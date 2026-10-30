import { createFileRoute } from "@tanstack/react-router";
import { errorResponse, jsonResponse, preflight } from "@/lib/ghost-api";
import { z } from "zod";

const PATH = "/api/public/v1/feedback/report";

const Body = z.object({
  panel: z.string().min(1).max(40).default("unknown"),
  message: z.string().min(3).max(4000),
  contact: z.string().max(255).optional().or(z.literal("")),
  severity: z.enum(["issue", "idea", "bug", "crash"]).default("issue"),
});

export const Route = createFileRoute("/api/public/v1/feedback/report")({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      POST: async ({ request }) => {
        const g = await import("@/lib/ghost-api.server");
        const raw = await request.text();
        const meta = g.clientMeta(request);

        const sig = g.verifySignature("POST", PATH, meta.timestamp, meta.signature, raw);
        if (!sig.ok) return errorResponse("bad_signature", sig.reason, 401);

        if (!g.rateLimit(`report:${meta.device ?? meta.ip ?? "anon"}`, 12).allowed)
          return errorResponse("rate_limited", "Too many reports — try again later.", 429);

        let body: z.infer<typeof Body>;
        try {
          body = Body.parse(raw ? JSON.parse(raw) : {});
        } catch {
          return errorResponse("bad_request", "Write a slightly longer message.", 400);
        }

        const db = await g.admin();
        const { error } = await db.from("panel_reports").insert({
          panel: body.panel,
          message: body.message,
          contact: body.contact || null,
          severity: body.severity,
          device_fingerprint: meta.device ?? null,
          license_key: meta.licenseKey ? g.normalizeKey(meta.licenseKey) : null,
          app_version: meta.appVersion,
        } as never);
        if (error) return errorResponse("write_failed", "Could not save the report.", 500);

        return jsonResponse({ ok: true, received_at: new Date().toISOString() });
      },
    },
  },
});
