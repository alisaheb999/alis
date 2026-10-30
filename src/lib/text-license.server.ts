/**
 * Ghostae Text V2 licence endpoints — server only.
 * Tokens are HMAC-SHA256 signed with LICENSE_TOKEN_SECRET and bound to one
 * licence + one machine. Seat limits are enforced in locked SQL functions.
 */
import { CORS_HEADERS } from "@/lib/ghost-api";

export const OFFLINE_VALID_DAYS = 14;

const CORS = { ...CORS_HEADERS, "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" };

export function preflight() {
  return new Response(null, { status: 204, headers: CORS });
}
export function reply(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...CORS },
  });
}
export function fail(code: string, message: string, status = 400) {
  return reply({ ok: false, error: { code, message } }, status);
}

export async function db() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export function normKey(v: unknown) {
  return String(v ?? "").trim().toUpperCase();
}
export function str(v: unknown, max: number) {
  const s = String(v ?? "").trim();
  return s.length && s.length <= max ? s : null;
}
export async function readJson(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const raw = await request.text();
    if (raw.length > 8192) return null;
    const v = JSON.parse(raw);
    return v && typeof v === "object" ? (v as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

const enc = new TextEncoder();
function b64u(bytes: Uint8Array) {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function unb64u(s: string) {
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}
async function hmacKey() {
  const secret = process.env["LICENSE_TOKEN_SECRET"];
  if (!secret) throw new Error("LICENSE_TOKEN_SECRET missing");
  return crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

export type TokenPayload = { lid: string; k: string; m: string; iat: number; exp: number };

export async function signToken(p: Omit<TokenPayload, "iat" | "exp">, licenceExpires: string | null) {
  const iat = Math.floor(Date.now() / 1000);
  let exp = iat + OFFLINE_VALID_DAYS * 86400;
  if (licenceExpires) exp = Math.min(exp, Math.floor(Date.parse(licenceExpires) / 1000));
  const body = b64u(enc.encode(JSON.stringify({ ...p, iat, exp })));
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", await hmacKey(), enc.encode(body)));
  return { token: `${body}.${b64u(sig)}`, exp };
}

/** Returns the payload only when the signature is valid, unexpired and bound to key+machine. */
export async function checkToken(token: string, key: string, machine: string): Promise<TokenPayload | "bad" | "expired"> {
  const [body, sig] = token.split(".");
  if (!body || !sig) return "bad";
  let ok = false;
  try {
    ok = await crypto.subtle.verify("HMAC", await hmacKey(), unb64u(sig), enc.encode(body));
  } catch {
    return "bad";
  }
  if (!ok) return "bad";
  let p: TokenPayload;
  try {
    p = JSON.parse(new TextDecoder().decode(unb64u(body))) as TokenPayload;
  } catch {
    return "bad";
  }
  if (p.k !== key || p.m !== machine) return "bad";
  if (!p.exp || p.exp * 1000 <= Date.now()) return "expired";
  return p;
}

type Db = Awaited<ReturnType<typeof db>>;

export async function licenceData(d: Db, key: string) {
  const { data: l } = await d
    .from("licenses")
    .select("id, license_key, plan, status, expires_at, email")
    .eq("license_key", key)
    .maybeSingle();
  if (!l) return null;
  const { data: o } = await d
    .from("orders")
    .select("customer_name, email")
    .eq("license_key", key)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return {
    id: l.id,
    license_key: l.license_key,
    plan: l.plan,
    customer_name: o?.customer_name ?? null,
    customer_email: l.email ?? o?.email ?? null,
    status: l.status,
    expires_at: l.expires_at,
    offline_valid_days: OFFLINE_VALID_DAYS,
  };
}

export async function log(
  d: Db,
  request: Request,
  e: { action: string; result: "ok" | "error"; license_id?: string | null; license_key?: string | null; machine_id?: string | null; error_code?: string | null; details?: Record<string, unknown> },
) {
  try {
    await d.from("license_logs").insert({
      action: e.action,
      result: e.result,
      license_id: e.license_id ?? null,
      license_key: e.license_key ? e.license_key.slice(0, 80) : null,
      machine_id: e.machine_id ? e.machine_id.slice(0, 200) : null,
      error_code: e.error_code ?? null,
      ip_address: request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
      details: (e.details ?? {}) as never,
    });
  } catch {
    /* logging must never break licensing */
  }
}

export const MESSAGES: Record<string, [string, number]> = {
  not_found: ["License not found.", 404],
  license_inactive: ["License is not active.", 403],
  license_suspended: ["License is suspended.", 403],
  license_revoked: ["License is revoked.", 403],
  license_expired: ["License has expired.", 403],
  device_revoked: ["This device was revoked by the owner.", 403],
  device_limit: ["All device seats for this license are in use.", 409],
};
