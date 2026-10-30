import { createFileRoute } from "@tanstack/react-router";
import { errorResponse, jsonResponse, preflight } from "@/lib/ghost-api";

const MAX_BYTES = 24 * 1024 * 1024;

/**
 * Queue the media for the Ghost Caption browser worker. Used automatically when
 * no paid STT provider key is configured, so the panel never dead-ends.
 */
async function queueBrowserJob(file: File, language: string, device: string, durationHint: number) {
  const { CAPTION_MAX_BYTES, admin, uploadMedia, workerOnline } = await import("@/lib/caption-queue.server");
  if (file.size > CAPTION_MAX_BYTES)
    return errorResponse("too_large", "Media is larger than 100 MB — export a compressed audio track.", 413);

  const db = await admin();
  const objectKey = await uploadMedia(file);
  const { data, error } = await db
    .from("caption_jobs")
    .insert({
      media_object_key: objectKey,
      media_name: file.name || "media",
      media_mime: file.type || "application/octet-stream",
      media_size: file.size,
      language: language || null,
      device_id: device || null,
      duration_hint: durationHint > 0 ? durationHint : null,
    })
    .select("id, status")
    .single();

  if (error || !data) {
    console.error("[ghost:stt] queue insert failed", error);
    return errorResponse("server_error", "Could not queue the caption job.", 500);
  }

  return jsonResponse({
    ok: true,
    mode: "job",
    provider: "ghost-browser",
    jobId: data.id,
    status: data.status,
    poll: `/api/public/v1/caption/jobs/${data.id}`,
    workerOnline: await workerOnline(),
  });
}

export const Route = createFileRoute("/api/public/v1/stt/transcribe")({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      POST: async ({ request }) => {
        let form: FormData;
        try {
          form = await request.formData();
        } catch {
          return errorResponse("bad_request", "Send the media as multipart/form-data.", 400);
        }

        const file = form.get("file");
        if (!(file instanceof File) || file.size === 0)
          return errorResponse("bad_request", "No media file received.", 400);

        const audioExt = ["mp3", "m4a", "wav", "aac", "flac", "ogg", "opus", "wma", "aiff", "aif"];
        const fname = (file.name || "").toLowerCase();
        const fext = fname.includes(".") ? fname.split(".").pop()! : "";
        const ftype = (file.type || "").toLowerCase();
        const isAudio = !ftype.startsWith("video/") && (audioExt.includes(fext) || ftype.startsWith("audio/"));
        if (!isAudio)
          return errorResponse(
            "unsupported_media",
            "Only audio supported. Please export your video as MP3 (or WAV/M4A) audio and upload that file.",
            415,
          );

        const requested = String(form.get("provider") || "auto").toLowerCase();
        const language = String(form.get("language") || "").trim();
        const device = String(form.get("device") || request.headers.get("x-ghost-device") || "").trim();
        const { providerKey, upstreamError } = await import("@/lib/ghost-providers.server");

        // Auto routing: use a hosted STT key when we have one, else the browser worker.
        let provider = requested;
        if (requested === "auto" || requested === "ghost" || requested === "browser") {
          if (requested === "auto" && providerKey("deepgram")) provider = "deepgram";
          else if (requested === "auto" && providerKey("assemblyai")) provider = "assemblyai";
          else if (requested === "auto" && providerKey("elevenlabs")) provider = "elevenlabs";
          else {
            try {
              return await queueBrowserJob(file, language, device, Number(form.get("duration")) || 0);
            } catch (err) {
              console.error("[ghost:stt] queue failed", err);
              return errorResponse("server_error", "Could not queue the caption job.", 500);
            }
          }
        }

        if (file.size > MAX_BYTES)
          return errorResponse("too_large", "File is larger than 24 MB — export a compressed audio track.", 413);


        try {
          if (provider === "deepgram") {
            const key = providerKey("deepgram");
            if (!key) return errorResponse("not_configured", "Deepgram key is not configured.", 503);
            const params = new URLSearchParams({ model: "nova-3", smart_format: "true", punctuate: "true" });
            if (language) params.set("language", language);
            const res = await fetch(`https://api.deepgram.com/v1/listen?${params}`, {
              method: "POST",
              headers: { Authorization: `Token ${key}`, "Content-Type": file.type || "application/octet-stream" },
              body: await file.arrayBuffer(),
            });
            if (!res.ok) {
              const e = await upstreamError("Deepgram", res);
              return errorResponse("upstream", e.message, e.status);
            }
            const data = (await res.json()) as any;
            const alt = data.results?.channels?.[0]?.alternatives?.[0];
            const text = String(alt?.transcript || "").trim();
            if (!text) return errorResponse("no_speech", "No speech was detected in that file.", 422);
            return jsonResponse({
              ok: true,
              provider,
              text,
              words: (alt?.words ?? []).map((w: any) => ({ text: w.punctuated_word ?? w.word, start: w.start, end: w.end })),
            });
          }

          if (provider === "assemblyai") {
            const key = providerKey("assemblyai");
            if (!key) return errorResponse("not_configured", "AssemblyAI key is not configured.", 503);
            const up = await fetch("https://api.assemblyai.com/v2/upload", {
              method: "POST",
              headers: { authorization: key, "Content-Type": "application/octet-stream" },
              body: await file.arrayBuffer(),
            });
            if (!up.ok) {
              const e = await upstreamError("AssemblyAI", up);
              return errorResponse("upstream", e.message, e.status);
            }
            const { upload_url } = (await up.json()) as { upload_url: string };
            const start = await fetch("https://api.assemblyai.com/v2/transcript", {
              method: "POST",
              headers: { authorization: key, "Content-Type": "application/json" },
              body: JSON.stringify({
                audio_url: upload_url,
                punctuate: true,
                ...(language ? { language_code: language } : { language_detection: true }),
              }),
            });
            if (!start.ok) {
              const e = await upstreamError("AssemblyAI", start);
              return errorResponse("upstream", e.message, e.status);
            }
            const job = (await start.json()) as { id: string };
            // Poll: AssemblyAI is async. Bounded so the Worker request cannot hang.
            for (let i = 0; i < 40; i++) {
              await new Promise((r) => setTimeout(r, 3000));
              const poll = await fetch(`https://api.assemblyai.com/v2/transcript/${job.id}`, {
                headers: { authorization: key },
              });
              const data = (await poll.json()) as any;
              if (data.status === "completed") {
                const text = String(data.text || "").trim();
                if (!text) return errorResponse("no_speech", "No speech was detected in that file.", 422);
                return jsonResponse({
                  ok: true,
                  provider,
                  text,
                  words: (data.words ?? []).map((w: any) => ({ text: w.text, start: w.start / 1000, end: w.end / 1000 })),
                });
              }
              if (data.status === "error")
                return errorResponse("upstream", String(data.error || "AssemblyAI transcription failed."), 502);
            }
            return errorResponse("timeout", "Transcription is still running — retry in a moment.", 504);
          }

          if (provider === "elevenlabs") {
            const key = providerKey("elevenlabs");
            if (!key) return errorResponse("not_configured", "ElevenLabs key is not configured.", 503);
            const upstream = new FormData();
            upstream.append("file", file, file.name || "ghost-source.mp3");
            upstream.append("model_id", "scribe_v1");
            upstream.append("diarize", "true");
            if (language) upstream.append("language_code", language);
            const res = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
              method: "POST",
              headers: { "xi-api-key": key },
              body: upstream,
            });
            if (!res.ok) {
              const e = await upstreamError("ElevenLabs", res);
              return errorResponse("upstream", e.message, e.status);
            }
            const data = (await res.json()) as any;
            const text = String(data.text || "").trim();
            if (!text) return errorResponse("no_speech", "No speech was detected in that file.", 422);
            return jsonResponse({
              ok: true,
              provider,
              text,
              words: (data.words ?? []).map((w: any) => ({ text: w.text, start: w.start, end: w.end, speaker: w.speaker_id })),
            });
          }

          return errorResponse("bad_request", "Unknown provider. Use deepgram, assemblyai or elevenlabs.", 400);
        } catch (err) {
          console.error("[ghost:stt] failure", err);
          return errorResponse("server_error", "Transcription failed.", 500);
        }
      },
    },
  },
});
