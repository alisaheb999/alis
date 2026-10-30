import { createFileRoute } from "@tanstack/react-router";
import { errorResponse, jsonResponse, preflight } from "@/lib/ghost-api";

/**
 * IDEA ▸ Discover — one query, several reference providers, one normalised shape.
 *
 * The CEP panel cannot embed Pinterest/Behance (X-Frame-Options + an ancient
 * CEF build), so the panel renders its own grid from this route instead. Every
 * provider here is licence-safe for reference use and Openverse needs no key,
 * which keeps Discover useful even before any key is configured.
 */

type IdeaItem = {
  id: string;
  source: string;
  type: "image" | "video";
  title: string;
  preview: string | null;
  download: string | null;
  pageUrl: string | null;
  credit: string | null;
  license: string | null;
};

const TIMEOUT_MS = 9000;

async function timedFetch(url: string, init?: RequestInit) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function fromPexels(q: string, limit: number, key: string | null): Promise<IdeaItem[]> {
  if (!key) return [];
  const res = await timedFetch(
    `https://api.pexels.com/v1/search?query=${encodeURIComponent(q)}&per_page=${limit}`,
    { headers: { Authorization: key } },
  );
  if (!res.ok) return [];
  const data = (await res.json()) as any;
  return (data.photos ?? []).map((p: any) => ({
    id: `pexels-${p.id}`,
    source: "Pexels",
    type: "image" as const,
    title: p.alt || `Pexels ${p.id}`,
    preview: p.src?.medium ?? null,
    download: p.src?.original ?? null,
    pageUrl: p.url ?? null,
    credit: p.photographer ?? null,
    license: "Pexels License",
  }));
}

async function fromPixabay(q: string, limit: number, key: string | null): Promise<IdeaItem[]> {
  if (!key) return [];
  const res = await timedFetch(
    `https://pixabay.com/api/?key=${encodeURIComponent(key)}&q=${encodeURIComponent(q)}&per_page=${limit}&image_type=all&safesearch=true`,
  );
  if (!res.ok) return [];
  const data = (await res.json()) as any;
  return (data.hits ?? []).map((h: any) => ({
    id: `pixabay-${h.id}`,
    source: "Pixabay",
    type: "image" as const,
    title: h.tags || `Pixabay ${h.id}`,
    preview: h.webformatURL ?? h.previewURL ?? null,
    download: h.largeImageURL ?? h.webformatURL ?? null,
    pageUrl: h.pageURL ?? null,
    credit: h.user ?? null,
    license: "Pixabay Content License",
  }));
}

async function fromOpenverse(q: string, limit: number): Promise<IdeaItem[]> {
  const res = await timedFetch(
    `https://api.openverse.org/v1/images/?q=${encodeURIComponent(q)}&page_size=${limit}`,
    { headers: { "User-Agent": "GHOST-Creative-System/3.9 (reference search)" } },
  );
  if (!res.ok) return [];
  const data = (await res.json()) as any;
  return (data.results ?? []).map((r: any) => ({
    id: `openverse-${r.id}`,
    source: "Openverse",
    type: "image" as const,
    title: r.title || "Openverse reference",
    preview: r.thumbnail ?? r.url ?? null,
    download: r.url ?? null,
    pageUrl: r.foreign_landing_url ?? null,
    credit: r.creator ?? null,
    license: r.license ? String(r.license).toUpperCase() : null,
  }));
}

export const Route = createFileRoute("/api/public/v1/idea/search")({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const q = (url.searchParams.get("q") || "").trim().slice(0, 120);
        const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 24, 1), 40);
        if (q.length < 2) {
          return errorResponse("bad_request", "Provide a search query of at least 2 characters (?q=).", 400);
        }

        const { providerKey } = await import("@/lib/ghost-providers.server");
        const pexels = providerKey("pexels");
        const pixabay = providerKey("pixabay");

        /* One slow or broken provider must not empty the whole grid. */
        const lanes = await Promise.allSettled([
          fromPexels(q, limit, pexels),
          fromPixabay(q, limit, pixabay),
          fromOpenverse(q, limit),
        ]);

        const items: IdeaItem[] = [];
        const sources: Record<string, number> = {};
        lanes.forEach((lane) => {
          if (lane.status !== "fulfilled") return;
          lane.value.forEach((item) => {
            if (!item.preview) return;
            items.push(item);
            sources[item.source] = (sources[item.source] ?? 0) + 1;
          });
        });

        /* Interleave providers so the first screen is not one source deep. */
        const buckets = new Map<string, IdeaItem[]>();
        items.forEach((item) => {
          const list = buckets.get(item.source) ?? [];
          list.push(item);
          buckets.set(item.source, list);
        });
        const mixed: IdeaItem[] = [];
        let more = true;
        for (let round = 0; more; round += 1) {
          more = false;
          buckets.forEach((list) => {
            const item = list[round];
            if (item) {
              mixed.push(item);
              more = true;
            }
          });
        }

        return jsonResponse({ ok: true, query: q, sources, items: mixed.slice(0, limit * 2) });
      },
    },
  },
});
