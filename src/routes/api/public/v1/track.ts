import { createFileRoute } from "@tanstack/react-router";
import { licenseFingerprint, packageMeta, resolveTier, recordDownload } from "@/lib/ghost-packages.server";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, x-ghost-license, x-ghost-key, x-ghost-panel, x-ghost-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Cache-Control": "no-store",
};

/**
 * Dead-simple click/usage counter. No token, no auth, never blocks the panel.
 * POST { panel: "text", action: "download", item?: "preset-name" }
 */
export const Route = createFileRoute("/api/public/v1/track")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: cors }),

      POST: async ({ request }) => {
        let body: Record<string, unknown> = {};
        try {
          body = (await request.json()) as Record<string, unknown>;
        } catch {
          /* empty body is fine */
        }

        const panel = String(body["panel"] ?? "unknown").slice(0, 40);
        const action = String(body["action"] ?? "click").slice(0, 40);
        const item = body["item"] == null ? null : String(body["item"]).slice(0, 160);
        const meta = packageMeta(request);
        const tier = await resolveTier(meta.license);

        await recordDownload({
          packageName: `${panel}:${action}`,
          item,
          tier,
          fingerprint: licenseFingerprint(meta.license),
          panelVersion: meta.panelVersion,
          country: meta.country,
        });

        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...cors },
        });
      },
    },
  },
});
