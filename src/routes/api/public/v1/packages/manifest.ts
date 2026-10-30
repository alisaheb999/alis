import { createFileRoute } from "@tanstack/react-router";
import { preflight } from "@/lib/ghost-api";
import { cachedJson, packageMeta, resolveTier } from "@/lib/ghost-packages.server";
import presetIndex from "@/data/ghost-preset-index.json";
import colorPresets from "@/data/ghost-color-presets.json";

/** Package manifest — the panel polls this to detect new package versions. */
export const Route = createFileRoute("/api/public/v1/packages/manifest")({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      GET: async ({ request }) => {
        const meta = packageMeta(request);
        const tier = await resolveTier(meta.license);
        return cachedJson(request, {
          ok: true,
          tier,
          packages: {
            presets: {
              version: presetIndex.version,
              count: presetIndex.count,
              endpoint: "/api/public/v1/presets",
            },
            colorPresets: {
              version: "1.0.0",
              count: (colorPresets as unknown[]).length,
              endpoint: "/api/public/v1/color-presets",
            },
            textStyles: { endpoint: "/api/public/v1/text-styles", previewLocal: true },
          },
          generatedAt: presetIndex.generatedAt,
        });
      },
    },
  },
});
