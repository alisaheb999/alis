import { createFileRoute } from "@tanstack/react-router";
import { errorResponse, jsonResponse, preflight } from "@/lib/ghost-api";

type Body = { version?: string; model?: string; input?: Record<string, unknown>; wait?: boolean };

export const Route = createFileRoute("/api/public/v1/image/replicate")({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      POST: async ({ request }) => {
        let body: Body;
        try {
          body = (await request.json()) as Body;
        } catch {
          return errorResponse("bad_request", "Send a JSON body.", 400);
        }
        const input = body.input && typeof body.input === "object" ? body.input : null;
        if (!input) return errorResponse("bad_request", "input object is required.", 400);
        if (!body.version && !body.model)
          return errorResponse("bad_request", "Provide a Replicate model or version.", 400);

        const { providerKey, upstreamError } = await import("@/lib/ghost-providers.server");
        const key = providerKey("replicate");
        if (!key) return errorResponse("not_configured", "Replicate token is not configured.", 503);

        const endpoint = body.model
          ? `https://api.replicate.com/v1/models/${body.model}/predictions`
          : "https://api.replicate.com/v1/predictions";

        try {
          const res = await fetch(endpoint, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${key}`,
              "Content-Type": "application/json",
              ...(body.wait === false ? {} : { Prefer: "wait=55" }),
            },
            body: JSON.stringify(body.model ? { input } : { version: body.version, input }),
          });
          if (!res.ok) {
            const e = await upstreamError("Replicate", res);
            return errorResponse("upstream", e.message, e.status);
          }
          const data = (await res.json()) as any;
          return jsonResponse({
            ok: true,
            provider: "replicate",
            id: data.id,
            status: data.status,
            output: data.output ?? null,
            error: data.error ?? null,
          });
        } catch (err) {
          console.error("[ghost:replicate] failure", err);
          return errorResponse("server_error", "Replicate request failed.", 500);
        }
      },
    },
  },
});
