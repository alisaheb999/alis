import { createFileRoute } from "@tanstack/react-router";
import { jsonResponse, preflight } from "@/lib/ghost-api";
import { CAPTION_LEASE_SECONDS, admin, workerAuthorized } from "@/lib/caption-queue.server";

/** Progress ping — also extends the job lease so long jobs are not requeued. */
export const Route = createFileRoute("/api/public/v1/worker/progress")({
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

        const jobId = String(body.jobId || "");
        const workerId = String(body.workerId || "");
        if (!/^[0-9a-f-]{36}$/i.test(jobId) || !/^[0-9a-f-]{36}$/i.test(workerId)) {
          return jsonResponse({ ok: false, error: "jobId and workerId are required." }, 400);
        }

        const db = await admin();
        // Only the worker holding the lease may report progress.
        const { data: leased } = await db
          .from("caption_jobs")
          .select("id")
          .eq("id", jobId)
          .eq("worker_id", workerId)
          .maybeSingle();
        if (!leased) {
          return jsonResponse({ ok: false, error: "not_leased_to_worker" }, 409);
        }

        await db
          .from("caption_jobs")
          .update({
            progress: Math.max(0, Math.min(99, Number(body.progress) || 0)),
            stage: String(body.stage || "processing").slice(0, 40),
            lease_expires_at: new Date(Date.now() + CAPTION_LEASE_SECONDS * 1000).toISOString(),
          })
          .eq("id", jobId)
          .eq("worker_id", workerId);

        await db
          .from("caption_workers")
          .update({ status: "busy", last_seen_at: new Date().toISOString() })
          .eq("id", workerId);

        return jsonResponse({ ok: true });
      },
    },
  },
});
