import { createFileRoute } from "@tanstack/react-router";
import { jsonResponse, preflight } from "@/lib/ghost-api";

export const Route = createFileRoute("/api/public/v1/license/tamper")({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      POST: async ({ request }) => {
        const g = await import("@/lib/ghost-api.server");
        const meta = g.clientMeta(request);
        let body: {
          license_key?: string;
          device_fingerprint?: string;
          kind?: string;
          detail?: string;
          panel?: string;
        } = {};
        try {
          body = await request.json();
        } catch {
          body = {};
        }

        const key = String(body.license_key || meta.licenseKey || "");
        const normalized = key ? g.normalizeKey(key) : null;

        await g.logEvent({
          event: "license.tamper",
          status: String(body.kind || "unknown"),
          license_key: normalized,
          device_fingerprint: String(body.device_fingerprint || meta.device || "") || null,
          ip_address: meta.ip,
          user_agent: meta.userAgent,
          app_version: meta.appVersion,
          details: { kind: String(body.kind || "unknown"), detail: String(body.detail || "").slice(0, 500), panel: String(body.panel || "") },
        });

        // Tamper reports auto-suspend the key so the panel locks everywhere.
        if (normalized) {
          const db = await g.admin();
          const { data: license } = await db
            .from("licenses")
            .select("id, notes, status")
            .eq("license_key", normalized)
            .maybeSingle();
          if (license && license.status === "active") {
            await db
              .from("licenses")
              .update({
                status: "suspended",
                notes:
                  (license.notes ? license.notes + "\n" : "") +
                  "BLOCK: tamper detected (" +
                  String(body.kind || "unknown") +
                  ")",
              })
              .eq("id", license.id);
          }
        }

        return jsonResponse({ ok: true });
      },
    },
  },
});
