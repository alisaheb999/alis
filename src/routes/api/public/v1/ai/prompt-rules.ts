import { createFileRoute } from "@tanstack/react-router";
import { errorResponse, jsonResponse, preflight } from "@/lib/ghost-api";

/**
 * Ghost intelligent prompting — cloud rule set.
 *
 * The panel ships a built-in copy of every category rule so it keeps working
 * offline, then merges whatever this endpoint returns on top of it. That means
 * prompt quality can be improved centrally (new rules, re-weighted rules,
 * disabled rules) without shipping a new extension build.
 */
export const Route = createFileRoute("/api/public/v1/ai/prompt-rules")({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      GET: async () => handle(),
      POST: async () => handle(),
    },
  },
});

async function handle() {
  try {
    const g = await import("@/lib/ghost-api.server");
    const db = await g.admin();
    const { data, error } = await db
      .from("prompt_templates")
      .select("category,kind,title,body,weight,quality_score,version")
      .eq("enabled", true)
      .order("category", { ascending: true })
      .order("weight", { ascending: false });

    if (error) return errorResponse("db_error", error.message, 500);

    const categories: Record<string, { system: string[]; rules: string[] }> = {};
    for (const row of data ?? []) {
      const key = String(row.category || "general");
      const bucket = (categories[key] ??= { system: [], rules: [] });
      if (String(row.kind) === "system") bucket.system.push(String(row.body));
      else bucket.rules.push(String(row.body));
    }

    return jsonResponse({
      ok: true,
      revision: (data ?? []).reduce((max, r) => Math.max(max, Number(r.version || 1)), 1),
      count: (data ?? []).length,
      categories,
    });
  } catch (err) {
    return errorResponse("server_error", err instanceof Error ? err.message : "Unknown error", 500);
  }
}
