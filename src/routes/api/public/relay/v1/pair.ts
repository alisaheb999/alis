import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/relay/v1/pair")({
  server: { handlers: { POST: async ({ request }) => {
    const { handlePair } = await import("@/lib/relay.server");
    return handlePair(request);
  } } },
});