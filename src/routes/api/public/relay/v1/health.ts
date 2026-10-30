import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/relay/v1/health")({
  server: { handlers: { GET: () => Response.json({ ok: true, server_time: new Date().toISOString() }, { headers: { "Cache-Control": "no-store" } }) } },
});