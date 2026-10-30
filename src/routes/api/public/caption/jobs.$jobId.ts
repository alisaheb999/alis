import { createFileRoute } from "@tanstack/react-router";
import { COMPAT_CORS, compatJson } from "@/lib/caption-compat.server";

/** Status poll for the shipped panel. The job id is an unguessable UUID; no PII is returned. */
export const Route = createFileRoute("/api/public/caption/jobs/$jobId")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: COMPAT_CORS }),
      GET: async ({ params }) => {
        const jobId = String(params.jobId || "");
        if (!/^[0-9a-f-]{36}$/i.test(jobId)) {
          return compatJson({ ok: false, error: "Invalid job id." }, 400);
        }

        const { admin, parseSrt } = await import("@/lib/caption-queue.server");
        const db = await admin();
        const { data: job } = await db
          .from("caption_jobs")
          .select("id, status, stage, progress, result_srt, error_message")
          .eq("id", jobId)
          .maybeSingle();

        if (!job) return compatJson({ ok: false, error: "কাজটি আর পাওয়া যাচ্ছে না।" }, 404);

        if ((job.status === "done" || job.status === "completed") && job.result_srt) {
          const parsed = parseSrt(job.result_srt);
          return compatJson({
            ok: true,
            job: {
              id: job.id,
              status: "completed",
              progress: 100,
              result: { srt: job.result_srt, cues: parsed.ok ? parsed.cues : [] },
            },
          });
        }

        if (job.status === "failed") {
          return compatJson({
            ok: true,
            job: { id: job.id, status: "failed", progress: 0, error: job.error_message || "ক্যাপশন তৈরি হয়নি।" },
          });
        }

        if (job.status === "cancelled" || job.status === "canceled") {
          return compatJson({ ok: true, job: { id: job.id, status: "cancelled", progress: 0 } });
        }

        return compatJson({
          ok: true,
          job: { id: job.id, status: "processing", progress: Number(job.progress) || 5, stage: job.stage },
        });
      },
    },
  },
});
