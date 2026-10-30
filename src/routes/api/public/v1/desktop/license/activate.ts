import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { errorResponse, jsonResponse, preflight } from "@/lib/ghost-api";

const Body = z.object({
  license_key: z.string().min(8).max(128),
  hwid: z.string().min(8).max(256),
  machine_name: z.string().max(200).optional(),
  platform: z.string().max(40).optional(),
});

export const Route = createFileRoute("/api/public/v1/desktop/license/activate")({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      POST: async ({ request }) => {
        const g = await import("@/lib/ghost-api.server");
        const d = await import("@/lib/desktop.server");
        const meta = g.clientMeta(request);
        if (!g.rateLimit(`desk-act:${meta.ip ?? "anon"}`, 20).allowed)
          return errorResponse("rate_limited", "Too many activation attempts.", 429);

        const parsed = Body.safeParse(await request.json().catch(() => ({})));
        if (!parsed.success) return errorResponse("bad_request", "Invalid activation data.", 400);
        const b = parsed.data;

        const db = await g.admin();
        const { data: lic } = await db
          .from("licenses")
          .select(d.LIC_COLS)
          .eq("license_key", g.normalizeKey(b.license_key))
          .maybeSingle();
        if (!lic) return errorResponse("not_found", "License key not found.", 404);

        // A signed-in user may only activate licences they own (or unowned keys).
        const t = d.verifyToken(d.bearer(request));
        if (t?.uid && lic.user_id && lic.user_id !== t.uid)
          return errorResponse("forbidden", "This license belongs to another account.", 403);

        const view = d.desktopLicense(lic as any, b.hwid);
        if (!view.valid) return errorResponse(view.status, `License is ${view.status}.`, 403);

        const r = await d.bindDevice(db, lic as any, b.hwid, b.machine_name ?? null, b.platform ?? null);
        if (!r.ok) return errorResponse(r.code, r.message, r.status);

        await g.logEvent({
          event: "desktop.activate",
          license_id: lic.id,
          device_fingerprint: b.hwid,
          ip_address: meta.ip,
          user_agent: meta.userAgent,
        });

        return jsonResponse({
          success: true,
          activation_id: r.activation_id,
          devices_used: r.used,
          max_devices: lic.max_activations,
          license: { ...view, devices_used: r.used },
        });
      },
    },
  },
});
