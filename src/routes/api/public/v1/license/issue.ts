import { createFileRoute } from "@tanstack/react-router";
import { errorResponse, jsonResponse, preflight } from "@/lib/ghost-api";

/**
 * Admin-only license generation.
 * Auth: `Authorization: Bearer <GHOST_ADMIN_BOOTSTRAP_TOKEN>`
 */
export const Route = createFileRoute("/api/public/v1/license/issue")({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      POST: async ({ request }) => {
        const g = await import("@/lib/ghost-api.server");
        if (!g.isAdminBearer(request))
          return errorResponse("unauthorized", "Admin bearer token required.", 401);

        const meta = g.clientMeta(request);
        if (!g.rateLimit(`issue:${meta.ip ?? "admin"}`, 30).allowed)
          return errorResponse("rate_limited", "Too many requests.", 429);

        let body: {
          email?: string;
          plan?: string;
          max_activations?: number;
          expires_in_days?: number;
          notes?: string;
        } = {};
        const raw = await request.text();
        if (raw) {
          try {
            body = JSON.parse(raw);
          } catch {
            return errorResponse("bad_request", "Body must be JSON.", 400);
          }
        }

        const db = await g.admin();
        const email = body.email?.slice(0, 255).toLowerCase() ?? null;
        const plan = (body.plan ?? "pro").slice(0, 40);
        const productKey = ["lifetime", "text_lifetime", "text"].includes(plan.toLowerCase()) || plan.toLowerCase().includes("text") ? "text" : "caption";
        if (email) {
          const { data: existing } = await db.from("licenses")
            .select("license_key, plan, status, expires_at, max_activations")
            .ilike("email", email).eq("product_key", productKey)
            .order("created_at", { ascending: false }).limit(1).maybeSingle();
          if (existing) return jsonResponse({ ok: true, license: existing, reused: true }, 200);
        }
        const key = g.generateLicenseKey();
        const expires =
          body.expires_in_days && body.expires_in_days > 0
            ? new Date(Date.now() + body.expires_in_days * 86400_000).toISOString()
            : null;

        const { data, error } = await db
          .from("licenses")
          .insert({
            license_key: key,
            email,
            plan,
            status: "active",
            max_activations: Math.min(Math.max(body.max_activations ?? 2, 1), 25),
            expires_at: expires,
            notes: body.notes?.slice(0, 1000) ?? null,
          })
          .select("license_key, plan, status, expires_at, max_activations")
          .single();

        if (error) return errorResponse("insert_failed", error.message, 500);

        await g.logEvent({
          event: "license.issue",
          license_key: key,
          ip_address: meta.ip,
          details: { email: body.email ?? null, plan: data.plan },
        });

        return jsonResponse({ ok: true, license: data }, 201);
      },
    },
  },
});
