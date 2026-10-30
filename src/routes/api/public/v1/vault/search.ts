import { createFileRoute } from "@tanstack/react-router";
import { errorResponse, jsonResponse, preflight } from "@/lib/ghost-api";

/**
 * GHOST Vault search — served from the mirrored catalogue so paging is stable
 * and the external library's daily search quota is never spent on browsing.
 */
export const Route = createFileRoute("/api/public/v1/vault/search")({
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
  const q = (url.searchParams.get("q") ?? "").trim().toLowerCase();
  const category = (url.searchParams.get("category") ?? "").trim();
  const kind = (url.searchParams.get("kind") ?? "").trim().toLowerCase();
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? 120) || 120, 1), 500);
  const offset = Math.max(Number(url.searchParams.get("offset") ?? 0) || 0, 0);

  const items = await v.vaultCatalogue();
  const origin = url.origin;

  const filtered = items.filter((item) => {
    if (category && category !== "all" && v.categoryId(item.category) !== category) return false;
    if (kind && String(item.kind).toLowerCase() !== kind) return false;
    if (!q) return true;
    const haystack = [item.title, item.file_name, item.category, ...(item.tags ?? [])].join(" ").toLowerCase();
    return haystack.includes(q);
  });

  const assets = filtered.slice(offset, offset + limit).map((item) => ({
    id: item.id,
    slug: `vault/${item.id}`,
    name: item.title || item.file_name,
    asset_type: item.kind,
    kind: item.kind,
    category: v.categoryId(item.category),
    category_label: v.titleCase(item.category || "General"),
    pack: "vault",
    file_name: item.file_name,
    mime_type: item.mime_type ?? null,
    size_bytes: Number(item.size_bytes || 0) || 0,
    preview_url: item.preview_url ?? null,
    url: `${origin}/api/public/v1/vault/download?id=${encodeURIComponent(item.id)}`,
    source: "vault",
  }));

  return jsonResponse({
    ok: true,
    total: filtered.length,
    grandTotal: items.length,
    bytes: filtered.reduce((sum, item) => sum + (Number(item.size_bytes || 0) || 0), 0),
    limit,
    offset,
    assets,
  });
}
