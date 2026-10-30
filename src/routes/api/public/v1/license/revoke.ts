import { createFileRoute } from "@tanstack/react-router";
import { errorResponse, jsonResponse, preflight } from "@/lib/ghost-api";

export const Route = createFileRoute("/api/public/v1/license/revoke")({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      POST: async ({ request }) => {
        const g = await import("@/lib/ghost-api.server");
        // Revocation is an admin-only operation — never license-key authenticated.
        if (!g.isAdminBearer(request))
          return errorResponse("unauthorized", "Admin bearer token required.", 401);

        const raw = await request.text();
        const meta = g.clientMeta(request);
        if (!g.rateLimit(`revoke:${meta.ip ?? "admin"}`, 30).allowed)
          return errorResponse("rate_limited", "Too many requests.", 429);

        let body: {
          license_key?: string;
          device_fingerprint?: string;
          action?: "revoke" | "suspend" | "reinstate";
          reason?: string;
        };
        try {
          body = raw ? JSON.parse(raw) : {};
        } catch {
          return errorResponse("bad_request", "Body must be JSON.", 400);
        }

        const key = (body.license_key ?? "").toString();
        if (!key) return errorResponse("bad_request", "license_key is required.", 400);
        const action = body.action ?? "revoke";

        const db = await g.admin();
        const normalized = g.normalizeKey(key);
        const { data: license } = await db
          .from("licenses")
          .select("*")
          .eq("license_key", normalized)
          .maybeSingle();
        if (!license) return errorResponse("not_found", "License not found.", 404);

        // Single-device revocation frees the seat but leaves the license alive.
        if (body.device_fingerprint) {
          await db
            .from("license_activations")
            .update({ revoked: action !== "reinstate" })
            .eq("license_id", license.id)
            .eq("device_fingerprint", body.device_fingerprint);
        } else {
          // "suspend" is the action name; "suspended" is the stored status.
          const status =
            action === "suspend" ? "suspended" : action === "reinstate" ? "active" : "revoked";
          await db
            .from("licenses")
            .update({ status, notes: body.reason ?? license.notes })
            .eq("id", license.id);
          if (action !== "reinstate")
            await db.from("license_activations").update({ revoked: true }).eq("license_id", license.id);
        }

        await g.logEvent({
          event: `license.${action}`,
          license_id: license.id,
          license_key: normalized,
          device_fingerprint: body.device_fingerprint ?? null,
          ip_address: meta.ip,
          user_agent: meta.userAgent,
          details: { reason: body.reason ?? null },
        });

        return jsonResponse({ ok: true, action, license_key: normalized });
      },
    },
  },
});
