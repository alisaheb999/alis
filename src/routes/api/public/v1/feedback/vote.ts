import { createFileRoute } from "@tanstack/react-router";
import { errorResponse, jsonResponse, preflight } from "@/lib/ghost-api";
import { z } from "zod";

const PATH = "/api/public/v1/feedback/vote";

const Body = z.object({
  preset_name: z.string().min(1).max(160),
  preset_kind: z.string().min(1).max(40).default("animation"),
  panel: z.string().min(1).max(40).default("ghost-text"),
  vote: z.enum(["up", "down"]),
});

export const Route = createFileRoute("/api/public/v1/feedback/vote")({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      POST: async ({ request }) => {
        const g = await import("@/lib/ghost-api.server");
        const raw = await request.text();
        const meta = g.clientMeta(request);

        const sig = g.verifySignature("POST", PATH, meta.timestamp, meta.signature, raw);
        if (!sig.ok) return errorResponse("bad_signature", sig.reason, 401);

        if (!g.rateLimit(`vote:${meta.device ?? meta.ip ?? "anon"}`, 120).allowed)
          return errorResponse("rate_limited", "Too many votes.", 429);

        const device = (meta.device ?? "").toString();
        if (!device) return errorResponse("bad_request", "Device header is required.", 400);

        let body: z.infer<typeof Body>;
        try {
          body = Body.parse(raw ? JSON.parse(raw) : {});
        } catch {
          return errorResponse("bad_request", "Invalid vote payload.", 400);
        }

        const db = await g.admin();
        const { error } = await db.from("preset_votes").upsert(
          {
            preset_name: body.preset_name,
            preset_kind: body.preset_kind,
            panel: body.panel,
            vote: body.vote,
            device_fingerprint: device,
            license_key: meta.licenseKey ? g.normalizeKey(meta.licenseKey) : null,
            app_version: meta.appVersion,
          } as never,
          { onConflict: "preset_kind,preset_name,device_fingerprint" },
        );
        if (error) return errorResponse("write_failed", "Could not record the vote.", 500);

        const { count: up } = await db
          .from("preset_votes")
          .select("id", { count: "exact", head: true })
          .eq("preset_kind", body.preset_kind)
          .eq("preset_name", body.preset_name)
          .eq("vote", "up");
        const { count: down } = await db
          .from("preset_votes")
          .select("id", { count: "exact", head: true })
          .eq("preset_kind", body.preset_kind)
          .eq("preset_name", body.preset_name)
          .eq("vote", "down");

        return jsonResponse({ ok: true, vote: body.vote, up: up ?? 0, down: down ?? 0 });
      },
    },
  },
});
