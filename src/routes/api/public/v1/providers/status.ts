import { createFileRoute } from "@tanstack/react-router";
import { CORS_HEADERS, jsonResponse, preflight } from "@/lib/ghost-api";

export const Route = createFileRoute("/api/public/v1/providers/status")({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      GET: async () => {
        const { providerAvailability } = await import("@/lib/ghost-providers.server");
        // Booleans only — key values never leave the server.
        return jsonResponse({ ok: true, providers: providerAvailability() }, 200, CORS_HEADERS);
      },
    },
  },
});
