import { createFileRoute } from "@tanstack/react-router";
import { errorResponse, jsonResponse, preflight } from "@/lib/ghost-api";
import { deviceLimitForPlan, lockedModulesForPlan } from "@/lib/ghost-entitlements";
import { isPaidPlan, normalizePlan } from "@/lib/ghost-quotas";

const PATH = "/api/public/v1/sync/config";

/**
 * Remote extension management endpoint.
 * Returns feature flags, UI config, premium module locks and a purge list.
 * The extension polls this (or is pushed a `purge` marker) and applies it live.
 */
export const Route = createFileRoute("/api/public/v1/sync/config")({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      GET: async ({ request }) => handle(request),
      POST: async ({ request }) => handle(request),
    },
  },
});

async function handle(request: Request) {
  const g = await import("@/lib/ghost-api.server");
  const raw = request.method === "POST" ? await request.text() : "";
  const meta = g.clientMeta(request);

  const sig = g.verifySignature(request.method, PATH, meta.timestamp, meta.signature, raw);
  if (!sig.ok) return errorResponse("bad_signature", sig.reason, 401);

  if (!g.rateLimit(`sync:${meta.licenseKey ?? meta.ip ?? "anon"}`, 120).allowed)
    return errorResponse("rate_limited", "Too many sync requests.", 429);

  const db = await g.admin();

  let licensed = false;
  let plan: string | null = null;
  let licenseId: string | null = null;

  if (meta.licenseKey) {
    const { data: license } = await db
      .from("licenses")
      .select("*")
      .eq("license_key", g.normalizeKey(meta.licenseKey))
      .maybeSingle();
    const verdict = g.evaluateLicense(license);
    licensed = verdict.valid;
    plan = license?.plan ?? null;
    licenseId = license?.id ?? null;
  }

  const { data: settings } = await db
    .from("extension_settings")
    .select("module, key, value, enabled, min_version")
    .eq("enabled", true)
    .eq("is_public", true);

  const config: Record<string, Record<string, unknown>> = {};
  for (const row of settings ?? []) {
    config[row.module] = config[row.module] ?? {};
    config[row.module][row.key] = row.value;
  }

  // Plan-driven entitlements: a Free/Basic key sees fewer modules than Ultra.
  // An admin override may only ADD locks, never unlock what the plan forbids —
  // otherwise a free key could be handed Lite/Pro modules.
  const planLocks = lockedModulesForPlan(plan, licensed);
  const override = (config.premium?.locked_modules as { modules?: string[] } | undefined)?.modules;
  const lockedModules = override
    ? Array.from(new Set([...planLocks, ...override.map((m) => String(m))]))
    : planLocks;
  const resolvedPlan = licensed ? normalizePlan(plan) : "free";

  await g.logEvent({
    event: "sync.config",
    license_id: licenseId,
    license_key: meta.licenseKey,
    device_fingerprint: meta.device,
    ip_address: meta.ip,
    user_agent: meta.userAgent,
    app_version: meta.appVersion,
  });

  return jsonResponse({
    ok: true,
    licensed,
    plan: resolvedPlan,
    plan_raw: plan,
    premium: licensed && isPaidPlan(plan),
    config,
    // Everything the client must lock/wipe when the license is not valid.
    locked_modules: lockedModules,
    device_limit: licensed ? deviceLimitForPlan(plan) : 1,
    purge: licensed ? [] : ["premium.cache", "toolkit.ffx.cache", "command.history.cloud"],
    server_time: new Date().toISOString(),
  });
}
