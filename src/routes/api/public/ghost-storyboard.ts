import { createFileRoute } from "@tanstack/react-router";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type, x-ghost-key, x-ghost-device, x-ghost-version",
};

type Shot = {
  title: string;
  description: string;
  shot: string;
  camera: string;
  transition: string;
  motion: string;
  visual: string;
  duration: number;
};

type Scene = { name: string; intent: string; shots: Shot[] };

function num(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Number(parsed.toFixed(1)) : fallback;
}

function sanitize(raw: unknown): Scene[] {
  if (!Array.isArray(raw)) return [];
  const scenes: Scene[] = [];
  for (const sceneRaw of raw.slice(0, 24)) {
    if (!sceneRaw || typeof sceneRaw !== "object") continue;
    const scene = sceneRaw as Record<string, unknown>;
    const shotsRaw = Array.isArray(scene.shots) ? scene.shots : [];
    const shots: Shot[] = [];
    for (const shotRaw of shotsRaw.slice(0, 12)) {
      if (!shotRaw || typeof shotRaw !== "object") continue;
      const shot = shotRaw as Record<string, unknown>;
      const title = String(shot.title ?? "").trim();
      if (!title) continue;
      shots.push({
        title: title.slice(0, 120),
        description: String(shot.description ?? "").trim().slice(0, 600),
        shot: String(shot.shot ?? "").trim().slice(0, 120),
        camera: String(shot.camera ?? "").trim().slice(0, 160),
        transition: String(shot.transition ?? "").trim().slice(0, 120),
        motion: String(shot.motion ?? "").trim().slice(0, 200),
        visual: String(shot.visual ?? "").trim().slice(0, 300),
        duration: num(shot.duration, 3),
      });
    }
    const name = String(scene.name ?? "").trim();
    if (!name && !shots.length) continue;
    scenes.push({ name: (name || "Scene").slice(0, 120), intent: String(scene.intent ?? "").trim().slice(0, 300), shots });
  }
  return scenes;
}

export const Route = createFileRoute("/api/public/ghost-storyboard")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      POST: async ({ request }) => {
        const apiKey = process.env.LOVABLE_API_KEY;
        if (!apiKey) {
          return Response.json({ ok: false, error: "AI is not configured." }, { status: 500, headers: CORS });
        }

        let body: { idea?: unknown; format?: unknown; duration?: unknown; language?: unknown };
        try {
          body = (await request.json()) as typeof body;
        } catch {
          return Response.json({ ok: false, error: "Invalid JSON body." }, { status: 400, headers: CORS });
        }

        const idea = String(body.idea ?? "").trim().slice(0, 6000);
        const format = String(body.format ?? "youtube").trim().slice(0, 60) || "youtube";
        const duration = Math.max(5, Math.min(3600, Number(body.duration) || 60));
        const language = String(body.language ?? "auto").trim().slice(0, 20);
        if (!idea) {
          return Response.json({ ok: false, error: "Write your idea first." }, { status: 400, headers: CORS });
        }

        // ---- licence + rate gate before any upstream AI call ----
        const { gateAiRequest, readCredentials } = await import("@/lib/ai-gate.server");
        const creds = readCredentials(request, body as Record<string, unknown>);
        const gate = await gateAiRequest({
          request,
          route: "storyboard",
          key: creds.key,
          device: creds.device,
          perMinute: 10,
          metrics: [{ metric: "idea.ai", amount: 1 }],
        });
        if (!gate.ok) {
          return Response.json(
            { ok: false, error: gate.error, reason: gate.reason },
            { status: gate.status, headers: CORS },
          );
        }

        const prompt = [
          `Build a professional ${format} storyboard from this idea for a ${duration} second piece.`,
          language === "auto"
            ? "Write in the same language the idea is written in."
            : `Write the storyboard in ${language}.`,
          "Break it into scenes; each scene holds shots. For every shot give: title, description,",
          "shot size/type, camera movement, transition into the next shot, motion/animation direction,",
          "visual & art-direction note, and a duration in seconds. Shot durations must sum to roughly",
          `${duration} seconds. Follow real production workflow (hook, build, payoff, CTA where relevant).`,
          'Reply with JSON only: {"title":"...","summary":"...","scenes":[{"name":"...","intent":"...","shots":[{"title":"...","description":"...","shot":"...","camera":"...","transition":"...","motion":"...","visual":"...","duration":3}]}]}',
          "",
          "IDEA:",
          idea,
        ].join("\n");

        const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-3.6-flash",
            response_format: { type: "json_object" },
            messages: [
              {
                role: "system",
                content:
                  "You are a senior director and storyboard artist for motion design and film. You reply with JSON only, no prose.",
              },
              { role: "user", content: prompt },
            ],
          }),
        });

        if (!response.ok) {
          const detail = await response.text().catch(() => "");
          console.error(`ghost-storyboard upstream ${response.status}: ${detail}`);
          const message =
            response.status === 429
              ? "AI is rate limited — try again shortly."
              : response.status === 402
                ? "AI credits exhausted for this workspace."
                : `Storyboard generation failed (${response.status}).`;
          return Response.json({ ok: false, error: message }, { status: response.status, headers: CORS });
        }

        const payload = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
        let parsed: { title?: unknown; summary?: unknown; scenes?: unknown } = {};
        try {
          parsed = JSON.parse(payload.choices?.[0]?.message?.content ?? "{}");
        } catch {
          return Response.json({ ok: false, error: "AI returned an unreadable storyboard." }, { status: 502, headers: CORS });
        }

        const scenes = sanitize(parsed.scenes);
        if (!scenes.length) {
          return Response.json({ ok: false, error: "AI returned no scenes — try a longer idea." }, { status: 422, headers: CORS });
        }

        return Response.json(
          {
            ok: true,
            title: String(parsed.title ?? "").trim().slice(0, 160) || "Untitled storyboard",
            summary: String(parsed.summary ?? "").trim().slice(0, 600),
            format,
            duration,
            scenes,
          },
          { headers: CORS },
        );
      },
    },
  },
});
