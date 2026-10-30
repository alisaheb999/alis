import { createFileRoute } from "@tanstack/react-router";
import { errorResponse, jsonResponse, preflight } from "@/lib/ghost-api";

const PATH = "/api/public/v1/text-styles";

/**
 * Cloud FFX text style library.
 * Returns every published text style with short-lived signed URLs for the
 * .ffx preset and its rendered PNG preview, so the panel can show the real
 * render (never a CSS approximation) and install the exact preset.
 */
export const Route = createFileRoute("/api/public/v1/text-styles")({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      GET: async ({ request }) => handle(request),
      POST: async ({ request }) => handle(request),
    },
  },
});

const BUCKET = "ghost-assets";

async function handle(request: Request) {
  const g = await import("@/lib/ghost-api.server");
  const raw = request.method === "POST" ? await request.text() : "";
  const meta = g.clientMeta(request);

  const sig = g.verifySignature(request.method, PATH, meta.timestamp, meta.signature, raw);
  if (!sig.ok) return errorResponse("bad_signature", sig.reason, 401);

  if (!g.rateLimit(`text-styles:${meta.licenseKey ?? meta.ip ?? "anon"}`, 60).allowed)
    return errorResponse("rate_limited", "Too many text style requests.", 429);

  const db = await g.admin();
  const { data, error } = await db
    .from("text_styles")
    .select("slug,name,tags,tier,ffx_path,preview_path,sort_order")
    .eq("published", true)
    .order("sort_order", { ascending: true })
    .limit(300);

  if (error) return errorResponse("server_error", "Could not read the text style library.", 500);

  const rows = data ?? [];
  const styles = [];
  for (const row of rows) {
    const ffx = await db.storage.from(BUCKET).createSignedUrl(row.ffx_path, 3600);
    let preview: string | null = null;
    if (row.preview_path) {
      const shot = await db.storage.from(BUCKET).createSignedUrl(row.preview_path, 3600);
      preview = shot.data?.signedUrl ?? null;
    }
    styles.push({
      slug: row.slug,
      name: row.name,
      tags: row.tags ?? [],
      tier: row.tier ?? "free",
      url: ffx.data?.signedUrl ?? null,
      preview,
    });
  }

  return jsonResponse({ ok: true, styles });
}
