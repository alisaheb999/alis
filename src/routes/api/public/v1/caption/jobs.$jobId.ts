import { createFileRoute } from "@tanstack/react-router";
import { jsonResponse, preflight } from "@/lib/ghost-api";
import { admin, parseSrt, workerOnline } from "@/lib/caption-queue.server";

/**
 * Job status for the After Effects panel. The job id is an unguessable UUID and
 * acts as the bearer for this single job — no PII is ever returned.
 */
export const Route = createFileRoute("/api/public/v1/caption/jobs/$jobId")({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      GET: async ({ params }) => {
        const jobId = String(params.jobId || "");
        if (!/^[0-9a-f-]{36}$/i.test(jobId)) {
          return jsonResponse({ ok: false, error: "Invalid job id." }, 400);
        }

        const db = await admin();
        const { data: job } = await db
          .from("caption_jobs")
          .select("id, status, stage, progress, result_srt, error_message, attempts, max_attempts, created_at")
          .eq("id", jobId)
          .maybeSingle();

        if (!job) return jsonResponse({ ok: false, error: "Job not found or expired." }, 404);

        if (job.status === "done" && job.result_srt) {
          const parsed = parseSrt(job.result_srt);
          return jsonResponse({
            ok: true,
            jobId: job.id,
            status: "done",
            stage: "done",
            progress: 100,
            srt: job.result_srt,
            cues: parsed.ok ? parsed.cues : [],
            text: parsed.ok ? parsed.cues.map((c) => c.text).join(" ") : "",
          });
        }

        if (job.status === "failed") {
          return jsonResponse({
            ok: false,
            jobId: job.id,
            status: "failed",
            error: job.error_message || "Caption job failed.",
          });
        }

        return jsonResponse({
          ok: true,
          jobId: job.id,
          status: job.status,
          stage: job.stage,
          progress: job.progress,
          workerOnline: await workerOnline(),
        });
      },
    },
  },
});
