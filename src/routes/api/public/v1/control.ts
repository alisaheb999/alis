import { createFileRoute } from "@tanstack/react-router";
import { isPaidPlan, normalizePlan } from "@/lib/ghost-quotas";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, x-ghost-license, x-ghost-key, x-ghost-panel, x-ghost-version",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Cache-Control": "no-store",
};

type Gate = {
  blocked?: boolean;
  version?: string;
  url?: string;
  message?: string;
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...cors },
  });

/**
 * Simple remote controller for the panels. No signature, never throws:
 *  - `license.off` → the admin suspended/revoked the key, the panel must lock.
 *  - `update.blocked` → the admin published a mandatory update; the panel
 *    covers its UI with a Download button pointing at `update.url`.
 *
 * GET/POST /api/public/v1/control?key=GHST-XXXX&panel=text
 */
export const Route = createFileRoute("/api/public/v1/control")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: cors }),
      GET: async ({ request }) => handle(request),
      POST: async ({ request }) => handle(request),
    },
  },
});

async function handle(request: Request) {
  let key = "";
  let device = "";
  try {
    const url = new URL(request.url);
    key = url.searchParams.get("key") ?? url.searchParams.get("license_key") ?? "";
    device = url.searchParams.get("device") ?? "";
  } catch {
    /* ignore */
  }
  if (!key) key = request.headers.get("x-ghost-license") ?? request.headers.get("x-ghost-key") ?? "";
  if (!key && request.method === "POST") {
    try {
      const body = (await request.json()) as { key?: string; license_key?: string; device_fingerprint?: string };
      key = body.key ?? body.license_key ?? "";
      device = body.device_fingerprint ?? "";
    } catch {
      /* ignore */
    }
  }

  let update: Gate = {};
  let license: {
    valid: boolean;
    status: string;
    plan: string | null;
    premium?: boolean;
    blocked?: boolean;
    notice?: string;
    message?: string;
  } = { valid: false, status: "none", plan: null };

  try {
    const g = await import("@/lib/ghost-api.server");
    if (!g.rateLimit(`control:${key || "missing"}`, 60).allowed)
      return json({ ok: false, error: { code: "rate_limited", message: "Too many control checks." } }, 429);
    const db = await g.admin();

    const { data: gateRow } = await db
      .from("extension_settings")
      .select("value, enabled")
      .eq("module", "control")
      .eq("key", "update_gate")
      .maybeSingle();
    const value = (gateRow?.value ?? {}) as Gate;
    update = gateRow?.enabled ? { ...value, blocked: value.blocked !== false } : { blocked: false };

    if (key) {
      const { data: row } = await db
        .from("licenses")
        .select("id, status, plan, expires_at, license_key, notes, last_seen_at, max_activations, activation_count, device_fingerprint, domain")
        .eq("license_key", g.normalizeKey(key))
        .maybeSingle();
      if (row) {
        const baseVerdict = g.evaluateLicense(row);
        let valid = baseVerdict.valid;
        let reason: string = baseVerdict.reason;
        if (valid && device) {
          const { data: activation } = await db
            .from("license_activations")
            .select("revoked")
            .eq("license_id", row.id)
            .eq("device_fingerprint", device)
            .maybeSingle();
          // Only an explicitly revoked device locks the panel. A missing
          // activation row (fresh install, reset fingerprint, lost record) must
          // never interrupt a paying user.
          if (activation?.revoked) {
            valid = false;
            reason = "device_revoked";
          }
        }
        // Per-key remote control lives in `notes`, so no extra table is needed:
        //   BLOCK: <reason>  → lock this one panel immediately
        //   MSG: <text>      → private banner inside this one panel
        const notes = String(row.notes ?? "");
        const block = /^\s*BLOCK:\s*(.*)$/im.exec(notes);
        const msg = /^\s*MSG:\s*(.*)$/im.exec(notes);
        license = {
          valid: valid && !block,
          status: block ? "suspended" : valid ? String(row.status ?? "unknown") : reason,
          // Normalized tier only (free | basic | pro | ultra | team) so the
          // panel can never read an unknown string as a paid plan.
          plan: valid && !block ? normalizePlan(row.plan) : "free",
          premium: Boolean(valid && !block && isPaidPlan(row.plan)),
          blocked: Boolean(block),
          ...(block?.[1]?.trim() ? { message: block[1].trim() } : {}),
          ...(msg?.[1]?.trim() ? { notice: msg[1].trim() } : {}),
        };
        // Heartbeat: every poll records that this key is alive.
        await db
          .from("licenses")
          .update({ last_seen_at: new Date().toISOString() })
          .eq("license_key", g.normalizeKey(key));
      } else {
        // No row for this key. This is almost always a data problem (key not
        // yet stored, replaced row, sync lag) rather than a real revocation,
        // so answer like a temporary outage: the panel keeps its stored key
        // and stays usable instead of showing "License removed".
        return json(
          { ok: false, license: { valid: false, status: "offline", plan: null }, update: { blocked: false } },
          503,
        );
      }

    }
  } catch {
    return json({ ok: false, license: { valid: false, status: "offline", plan: null }, update: { blocked: false } }, 503);
  }

  return json({
    ok: true,
    // The panel locks premium UI when this is false.
    license,
    update,
    launch: {
      available: ["cache", "text", "presets", "bridge"],
      coming: ["tools", "idea", "one", "command"],
      comingOn: "2026-09-10",
    },
    server_time: new Date().toISOString(),
  });
}
