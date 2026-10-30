import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/relay/v1/heartbeat")({
  server: { handlers: { POST: async ({ request }) => {
    const { handleHeartbeat } = await import("@/lib/relay.server");
    return handleHeartbeat(request);
  } } },
});
