import { createFileRoute } from "@tanstack/react-router";
import { errorResponse, jsonResponse, preflight } from "@/lib/ghost-api";

const PATH = "/api/public/v1/assets/facets";

/**
 * Cloud library taxonomy.
 * Returns every published pack with its categories and asset counts so the
 * extension can render the cloud library category by category instead of one
 * flat, randomly ordered grid.
 */
export const Route = createFileRoute("/api/public/v1/assets/facets")({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      GET: async ({ request }) => handle(request),
      POST: async ({ request }) => handle(request),
    },
  },
});

const PACK_LABELS: Record<string, string> = {
  flags: "Flags",
  "white-icons": "White Icons",
  "black-icons": "Black Icons",
  "white-line-icons": "White Line",
  "glass-icons": "Glass",
  "business-man": "Business Man",
  "apple-emoji": "Apple Emoji",
};

function titleCase(value: string) {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

async function handle(request: Request) {
  const g = await import("@/lib/ghost-api.server");
  const raw = request.method === "POST" ? await request.text() : "";
  const meta = g.clientMeta(request);

  const sig = g.verifySignature(request.method, PATH, meta.timestamp, meta.signature, raw);
  if (!sig.ok) return errorResponse("bad_signature", sig.reason, 401);

  if (!g.rateLimit(`facets:${meta.licenseKey ?? meta.ip ?? "anon"}`, 60).allowed)
    return errorResponse("rate_limited", "Too many taxonomy requests.", 429);

  const db = await g.admin();
  const { data, error } = await db.rpc("asset_facets");
  if (error) return errorResponse("server_error", "Could not read the cloud taxonomy.", 500);

  type Row = { pack: string; category: string; asset_type: string; total: number };
  const rows = (data ?? []) as Row[];

  const packs: Array<{
    id: string;
    label: string;
    type: string;
    total: number;
    categories: Array<{ id: string; label: string; total: number }>;
  }> = [];
  const index = new Map<string, number>();

  for (const row of rows) {
    let at = index.get(row.pack);
    if (at === undefined) {
      at = packs.length;
      index.set(row.pack, at);
      packs.push({
        id: row.pack,
        label: PACK_LABELS[row.pack] ?? titleCase(row.pack),
        type: row.asset_type,
        total: 0,
        categories: [],
      });
    }
    const pack = packs[at];
    pack.total += Number(row.total) || 0;
    // A pack whose only category equals the pack name is really uncategorised.
    pack.categories.push({
      id: row.category,
      label: titleCase(row.category),
      total: Number(row.total) || 0,
    });
  }

  for (const pack of packs) {
    if (pack.categories.length === 1 && pack.categories[0].id === pack.id) pack.categories = [];
    pack.categories.sort((a, b) => a.label.localeCompare(b.label));
  }
  packs.sort((a, b) => b.total - a.total || a.label.localeCompare(b.label));

  return jsonResponse({
    ok: true,
    packs,
    total: packs.reduce((sum, p) => sum + p.total, 0),
    server_time: new Date().toISOString(),
  });
}
