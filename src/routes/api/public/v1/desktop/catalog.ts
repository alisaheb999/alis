import { createFileRoute } from "@tanstack/react-router";
import { jsonResponse, preflight } from "@/lib/ghost-api";
import { findProduct } from "@/lib/products-catalog";

/** Extension catalog — latest published release per product + host app (Release Hub). */
export const Route = createFileRoute("/api/public/v1/desktop/catalog")({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      GET: async () => {
        const g = await import("@/lib/ghost-api.server");
        let products: unknown[] = [];
        try {
          const db = await g.admin();
          const { data } = await db
            .from("extension_releases")
            .select("id, product_key, name, host_app, version, cep_folder, changelog, thumbnail_url, is_free, sha256, size_bytes, created_at")
            .eq("published", true)
            .order("created_at", { ascending: false })
            .limit(200);
          const { data: mediaRows } = await db.from("extension_settings").select("key, value").eq("module", "desktop_media");
          const media = new Map((mediaRows ?? []).map((m) => [m.key, (m.value ?? {}) as any]));
          const { data: setRows } = await db.from("extension_settings").select("key, value, enabled").eq("module", "desktop_product");
          const sets = new Map((setRows ?? []).map((m) => [m.key, { ...((m.value ?? {}) as any), on: m.enabled !== false }]));
          const seen = new Set<string>();
          for (const r of data ?? []) {
            const k = `${r.product_key}:${r.host_app}`;
            if (seen.has(k)) continue;
            const cfg = sets.get(r.product_key);
            if (cfg && !cfg.on) continue;
            seen.add(k);
            const site = findProduct(r.product_key);
            const priceText = site?.price?.amount ?? site?.planTable?.find((p) => p.id !== "free")?.price ?? "";
            const digits = priceText.replace(/[০-৯]/g, (d) => String("০১২৩৪৫৬৭৮৯".indexOf(d))).replace(/[^0-9]/g, "");
            products.push({
              release_id: r.id,
              id: r.product_key,
              slug: r.product_key,
              product_slug: r.product_key,
              name: site?.name ?? r.name,
              host_app: r.host_app,
              target_host: r.host_app,
              category: r.host_app === "premiere-pro" ? "Premiere Pro" : "After Effects",
              version: r.version,
              latest_version: r.version,
              cep_folder_name: r.cep_folder,
              changelog: r.changelog,
              description: site?.description.bn ?? "",
              tagline: site?.tagline.bn ?? "",
              features: site?.highlights.map((h) => h.bn) ?? [],
              price_bdt: r.is_free ? 0 : typeof cfg?.price === "number" ? cfg.price : Number(digits || 0),
              original_price_bdt: r.is_free ? 0 : typeof cfg?.original_price === "number" ? cfg.original_price : Number(digits || 0),
              plans: site?.planTable ?? [],
              status: site?.status ?? "available",
              thumbnail_url: r.thumbnail_url,
              screenshots: Array.isArray(media.get(r.product_key)?.screenshots) ? media.get(r.product_key).screenshots : [],
              tutorials: Array.isArray(media.get(r.product_key)?.tutorials) ? media.get(r.product_key).tutorials : [],
              is_free: r.is_free,
              sha256: r.sha256,
              size_bytes: r.size_bytes,
              released_at: r.created_at,
              product_page_url: `https://ghostae.com/products/${r.product_key}`,
              download_endpoint: `/api/public/v1/desktop/download?release_id=${r.id}`,
              download_url: `https://ghostae.com/api/public/v1/desktop/download?release_id=${r.id}`,
            });
          }
        } catch {
          products = []; /* desktop keeps its cached copy */
        }
        return jsonResponse(
          { success: true, server_time: new Date().toISOString(), products },
          200,
          { "Cache-Control": "public, max-age=120" },
        );
      },
    },
  },
});
