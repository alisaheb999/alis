import { createFileRoute } from "@tanstack/react-router";
import { errorResponse, jsonResponse, preflight } from "@/lib/ghost-api";
import { z } from "zod";

const Body = z.object({
  panel: z.string().max(120).default("unknown"),
  message: z.string().min(1).max(1200),
  source: z.string().max(300).default(""),
  line: z.number().int().min(0).max(10_000_000).default(0),
  column: z.number().int().min(0).max(10_000_000).default(0),
  stack: z.string().max(3000).default(""),
  chrome: z.number().int().min(0).max(999).default(0),
  variant: z.string().max(40).default("unknown"),
});

export const Route = createFileRoute("/api/public/v1/runtime-report")({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      POST: async ({ request }) => {
        const g = await import("@/lib/ghost-api.server");
        const meta = g.clientMeta(request);
        if (!meta.licenseKey || !meta.device)
          return errorResponse("unauthorized", "An activated extension is required.", 401);
        if (!g.rateLimit(`runtime:${meta.device}`, 20, 60_000).allowed)
          return errorResponse("rate_limited", "Too many runtime reports.", 429);

        let body: z.infer<typeof Body>;
        try {
          body = Body.parse(await request.json());
        } catch {
          return errorResponse("bad_request", "Invalid runtime report.", 400);
        }

        const db = await g.admin();
        const normalized = g.normalizeKey(meta.licenseKey);
        const { data: license } = await db
          .from("licenses")
          .select("id, status, expires_at, license_key, plan, max_activations, activation_count, device_fingerprint, domain")
          .eq("license_key", normalized)
          .maybeSingle();
        const verdict = g.evaluateLicense(license);
        if (!verdict.valid) return errorResponse("license_invalid", "License is not active.", 403);

        await g.logEvent({
          event: "runtime.error",
          status: "error",
          license_id: license?.id ?? null,
          license_key: normalized,
          device_fingerprint: meta.device,
          ip_address: meta.ip,
          user_agent: meta.userAgent,
          app_version: meta.appVersion,
          details: body,
        });
        return jsonResponse({ ok: true });
      },
    },
  },
});