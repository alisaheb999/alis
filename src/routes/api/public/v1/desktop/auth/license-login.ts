import { createFileRoute } from "@tanstack/react-router";
import { preflight } from "@/lib/ghost-api";
import { forward } from "@/lib/desktop-proxy";

export const Route = createFileRoute("/api/public/v1/desktop/auth/license-login")({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      POST: async ({ request }) => forward(request, "/api/public/v1/desktop/auth/login", "POST"),
    },
  },
});
