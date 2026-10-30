import { createFileRoute } from "@tanstack/react-router";
import { jsonResponse, preflight } from "@/lib/ghost-api";

function newer(a: string, b: string) {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    const x = pa[i] || 0;
    const y = pb[i] || 0;
    if (x !== y) return x > y;
  }
  return false;
}

/** Desktop app update info — admin publishes extension_settings (module 'desktop', key 'app'). */
export const Route = createFileRoute("/api/public/v1/desktop/app/check-update")({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const current = (url.searchParams.get("version") || "0.0.0").slice(0, 20);
        const platform = url.searchParams.get("platform") === "mac" ? "mac" : "win";
        let latest: any = null;
        try {
          const g = await import("@/lib/ghost-api.server");
          const d = await import("@/lib/desktop.server");
          latest = await d.desktopSetting(await g.admin(), "app");
        } catch {
          /* no update info is safe */
        }
        const build = latest?.[platform] ?? null;
        const version: string | null = typeof latest?.version === "string" ? latest.version : null;
        const available = !!(version && build?.url && newer(version, current));
        return jsonResponse({
          success: true,
          update_available: available,
          current_version: current,
          latest_version: version,
          release_notes: latest?.notes ?? null,
          mandatory: available && latest?.mandatory === true,
          download_url: available ? build.url : null,
          sha256: available ? (build.sha256 ?? null) : null,
        });
      },
    },
  },
});
