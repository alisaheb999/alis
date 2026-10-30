import { z } from "zod";

export const pairInput = z.object({
  pairing_code: z.string().trim().toUpperCase().regex(/^[A-Z2-9]{8}$/),
  device_uuid: z.string().uuid().transform((v) => v.toLowerCase()),
  device_name: z.string().trim().min(1).max(100),
  android_version: z.string().max(40),
  app_version: z.string().max(40),
});

export async function hashRelay(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (v) => v.toString(16).padStart(2, "0")).join("");
}

export function pairingCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return Array.from(bytes, (v) => alphabet[v % 32]).join("");
}

export function relayResponse(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export async function handlePair(request: Request) {
  try {
    if (!request.headers.get("content-type")?.includes("application/json")) {
      return relayResponse({ ok: false, error: "JSON_REQUIRED" }, 415);
    }
    // Bound the actual streamed body, not just the client-supplied length header.
    const reader = request.body?.getReader();
    if (!reader) return relayResponse({ ok: false, error: "INVALID_REQUEST" }, 400);
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const next = await reader.read();
      if (next.done) break;
      size += next.value.byteLength;
      if (size > 4096) { await reader.cancel(); return relayResponse({ ok: false, error: "BODY_TOO_LARGE" }, 413); }
      chunks.push(next.value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
    const parsed = pairInput.safeParse(JSON.parse(new TextDecoder().decode(bytes)));
    if (!parsed.success) return relayResponse({ ok: false, error: "INVALID_REQUEST" }, 400);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // The edge owns cf-connecting-ip; never trust a client x-forwarded-for identity.
    const ip = request.headers.get("cf-connecting-ip") ?? "local-preview";
    const scope = await hashRelay(`relay-pair:${ip}`);
    const { data: allowed, error: limitError } = await supabaseAdmin.rpc("relay_allow_pair_attempt", { p_scope_hash: scope });
    if (limitError) throw limitError;
    if (!allowed) return relayResponse({ ok: false, error: "RATE_LIMITED" }, 429);
    const input = parsed.data;
    const token = Array.from(crypto.getRandomValues(new Uint8Array(32)), (v) => v.toString(16).padStart(2, "0")).join("");
    const { data: id, error } = await supabaseAdmin.rpc("relay_pair_device", {
      p_code_hash: await hashRelay(input.pairing_code), p_device_uuid: input.device_uuid,
      p_device_name: input.device_name, p_token_hash: await hashRelay(token),
      p_app_version: input.app_version, p_android_version: input.android_version,
    });
    if (error) throw error;
    if (!id) return relayResponse({ ok: false, error: "PAIRING_UNAVAILABLE", message: "Code expired, used, invalid, or device already paired." }, 400);
    // Provisional v1 contract; Android field names must be confirmed before rollout.
    return relayResponse({ ok: true, device_id: id, device_token: token, heartbeat_seconds: 300, server_time: new Date().toISOString(), mode: "testing" });
  } catch (error) {
    if (error instanceof SyntaxError) return relayResponse({ ok: false, error: "INVALID_JSON" }, 400);
    return relayResponse({ ok: false, error: "SERVICE_UNAVAILABLE" }, 503);
  }
}
async function readJson(request: Request, max = 8192): Promise<unknown> {
  const text = await request.text();
  if (text.length > max) throw new RangeError("too large");
  return JSON.parse(text);
}

async function authDevice(request: Request) {
  const h = request.headers.get("authorization") ?? "";
  if (!h.startsWith("Bearer ") || h.length > 200) return null;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.from("relay_devices").select("id,status")
    .eq("token_hash", await hashRelay(h.slice(7).trim())).maybeSingle();
  if (!data || data.status !== "ACTIVE") return null;
  await supabaseAdmin.from("relay_devices").update({ last_seen_at: new Date().toISOString() }).eq("id", data.id);
  return { id: data.id as string, db: supabaseAdmin };
}

export async function handleHeartbeat(request: Request) {
  try {
    const dev = await authDevice(request);
    if (!dev) return relayResponse({ ok: false, error: "UNAUTHORIZED" }, 401);
    return relayResponse({ ok: true, server_time: new Date().toISOString(), heartbeat_seconds: 300, mode: "testing" });
  } catch { return relayResponse({ ok: false, error: "SERVICE_UNAVAILABLE" }, 503); }
}

const txInput = z.object({
  provider: z.string().trim().toLowerCase().pipe(z.enum(["bkash", "nagad", "rocket", "upay"])),
  trx_id: z.string().trim().toUpperCase().regex(/^[A-Z0-9._-]{4,40}$/),
  amount: z.coerce.number().positive().max(10_000_000),
  sender: z.string().trim().max(30).optional(),
  received_at: z.string().datetime({ offset: true }).optional(),
  raw_text: z.string().max(1000).optional(),
});

export async function handleTransaction(request: Request) {
  try {
    const dev = await authDevice(request);
    if (!dev) return relayResponse({ ok: false, error: "UNAUTHORIZED" }, 401);
    const parsed = txInput.safeParse(await readJson(request));
    if (!parsed.success) return relayResponse({ ok: false, error: "INVALID_REQUEST" }, 400);
    return await processTransaction(dev, parsed.data);
  } catch (e) {
    if (e instanceof SyntaxError) return relayResponse({ ok: false, error: "INVALID_JSON" }, 400);
    if (e instanceof RangeError) return relayResponse({ ok: false, error: "BODY_TOO_LARGE" }, 413);
    return relayResponse({ ok: false, error: "SERVICE_UNAVAILABLE" }, 503);
  }
}

type Tx = z.infer<typeof txInput>;
type Dev = { id: string; db: Awaited<typeof import("@/integrations/supabase/client.server")>["supabaseAdmin"] };

/** Shared matcher for every SMS source (paired app or SmsForwarder webhook). Exact provider + TrxID + amount only. */
export async function processTransaction(dev: Dev, t: Tx) {
  {
    const amount = Math.round(t.amount);
    const { data: dup } = await dev.db.from("relay_transactions").select("id,match_status")
      .eq("provider", t.provider).eq("trx_id", t.trx_id).maybeSingle();
    if (dup) return relayResponse({ ok: true, duplicate: true, id: dup.id, match_status: dup.match_status });
    const { data: order } = await dev.db.from("orders").select("id,amount")
      .eq("transaction_id", t.trx_id).eq("payment_method", t.provider).eq("status", "pending").limit(1).maybeSingle();
    let match_status = !order ? "unmatched" : order.amount === amount ? "matched" : "amount_mismatch";
    let matchedId: string | null = order?.id ?? null;
    let kind = order ? "extension" : null as string | null;
    if (!order) {
      const { matchOtherOrders } = await import("./relay-match.server");
      const other = await matchOtherOrders(dev.db, t.provider, t.trx_id, amount);
      if (other) { match_status = other.status; matchedId = other.id; kind = other.kind; }
    }
    const { data: row, error } = await dev.db.from("relay_transactions").insert({
      device_id: dev.id, provider: t.provider, trx_id: t.trx_id, amount, sender: t.sender ?? null,
      received_at: t.received_at ?? null, raw_text: t.raw_text ?? null, match_status, matched_order_id: matchedId,
    }).select("id").single();
    if (error) {
      if (error.code === "23505") return relayResponse({ ok: true, duplicate: true });
      throw error;
    }
    // Exact TrxID + provider + amount on a pending order → issue the licence automatically.
    let activated = false;
    if (match_status === "matched" && order) {
      try {
        const { activateOrder } = await import("./order-activation.server");
        activated = Boolean(await activateOrder(dev.db, order.id, { claimPending: true, note: "Auto-verified by Payment Relay" }));
      } catch { activated = false; }
    }
    if (kind !== "extension" && match_status === "matched") activated = true;
    return relayResponse({ ok: true, id: row.id, match_status, kind, activated, mode: "auto" });
  }
}

/** Fixed, non-pairable record that attributes SmsForwarder SMS. Setting it non-ACTIVE in admin disables the webhook. */
const SMS_FORWARDER_DEVICE_UUID = "00000000-0000-4000-8000-534d53465744";

async function smsForwarderDevice(db: Dev["db"]): Promise<Dev | null> {
  const { data } = await db.from("relay_devices").select("id,status").eq("device_uuid", SMS_FORWARDER_DEVICE_UUID).maybeSingle();
  if (data) return data.status === "ACTIVE" ? { id: data.id as string, db } : null;
  // Random unknown token: this record can never authenticate as a paired phone.
  const token = Array.from(crypto.getRandomValues(new Uint8Array(32)), (v) => v.toString(16).padStart(2, "0")).join("");
  const { data: row, error } = await db.from("relay_devices").insert({
    device_uuid: SMS_FORWARDER_DEVICE_UUID, device_name: "SmsForwarder Webhook", token_hash: await hashRelay(token), status: "ACTIVE",
  }).select("id").single();
  if (error) throw error;
  return { id: row.id as string, db };
}

async function hmacB64(secret: string, msg: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(msg)));
  return btoa(String.fromCharCode(...sig));
}

async function sameSecret(a: string, b: string) {
  // Compare digests so timing does not leak the secret length/prefix.
  return (await hashRelay(a)) === (await hashRelay(b));
}

/** SmsForwarder webhook: header `x-webhook-secret`, or SmsForwarder's built-in sign (HmacSHA256 of "timestamp\nsecret"). */
export async function handleSmsForwarder(request: Request) {
  try {
    const secret = process.env.SMS_WEBHOOK_SECRET;
    if (!secret || secret.length < 16) return relayResponse({ ok: false, error: "NOT_CONFIGURED" }, 503);
    const raw = await request.text();
    if (raw.length > 8192) return relayResponse({ ok: false, error: "BODY_TOO_LARGE" }, 413);
    let body: Record<string, unknown> = {};
    if ((request.headers.get("content-type") ?? "").includes("json")) body = JSON.parse(raw || "{}");
    else body = Object.fromEntries(new URLSearchParams(raw));
    const str = (k: string) => (typeof body[k] === "string" || typeof body[k] === "number" ? String(body[k]) : "");

    const header = request.headers.get("x-webhook-secret") ?? request.headers.get("x-relay-secret") ?? "";
    let authed = header ? await sameSecret(header, secret) : false;
    if (!authed && str("sign") && str("timestamp")) {
      const ts = Number(str("timestamp"));
      const fresh = Number.isFinite(ts) && Math.abs(Date.now() - ts) < 60 * 60 * 1000;
      const expected = await hmacB64(secret, `${ts}\n${secret}`);
      let given = str("sign");
      try { given = decodeURIComponent(given); } catch { /* keep as-is */ }
      authed = fresh && await sameSecret(given, expected);
    }
    if (!authed) return relayResponse({ ok: false, error: "UNAUTHORIZED" }, 401);

    const { parseSms } = await import("./sms-parse");
    const from = str("from") || str("sender") || str("phone");
    const content = str("content") || str("msg") || str("text") || str("message");
    const p = parseSms(from.slice(0, 60), content.slice(0, 1000));
    if (!p) return relayResponse({ ok: true, ignored: true }); // 200 so the app does not retry non-payment SMS
    const tx = txInput.safeParse({ ...p, sender: p.sender ?? undefined, raw_text: content.slice(0, 1000) });
    if (!tx.success) return relayResponse({ ok: true, ignored: true });

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const dev = await smsForwarderDevice(supabaseAdmin);
    if (!dev) return relayResponse({ ok: false, error: "DISABLED" }, 403);
    return await processTransaction(dev, tx.data);
  } catch (e) {
    if (e instanceof SyntaxError) return relayResponse({ ok: false, error: "INVALID_JSON" }, 400);
    return relayResponse({ ok: false, error: "SERVICE_UNAVAILABLE" }, 503);
  }
}
