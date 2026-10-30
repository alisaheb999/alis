import { createFileRoute } from "@tanstack/react-router";
import { jsonResponse, preflight } from "@/lib/ghost-api";

/**
 * Patch feed — deliberately unsigned and public.
 *
 * Every panel polls this on boot and every few minutes. When the published
 * patch version is newer than the running build, the panels lock themselves
 * and show a single "Download update" button: download → verify checksum →
 * stage → restart After Effects. Only the changed files are replaced, so the
 * user never re-downloads or re-installs the whole extension.
 *
 * Published from the admin panel into extension_settings (module 'patch').
 */
export const Route = createFileRoute("/api/public/v1/patch/latest")({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      GET: async ({ request }) => handle(request),
    },
  },
});

async function handle(request: Request) {
  const g = await import("@/lib/ghost-api.server");
  const db = await g.admin();
  const url = new URL(request.url);
  const channel = (url.searchParams.get("channel") || "stable").slice(0, 20);

  const { data: row } = await db
    .from("extension_settings")
    .select("value, enabled, min_version")
    .eq("module", "patch")
    .eq("key", channel)
    .maybeSingle();

  if (!row || row.enabled === false || !row.value || typeof row.value !== "object") {
    return jsonResponse({ ok: true, channel, patch: null, server_time: new Date().toISOString() });
  }

  const v = row.value as Record<string, unknown>;
  const str = (key: string) => (typeof v[key] === "string" ? (v[key] as string) : null);

  if (!str("version") || !str("url")) {
    return jsonResponse({ ok: true, channel, patch: null, server_time: new Date().toISOString() });
  }

  return jsonResponse({
    ok: true,
    channel,
    patch: {
      patchId: str("patchId"),
      version: str("version"),
      fromVersion: str("fromVersion"),
      title: str("title"),
      notes: str("notes"),
      url: str("url"),
      sha256: str("sha256"),
      sizeBytes: typeof v.sizeBytes === "number" ? v.sizeBytes : null,
      // A mandatory patch locks every panel until it is applied.
      mandatory: v.mandatory !== false,
      requiresRestart: v.requiresRestart !== false,
      publishedAt: str("publishedAt"),
      minVersion: row.min_version ?? null,
    },
    server_time: new Date().toISOString(),
  });
}
