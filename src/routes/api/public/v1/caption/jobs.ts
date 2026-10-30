import { createFileRoute } from "@tanstack/react-router";
import { preflight } from "@/lib/ghost-api";
import { CAPTION_MAX_BYTES, admin, uploadMedia, workerOnline } from "@/lib/caption-queue.server";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

export const Route = createFileRoute("/api/public/v1/caption/jobs")({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      POST: async ({ request }) => {
        let form: FormData;
        try {
          form = await request.formData();
        } catch {
          return json({ ok: false, error: "Send the media as multipart/form-data." }, 400);
        }

        const file = form.get("file");
        if (!(file instanceof File) || file.size === 0) {
          return json({ ok: false, error: "No media file received." }, 400);
        }
        if (file.size > CAPTION_MAX_BYTES) {
          return json({ ok: false, error: "Media is larger than 100 MB — export a compressed audio track." }, 413);
        }

        const idempotencyKey =
          (request.headers.get("idempotency-key") || String(form.get("idempotencyKey") || "")).trim() || null;
        const db = await admin();

        if (idempotencyKey) {
          const { data: existing } = await db
            .from("caption_jobs")
            .select("id, status")
            .eq("idempotency_key", idempotencyKey)
            .maybeSingle();
          if (existing) return json({ ok: true, jobId: existing.id, status: existing.status });
        }

        let objectKey: string;
        try {
          objectKey = await uploadMedia(file);
        } catch (error) {
          console.error("[ghost:caption] upload failed", error);
          return json({ ok: false, error: "Could not store the media file." }, 500);
        }

        const { data, error } = await db
          .from("caption_jobs")
          .insert({
            media_object_key: objectKey,
            media_name: file.name || "media",
            media_mime: file.type || "application/octet-stream",
            media_size: file.size,
            duration_hint: Number(form.get("duration")) || null,
            language: String(form.get("language") || "").trim() || null,
            device_id: String(form.get("device") || request.headers.get("x-ghost-device") || "").trim() || null,
            idempotency_key: idempotencyKey,
          })
          .select("id, status")
          .single();

        if (error || !data) {
          console.error("[ghost:caption] job insert failed", error);
          return json({ ok: false, error: "Could not queue the caption job." }, 500);
        }

        return json({
          ok: true,
          jobId: data.id,
          status: data.status,
          poll: `/api/public/v1/caption/jobs/${data.id}`,
          workerOnline: await workerOnline(),
        });
      },
    },
  },
});
