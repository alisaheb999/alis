/**
 * GHOST package server — server-only helpers.
 * Serves the preset/color packages consumed by the Ghostae Text panel and
 * records anonymous download statistics. Raw license keys are never stored.
 */
import { createHash } from "node:crypto";
import { CORS_HEADERS } from "./ghost-api";

export type Tier = "free" | "pro" | "team" | "ultra";

/** Weak-but-stable ETag from a JSON payload. */
export function etagOf(body: string) {
  return `W/"${createHash("sha1").update(body).digest("hex").slice(0, 24)}"`;
}

/** JSON response with ETag + shared-cache headers, honouring If-None-Match. */
export function cachedJson(request: Request, payload: unknown, maxAge = 300) {
  const body = JSON.stringify(payload);
  const etag = etagOf(body);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Cache-Control": `public, max-age=${maxAge}, stale-while-revalidate=86400`,
    ETag: etag,
    ...CORS_HEADERS,
    "Access-Control-Expose-Headers": "ETag",
  };
  if (request.headers.get("if-none-match") === etag)
    return new Response(null, { status: 304, headers });
  return new Response(body, { status: 200, headers });
}

/** Salted, irreversible fingerprint of a license key (stats only). */
export function licenseFingerprint(key: string | null) {
  if (!key) return null;
  const salt = process.env.GHOST_DOWNLOAD_SALT ?? "ghost-default-salt";
  return createHash("sha256")
    .update(`${salt}:${key.trim().toUpperCase()}`)
    .digest("hex")
    .slice(0, 32);
}

/** Tier for a license key. Fail-open: any problem ⇒ "free", panel never blocks. */
const tierCache = new Map<string, { tier: Tier; at: number }>();
const TIER_TTL = 5 * 60 * 1000;

export async function resolveTier(key: string | null): Promise<Tier> {
  if (!key) return "free";
  const norm = key.trim().toUpperCase();
  const hit = tierCache.get(norm);
  if (hit && Date.now() - hit.at < TIER_TTL) return hit.tier;

  let tier: Tier = "free";
  try {
    const g = await import("./ghost-api.server");
    const db = await g.admin();
    const { data } = await db
      .from("licenses")
      .select("*")
      .eq("license_key", g.normalizeKey(norm))
      .maybeSingle();
    if (data && g.evaluateLicense(data).valid) {
      // Strict mapping — an unknown plan id resolves to `free`, never `pro`.
      const { normalizePlan } = await import("@/lib/ghost-quotas");
      const plan = normalizePlan(data.plan);
      tier = plan === "team" ? "team" : plan === "ultra" ? "ultra" : plan === "free" ? "free" : "pro";
    }
  } catch {
    /* fail-open */
  }
  if (tierCache.size > 2000) tierCache.clear();
  tierCache.set(norm, { tier, at: Date.now() });
  return tier;
}

/** Panel headers used across the package endpoints. */
export function packageMeta(request: Request) {
  const h = request.headers;
  return {
    license: h.get("x-ghost-license") ?? h.get("x-ghost-key"),
    panelVersion: h.get("x-ghost-panel") ?? h.get("x-ghost-version"),
    country: h.get("cf-ipcountry"),
  };
}

/** Fire-and-forget download stat. Never throws. */
export async function recordDownload(entry: {
  packageName: string;
  item?: string | null;
  tier: Tier;
  fingerprint: string | null;
  panelVersion?: string | null;
  country?: string | null;
}) {
  try {
    const { admin } = await import("./ghost-api.server");
    const db = await admin();
    await db.from("download_events").insert({
      package: entry.packageName,
      item: entry.item ?? null,
      tier: entry.tier,
      license_fingerprint: entry.fingerprint,
      panel_version: entry.panelVersion ?? null,
      country: entry.country ?? null,
    } as never);
  } catch {
    /* stats must never break a download */
  }
}
