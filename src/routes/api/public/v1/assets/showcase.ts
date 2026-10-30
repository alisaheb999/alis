import { createFileRoute } from "@tanstack/react-router";
import { errorResponse, jsonResponse, preflight } from "@/lib/ghost-api";

/**
 * Marketing showcase feed — unsigned, read-only, heavily capped.
 * Returns short-lived signed thumbnails for a small curated sample of the
 * cloud library so the website panel preview shows real assets instead of
 * placeholder colour plates. Never returns download paths or private metadata.
 */
export const Route = createFileRoute("/api/public/v1/assets/showcase")({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      GET: async ({ request }) => handle(request),
    },
  },
});

const MAX_ITEMS = 36;
const SIGNED_TTL = 3600;

async function handle(request: Request) {
  const g = await import("@/lib/ghost-api.server");
  const meta = g.clientMeta(request);
  if (!g.rateLimit(`showcase:${meta.ip ?? "anon"}`, 120).allowed)
    return errorResponse("rate_limited", "Too many preview requests.", 429);

  const url = new URL(request.url);
  const limit = Math.min(
    MAX_ITEMS,
    Math.max(1, Number(url.searchParams.get("limit") ?? 24) || 24),
  );

  const db = await g.admin();
  const { data: rows } = await db
    .from("assets")
    .select("title,type,file_path,bucket,size_bytes,meta_data")
    .eq("published", true)
    .order("title", { ascending: true })
    .limit(240);

  const pool = rows ?? [];
  // Spread the sample across categories so the preview never shows 24 flags
  // from one region.
  const byCategory = new Map<string, typeof pool>();
  for (const row of pool) {
    const cat = String((row.meta_data as Record<string, unknown> | null)?.category ?? "misc");
    if (!byCategory.has(cat)) byCategory.set(cat, []);
    byCategory.get(cat)!.push(row);
  }
  const picked: typeof pool = [];
  let round = 0;
  while (picked.length < limit) {
    let added = false;
    for (const list of byCategory.values()) {
      if (list[round]) {
        picked.push(list[round]);
        added = true;
        if (picked.length >= limit) break;
      }
    }
    if (!added) break;
    round += 1;
  }

  const items = await Promise.all(
    picked.map(async (a) => {
      const { data } = await db.storage.from(a.bucket).createSignedUrl(a.file_path, SIGNED_TTL);
      const m = (a.meta_data ?? {}) as Record<string, unknown>;
      return {
        title: a.title,
        type: a.type,
        category: String(m.category ?? ""),
        pack: String(m.pack ?? ""),
        ext: String(m.file_name ?? "").split(".").pop()?.toUpperCase() ?? "PNG",
        size_bytes: a.size_bytes,
        url: data?.signedUrl ?? null,
      };
    }),
  );

  return jsonResponse(
    { ok: true, count: items.length, assets: items.filter((i) => i.url) },
    200,
    { "cache-control": "public, max-age=600" },
  );
}
