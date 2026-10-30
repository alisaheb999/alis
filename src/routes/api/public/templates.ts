import { createFileRoute } from "@tanstack/react-router";
import { CORS_HEADERS, preflight } from "@/lib/ghost-api";

/** Template catalogue consumed by the Ghostae Presets panel (js/ghost-server-library.js). */
export const Route = createFileRoute("/api/public/templates")({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      GET: async () => {
        const { listTemplates } = await import("@/lib/ghost-templates.server");
        let templates: Awaited<ReturnType<typeof listTemplates>> = [];
        try {
          templates = await listTemplates();
        } catch {
          /* storage hiccup must not empty the panel: it falls back to previews */
        }
        return new Response(JSON.stringify({ ok: true, count: templates.length, templates }), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=86400",
            ...CORS_HEADERS,
          },
        });
      },
    },
  },
});
