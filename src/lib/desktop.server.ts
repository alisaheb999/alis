/**
 * Desktop Hub (Ghostae Creative Suite) — server-only helpers.
 * Signed desktop session tokens + signed per-product offline entitlements.
 * Reuses existing `licenses` / `license_activations`; never mutates other data.
 */
import { createHmac, timingSafeEqual } from "node:crypto";

const DAY = 24 * 60 * 60 * 1000;
export const TOKEN_TTL_MS = 30 * DAY;
export const OFFLINE_GRACE_MS = 30 * DAY;

function secret() {
  return (
    process.env["GHOST_REQUEST_SIGNING_SECRET"] ||
    process.env["SUPABASE_SERVICE_ROLE_KEY"] ||
    "ghost-desktop-fallback"
  );
}
const b64 = (s: string) => Buffer.from(s).toString("base64url");
const mac = (s: string) => createHmac("sha256", secret()).update(s).digest("base64url");

export function signToken(payload: Record<string, unknown>) {
  const body = b64(JSON.stringify(payload));
  return `${body}.${mac(body)}`;
}

export function verifyToken(token: string | null | undefined): Record<string, unknown> | null {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const a = Buffer.from(mac(body));
  const b = Buffer.from(sig);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const p = JSON.parse(Buffer.from(body, "base64url").toString());
    if (typeof p.exp !== "number" || p.exp < Date.now()) return null;
    return p;
  } catch {
    return null;
  }
}

export function bearer(request: Request) {
  const h = request.headers.get("authorization") ?? "";
  return h.startsWith("Bearer ") ? h.slice(7) : null;
}

type Lic = {
  id: string;
  license_key: string;
  plan: string;
  status: string;
  expires_at: string | null;
  max_activations: number;
  activation_count: number;
  product_key: string | null;
};

const mask = (k: string) => (k.length > 8 ? `${k.slice(0, 6)}••••${k.slice(-4)}` : "••••");

/** Public licence shape for the desktop app, with a signed offline entitlement. */
export function desktopLicense(l: Lic, hwid: string) {
  const expired = !!l.expires_at && new Date(l.expires_at).getTime() < Date.now();
  const valid = !expired && (l.status === "active" || l.status === "inactive");
  const product = l.product_key || "text";
  const now = Date.now();
  const offlineUntil = Math.min(
    now + OFFLINE_GRACE_MS,
    l.expires_at ? new Date(l.expires_at).getTime() : Infinity,
  );
  const ent = {
    product_slug: product,
    status: valid ? "active" : expired ? "expired" : l.status,
    plan: l.plan,
    machine_id: hwid,
    issued_at: new Date(now).toISOString(),
    offline_until: new Date(offlineUntil).toISOString(),
  };
  return {
    id: l.id,
    product_slug: product,
    license_key: l.license_key,
    license_key_masked: mask(l.license_key),
    plan: l.plan,
    status: ent.status,
    valid,
    lifetime: !l.expires_at,
    expires_at: l.expires_at,
    devices_used: l.activation_count,
    max_devices: l.max_activations,
    entitlement: valid ? { ...ent, signature: mac(JSON.stringify(ent)) } : null,
  };
}

export const LIC_COLS =
  "id, license_key, plan, status, expires_at, max_activations, activation_count, product_key, user_id, email";

/** Bind a device to a licence (seat-limited). Existing device always re-allowed. */
export async function bindDevice(
  db: any,
  lic: Lic,
  hwid: string,
  machine: string | null,
  platform: string | null,
): Promise<{ ok: true; activation_id: string; used: number } | { ok: false; code: string; message: string; status: number }> {
  const { data: existing } = await db
    .from("license_activations")
    .select("id, revoked")
    .eq("license_id", lic.id)
    .eq("device_fingerprint", hwid)
    .maybeSingle();
  if (existing?.revoked)
    return { ok: false, code: "device_revoked", message: "This device was revoked.", status: 403 };
  if (!existing) {
    const { count } = await db
      .from("license_activations")
      .select("id", { count: "exact", head: true })
      .eq("license_id", lic.id)
      .eq("revoked", false);
    if ((count ?? 0) >= lic.max_activations)
      return {
        ok: false,
        code: "device_limit",
        message: `Device limit reached (${lic.max_activations}).`,
        status: 403,
      };
  }
  const { data: act } = await db
    .from("license_activations")
    .upsert(
      {
        license_id: lic.id,
        device_fingerprint: hwid,
        hostname: machine,
        platform,
        revoked: false,
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: "license_id,device_fingerprint" },
    )
    .select("id")
    .single();
  const { count: used } = await db
    .from("license_activations")
    .select("id", { count: "exact", head: true })
    .eq("license_id", lic.id)
    .eq("revoked", false);
  await db
    .from("licenses")
    .update({
      status: "active",
      activation_count: used ?? 1,
      last_seen_at: new Date().toISOString(),
    })
    .eq("id", lic.id);
  return { ok: true, activation_id: act?.id ?? "", used: used ?? 1 };
}

/** Reads a JSON config row published from admin into extension_settings (module 'desktop'). */
export async function desktopSetting(db: any, key: string) {
  const { data } = await db
    .from("extension_settings")
    .select("value, enabled")
    .eq("module", "desktop")
    .eq("key", key)
    .maybeSingle();
  if (!data || data.enabled === false) return null;
  return data.value as any;
}
