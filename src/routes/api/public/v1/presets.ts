import { createFileRoute } from "@tanstack/react-router";
import { preflight } from "@/lib/ghost-api";
import { cachedJson, packageMeta, resolveTier } from "@/lib/ghost-packages.server";
import presetIndex from "@/data/ghost-preset-index.json";

/** Animation preset index (500 presets) consumed by js/ghost-preset-store.js. */
export const Route = createFileRoute("/api/public/v1/presets")({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      GET: async ({ request }) => {
        const tier = await resolveTier(packageMeta(request).license);
        return cachedJson(request, { ok: true, tier, ...presetIndex });
      },
    },
  },
});
