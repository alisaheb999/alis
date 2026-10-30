import { createFileRoute } from "@tanstack/react-router";
import {
  COMPAT_CORS,
  COMPAT_MAX_BYTES,
  buildCues,
  compatCharge,
  compatIdentity,
  compatJson,
  compatTranscribe,
  minutesFor,
} from "@/lib/caption-compat.server";

/**
 * Step 2 of the shipped panel's flow: receive the media, meter it, transcribe it
 * and return finished cues. Quota is charged BEFORE any AI credit is spent.
 */
export const Route = createFileRoute("/api/public/caption/jobs/$jobId/upload")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: COMPAT_CORS }),
      POST: async ({ request, params }) => {
        const jobId = String(params.jobId || "");
        if (!/^[0-9a-f-]{36}$/i.test(jobId)) {
          return compatJson({ ok: false, error: "Invalid job id." }, 400);
        }

        const { admin, cuesToSrt } = await import("@/lib/caption-queue.server");
        const db = await admin();
        const { data: job } = await db
          .from("caption_jobs")
          .select("id, status, device_id, language, duration_hint")
          .eq("id", jobId)
          .maybeSingle();
        if (!job) return compatJson({ ok: false, error: "কাজটি আর পাওয়া যাচ্ছে না।" }, 404);
        if (job.status === "cancelled" || job.status === "canceled") {
          return compatJson({ ok: true, job: { id: jobId, status: "cancelled", progress: 0 } });
        }

        let form: FormData;
        try {
          form = await request.formData();
        } catch {
          return compatJson({ ok: false, error: "মিডিয়া ফাইল পাঠানো যায়নি।" }, 400);
        }

        const file = form.get("file");
        if (!(file instanceof File) || file.size === 0) {
          return compatJson({ ok: false, error: "কোনো মিডিয়া ফাইল পাওয়া যায়নি।" }, 400);
        }
        if (file.size > COMPAT_MAX_BYTES) {
          return compatJson(
            { ok: false, error: "ফাইলটি ২৪ মেগাবাইটের বেশি — কম্প্রেস করা অডিও (mp3/m4a) দিন।" },
            413,
          );
        }

        const durationHint = Number(form.get("duration")) || Number(job.duration_hint) || 0;
        const minutes = minutesFor(file.size, durationHint);
        const identity = await compatIdentity(request, { device: job.device_id });

        const charge = await compatCharge(identity, minutes, false);
        if (!charge.allowed) {
          await db
            .from("caption_jobs")
            .update({ status: "failed", progress: 0, error_code: "quota", error_message: "quota exceeded" })
            .eq("id", jobId);
          return compatJson(
            { ok: false, error: "আপনার প্ল্যানের ক্যাপশন সীমা শেষ হয়েছে। ghostae.com থেকে প্ল্যান আপগ্রেড করুন।" },
            429,
          );
        }

        await db
          .from("caption_jobs")
          .update({
            status: "processing",
            stage: "transcribing",
            progress: 30,
            media_name: file.name || "media",
            media_mime: file.type || "application/octet-stream",
            media_size: file.size,
          })
          .eq("id", jobId);

        let text: string;
        try {
          text = await compatTranscribe(file, String(form.get("language") || job.language || ""));
        } catch (error) {
          const message = error instanceof Error ? error.message : "ক্যাপশন তৈরি করা যায়নি।";
          await db
            .from("caption_jobs")
            .update({ status: "failed", progress: 0, error_code: "transcribe", error_message: message })
            .eq("id", jobId);
          return compatJson({ ok: false, error: message }, 502);
        }

        const duration = durationHint > 0 ? durationHint : minutes * 60;
        const cues = buildCues(text, duration);
        if (!cues.length) {
          await db
            .from("caption_jobs")
            .update({ status: "failed", progress: 0, error_code: "empty", error_message: "no cues" })
            .eq("id", jobId);
          return compatJson({ ok: false, error: "অডিওতে স্পষ্ট কথা পাওয়া যায়নি।" }, 422);
        }

        const srt = cuesToSrt(cues);
        await db
          .from("caption_jobs")
          .update({
            status: "done",
            stage: "done",
            progress: 100,
            result_srt: srt,
            completed_at: new Date().toISOString(),
          })
          .eq("id", jobId);

        return compatJson({
          ok: true,
          job: { id: jobId, status: "completed", progress: 100, result: { srt, cues } },
        });
      },
    },
  },
});
