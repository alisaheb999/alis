import { createFileRoute } from "@tanstack/react-router";
import { errorResponse, jsonResponse, preflight } from "@/lib/ghost-api";

/**
 * Self-serve licence key — only works while the admin has the
 * "Auto licence" switch turned ON (admin panel → Keys tab).
 *
 * GET  → { enabled }            (so the UI can show the right button)
 * POST → { license: { key } }   (issues one key, respects a daily cap)
 */
export const Route = createFileRoute("/api/public/v1/license/auto")({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      GET: async () => {
        const cfg = await settings();
        return jsonResponse({ ok: true, enabled: cfg.enabled, plan: cfg.plan });
      },
      POST: async ({ request }) => {
        const g = await import("@/lib/ghost-api.server");
        const meta = g.clientMeta(request);
        if (!g.rateLimit(`auto-license:${meta.ip ?? "anon"}`, 6).allowed)
          return errorResponse("rate_limited", "Too many requests. Try again later.", 429);

        const cfg = await settings();
        if (!cfg.enabled)
          return jsonResponse({ ok: true, enabled: false, license: null, reason: "disabled" });

        let body: { email?: string; contact?: string; product?: string } = {};
        try {
          const raw = await request.text();
          if (raw) body = JSON.parse(raw);
        } catch {
          /* ignore */
        }

        const db = await g.admin();
        const since = new Date(Date.now() - 86400_000).toISOString();
        const { count } = await db
          .from("licenses")
          .select("id", { count: "exact", head: true })
          .eq("notes", "auto-issued")
          .gte("created_at", since);
        if ((count ?? 0) >= cfg.daily_limit)
          return jsonResponse({ ok: true, enabled: false, license: null, reason: "daily_limit" });

        const contact = (body.email || body.contact || "").toString().slice(0, 255) || null;
        const key = g.generateLicenseKey();
        // HARD RULE: a self-serve key is ALWAYS free, never a paid tier, no
        // matter what the admin setting says. Paid plans only come from orders.
        const expires = null;

        const { data, error } = await db
          .from("licenses")
          .insert({
            license_key: key,
            email: contact,
            plan: "free",
            status: "active",
            max_activations: 1,
            expires_at: expires,
            notes: "auto-issued",
          })
          .select("license_key, plan, status, expires_at")
          .single();
        if (error) return errorResponse("insert_failed", error.message, 500);

        await g.logEvent({
          event: "license.auto_issue",
          license_key: key,
          ip_address: meta.ip,
          details: { contact, product: body.product ?? null, plan: "free" },
        });

        return jsonResponse({ ok: true, enabled: true, license: data }, 201);
      },
    },
  },
});

async function settings() {
  const fallback = { enabled: false, plan: "free", trial_days: 7, daily_limit: 50 };
  try {
    const g = await import("@/lib/ghost-api.server");
    const db = await g.admin();
    const { data } = await db
      .from("extension_settings")
      .select("value, enabled")
      .eq("module", "license")
      .eq("key", "auto_issue")
      .maybeSingle();
    if (!data) return fallback;
    const value = (data.value ?? {}) as Record<string, unknown>;
    return {
      enabled: Boolean(data.enabled),
      plan: "free", // self-serve keys are free-only by design
      trial_days: Number(value.trial_days ?? 7),
      daily_limit: Number(value.daily_limit ?? 50),
    };
  } catch {
    return fallback;
  }
}
