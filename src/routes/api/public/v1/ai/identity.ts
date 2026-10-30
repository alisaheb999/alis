import { createFileRoute } from "@tanstack/react-router";
import { errorResponse, jsonResponse, preflight } from "@/lib/ghost-api";

/**
 * Ghost AI OS — Layer 1 identity feed.
 *
 * The panel ships an offline copy of the identity so it keeps working without
 * network, then merges whatever this endpoint returns on top of it. Behaviour
 * can therefore be tuned centrally from the admin console without releasing a
 * new extension build.
 */
export const Route = createFileRoute("/api/public/v1/ai/identity")({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      GET: async () => handle(),
      POST: async () => handle(),
    },
  },
});

async function handle() {
  try {
    const { loadIdentity } = await import("@/lib/ghost-identity.server");
    const doc = await loadIdentity();
    return jsonResponse({
      ok: true,
      layer: 1,
      revision: doc.revision,
      updatedAt: doc.updatedAt,
      count: doc.count,
      system: doc.system,
      sections: doc.sections.map((s) => ({
        slug: s.slug,
        title: s.title,
        body: s.body,
        ordinal: s.ordinal,
      })),
    });
  } catch (err) {
    return errorResponse("server_error", err instanceof Error ? err.message : "Unknown error", 500);
  }
}
