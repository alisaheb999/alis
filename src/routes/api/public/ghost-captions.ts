import { createFileRoute } from "@tanstack/react-router";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type, x-ghost-key, x-ghost-device, x-ghost-version",
};

type Cue = { start: number; end: number; text: string };

function fallbackCues(text: string, duration: number): Cue[] {
  const chunks = text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?।])\s+/)
    .flatMap((sentence) => {
      const words = sentence.trim().split(" ").filter(Boolean);
      const out: string[] = [];
      for (let i = 0; i < words.length; i += 8) out.push(words.slice(i, i + 8).join(" "));
      return out;
    })
    .filter(Boolean);
  if (!chunks.length) return [];
  const totalChars = chunks.reduce((sum, chunk) => sum + chunk.length, 0) || 1;
  let cursor = 0;
  return chunks.map((chunk) => {
    const span = Math.max(0.6, (chunk.length / totalChars) * duration);
    const cue = { start: Number(cursor.toFixed(2)), end: Number(Math.min(duration, cursor + span).toFixed(2)), text: chunk };
    cursor += span;
    return cue;
  });
}

function sanitize(raw: unknown, duration: number): Cue[] {
  if (!Array.isArray(raw)) return [];
  const cues: Cue[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const text = String(row.text ?? "").trim();
    const start = Number(row.start);
    const end = Number(row.end);
    if (!text || !Number.isFinite(start) || !Number.isFinite(end) || end <= start) continue;
    cues.push({
      start: Math.max(0, Number(start.toFixed(2))),
      end: Number(Math.min(duration || end, end).toFixed(2)),
      text,
    });
  }
  return cues.sort((a, b) => a.start - b.start);
}

export const Route = createFileRoute("/api/public/ghost-captions")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      POST: async ({ request }) => {
        const apiKey = process.env.LOVABLE_API_KEY;
        if (!apiKey) {
          return Response.json({ ok: false, error: "AI is not configured." }, { status: 500, headers: CORS });
        }

        let body: { text?: unknown; duration?: unknown; maxChars?: unknown };
        try {
          body = (await request.json()) as typeof body;
        } catch {
          return Response.json({ ok: false, error: "Invalid JSON body." }, { status: 400, headers: CORS });
        }

        const text = String(body.text ?? "").trim().slice(0, 20000);
        const duration = Math.max(1, Math.min(7200, Number(body.duration) || 0)) || 60;
        const maxChars = Math.max(16, Math.min(120, Number(body.maxChars) || 42));
        if (!text) {
          return Response.json({ ok: false, error: "No transcript text supplied." }, { status: 400, headers: CORS });
        }

        // ---- licence + rate gate before any upstream AI call ----
        const { gateAiRequest, readCredentials } = await import("@/lib/ai-gate.server");
        const creds = readCredentials(request, body as Record<string, unknown>);
        const gate = await gateAiRequest({
          request,
          route: "captions",
          key: creds.key,
          device: creds.device,
          perMinute: 20,
          metrics: [{ metric: "command.chat", amount: 1 }],
        });
        if (!gate.ok) {
          return Response.json(
            { ok: false, error: gate.error, reason: gate.reason },
            { status: gate.status, headers: CORS },
          );
        }

        const prompt = [
          `Split this transcript into subtitle cues for a ${duration.toFixed(1)} second timeline.`,
          `Rules: keep the original language and wording, max ${maxChars} characters per cue,`,
          `1 to 2 lines per cue, cue duration between 0.8s and 5s, no overlaps, cover 0 to ${duration.toFixed(1)}s,`,
          `distribute timings evenly by word count.`,
          `Reply with JSON only: {"cues":[{"start":0,"end":1.8,"text":"..."}]}`,
          "",
          "TRANSCRIPT:",
          text,
        ].join("\n");

        let cues: Cue[] = [];
        try {
          const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              model: "google/gemini-3.6-flash",
              response_format: { type: "json_object" },
              messages: [
                { role: "system", content: "You are a professional subtitle timing engine. You reply with JSON only." },
                { role: "user", content: prompt },
              ],
            }),
          });
          if (response.ok) {
            const payload = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
            const content = payload.choices?.[0]?.message?.content ?? "";
            const parsed = JSON.parse(content) as { cues?: unknown };
            cues = sanitize(parsed.cues, duration);
          } else {
            console.error(`ghost-captions upstream ${response.status}: ${await response.text().catch(() => "")}`);
          }
        } catch (error) {
          console.error("ghost-captions timing failed", error);
        }

        if (!cues.length) cues = fallbackCues(text, duration);
        if (!cues.length) {
          return Response.json({ ok: false, error: "Could not build caption cues." }, { status: 422, headers: CORS });
        }
        return Response.json({ ok: true, cues }, { headers: CORS });
      },
    },
  },
});
