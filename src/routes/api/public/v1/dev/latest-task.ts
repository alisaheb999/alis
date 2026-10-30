import { createFileRoute } from "@tanstack/react-router";

// Antigravity task bridge: returns the newest prompt uploaded under project "antigravity-task".
// Read-only; the PC sync script polls this and writes ANTIGRAVITY_PROMPT.md.
export const Route = createFileRoute("/api/public/v1/dev/latest-task")({
  server: {
    handlers: {
      GET: async () => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data } = await supabaseAdmin
          .from("dev_snapshots")
          .select("file_path, created_at, note")
          .eq("project", "antigravity-task")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (!data) return new Response("", { status: 204 });
        const dl = await supabaseAdmin.storage.from("dev-snapshots").download(data.file_path);
        if (dl.error) return new Response("not found", { status: 404 });
        return new Response(await dl.data.text(), {
          headers: {
            "content-type": "text/markdown; charset=utf-8",
            "x-task-id": data.file_path,
            "cache-control": "no-store",
          },
        });
      },
    },
  },
});
