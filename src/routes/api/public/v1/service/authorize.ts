import { createFileRoute } from "@tanstack/react-router";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, x-ghost-service-token, authorization",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Cache-Control": "no-store",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...cors },
  });
}

/**
 * Sub-server gate (Presets / Text asset servers call this before serving a file).
 * POST { license_key?, device?, metric, amount? }
 */
export const Route = createFileRoute("/api/public/v1/service/authorize")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: cors }),

      POST: async ({ request }) => {
        const mod = await import("@/lib/ghost-quota.server");
        // No token needed: this endpoint only counts usage, it exposes no data.

        let body: Record<string, unknown> = {};
        try {
          body = (await request.json()) as Record<string, unknown>;
        } catch {
          return json({ ok: false, error: "invalid_json" }, 400);
        }

        const metric = String(body["metric"] ?? "").trim();
        if (!metric) return json({ ok: false, error: "metric_required" }, 400);

        const identity = await mod.resolveIdentity(
          body["license_key"] as string | null,
          (body["device"] ?? body["device_fingerprint"]) as string | null,
        );
        const verdict = await mod.consume(identity, metric, Number(body["amount"] ?? 1), false);

        return json(
          {
            ok: verdict.allowed,
            licensed: identity.valid,
            license_reason: identity.reason,
            ...verdict,
            grant: verdict.allowed ? await mod.issueGrant(identity, verdict.metric) : null,
          },
          verdict.allowed ? 200 : 429,
        );
      },
    },
  },
});
