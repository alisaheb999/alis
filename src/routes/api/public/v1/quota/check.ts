import { createFileRoute } from "@tanstack/react-router";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, x-ghost-service-token, authorization",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Cache-Control": "no-store",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...cors },
  });
}

/**
 * Panel-facing quota gate.
 * POST { license_key?, device?, metric, amount?, dry_run? }
 * GET  ?license_key=&device=   -> full usage snapshot
 */
export const Route = createFileRoute("/api/public/v1/quota/check")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: cors }),

      GET: async ({ request }) => {
        const q = new URL(request.url).searchParams;
        const mod = await import("@/lib/ghost-quota.server");
        const identity = await mod.resolveIdentity(q.get("license_key"), q.get("device"));
        return json({ ok: true, ...(await mod.usageSnapshot(identity)) });
      },

      POST: async ({ request }) => {
        let body: Record<string, unknown> = {};
        try {
          body = (await request.json()) as Record<string, unknown>;
        } catch {
          return json({ ok: false, error: "invalid_json" }, 400);
        }

        const metric = String(body["metric"] ?? "").trim();
        if (!metric) return json({ ok: false, error: "metric_required" }, 400);

        const mod = await import("@/lib/ghost-quota.server");
        const identity = await mod.resolveIdentity(
          body["license_key"] as string | null,
          (body["device"] ?? body["device_fingerprint"]) as string | null,
        );

        const amount = Number(body["amount"] ?? 1);
        const dryRun = Boolean(body["dry_run"]);
        const verdict = await mod.consume(identity, metric, amount, dryRun);
        const grant = verdict.allowed ? await mod.issueGrant(identity, verdict.metric) : null;

        return json(
          {
            ok: verdict.allowed,
            license: { valid: identity.valid, plan: identity.plan, reason: identity.reason },
            ...verdict,
            grant,
          },
          verdict.allowed ? 200 : 429,
        );
      },
    },
  },
});
