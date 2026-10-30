import { createFileRoute } from "@tanstack/react-router";
import { errorResponse, jsonResponse, preflight } from "@/lib/ghost-api";

const PATH = "/api/public/v1/assets/fetch";

/**
 * Controlled asset distribution.
 * Public assets return a plain URL; licensed/premium assets return a short-lived
 * presigned URL that only an active, non-revoked license can obtain.
 */
export const Route = createFileRoute("/api/public/v1/assets/fetch")({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      GET: async ({ request }) => handle(request),
      POST: async ({ request }) => handle(request),
    },
  },
});

async function handle(request: Request) {
  const g = await import("@/lib/ghost-api.server");
  const raw = request.method === "POST" ? await request.text() : "";
  const meta = g.clientMeta(request);

  const sig = g.verifySignature(request.method, PATH, meta.timestamp, meta.signature, raw);
  if (!sig.ok) return errorResponse("bad_signature", sig.reason, 401);

  if (!g.rateLimit(`assets:${meta.licenseKey ?? meta.ip ?? "anon"}`, 90).allowed)
    return errorResponse("rate_limited", "Too many asset requests.", 429);

  const url = new URL(request.url);
  let body: { slug?: string; type?: string; q?: string; category?: string; pack?: string; limit?: number; offset?: number } = {};
  if (raw) {
    try {
      body = JSON.parse(raw);
    } catch {
      return errorResponse("bad_request", "Body must be JSON.", 400);
    }
  }
  const pick = (key: keyof typeof body, max: number) =>
    ((body[key] as string | undefined) ?? url.searchParams.get(key) ?? "").toString().slice(0, max);
  const slug = pick("slug", 200);
  const type = pick("type", 60);
  const q = pick("q", 80).trim().toLowerCase();
  const category = pick("category", 40).trim().toLowerCase();
  const pack = pick("pack", 40).trim().toLowerCase();
  const limit = Math.min(500, Math.max(1, Number(body.limit ?? url.searchParams.get("limit") ?? 200) || 200));
  const offset = Math.max(0, Number(body.offset ?? url.searchParams.get("offset") ?? 0) || 0);


  const db = await g.admin();

  let licensed = false;
  let licenseId: string | null = null;
  if (meta.licenseKey) {
    const { data: license } = await db
      .from("licenses")
      .select("*")
      .eq("license_key", g.normalizeKey(meta.licenseKey))
      .maybeSingle();
    licensed = g.evaluateLicense(license).valid;
    licenseId = license?.id ?? null;

    if (licensed && meta.device) {
      const { data: act } = await db
        .from("license_activations")
        .select("revoked")
        .eq("license_id", license!.id)
        .eq("device_fingerprint", meta.device)
        .maybeSingle();
      licensed = !!act && !act.revoked;
    }
  }

  let query = db.from("assets").select("*", { count: "exact" }).eq("published", true);
  if (slug) query = query.eq("slug", slug);
  if (type) query = query.eq("type", type);
  if (category) query = query.eq("meta_data->>category", category);
  if (pack) query = query.eq("meta_data->>pack", pack);
  // Free-text search across the human title and the stored tag list.
  // Strip PostgREST/ILIKE metacharacters (including the `_` single-char wildcard).
  if (q) {
    const safe = q.replace(/[%_,()*\\]/g, "");
    if (safe) query = query.or(`title.ilike.%${safe}%,slug.ilike.%${safe}%`);
  }
  // Category-first ordering: the extension groups the result by pack ▸ category,
  // so rows must arrive grouped, never in raw title order.
  query = query
    .order("meta_data->>pack", { ascending: true })
    .order("meta_data->>category", { ascending: true })
    .order("title", { ascending: true });

  const { data: rows, count: total } = slug
    ? await query.limit(1)
    : await query.range(offset, offset + limit - 1);

  const visible = (rows ?? []).filter((a) => a.access_level === "public" || licensed);


  const items = await Promise.all(
    visible.map(async (a) => {
      let signedUrl: string | null = null;
      if (a.access_level === "public") {
        signedUrl = db.storage.from(a.bucket).getPublicUrl(a.file_path).data.publicUrl;
      } else {
        const { data } = await db.storage.from(a.bucket).createSignedUrl(a.file_path, 900);
        signedUrl = data?.signedUrl ?? null;
      }
      return {
        id: a.id,
        title: a.title,
        slug: a.slug,
        type: a.type,
        access_level: a.access_level,
        size_bytes: a.size_bytes,
        checksum: a.checksum,
        meta: a.meta_data,
        url: signedUrl,
        expires_in: a.access_level === "public" ? null : 900,
      };
    }),
  );

  await g.logEvent({
    event: "assets.fetch",
    status: licensed ? "licensed" : "public",
    license_id: licenseId,
    license_key: meta.licenseKey,
    device_fingerprint: meta.device,
    ip_address: meta.ip,
    user_agent: meta.userAgent,
    app_version: meta.appVersion,
    details: { slug: slug || null, type: type || null, q: q || null, category: category || null, count: items.length },
  });

  return jsonResponse({
    ok: true,
    licensed,
    count: items.length,
    total: total ?? items.length,
    offset,
    limit,
    assets: items,
  });
}

