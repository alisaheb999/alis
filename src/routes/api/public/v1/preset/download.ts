import { createFileRoute } from "@tanstack/react-router";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, x-ghost-license, x-ghost-key, x-ghost-panel",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Cache-Control": "no-store",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...cors } });

const BUCKET = "ghost-presets";
const FREE_LIMIT = 10;

function limitFor(plan: string | null) {
  const p = (plan ?? "free").toLowerCase();
  if (p === "free" || p === "trial") return FREE_LIMIT;
  return -1; // unlimited
}

/**
 * The .ffx payloads live in private storage, never inside the shipped panel.
 *  GET  → { used, limit, plan, slugs[] }  (what this key already unlocked)
 *  POST → { url } signed download for one preset, counted against the plan.
 */
export const Route = createFileRoute("/api/public/v1/preset/download")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: cors }),
      GET: async ({ request }) => handle(request, "list"),
      POST: async ({ request }) => handle(request, "grant"),
    },
  },
});

async function handle(request: Request, mode: "list" | "grant") {
  try {
    const url = new URL(request.url);
    let key = url.searchParams.get("key") ?? url.searchParams.get("license_key") ?? "";
    let slug = url.searchParams.get("slug") ?? "";
    let device = url.searchParams.get("device") ?? "";
    const panel = (url.searchParams.get("panel") ?? "text").slice(0, 20);
    if (request.method === "POST") {
      try {
        const body = (await request.json()) as { key?: string; license_key?: string; slug?: string; device_fingerprint?: string };
        key = body.key ?? body.license_key ?? key;
        slug = body.slug ?? slug;
        device = body.device_fingerprint ?? device;
      } catch {
        /* ignore */
      }
    }
    if (!key) key = request.headers.get("x-ghost-license") ?? request.headers.get("x-ghost-key") ?? "";
    key = key.trim().toUpperCase().replace(/\s+/g, "");
    if (!key) return json({ ok: false, error: "missing_key" }, 400);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: license } = await supabaseAdmin
      .from("licenses")
      .select("license_key, plan, status, expires_at")
      .eq("license_key", key)
      .maybeSingle();

    if (!license) return json({ ok: false, error: "not_found" }, 403);
    const expired = license.expires_at ? new Date(license.expires_at).getTime() < Date.now() : false;
    const active = license.status === "active" || license.status === "inactive";
    if (!active || expired) return json({ ok: false, error: expired ? "expired" : license.status }, 403);

    const plan = license.plan ?? "free";
    const limit = limitFor(plan);

    const { data: rows } = await supabaseAdmin
      .from("preset_downloads")
      .select("preset_slug")
      .eq("license_key", key)
      .eq("panel", panel);
    const slugs = (rows ?? []).map((r) => r.preset_slug as string);

    if (mode === "list") return json({ ok: true, plan, limit, used: slugs.length, slugs });

    slug = slug.replace(/^\/+/, "").slice(0, 300);
    if (!slug || slug.includes("..") || !slug.toLowerCase().endsWith(".ffx"))
      return json({ ok: false, error: "bad_slug" }, 400);

    const already = slugs.includes(slug);
    if (!already && limit >= 0 && slugs.length >= limit)
      return json({ ok: false, error: "limit_reached", plan, limit, used: slugs.length }, 402);

    const signed = await supabaseAdmin.storage.from(BUCKET).createSignedUrl(`${panel}/${slug}`, 300);
    if (signed.error || !signed.data?.signedUrl) return json({ ok: false, error: "unavailable" }, 404);

    if (!already) {
      await supabaseAdmin.from("preset_downloads").insert({
        license_key: key,
        preset_slug: slug,
        panel,
        device_fingerprint: device || null,
      } as never);
    }

    return json({
      ok: true,
      url: signed.data.signedUrl,
      slug,
      plan,
      limit,
      used: already ? slugs.length : slugs.length + 1,
    });
  } catch {
    return json({ ok: false, error: "server_error" }, 500);
  }
}
