import { createFileRoute } from "@tanstack/react-router";

// Owner-only dev bridge: Antigravity uploads project ZIPs for audit.
// Isolated table + private bucket; no user data touched.
const MAX = 50 * 1024 * 1024;

function safeEqual(a: string, b: string) {
  if (!a || a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

export const Route = createFileRoute("/api/public/v1/dev/upload")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        
        const form = await request.formData().catch(() => null);
        const file = form?.get("file");
        const project = String(form?.get("project") ?? "").trim();
        const note = String(form?.get("note") ?? "").slice(0, 2000);
        if (!(file instanceof File)) return json({ error: "file missing" }, 400);
        if (!/^[a-z0-9-]{2,40}$/.test(project)) return json({ error: "project must be a-z0-9- (2-40)" }, 400);
        if (file.size > MAX) return json({ error: "max 50MB" }, 413);

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const path = `${project}/${new Date().toISOString().replace(/[:.]/g, "-")}.zip`;
        const up = await supabaseAdmin.storage
          .from("dev-snapshots")
          .upload(path, await file.arrayBuffer(), { contentType: "application/zip" });
        if (up.error) return json({ error: "upload failed" }, 500);
        await supabaseAdmin.from("dev_snapshots").insert({ project, note, file_path: path, size_bytes: file.size });
        return json({ ok: true, project, path });
      },
    },
  },
});
