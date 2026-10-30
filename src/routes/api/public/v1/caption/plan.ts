import { createFileRoute } from "@tanstack/react-router";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Cache-Control": "no-store",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...cors } });

/** Keys are already normalized plan tiers; unknown never reaches here. */
const UPLOAD_MB: Record<string, number> = { free: 15, basic: 60, pro: 200, ultra: 400, team: 400 };
const TAG: Record<string, string> = { free: "FREE", basic: "LITE", pro: "PRO", ultra: "PRO", team: "TEAM" };
const NAME: Record<string, string> = {
  free: "ফ্রি প্ল্যান",
  basic: "লাইট প্ল্যান",
  pro: "প্রো প্ল্যান",
  ultra: "প্রো প্ল্যান",
  team: "টিম প্ল্যান",
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Ghostae Caption plan + usage surface for the AE panel.
 *  GET  ?key=&device=            -> plan tag, daily/monthly minutes, upload cap
 *  POST { key, device, minutes } -> counts one caption job (daily + monthly)
 */
export const Route = createFileRoute("/api/public/v1/caption/plan")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: cors }),

      GET: async ({ request }) => {
        const q = new URL(request.url).searchParams;
        return snapshot(q.get("key") ?? q.get("license_key"), q.get("device"), 0, true);
      },

      POST: async ({ request }) => {
        let body: Record<string, unknown> = {};
        try {
          body = (await request.json()) as Record<string, unknown>;
        } catch {
          return json({ ok: false, error: "invalid_json" }, 400);
        }
        const minutes = Math.max(1, Math.ceil(Number(body["minutes"]) || 1));
        return snapshot(
          (body["key"] ?? body["license_key"]) as string | null,
          body["device"] as string | null,
          minutes,
          Boolean(body["dry_run"]),
        );
      },
    },
  },
});

async function snapshot(key: string | null, device: string | null, minutes: number, dryRun: boolean) {
  try {
    const q = await import("@/lib/ghost-quota.server");
    const identity = await q.resolveIdentity(key, device);
    const amount = Math.max(1, minutes || 1);
    const termPeriod =
      identity.valid && identity.licenseId && (identity.plan === "basic" || identity.plan === "pro")
        ? `term:${identity.licenseId}`
        : undefined;

    const day = await q.consume(identity, "caption.minutes.day", amount, dryRun || minutes === 0, today());
    const month = await q.consume(identity, "caption.minutes", amount, dryRun || minutes === 0, termPeriod);
    const plan = identity.plan;
    const allowed = identity.valid && day.allowed && month.allowed;

    return json(
      {
        ok: allowed,
        licensed: identity.valid,
        reason: identity.valid ? (allowed ? "ok" : "quota_exceeded") : identity.reason,
        // Fail-closed: anything not clearly paid is shown as FREE, never LITE/PRO.
        tag: identity.valid ? (TAG[plan] ?? "FREE") : "FREE",
        plan,
        premium: identity.valid && plan !== "free",
        name: identity.valid ? (NAME[plan] ?? NAME["free"]) : NAME["free"],
        daily: { used: day.used, limit: day.limit },
        monthly: { used: month.used, limit: month.limit, period: month.period },
        upload_max_mb: UPLOAD_MB[plan] ?? 15,
        renew: month.reset_at,
      },
      identity.valid ? (allowed ? 200 : 429) : 403,
    );
  } catch {
    return json({ ok: false, licensed: false, reason: "server_error", tag: "FREE" }, 503);
  }
}
