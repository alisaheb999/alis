import { createFileRoute } from "@tanstack/react-router";
import { preflight } from "@/lib/ghost-api";
import { forward } from "@/lib/desktop-proxy";

export const Route = createFileRoute("/api/public/v1/desktop/licenses/activate-hwid")({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      POST: async ({ request }) => forward(request, "/api/public/v1/desktop/license/activate", "POST"),
    },
  },
});
