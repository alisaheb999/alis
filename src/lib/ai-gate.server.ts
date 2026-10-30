/**
 * Shared AI abuse gate (server-only).
 *
 * Every public AI endpoint must pass through this before it is allowed to spend
 * a single upstream AI credit. Rules, in order:
 *   1. per-IP + per-key sliding-window rate limit,
 *   2. the licence key must exist, be active and be bound to this device,
 *   3. the action is counted against the plan quota (atomic, fail-closed).
 *
 * Anything unknown resolves to the `free` tier, so a forged/unknown key can
 * never buy paid limits.
 */
import type { QuotaIdentity } from "@/lib/ghost-quota.server";

export type GateDenied = { ok: false; status: number; error: string; reason: string };
export type GateAllowed = { ok: true; identity: QuotaIdentity; used: number; limit: number | null };
export type GateResult = GateDenied | GateAllowed;

/** Pull the licence key + device from headers, falling back to the payload. */
export function readCredentials(
  request: Request,
  payload?: Record<string, unknown> | FormData | null,
) {
  const h = request.headers;
  const url = new URL(request.url);
  const pick = (name: string) => {
    if (!payload) return null;
    const value = payload instanceof FormData ? payload.get(name) : payload[name];
    return typeof value === "string" && value.trim() ? value.trim() : null;
  };

  const key =
    h.get("x-ghost-key") ||
    pick("key") ||
    pick("license_key") ||
    url.searchParams.get("key") ||
    url.searchParams.get("license_key");
  const device =
    h.get("x-ghost-device") ||
    pick("device") ||
    pick("device_fingerprint") ||
    url.searchParams.get("device");

  return { key: key || null, device: device || null };
}

/**
 * Gate one AI action.
 * `metrics` are consumed together — all must pass, otherwise nothing is spent.
 */
export async function gateAiRequest(options: {
  request: Request;
  route: string;
  key: string | null;
  device: string | null;
  /** quota metrics to charge, e.g. [{ metric: "caption.minutes.day", amount: 3, daily: true }] */
  metrics: Array<{ metric: string; amount?: number; daily?: boolean; term?: boolean }>;
  /** requests per minute allowed per caller */
  perMinute?: number;
}): Promise<GateResult> {
  const { request, route, key, device, metrics } = options;
  const g = await import("@/lib/ghost-api.server");
  const q = await import("@/lib/ghost-quota.server");
  const meta = g.clientMeta(request);

  const bucket = `${route}:${key || meta.ip || "anon"}`;
  if (!g.rateLimit(bucket, options.perMinute ?? 12, 60_000).allowed) {
    return { ok: false, status: 429, reason: "rate_limited", error: "অনেক বেশি রিকোয়েস্ট — এক মিনিট পরে আবার চেষ্টা করুন।" };
  }

  if (!key) {
    return {
      ok: false,
      status: 401,
      reason: "no_license",
      error: "লাইসেন্স কী পাওয়া যায়নি। প্যানেলে আপনার কী অ্যাক্টিভেট করুন।",
    };
  }

  const identity = await q.resolveIdentity(key, device);
  if (!identity.valid) {
    return {
      ok: false,
      status: 403,
      reason: identity.reason,
      error: "এই লাইসেন্স কী এখন ব্যবহারযোগ্য নয়। প্যানেল থেকে আবার অ্যাক্টিভেট করুন।",
    };
  }

  // Dry-run every metric first so a partial charge is impossible.
  const today = new Date().toISOString().slice(0, 10);
  const periodFor = (m: { daily?: boolean; term?: boolean }) => {
    if (m.daily) return today;
    if (m.term && identity.licenseId && identity.plan !== "free") return `term:${identity.licenseId}`;
    return undefined;
  };

  for (const m of metrics) {
    const check = await q.consume(identity, m.metric, Math.max(1, m.amount ?? 1), true, periodFor(m));
    if (!check.allowed) {
      return {
        ok: false,
        status: 429,
        reason: "quota_exceeded",
        error: "আপনার প্ল্যানের সীমা শেষ হয়েছে। প্ল্যান আপগ্রেড করুন অথবা পরবর্তী সময়ে চেষ্টা করুন।",
      };
    }
  }

  let used = 0;
  let limit: number | null = null;
  for (const m of metrics) {
    const spent = await q.consume(identity, m.metric, Math.max(1, m.amount ?? 1), false, periodFor(m));
    if (!spent.allowed) {
      return {
        ok: false,
        status: 429,
        reason: "quota_exceeded",
        error: "আপনার প্ল্যানের সীমা শেষ হয়েছে। প্ল্যান আপগ্রেড করুন অথবা পরবর্তী সময়ে চেষ্টা করুন।",
      };
    }
    used = spent.used;
    limit = spent.limit;
  }

  await g.logEvent({
    event: `ai.${route}`,
    status: "ok",
    license_id: identity.licenseId,
    license_key: identity.licenseKey,
    device_fingerprint: identity.deviceFingerprint,
    ip_address: meta.ip,
    user_agent: meta.userAgent,
    app_version: meta.appVersion,
    details: { metrics: metrics.map((m) => `${m.metric}:${m.amount ?? 1}`) },
  });

  return { ok: true, identity, used, limit };
}
