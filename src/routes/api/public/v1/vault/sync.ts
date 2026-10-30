import { createFileRoute } from "@tanstack/react-router";
import { errorResponse, jsonResponse, preflight } from "@/lib/ghost-api";

/**
 * GHOST Vault sync — mirrors a slice of the external library into our cache.
 * Called by the panel on cold start and by admins to force a refresh; the daily
 * upstream quota is enforced inside vaultSync().
 */
export const Route = createFileRoute("/api/public/v1/vault/sync")({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      GET: async ({ request }) => handle(request),
      POST: async ({ request }) => handle(request),
    },
  },
});

async function handle(request: Request) {
  const v = await import("@/lib/ghost-vault.server");
  if (!v.vaultConfigured()) {
    return errorResponse("not_configured", "The vault library is not connected.", 503);
  }
  const url = new URL(request.url);
  const pages = Math.min(Math.max(Number(url.searchParams.get("pages") ?? 6) || 6, 1), 40);
  const force = url.searchParams.get("force") === "1";
  try {
    const result = await v.vaultSync({ pages, force });
    return jsonResponse({ ok: true, ...result });
  } catch (err) {
    return errorResponse("sync_failed", err instanceof Error ? err.message : "Sync failed", 502);
  }
}
