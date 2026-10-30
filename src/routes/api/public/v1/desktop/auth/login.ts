import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { errorResponse, jsonResponse, preflight } from "@/lib/ghost-api";

const Body = z.object({
  email: z.string().email().max(255).optional(),
  password: z.string().min(1).max(200).optional(),
  license_key: z.string().min(8).max(128).optional(),
  hwid: z.string().min(8).max(256),
  machine_name: z.string().max(200).optional(),
  platform: z.string().max(40).optional(),
});

export const Route = createFileRoute("/api/public/v1/desktop/auth/login")({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      POST: async ({ request }) => {
        const g = await import("@/lib/ghost-api.server");
        const d = await import("@/lib/desktop.server");
        const meta = g.clientMeta(request);
        if (!g.rateLimit(`desk-login:${meta.ip ?? "anon"}`, 15).allowed)
          return errorResponse("rate_limited", "Too many login attempts.", 429);

        const parsed = Body.safeParse(await request.json().catch(() => ({})));
        if (!parsed.success) return errorResponse("bad_request", "Invalid login data.", 400);
        const b = parsed.data;
        const db = await g.admin();

        let user: { id: string | null; email: string | null };
        let rows: any[] = [];

        if (b.license_key) {
          const { data } = await db
            .from("licenses")
            .select(d.LIC_COLS)
            .eq("license_key", g.normalizeKey(b.license_key))
            .maybeSingle();
          if (!data) return errorResponse("invalid_key", "License key not found.", 401);
          user = { id: data.user_id, email: data.email };
          rows = [data];
        } else if (b.email && b.password) {
          const url = process.env["SUPABASE_URL"]!;
          const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
          const anon = createClient(url, key, {
            auth: { persistSession: false, autoRefreshToken: false },
          });
          const { data, error } = await anon.auth.signInWithPassword({
            email: b.email,
            password: b.password,
          });
          if (error || !data.user)
            return errorResponse("invalid_credentials", "Email or password is incorrect.", 401);
          user = { id: data.user.id, email: data.user.email ?? b.email };
          const { data: list } = await db
            .from("licenses")
            .select(d.LIC_COLS)
            .eq("user_id", data.user.id);
          rows = list ?? [];
        } else {
          return errorResponse("bad_request", "Provide email+password or license_key.", 400);
        }

        const token = d.signToken({
          uid: user.id,
          lk: b.license_key ? g.normalizeKey(b.license_key) : null,
          hw: b.hwid,
          exp: Date.now() + d.TOKEN_TTL_MS,
        });

        await g.logEvent({
          event: "desktop.login",
          device_fingerprint: b.hwid,
          ip_address: meta.ip,
          user_agent: meta.userAgent,
          details: { mode: b.license_key ? "license_key" : "email", count: rows.length },
        });

        return jsonResponse({
          success: true,
          token,
          expires_at: new Date(Date.now() + d.TOKEN_TTL_MS).toISOString(),
          user: { id: user.id, email: user.email },
          licenses: rows.map((r) => d.desktopLicense(r, b.hwid)),
        });
      },
    },
  },
});
