import { createFileRoute } from "@tanstack/react-router";
import { errorResponse, jsonResponse, preflight } from "@/lib/ghost-api";

export const Route = createFileRoute("/api/public/v1/desktop/licenses")({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      GET: async ({ request }) => {
        const g = await import("@/lib/ghost-api.server");
        const d = await import("@/lib/desktop.server");
        const t = d.verifyToken(d.bearer(request));
        if (!t) return errorResponse("unauthorized", "Session expired. Please log in again.", 401);
        if (!g.rateLimit(`desk-lic:${t.hw}`, 60).allowed)
          return errorResponse("rate_limited", "Too many requests.", 429);

        const db = await g.admin();
        let q = db.from("licenses").select(d.LIC_COLS);
        q = t.uid ? q.eq("user_id", t.uid as string) : q.eq("license_key", t.lk as string);
        const { data, error } = await q;
        if (error) return errorResponse("unavailable", "License server busy, try later.", 503);

        return jsonResponse({
          success: true,
          server_time: new Date().toISOString(),
          licenses: (data ?? []).map((r: any) => d.desktopLicense(r, t.hw as string)),
        });
      },
    },
  },
});
