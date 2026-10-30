/**
 * Ghostae quota engine (server-only).
 *
 * Main server = security brain. Panels and the per-panel asset sub-servers ask
 * this module "may this licence do X?" before any file is served or any AI call
 * is made. Counting is atomic (`ghost_consume_quota`) and resets every calendar
 * month.
 */
import {
  QUOTA_METRICS,
  currentPeriod,
  limitFor,
  normalizeMetric,
  normalizePlan,
  periodResetAt,
} from "@/lib/ghost-quotas";

export type QuotaIdentity = {
  licenseId: string | null;
  licenseKey: string | null;
  plan: string;
  valid: boolean;
  reason: string;
  scopeKey: string;
  deviceFingerprint: string | null;
};

export type QuotaVerdict = {
  allowed: boolean;
  reason: string;
  metric: string;
  plan: string;
  used: number;
  limit: number | null;
  remaining: number | null;
  period: string;
  reset_at: string;
};

/**
 * Resolve who is asking. A valid licence gets its plan; anything else falls
 * back to the `free` tier counted per device so unlicensed panels still work
 * but stay strictly capped.
 */
export async function resolveIdentity(
  licenseKey: string | null | undefined,
  deviceFingerprint: string | null | undefined,
): Promise<QuotaIdentity> {
  const g = await import("@/lib/ghost-api.server");
  const device = (deviceFingerprint || "").toString().trim() || null;
  const raw = (licenseKey || "").toString().trim();

  if (!raw) {
    return {
      licenseId: null,
      licenseKey: null,
      plan: "free",
      valid: false,
      reason: "no_license",
      scopeKey: `device:${device || "anonymous"}`,
      deviceFingerprint: device,
    };
  }

  const key = g.normalizeKey(raw);
  const db = await g.admin();
  const { data: license } = await db
    .from("licenses")
    .select("*")
    .eq("license_key", key)
    .maybeSingle();

  if (!license) {
    return {
      licenseId: null,
      licenseKey: key,
      plan: "free",
      valid: false,
      reason: "not_found",
      scopeKey: `device:${device || key}`,
      deviceFingerprint: device,
    };
  }

  const verdict = g.evaluateLicense(license);
  let valid = verdict.valid;
  let reason: string = verdict.reason;

  // Device must be a registered, non-revoked seat of this licence.
  if (valid && device) {
    const { data: act } = await db
      .from("license_activations")
      .select("id, revoked")
      .eq("license_id", license.id)
      .eq("device_fingerprint", device)
      .maybeSingle();
    if (!act) {
      valid = false;
      reason = "device_not_activated";
    } else if (act.revoked) {
      valid = false;
      reason = "device_revoked";
    }
  }

  return {
    licenseId: license.id as string,
    licenseKey: key,
    plan: valid ? normalizePlan(license.plan as string) : "free",
    valid,
    reason: valid ? "ok" : reason,
    // Licence-wide counter (team plans share it); unlicensed falls back to device.
    scopeKey: valid ? `license:${license.id}` : `device:${device || key}`,
    deviceFingerprint: device,
  };
}

/**
 * Count (or dry-run check) one billable action.
 * `periodOverride` allows daily buckets (e.g. "2026-08-27") next to monthly ones.
 */
export async function consume(
  identity: QuotaIdentity,
  metric: string,
  amount = 1,
  dryRun = false,
  periodOverride?: string,
): Promise<QuotaVerdict> {
  const key = normalizeMetric(metric);
  const period = periodOverride || currentPeriod();
  const reset_at = periodOverride
    ? new Date(Date.now() + 86400_000).toISOString().slice(0, 10)
    : periodResetAt();

  if (!key) {
    return {
      allowed: false,
      reason: "unknown_metric",
      metric: String(metric || ""),
      plan: identity.plan,
      used: 0,
      limit: 0,
      remaining: 0,
      period,
      reset_at,
    };
  }

  const limit = limitFor(key, identity.plan);
  const g = await import("@/lib/ghost-api.server");
  const db = await g.admin();
  const qty = Math.max(1, Math.floor(Number(amount) || 1));

  if (dryRun) {
    const { data: row } = await db
      .from("usage_counters")
      .select("used")
      .eq("scope_key", identity.scopeKey)
      .eq("metric", key)
      .eq("period", period)
      .maybeSingle();
    const used = Number(row?.used ?? 0);
    const allowed = limit === null || used + qty <= limit;
    return {
      allowed,
      reason: allowed ? "ok" : "quota_exceeded",
      metric: key,
      plan: identity.plan,
      used,
      limit,
      remaining: limit === null ? null : Math.max(0, limit - used),
      period,
      reset_at,
    };
  }

  const { data, error } = await db.rpc("ghost_consume_quota", {
    p_scope: identity.scopeKey,
    p_license: identity.licenseId,
    p_plan: identity.plan,
    p_metric: key,
    p_period: period,
    p_amount: qty,
    p_limit: limit,
  } as never);

  if (error) throw new Error(error.message);

  const row = Array.isArray(data) ? data[0] : data;
  const used = Number(row?.used ?? 0);
  const allowed = Boolean(row?.allowed);

  return {
    allowed,
    reason: allowed ? "ok" : "quota_exceeded",
    metric: key,
    plan: identity.plan,
    used,
    limit,
    remaining: limit === null ? null : Math.max(0, limit - used),
    period,
    reset_at,
  };
}

/** Every metric's used/limit for the current period — panels show this. */
export async function usageSnapshot(identity: QuotaIdentity) {
  const g = await import("@/lib/ghost-api.server");
  const db = await g.admin();
  const period = currentPeriod();
  const { data } = await db
    .from("usage_counters")
    .select("metric, used")
    .eq("scope_key", identity.scopeKey)
    .eq("period", period);

  const usedBy = new Map<string, number>();
  for (const row of data ?? []) usedBy.set(String(row.metric), Number(row.used) || 0);

  const metrics = Object.entries(QUOTA_METRICS).map(([metric, def]) => {
    const limit = def.limits[normalizePlan(identity.plan)];
    const used = usedBy.get(metric) ?? 0;
    return {
      metric,
      panel: def.panel,
      label: def.label,
      used,
      limit,
      remaining: limit === null ? null : Math.max(0, limit - used),
    };
  });

  return { plan: identity.plan, licensed: identity.valid, period, reset_at: periodResetAt(), metrics };
}

/* ------------------------------------------------------------------ *
 * Sub-server grants — short-lived proof that the main server said yes.
 * ------------------------------------------------------------------ */

async function hmac(payload: string, secret: string) {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, enc.encode(payload));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** `<expiryMs>.<metric>.<scope>.<hmac>` — sub-servers may verify it offline. */
export async function issueGrant(identity: QuotaIdentity, metric: string, ttlMs = 5 * 60_000) {
  const secret = process.env["GHOST_SERVICE_TOKEN"] || "";
  if (!secret) return null;
  const exp = Date.now() + ttlMs;
  const body = `${exp}.${metric}.${identity.scopeKey}`;
  return `${body}.${await hmac(body, secret)}`;
}

/**
 * Shared service token check. Simple by design: if no token is configured on
 * the main server, sub-servers don't need one either (fail-open). Configure
 * GHOST_SERVICE_TOKEN only when you want to lock sub-servers down.
 */
export function serviceTokenValid(request: Request) {
  const expected = process.env["GHOST_SERVICE_TOKEN"] || "";
  if (!expected) return true;
  const provided =
    request.headers.get("x-ghost-service-token") ||
    (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!provided || expected.length !== provided.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ provided.charCodeAt(i);
  return diff === 0;
}

