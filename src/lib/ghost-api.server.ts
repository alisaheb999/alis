/**
 * GHOST Cloud API — server-only core.
 * Blocked from client bundles by the `.server.ts` filename convention.
 * Route handlers must import this lazily: `await import("@/lib/ghost-api.server")`.
 */
import { createHmac, timingSafeEqual, randomUUID } from "node:crypto";
import { canonicalPayload } from "./ghost-api";

/* ------------------------------------------------------------------ *
 * Service-role client (bypasses RLS — never expose to the browser)
 * ------------------------------------------------------------------ */
export async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

/* ------------------------------------------------------------------ *
 * Request signature verification (HMAC-SHA256, replay-protected)
 * ------------------------------------------------------------------ */
const MAX_SKEW_MS = 5 * 60 * 1000;

export type SignatureResult = { ok: true } | { ok: false; reason: string };

export function verifySignature(
  method: string,
  path: string,
  timestamp: string | null,
  signature: string | null,
  rawBody: string,
): SignatureResult {
  const secret = process.env.GHOST_REQUEST_SIGNING_SECRET;
  // Signing is optional-but-verified: unsigned calls are still license-gated,
  // signed calls must be correct. Never silently accept a bad signature.
  if (!signature) return { ok: true };
  if (!secret) return { ok: false, reason: "signing_not_configured" };
  if (!timestamp) return { ok: false, reason: "missing_timestamp" };

  const skew = Math.abs(Date.now() - Number(timestamp));
  if (!Number.isFinite(skew) || skew > MAX_SKEW_MS) return { ok: false, reason: "stale_timestamp" };

  const expected = createHmac("sha256", secret)
    .update(canonicalPayload(method, path, timestamp, rawBody))
    .digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return { ok: false, reason: "bad_signature" };
  return { ok: true };
}

/* ------------------------------------------------------------------ *
 * Rate limiting (per key+route, in-memory sliding window)
 * ------------------------------------------------------------------ */
const buckets = new Map<string, number[]>();

export function rateLimit(identity: string, limit = 60, windowMs = 60_000) {
  const now = Date.now();
  const hits = (buckets.get(identity) ?? []).filter((t) => now - t < windowMs);
  hits.push(now);
  buckets.set(identity, hits);
  if (buckets.size > 5000) buckets.clear(); // bounded memory on the Worker
  return { allowed: hits.length <= limit, remaining: Math.max(0, limit - hits.length) };
}

/* ------------------------------------------------------------------ *
 * Audit trail
 * ------------------------------------------------------------------ */
export async function logEvent(entry: {
  event: string;
  status?: string;
  license_id?: string | null;
  license_key?: string | null;
  device_fingerprint?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  app_version?: string | null;
  details?: Record<string, unknown>;
}) {
  try {
    const db = await admin();
    await db.from("extension_logs").insert({
      event: entry.event,
      status: entry.status ?? "ok",
      license_id: entry.license_id ?? null,
      license_key: entry.license_key ?? null,
      device_fingerprint: entry.device_fingerprint ?? null,
      ip_address: entry.ip_address ?? null,
      user_agent: entry.user_agent ?? null,
      app_version: entry.app_version ?? null,
      details: (entry.details ?? {}) as never,
    });
  } catch {
    /* logging must never break the request */
  }
}

/* ------------------------------------------------------------------ *
 * Request context helpers
 * ------------------------------------------------------------------ */
export function clientMeta(request: Request) {
  const h = request.headers;
  return {
    ip:
      h.get("cf-connecting-ip") ??
      h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      null,
    userAgent: h.get("user-agent"),
    appVersion: h.get("x-ghost-version"),
    licenseKey: h.get("x-ghost-key"),
    device: h.get("x-ghost-device"),
    timestamp: h.get("x-ghost-timestamp"),
    signature: h.get("x-ghost-signature"),
  };
}

/* ------------------------------------------------------------------ *
 * License evaluation
 * ------------------------------------------------------------------ */
export type LicenseRow = {
  id: string;
  license_key: string;
  status: string;
  plan: string;
  expires_at: string | null;
  max_activations: number;
  activation_count: number;
  device_fingerprint: string | null;
  domain: string | null;
};

export function normalizeKey(key: string) {
  return key.trim().toUpperCase().replace(/\s+/g, "");
}

export function generateLicenseKey(prefix = "GHOST") {
  const raw = randomUUID().replace(/-/g, "").toUpperCase();
  return `${prefix}-${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}-${raw.slice(12, 16)}`;
}

export function evaluateLicense(row: LicenseRow | null) {
  if (!row) return { valid: false, reason: "not_found" as const };
  if (row.status === "revoked") return { valid: false, reason: "revoked" as const };
  if (row.status === "suspended") return { valid: false, reason: "suspended" as const };
  if (row.expires_at && new Date(row.expires_at).getTime() < Date.now())
    return { valid: false, reason: "expired" as const };
  if (row.status !== "active") return { valid: false, reason: "inactive" as const };
  return { valid: true, reason: "ok" as const };
}

/** Public shape returned to the extension — never leak internal columns. */
export function licensePayload(row: LicenseRow, verdict: { valid: boolean; reason: string }) {
  return {
    key: row.license_key,
    plan: row.plan,
    status: row.status,
    valid: verdict.valid,
    reason: verdict.reason,
    expires_at: row.expires_at,
    seats: { used: row.activation_count, max: row.max_activations },
  };
}

/* ------------------------------------------------------------------ *
 * Admin bearer (for revoke / management calls made outside the app UI)
 * ------------------------------------------------------------------ */
export function isAdminBearer(request: Request) {
  const token = process.env.GHOST_ADMIN_BOOTSTRAP_TOKEN;
  const header = request.headers.get("authorization");
  if (!token || !header?.startsWith("Bearer ")) return false;
  const given = Buffer.from(header.slice(7));
  const want = Buffer.from(token);
  return given.length === want.length && timingSafeEqual(given, want);
}
