import { createFileRoute } from "@tanstack/react-router";
import { preflight } from "@/lib/ghost-api";
import { cachedJson, packageMeta, resolveTier } from "@/lib/ghost-packages.server";
import colorPresets from "@/data/ghost-color-presets.json";

/** Colour / gradient presets used by the panel's Colour tab (server-first, local fallback). */
export const Route = createFileRoute("/api/public/v1/color-presets")({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      GET: async ({ request }) => {
        const list = colorPresets as unknown[];
        const tier = await resolveTier(packageMeta(request).license);
        return cachedJson(request, {
          ok: true,
          tier,
          version: "1.0.0",
          count: list.length,
          presets: list,
        });
      },
    },
  },
});
