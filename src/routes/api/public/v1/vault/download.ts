import { createFileRoute } from "@tanstack/react-router";
import { CORS_HEADERS, errorResponse, preflight } from "@/lib/ghost-api";

/**
 * GHOST Vault download — resolves the signed file URL upstream and redirects,
 * so the extension can download without ever seeing the vault API key.
 */
export const Route = createFileRoute("/api/public/v1/vault/download")({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      GET: async ({ request }) => handle(request),
    },
  },
});

async function handle(request: Request) {
  const v = await import("@/lib/ghost-vault.server");
  if (!v.vaultConfigured()) return errorResponse("not_configured", "The vault library is not connected.", 503);

  const id = new URL(request.url).searchParams.get("id") ?? "";
  if (!/^[a-zA-Z0-9-]{6,64}$/.test(id)) return errorResponse("bad_request", "A valid asset id is required.", 400);

  const target = await v.vaultFileUrl(id).catch(() => null);
  if (!target) return errorResponse("not_found", "That file is no longer available.", 404);

  return new Response(null, {
    status: 302,
    headers: { ...CORS_HEADERS, Location: target, "Cache-Control": "no-store" },
  });
}
