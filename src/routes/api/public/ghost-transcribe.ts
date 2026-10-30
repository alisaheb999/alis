import { createFileRoute } from "@tanstack/react-router";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type, x-ghost-key, x-ghost-device, x-ghost-version",
};

const MAX_BYTES = 24 * 1024 * 1024;

const EXT_BY_TYPE: Record<string, string> = {
  "audio/wav": "wav",
  "audio/x-wav": "wav",
  "audio/mpeg": "mp3",
  "audio/mp3": "mp3",
  "audio/mp4": "mp4",
  "audio/m4a": "m4a",
  "audio/webm": "webm",
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "video/webm": "webm",
};

export const Route = createFileRoute("/api/public/ghost-transcribe")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      POST: async ({ request }) => {
        const apiKey = process.env.LOVABLE_API_KEY;
        if (!apiKey) {
          return Response.json({ ok: false, error: "AI is not configured." }, { status: 500, headers: CORS });
        }

        let form: FormData;
        try {
          form = await request.formData();
        } catch {
          return Response.json({ ok: false, error: "Send the media as multipart/form-data." }, { status: 400, headers: CORS });
        }

        const file = form.get("file");
        if (!(file instanceof File) || file.size === 0) {
          return Response.json({ ok: false, error: "No media file received." }, { status: 400, headers: CORS });
        }
        if (file.size > MAX_BYTES) {
          return Response.json(
            { ok: false, error: "File is larger than 24 MB. Export a compressed audio track (mp3/m4a) and try again." },
            { status: 413, headers: CORS },
          );
        }

        // ---- licence + quota gate: nothing upstream is spent before this passes ----
        const { gateAiRequest, readCredentials } = await import("@/lib/ai-gate.server");
        const creds = readCredentials(request, form);
        // Billable minutes: prefer the real media duration, else estimate from size.
        const seconds = Number(form.get("duration") || form.get("duration_seconds") || 0);
        const minutes = Number.isFinite(seconds) && seconds > 0
          ? Math.max(1, Math.ceil(seconds / 60))
          : Math.max(1, Math.ceil(file.size / (1024 * 1024)));

        const gate = await gateAiRequest({
          request,
          route: "transcribe",
          key: creds.key,
          device: creds.device,
          perMinute: 8,
          metrics: [
            { metric: "caption.minutes.day", amount: minutes, daily: true },
            { metric: "caption.minutes", amount: minutes, term: true },
          ],
        });
        if (!gate.ok) {
          return Response.json(
            { ok: false, error: gate.error, reason: gate.reason },
            { status: gate.status, headers: CORS },
          );
        }

        const language = String(form.get("language") || "").trim();
        const baseType = (file.type || "audio/mpeg").split(";")[0];
        const ext = EXT_BY_TYPE[baseType] || (file.name.split(".").pop() || "mp3");

        const upstream = new FormData();
        upstream.append("model", "openai/gpt-4o-transcribe");
        upstream.append("file", file, `ghost-source.${ext}`);
        if (language && /^[a-z]{2}$/.test(language)) upstream.append("language", language);

        const response = await fetch("https://ai.gateway.lovable.dev/v1/audio/transcriptions", {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}` },
          body: upstream,
        });

        if (!response.ok) {
          const detail = await response.text().catch(() => "");
          console.error(`ghost-transcribe upstream ${response.status}: ${detail}`);
          const message =
            response.status === 429
              ? "Transcription is rate limited — try again in a moment."
              : response.status === 402
                ? "AI credits exhausted for this workspace."
                : `Transcription failed (${response.status}).`;
          return Response.json({ ok: false, error: message, detail }, { status: response.status, headers: CORS });
        }

        const payload = (await response.json()) as { text?: string };
        const text = String(payload.text || "").trim();
        if (!text) {
          return Response.json({ ok: false, error: "No speech was detected in that file." }, { status: 422, headers: CORS });
        }
        return Response.json({ ok: true, text }, { headers: CORS });
      },
    },
  },
});
