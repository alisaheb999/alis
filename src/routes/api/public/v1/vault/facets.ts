import { createFileRoute } from "@tanstack/react-router";
import { errorResponse, jsonResponse, preflight } from "@/lib/ghost-api";

/**
 * GHOST Vault taxonomy — every category with its file count and total size, so
 * Ghostae Cache can render the external library category by category and show
 * accurate "N files · X GB" totals.
 */
export const Route = createFileRoute("/api/public/v1/vault/facets")({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      GET: async ({ request }) => handle(request),
    },
  },
});

async function handle(request: Request) {
  const v = await import("@/lib/ghost-vault.server");
  if (!v.vaultConfigured()) {
    return errorResponse("not_configured", "The vault library is not connected.", 503);
  }

  const url = new URL(request.url);
  if (url.searchParams.get("sync") === "1") await v.vaultSync({ pages: 6 }).catch(() => null);

  const [items, state] = await Promise.all([v.vaultCatalogue(), v.vaultState()]);

  type Bucket = { id: string; label: string; total: number; bytes: number; kinds: Record<string, number> };
  const buckets = new Map<string, Bucket>();
  let bytes = 0;

  for (const item of items) {
    const id = v.categoryId(item.category);
    let bucket = buckets.get(id);
    if (!bucket) {
      bucket = { id, label: v.titleCase(item.category || "General"), total: 0, bytes: 0, kinds: {} };
      buckets.set(id, bucket);
    }
    const size = Number(item.size_bytes || 0) || 0;
    bucket.total += 1;
    bucket.bytes += size;
    bucket.kinds[item.kind] = (bucket.kinds[item.kind] ?? 0) + 1;
    bytes += size;
  }

  const categories = [...buckets.values()].sort((a, b) => b.total - a.total);
  const expected = Number(state?.expected_total ?? 0) || items.length;

  return jsonResponse({
    ok: true,
    pack: { id: "vault", label: "GHOST Vault", type: "mixed" },
    total: items.length,
    expected,
    bytes,
    partial: items.length < expected,
    updatedAt: state?.updated_at ?? null,
    categories,
  });
}
