import { createFileRoute } from "@tanstack/react-router";
import { errorResponse, jsonResponse, preflight } from "@/lib/ghost-api";

const HEARTBEAT_SECONDS = 6 * 60 * 60;
const TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function b64url(bytes: Uint8Array) {
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function signToken(payload: Record<string, unknown>) {
  const secret =
    process.env["GHOST_REQUEST_SIGNING_SECRET"] ||
    process.env["SUPABASE_SERVICE_ROLE_KEY"] ||
    "ghost-session-fallback";
  const body = b64url(new TextEncoder().encode(JSON.stringify(payload)));
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body)));
  return body + "." + b64url(sig);
}

// Cloud/DB failure: keep the panel open with a short grace token instead of locking.
async function graceResponse(key: string) {
  if (!key) return jsonResponse({ ok: true, license: { valid: false, reason: "no_key" } }, 200);
  const expiresAt = Date.now() + 3 * 24 * 60 * 60 * 1000;
  const token = await signToken({ k: key, g: 1, exp: expiresAt });
  return jsonResponse({
    ok: true,
    license: { valid: true, reason: "ok", plan: null, grace: true },
    session_token: token,
    expires_at: expiresAt,
    heartbeat_seconds: 30 * 60,
  });
}

export const Route = createFileRoute("/api/public/v1/license/session")({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      POST: async ({ request }) => {
        let graceKey = "";
        try {
        const g = await import("@/lib/ghost-api.server");
        const meta = g.clientMeta(request);
        let body: {
          license_key?: string;
          device_fingerprint?: string;
          panel?: string;
          version?: string;
        } = {};
        try {
          body = await request.json();
        } catch {
          body = {};
        }

        const key = String(body.license_key || meta.licenseKey || "");
        const device = String(body.device_fingerprint || meta.device || "");
        graceKey = key.trim().toUpperCase();
        if (!key)
          return jsonResponse({ ok: true, license: { valid: false, reason: "no_key" } }, 200);

        if (!g.rateLimit(`session:${key}:${device}`, 240).allowed)
          return errorResponse("rate_limited", "Too many session checks.", 429);

        const db = await g.admin();
        const normalized = g.normalizeKey(key);
        const { data: license, error: dbErr } = await db
          .from("licenses")
          .select("*")
          .eq("license_key", normalized)
          .maybeSingle();

        // Fail-open: a backend hiccup must never lock a paying user's panel.
        if (dbErr) return graceResponse(normalized);

        if (!license)
          return jsonResponse({ ok: true, license: { valid: false, reason: "not_found" } }, 200);

        if (
          license.expires_at &&
          new Date(license.expires_at).getTime() < Date.now() &&
          license.status !== "expired"
        ) {
          await db.from("licenses").update({ status: "expired" }).eq("id", license.id);
          license.status = "expired";
        }

        let verdict = g.evaluateLicense(license);

        // Admin remote control via licenses.notes (BLOCK: reason)
        const notes = String(license.notes || "");
        const blockMatch = /(?:^|\n)\s*BLOCK:\s*(.*)/i.exec(notes);
        if (verdict.valid && blockMatch) verdict = { valid: false, reason: "suspended" as never };

        if (verdict.valid && device) {
          const { data: act } = await db
            .from("license_activations")
            .select("id, revoked")
            .eq("license_id", license.id)
            .eq("device_fingerprint", device)
            .maybeSingle();
          if (act?.revoked) verdict = { valid: false, reason: "device_revoked" as never };
          else if (act) {
            await db
              .from("license_activations")
              .update({ last_seen_at: new Date().toISOString(), app_version: meta.appVersion })
              .eq("id", act.id);
          } else {
            const { count } = await db
              .from("license_activations")
              .select("id", { count: "exact", head: true })
              .eq("license_id", license.id)
              .eq("revoked", false);
            const used = count ?? 0;
            if (used >= (license.max_activations ?? 1)) {
              verdict = { valid: false, reason: "seat_limit" as never };
            } else {
              await db.from("license_activations").insert({
                license_id: license.id,
                device_fingerprint: device,
                hostname: "after-effects",
                platform: meta.userAgent?.slice(0, 120) ?? null,
                app_version: meta.appVersion,
              });
              await db
                .from("licenses")
                .update({ activation_count: used + 1, status: "active" })
                .eq("id", license.id);
            }
          }
        }

        if (!verdict.valid)
          return jsonResponse(
            { ok: true, license: { valid: false, reason: verdict.reason, plan: license.plan } },
            200,
          );

        await db
          .from("licenses")
          .update({ last_seen_at: new Date().toISOString() })
          .eq("id", license.id);

        const expiresAt = Date.now() + TOKEN_TTL_MS;
        const token = await signToken({
          k: normalized,
          d: device,
          p: license.plan,
          exp: expiresAt,
        });

        const msgMatch = /(?:^|\n)\s*MSG:\s*(.*)/i.exec(notes);

        return jsonResponse({
          ok: true,
          license: { valid: true, reason: "ok", plan: license.plan },
          session_token: token,
          expires_at: expiresAt,
          heartbeat_seconds: HEARTBEAT_SECONDS,
          message: msgMatch ? msgMatch[1].trim() : null,
        });
        } catch {
          return graceResponse(graceKey);
        }
      },
    },
  },
});
