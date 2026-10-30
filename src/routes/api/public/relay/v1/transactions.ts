import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/relay/v1/transactions")({
  server: { handlers: { POST: async ({ request }) => {
    const { handleTransaction } = await import("@/lib/relay.server");
    return handleTransaction(request);
  } } },
});
