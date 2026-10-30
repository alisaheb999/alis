import { createFileRoute } from "@tanstack/react-router";
import { jsonResponse, preflight } from "@/lib/ghost-api";
import { admin, parseSrt, removeMedia, workerAuthorized } from "@/lib/caption-queue.server";

/** Final result from the worker: validated SRT, or a failure report. */
export const Route = createFileRoute("/api/public/v1/worker/submit")({
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
        const { data: job } = await db
          .from("caption_jobs")
          .select("id, media_object_key, attempts, max_attempts, worker_id")
          .eq("id", jobId)
          .maybeSingle();
        if (!job) return jsonResponse({ ok: false, error: "Job not found." }, 404);
        if (job.worker_id && job.worker_id !== workerId) {
          return jsonResponse({ ok: false, error: "Job is leased to another worker." }, 409);
        }

        const finishWorker = () =>
          db.from("caption_workers").update({ status: "idle", last_seen_at: new Date().toISOString() }).eq("id", workerId);

        // Failure path — requeue while attempts remain so another run can pick it up.
        if (body.error || !body.srt) {
          const message = String(body.error || "Worker returned no SRT.").slice(0, 1000);
          const exhausted = (job.attempts ?? 1) >= (job.max_attempts ?? 3);
          await db
            .from("caption_jobs")
            .update({
              status: exhausted ? "failed" : "queued",
              stage: exhausted ? "failed" : "queued",
              progress: exhausted ? 100 : 0,
              worker_id: null,
              lease_expires_at: null,
              error_code: "worker_error",
              error_message: message,
              completed_at: exhausted ? new Date().toISOString() : null,
            })
            .eq("id", jobId);
          if (exhausted) await removeMedia([job.media_object_key]).catch(() => {});
          await finishWorker();
          return jsonResponse({ ok: true, status: exhausted ? "failed" : "queued" });
        }

        const parsed = parseSrt(String(body.srt));
        if (!parsed.ok) {
          const exhausted = (job.attempts ?? 1) >= (job.max_attempts ?? 3);
          await db
            .from("caption_jobs")
            .update({
              status: exhausted ? "failed" : "queued",
              stage: exhausted ? "failed" : "queued",
              worker_id: null,
              lease_expires_at: null,
              error_code: "invalid_srt",
              error_message: parsed.error,
              completed_at: exhausted ? new Date().toISOString() : null,
            })
            .eq("id", jobId);
          await finishWorker();
          return jsonResponse({ ok: false, error: parsed.error }, 422);
        }

        await db
          .from("caption_jobs")
          .update({
            status: "done",
            stage: "done",
            progress: 100,
            result_srt: parsed.srt,
            error_code: null,
            error_message: null,
            worker_id: null,
            lease_expires_at: null,
            completed_at: new Date().toISOString(),
          })
          .eq("id", jobId);

        // The media is no longer needed once captions exist.
        await removeMedia([job.media_object_key]).catch(() => {});
        await finishWorker();

        return jsonResponse({ ok: true, status: "done", cues: parsed.cues.length });
      },
    },
  },
});
