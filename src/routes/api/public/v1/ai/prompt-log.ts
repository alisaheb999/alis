import { createFileRoute } from "@tanstack/react-router";
import { errorResponse, jsonResponse, preflight } from "@/lib/ghost-api";

type Body = {
  category?: string;
  detected?: string;
  provider?: string;
  model?: string;
  rawLength?: number;
  expandedLength?: number;
  ok?: boolean;
  rating?: number;
  latencyMs?: number;
  device?: string;
  licenseKey?: string;
  appVersion?: string;
  meta?: Record<string, unknown>;
};

const num = (v: unknown, max: number) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(0, Math.min(max, Math.round(n))) : 0;
};

/**
 * Anonymous quality telemetry for the prompt optimisation pipeline.
 * Only lengths, category and outcome are stored — never the prompt text — so
 * rule weights can be tuned over time without holding user content.
 */
export const Route = createFileRoute("/api/public/v1/ai/prompt-log")({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      POST: async ({ request }) => {
        let body: Body;
        try {
          body = (await request.json()) as Body;
        } catch {
          return errorResponse("bad_request", "Send a JSON body.", 400);
        }
        try {
          const g = await import("@/lib/ghost-api.server");
          const db = await g.admin();
          const { error } = await db.from("prompt_runs").insert({
            category: String(body.category || "general").slice(0, 64),
            detected_category: body.detected ? String(body.detected).slice(0, 64) : null,
            provider: body.provider ? String(body.provider).slice(0, 64) : null,
            model: body.model ? String(body.model).slice(0, 120) : null,
            raw_length: num(body.rawLength, 100000),
            expanded_length: num(body.expandedLength, 200000),
            ok: body.ok !== false,
            rating: body.rating == null ? null : num(body.rating, 5),
            latency_ms: body.latencyMs == null ? null : num(body.latencyMs, 600000),
            device_fingerprint: body.device ? String(body.device).slice(0, 200) : null,
            license_key: body.licenseKey ? String(body.licenseKey).slice(0, 120) : null,
            app_version: body.appVersion ? String(body.appVersion).slice(0, 40) : null,
            meta_data: (body.meta && typeof body.meta === "object" ? body.meta : {}) as never,
          });
          if (error) return errorResponse("db_error", error.message, 500);
          return jsonResponse({ ok: true });
        } catch (err) {
          return errorResponse("server_error", err instanceof Error ? err.message : "Unknown error", 500);
        }
      },
    },
  },
});
