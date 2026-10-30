import { createFileRoute } from "@tanstack/react-router";
import { errorResponse, jsonResponse, preflight } from "@/lib/ghost-api";
import { lockedModulesForPlan } from "@/lib/ghost-entitlements";
import { isPaidPlan, normalizePlan } from "@/lib/ghost-quotas";

const PATH = "/api/public/v1/license/verify";

export const Route = createFileRoute("/api/public/v1/license/verify")({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      POST: async ({ request }) => {
        const g = await import("@/lib/ghost-api.server");
        const raw = await request.text();
        const meta = g.clientMeta(request);

        const sig = g.verifySignature("POST", PATH, meta.timestamp, meta.signature, raw);
        if (!sig.ok) return errorResponse("bad_signature", sig.reason, 401);

        if (!g.rateLimit(`verify:${meta.licenseKey ?? meta.ip ?? "anon"}`, 120).allowed)
          return errorResponse("rate_limited", "Too many verification requests.", 429);

        let body: {
          license_key?: string;
          device_fingerprint?: string;
          product?: string;
          app?: string;
          version?: string;
        };
        try {
          body = raw ? JSON.parse(raw) : {};
        } catch {
          return errorResponse("bad_request", "Body must be JSON.", 400);
        }

        const key = (body.license_key || meta.licenseKey || "").toString();
        const device = (body.device_fingerprint || meta.device || "").toString();
        if (!key) return errorResponse("bad_request", "license_key is required.", 400);

        const db = await g.admin();
        const normalized = g.normalizeKey(key);
        const { data: license, error: dbErr } = await db
          .from("licenses")
          .select("*")
          .eq("license_key", normalized)
          .maybeSingle();

        // Backend hiccup must never look like "key removed" — 503 keeps the panel in offline grace.
        if (dbErr) return errorResponse("unavailable", "Server busy, try later.", 503);

        if (!license)
          return jsonResponse(
            {
              ok: false,
              error: "INVALID_LICENSE",
              message: "License key is invalid or expired.",
              license: { key: normalized, valid: false, reason: "not_found" },
            },
            200,
          );

        // Auto-expire in the record so the dashboard reflects reality.
        if (
          license.expires_at &&
          new Date(license.expires_at).getTime() < Date.now() &&
          license.status !== "expired"
        ) {
          await db.from("licenses").update({ status: "expired" }).eq("id", license.id);
          license.status = "expired";
        }

        let verdict = g.evaluateLicense(license);

        // Device-level revocation overrides an otherwise healthy license.
        // Self-heal: a known-good key on an unregistered device claims a free
        // seat instead of failing — this is what used to make the activation
        // popup reappear in sibling panels after an update.
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

        if (verdict.valid)
          await db
            .from("licenses")
            .update({ last_seen_at: new Date().toISOString() })
            .eq("id", license.id);

        await g.logEvent({
          event: "license.verify",
          status: verdict.valid ? "ok" : verdict.reason,
          license_id: license.id,
          license_key: normalized,
          device_fingerprint: device || null,
          ip_address: meta.ip,
          user_agent: meta.userAgent,
          app_version: (body.version || meta.appVersion || null)?.toString().slice(0, 40) ?? null,
          details: {
            product: body.product?.toString().slice(0, 40) ?? null,
            app: body.app?.toString().slice(0, 40) ?? null,
          },
        });

        const payload = {
          ...g.licensePayload(license, verdict),
          user_email: license.email ?? null,
        };

        return jsonResponse({
          ok: verdict.valid,
          ...(verdict.valid
            ? {}
            : { error: "INVALID_LICENSE", message: "License key is invalid or expired." }),
          license: payload,
          // Client wipes premium cache immediately when this is false.
          // A valid FREE key is still not premium — only paid tiers are.
          entitlements: verdict.valid
            ? {
                premium: isPaidPlan(license.plan),
                plan: normalizePlan(license.plan),
                locked_modules: lockedModulesForPlan(license.plan, true),
              }
            : { premium: false, plan: "free", locked_modules: lockedModulesForPlan(license.plan, false) },
          checked_at: new Date().toISOString(),
        });
      },
    },
  },
});
