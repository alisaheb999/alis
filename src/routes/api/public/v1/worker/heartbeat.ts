import { createFileRoute } from "@tanstack/react-router";
import { jsonResponse, preflight } from "@/lib/ghost-api";
import { admin, workerAuthorized } from "@/lib/caption-queue.server";

/** Worker check-in: registers the worker on first call, then refreshes last_seen_at. */
export const Route = createFileRoute("/api/public/v1/worker/heartbeat")({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      POST: async ({ request }) => {
        const auth = workerAuthorized(request);
        if (!auth.ok) return jsonResponse({ ok: false, error: auth.reason }, 401);

        let body: Record<string, unknown> = {};
        try {
          body = (await request.json()) as Record<string, unknown>;
        } catch {
          body = {};
        }

        const db = await admin();
        const patch = {
          name: String(body.name || "ghost-caption-worker").slice(0, 80),
          status: ["idle", "busy", "paused"].includes(String(body.status)) ? String(body.status) : "idle",
          max_jobs: Math.max(1, Math.min(4, Number(body.maxJobs) || 1)),
          capabilities: JSON.parse(JSON.stringify(body.capabilities ?? {})) as Record<string, string | number | boolean>,
          last_seen_at: new Date().toISOString(),
        };

        const supplied = String(body.workerId || "");
        if (/^[0-9a-f-]{36}$/i.test(supplied)) {
          const { data } = await db
            .from("caption_workers")
            .update(patch)
            .eq("id", supplied)
            .select("id")
            .maybeSingle();
          if (data) return jsonResponse({ ok: true, workerId: data.id });
        }

        const { data, error } = await db.from("caption_workers").insert(patch).select("id").single();
        if (error || !data) {
          console.error("[ghost:caption] worker register failed", error);
          return jsonResponse({ ok: false, error: "Could not register the worker." }, 500);
        }
        return jsonResponse({ ok: true, workerId: data.id });
      },
    },
  },
});
