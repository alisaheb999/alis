import { createFileRoute } from "@tanstack/react-router";
import { errorResponse, jsonResponse, preflight } from "@/lib/ghost-api";

/** Admin download/license stats — consumed by extension-src/ghostae-text/docs/stats.mjs. */
export const Route = createFileRoute("/api/admin/v1/stats")({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      GET: async ({ request }) => {
        const { timingSafeEqual } = await import("node:crypto");
        const expected =
          process.env.GHOST_ADMIN_STATS_TOKEN ?? process.env.GHOST_ADMIN_BOOTSTRAP_TOKEN ?? "";
        const given =
          request.headers.get("x-ghost-admin-token") ??
          request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
          "";
        const a = Buffer.from(given);
        const b = Buffer.from(expected);
        if (!expected || a.length !== b.length || !timingSafeEqual(a, b))
          return errorResponse("unauthorized", "Invalid admin token.", 401);

        const { admin } = await import("@/lib/ghost-api.server");
        const db = await admin();

        const [totals, daily, licenses, activations] = await Promise.all([
          db.from("download_totals").select("*"),
          db.from("download_daily").select("*").order("day", { ascending: false }).limit(60),
          db.from("licenses").select("status, plan"),
          db.from("license_activations").select("id", { count: "exact", head: true }).eq("revoked", false),
        ]);

        const rows = licenses.data ?? [];
        const byPlan: Record<string, number> = {};
        const byStatus: Record<string, number> = {};
        for (const r of rows) {
          const plan = String(r.plan ?? "unknown");
          const status = String(r.status ?? "unknown");
          byPlan[plan] = (byPlan[plan] ?? 0) + 1;
          byStatus[status] = (byStatus[status] ?? 0) + 1;
        }

        return jsonResponse({
          ok: true,
          generated_at: new Date().toISOString(),
          downloads: { totals: totals.data ?? [], daily: daily.data ?? [] },
          licenses: {
            total: rows.length,
            by_plan: byPlan,
            by_status: byStatus,
            active_devices: activations.count ?? 0,
          },
        });
      },
    },
  },
});
