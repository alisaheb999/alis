import { createFileRoute } from "@tanstack/react-router";
import { errorResponse, jsonResponse, preflight } from "@/lib/ghost-api";

const PATH = "/api/public/v1/license/activate";

export const Route = createFileRoute("/api/public/v1/license/activate")({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      POST: async ({ request }) => {
        const g = await import("@/lib/ghost-api.server");
        const raw = await request.text();
        const meta = g.clientMeta(request);

        const sig = g.verifySignature("POST", PATH, meta.timestamp, meta.signature, raw);
        if (!sig.ok) return errorResponse("bad_signature", sig.reason, 401);

        if (!g.rateLimit(`activate:${meta.ip ?? "anon"}`, 20).allowed)
          return errorResponse("rate_limited", "Too many activation attempts.", 429);

        let body: {
          license_key?: string;
          device_fingerprint?: string;
          hostname?: string;
          platform?: string;
          domain?: string;
        };
        try {
          body = raw ? JSON.parse(raw) : {};
        } catch {
          return errorResponse("bad_request", "Body must be JSON.", 400);
        }

        // Older CEP transports can lose a JSON field while retaining headers;
        // accept either source and treat an empty body value as absent.
        const key = (body.license_key || meta.licenseKey || "").toString();
        const device = (body.device_fingerprint || meta.device || "").toString();
        if (key.length < 8 || key.length > 128)
          return errorResponse("bad_request", "license_key is required.", 400);
        if (device.length < 8 || device.length > 256)
          return errorResponse("bad_request", "device_fingerprint is required.", 400);

        const db = await g.admin();
        const normalized = g.normalizeKey(key);
        const { data: license } = await db
          .from("licenses")
          .select("*")
          .eq("license_key", normalized)
          .maybeSingle();

        const verdict = g.evaluateLicense(
          license ? { ...license, status: license.status === "inactive" ? "active" : license.status } : null,
        );

        if (!license) {
          await g.logEvent({
            event: "license.activate",
            status: "not_found",
            license_key: normalized,
            device_fingerprint: device,
            ip_address: meta.ip,
            user_agent: meta.userAgent,
            app_version: meta.appVersion,
          });
          return errorResponse("not_found", "This license key does not exist.", 404);
        }
        if (!verdict.valid)
          return errorResponse(verdict.reason, `License is ${verdict.reason}.`, 403);

        // Seat check — an existing activation for this device is always allowed back in.
        const { data: existing } = await db
          .from("license_activations")
          .select("id, revoked")
          .eq("license_id", license.id)
          .eq("device_fingerprint", device)
          .maybeSingle();

        if (existing?.revoked)
          return errorResponse("device_revoked", "This device was revoked by the owner.", 403);

        if (!existing) {
          const { count } = await db
            .from("license_activations")
            .select("id", { count: "exact", head: true })
            .eq("license_id", license.id)
            .eq("revoked", false);
          if ((count ?? 0) >= license.max_activations)
            return errorResponse(
              "seat_limit",
              `All ${license.max_activations} device seats are in use.`,
              409,
            );
        }

        await db.from("license_activations").upsert(
          {
            license_id: license.id,
            device_fingerprint: device,
            hostname: body.hostname ?? null,
            platform: body.platform ?? null,
            app_version: meta.appVersion,
            revoked: false,
            last_seen_at: new Date().toISOString(),
          },
          { onConflict: "license_id,device_fingerprint" },
        );

        const { count: seats } = await db
          .from("license_activations")
          .select("id", { count: "exact", head: true })
          .eq("license_id", license.id)
          .eq("revoked", false);

        const { data: updated } = await db
          .from("licenses")
          .update({
            status: "active",
            activation_count: seats ?? 1,
            activated_at: license.activated_at ?? new Date().toISOString(),
            last_seen_at: new Date().toISOString(),
            device_fingerprint: license.device_fingerprint ?? device,
            domain: license.domain ?? body.domain ?? null,
          })
          .eq("id", license.id)
          .select("*")
          .single();

        await g.logEvent({
          event: "license.activate",
          license_id: license.id,
          license_key: normalized,
          device_fingerprint: device,
          ip_address: meta.ip,
          user_agent: meta.userAgent,
          app_version: meta.appVersion,
          details: { platform: body.platform ?? null },
        });

        return jsonResponse({
          ok: true,
          license: g.licensePayload(updated ?? license, { valid: true, reason: "ok" }),
          activated_at: new Date().toISOString(),
        });
      },
    },
  },
});
