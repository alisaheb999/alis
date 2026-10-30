import { createFileRoute } from "@tanstack/react-router";
import { errorResponse, jsonResponse, preflight } from "@/lib/ghost-api";
import { packageMeta, resolveTier, licenseFingerprint, recordDownload } from "@/lib/ghost-packages.server";
import presetIndex from "@/data/ghost-preset-index.json";

type IndexedPreset = { id?: string; name?: string; slug?: string; category?: string; tier?: string };

/**
 * Preset document download. Documents are not published to the cloud yet, so a
 * known preset returns 404 `preset_document_not_published` and the panel falls
 * back to its bundled copy (per docs/INTEGRATION.md).
 */
export const Route = createFileRoute("/api/public/v1/presets/$name/download")({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      GET: async ({ request, params }) => {
        const wanted = decodeURIComponent(params.name ?? "").toLowerCase();
        if (!wanted) return errorResponse("bad_request", "Preset name is required.", 400);

        const all = ((presetIndex as { presets?: IndexedPreset[] }).presets ?? []) as IndexedPreset[];
        const preset = all.find(
          (p) =>
            [p.id, p.slug, p.name].filter(Boolean).some((v) => String(v).toLowerCase() === wanted),
        );
        if (!preset)
          return errorResponse("preset_not_found", `Unknown preset "${wanted}".`, 404);

        const meta = packageMeta(request);
        const tier = await resolveTier(meta.license);
        await recordDownload({
          packageName: "presets",
          item: preset.id ?? preset.name ?? wanted,
          tier,
          fingerprint: licenseFingerprint(meta.license),
          panelVersion: meta.panelVersion,
          country: meta.country,
        });

        return jsonResponse(
          {
            ok: false,
            error: {
              code: "preset_document_not_published",
              message: "This preset ships inside the panel package; use the bundled copy.",
            },
            preset: { id: preset.id, name: preset.name, category: preset.category, tier },
          },
          404,
        );
      },
    },
  },
});
