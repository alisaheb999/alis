import { createFileRoute } from "@tanstack/react-router";
import { errorResponse, jsonResponse, preflight } from "@/lib/ghost-api";

type StockItem = {
  id: string;
  source: string;
  type: "photo" | "video" | "audio" | "gif";
  title: string;
  preview: string | null;
  download: string | null;
  duration?: number | null;
  credit?: string | null;
};

export const Route = createFileRoute("/api/public/v1/stock/search")({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const q = (url.searchParams.get("q") || "").trim().slice(0, 120);
        const source = (url.searchParams.get("source") || "pexels").toLowerCase();
        const kind = (url.searchParams.get("type") || "photo").toLowerCase();
        const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 24, 1), 50);
        if (!q) return errorResponse("bad_request", "Provide a search query (?q=).", 400);

        const { providerKey, upstreamError } = await import("@/lib/ghost-providers.server");

        try {
          if (source === "pexels") {
            const key = providerKey("pexels");
            if (!key) return errorResponse("not_configured", "Pexels key is not configured.", 503);
            const video = kind === "video";
            const res = await fetch(
              `https://api.pexels.com/${video ? "videos" : "v1"}/search?query=${encodeURIComponent(q)}&per_page=${limit}`,
              { headers: { Authorization: key } },
            );
            if (!res.ok) {
              const e = await upstreamError("Pexels", res);
              return errorResponse("upstream", e.message, e.status);
            }
            const data = (await res.json()) as any;
            const items: StockItem[] = video
              ? (data.videos ?? []).map((v: any) => ({
                  id: String(v.id),
                  source: "pexels",
                  type: "video" as const,
                  title: v.user?.name ? `Video by ${v.user.name}` : `Pexels ${v.id}`,
                  preview: v.image ?? null,
                  download: v.video_files?.sort((a: any, b: any) => (b.width ?? 0) - (a.width ?? 0))[0]?.link ?? null,
                  duration: v.duration ?? null,
                  credit: v.user?.name ?? null,
                }))
              : (data.photos ?? []).map((p: any) => ({
                  id: String(p.id),
                  source: "pexels",
                  type: "photo" as const,
                  title: p.alt || `Pexels ${p.id}`,
                  preview: p.src?.medium ?? null,
                  download: p.src?.original ?? null,
                  credit: p.photographer ?? null,
                }));
            return jsonResponse({ ok: true, source, type: kind, items });
          }

          if (source === "pixabay") {
            const key = providerKey("pixabay");
            if (!key) return errorResponse("not_configured", "Pixabay key is not configured.", 503);
            const video = kind === "video";
            // Pixabay rejects per_page below 3.
            const perPage = Math.max(3, limit);
            const endpoint = video
              ? `https://pixabay.com/api/videos/?key=${key}&q=${encodeURIComponent(q)}&per_page=${perPage}`
              : `https://pixabay.com/api/?key=${key}&q=${encodeURIComponent(q)}&per_page=${perPage}`;
            const res = await fetch(endpoint);
            if (!res.ok) {
              const e = await upstreamError("Pixabay", res);
              return errorResponse("upstream", e.message, e.status);
            }
            const data = (await res.json()) as any;
            const items: StockItem[] = (data.hits ?? []).map((h: any) => ({
              id: String(h.id),
              source: "pixabay",
              type: video ? ("video" as const) : ("photo" as const),
              title: h.tags || `Pixabay ${h.id}`,
              preview: video ? (h.videos?.tiny?.thumbnail ?? null) : (h.webformatURL ?? null),
              download: video ? (h.videos?.large?.url ?? h.videos?.medium?.url ?? null) : (h.largeImageURL ?? null),
              duration: h.duration ?? null,
              credit: h.user ?? null,
            }));
            return jsonResponse({ ok: true, source, type: kind, items });
          }

          if (source === "freesound") {
            const key = providerKey("freesound");
            if (!key) return errorResponse("not_configured", "Freesound key is not configured.", 503);
            const res = await fetch(
              `https://freesound.org/apiv2/search/text/?query=${encodeURIComponent(q)}&page_size=${limit}` +
                `&fields=id,name,duration,previews,username,license`,
              { headers: { Authorization: `Token ${key}` } },
            );
            if (!res.ok) {
              const e = await upstreamError("Freesound", res);
              return errorResponse("upstream", e.message, e.status);
            }
            const data = (await res.json()) as any;
            const items: StockItem[] = (data.results ?? []).map((s: any) => ({
              id: String(s.id),
              source: "freesound",
              type: "audio" as const,
              title: s.name || `Sound ${s.id}`,
              preview: s.previews?.["preview-lq-mp3"] ?? null,
              download: s.previews?.["preview-hq-mp3"] ?? null,
              duration: s.duration ?? null,
              credit: s.username ?? null,
            }));
            return jsonResponse({ ok: true, source, type: "audio", items });
          }

          if (source === "giphy") {
            const key = providerKey("giphy");
            if (!key) return errorResponse("not_configured", "GIPHY key is not configured.", 503);
            const sticker = kind === "sticker";
            const res = await fetch(
              `https://api.giphy.com/v1/${sticker ? "stickers" : "gifs"}/search?api_key=${key}` +
                `&q=${encodeURIComponent(q)}&limit=${limit}&rating=pg-13`,
            );
            if (!res.ok) {
              const e = await upstreamError("GIPHY", res);
              return errorResponse("upstream", e.message, e.status);
            }
            const data = (await res.json()) as any;
            const items: StockItem[] = (data.data ?? []).map((g: any) => ({
              id: String(g.id),
              source: "giphy",
              type: "gif" as const,
              title: g.title || `GIF ${g.id}`,
              preview: g.images?.fixed_width?.url ?? null,
              download: g.images?.original?.url ?? null,
              credit: g.username || null,
            }));
            return jsonResponse({ ok: true, source, type: "gif", items });
          }

          return errorResponse("bad_request", "Unknown source. Use pexels, pixabay, freesound or giphy.", 400);
        } catch (err) {
          console.error("[ghost:stock] failure", err);
          return errorResponse("server_error", "Stock search failed.", 500);
        }
      },
    },
  },
});
