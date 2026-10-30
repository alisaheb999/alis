import { createFileRoute } from "@tanstack/react-router";
import { preflight } from "@/lib/ghost-api";
import { forward } from "@/lib/desktop-proxy";

export const Route = createFileRoute("/api/public/v1/desktop/licenses/sync")({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      POST: async ({ request }) => forward(request, "/api/public/v1/desktop/licenses", "GET"),
      GET: async ({ request }) => forward(request, "/api/public/v1/desktop/licenses", "GET"),
    },
  },
});
