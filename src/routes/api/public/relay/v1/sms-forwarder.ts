import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/relay/v1/sms-forwarder")({
  server: { handlers: { POST: async ({ request }) => {
    const { handleSmsForwarder } = await import("@/lib/relay.server");
    return handleSmsForwarder(request);
  } } },
});
