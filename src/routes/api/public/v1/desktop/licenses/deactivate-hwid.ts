import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { errorResponse, jsonResponse, preflight } from "@/lib/ghost-api";

const Body = z.object({
  license_key: z.string().min(8).max(128),
  hwid: z.string().min(8).max(256),
});

export const Route = createFileRoute("/api/public/v1/desktop/licenses/deactivate-hwid")({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      POST: async ({ request }) => {
        const g = await import("@/lib/ghost-api.server");
        const d = await import("@/lib/desktop.server");
        const meta = g.clientMeta(request);
        if (!g.rateLimit(`desk-deact:${meta.ip ?? "anon"}`, 20).allowed)
          return errorResponse("rate_limited", "Too many requests.", 429);

        const parsed = Body.safeParse(await request.json().catch(() => ({})));
        if (!parsed.success) return errorResponse("bad_request", "Invalid data.", 400);
        const b = parsed.data;

        // Session must belong to this device and own the licence.
        const t = d.verifyToken(d.bearer(request));
        if (!t || t.hw !== b.hwid)
          return errorResponse("unauthorized", "Session expired. Please log in again.", 401);

        const db = await g.admin();
        const key = g.normalizeKey(b.license_key);
        const { data: lic } = await db
          .from("licenses")
          .select("id, user_id, license_key, max_activations")
          .eq("license_key", key)
          .maybeSingle();
        if (!lic) return errorResponse("not_found", "License key not found.", 404);
        const owns = t.uid ? lic.user_id === t.uid : t.lk === key;
        if (!owns) return errorResponse("forbidden", "This license belongs to another account.", 403);

        // Free the seat (never touch revoked rows — admin revocations stay).
        await db
          .from("license_activations")
          .delete()
          .eq("license_id", lic.id)
          .eq("device_fingerprint", b.hwid)
          .eq("revoked", false);
        const { count } = await db
          .from("license_activations")
          .select("id", { count: "exact", head: true })
          .eq("license_id", lic.id)
          .eq("revoked", false);
        await db.from("licenses").update({ activation_count: count ?? 0 }).eq("id", lic.id);

        await g.logEvent({
          event: "desktop.deactivate",
          license_id: lic.id,
          device_fingerprint: b.hwid,
          ip_address: meta.ip,
          user_agent: meta.userAgent,
        });

        return jsonResponse({ success: true, devices_used: count ?? 0, max_devices: lic.max_activations });
      },
    },
  },
});
