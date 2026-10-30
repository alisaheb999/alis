import { createFileRoute } from "@tanstack/react-router";
import { errorResponse, jsonResponse, preflight } from "@/lib/ghost-api";

/** Short-lived ZIP link — open installer mode, any published release. */
export const Route = createFileRoute("/api/public/v1/desktop/download")({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      GET: async ({ request }) => {
        const g = await import("@/lib/ghost-api.server");
        const id = new URL(request.url).searchParams.get("release_id") ?? "";
        if (!/^[0-9a-f-]{36}$/i.test(id)) return errorResponse("bad_request", "Invalid release.", 400);
        const db = await g.admin();
        const { data: rel } = await db
          .from("extension_releases")
          .select("id, product_key, storage_path, sha256, version, is_free, published")
          .eq("id", id)
          .maybeSingle();
        if (!rel || !rel.published) return errorResponse("not_found", "Release not found.", 404);

        // Installer mode: no login/licence check (re-enable in a future version).

        if (/^https:\/\//i.test(rel.storage_path)) {
          return jsonResponse({ success: true, url: rel.storage_path, sha256: rel.sha256, version: rel.version, expires_in: 900 });
        }
        const { data: s } = await db.storage.from("extension-releases").createSignedUrl(rel.storage_path, 900);
        if (!s?.signedUrl) return errorResponse("unavailable", "Download busy, try later.", 503);
        return jsonResponse({ success: true, url: s.signedUrl, sha256: rel.sha256, version: rel.version, expires_in: 900 });
      },
    },
  },
});
