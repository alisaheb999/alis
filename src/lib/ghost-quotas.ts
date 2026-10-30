/**
 * Ghostae quota registry — the single source of truth for monthly limits.
 *
 * Numbers mirror the published pricing table.
 * Metric keys are what panels and sub-servers send to the main server; the
 * main server counts them per licence (or per device when unlicensed) inside a
 * calendar month and refuses the request once the plan limit is reached.
 *
 * `null` = unlimited.
 */

export type PlanKey = "free" | "basic" | "pro" | "ultra" | "team";

export type QuotaLimits = Record<PlanKey, number | null>;

/** Every billable action in the ecosystem. */
export const QUOTA_METRICS: Record<string, { label: string; panel: string; limits: QuotaLimits }> = {
  // ---------------- Ghostae Cache ----------------
  "cache.download": { panel: "cache", label: "Asset downloads", limits: { free: 1000, basic: 2500, pro: 5000, ultra: 20000, team: 50000 } },
  "cache.removebg": { panel: "cache", label: "Background removals", limits: { free: 200, basic: 500, pro: 1000, ultra: 4000, team: 10000 } },
  "cache.ai.image": { panel: "cache", label: "AI image generations", limits: { free: 50, basic: 150, pro: 300, ultra: 1000, team: 2500 } },

  // ---------------- Ghostae Text ----------------
  "text.animation": { panel: "text", label: "Text animations", limits: { free: 20, basic: 70, pro: 150, ultra: 500, team: 1200 } },
  "text.color": { panel: "text", label: "Colour presets", limits: { free: 20, basic: 90, pro: 200, ultra: 700, team: 1500 } },
  "text.emoji": { panel: "text", label: "Emoji inserts", limits: { free: 50, basic: 150, pro: 300, ultra: 1000, team: 2500 } },
  "text.expression": { panel: "text", label: "Expressions", limits: { free: 100, basic: 300, pro: 600, ultra: 2000, team: 5000 } },
  "text.style": { panel: "text", label: "FFX text styles", limits: { free: 15, basic: 60, pro: 150, ultra: 700, team: 1500 } },

  // ---------------- Ghostae Presets ----------------
  "presets.standard": { panel: "presets", label: "Standard preset downloads", limits: { free: 40, basic: 120, pro: 250, ultra: 800, team: 2000 } },
  "presets.premium": { panel: "presets", label: "Premium preset downloads", limits: { free: 100, basic: 300, pro: 600, ultra: 2000, team: 5000 } },
  "presets.save": { panel: "presets", label: "Save Preset uses", limits: { free: 20, basic: 60, pro: 120, ultra: 400, team: 1000 } },

  // ---------------- Ghostae Tools ----------------
  "tools.autocut.min": { panel: "tools", label: "Auto Cut minutes", limits: { free: 30, basic: 90, pro: 200, ultra: 600, team: 1500 } },
  "tools.removebg": { panel: "tools", label: "Tools BG removals", limits: { free: 50, basic: 150, pro: 300, ultra: 1000, team: 2500 } },
  "tools.ai": { panel: "tools", label: "AI Solution requests", limits: { free: 30, basic: 90, pro: 200, ultra: 700, team: 1500 } },

  // ---------------- Ghostae Bridge ----------------
  "bridge.image": { panel: "bridge", label: "Input images", limits: { free: 1000, basic: 2500, pro: 5000, ultra: 20000, team: 50000 } },
  "bridge.video": { panel: "bridge", label: "Input videos", limits: { free: 30, basic: 90, pro: 200, ultra: 700, team: 1500 } },
  "bridge.chat": { panel: "bridge", label: "AI chat messages", limits: { free: 3000, basic: 7000, pro: 15000, ultra: 50000, team: 120000 } },
  "bridge.removebg": { panel: "bridge", label: "Background removals", limits: { free: 50, basic: 150, pro: 300, ultra: 1000, team: 2500 } },

  // ---------------- Ghostae Idea ----------------
  "idea.download": { panel: "idea", label: "Idea downloads", limits: { free: 3000, basic: 7000, pro: 15000, ultra: 50000, team: 120000 } },
  "idea.ai": { panel: "idea", label: "AI BG & chat", limits: { free: 300, basic: 700, pro: 1500, ultra: 5000, team: 12000 } },
  "idea.video": { panel: "idea", label: "AI video generations", limits: { free: 50, basic: 150, pro: 300, ultra: 1000, team: 2500 } },

  // ---------------- Ghostae One ----------------
  "one.finance": { panel: "one", label: "Financial management actions", limits: { free: 10, basic: 40, pro: 100, ultra: 400, team: 1000 } },
  "one.invoice": { panel: "one", label: "Invoices sent", limits: { free: 50, basic: 150, pro: 300, ultra: 1000, team: 2500 } },
  "one.backup": { panel: "one", label: "Auto backups", limits: { free: 20, basic: 70, pro: 150, ultra: 500, team: 1200 } },
  "one.cloud": { panel: "one", label: "Client cloud actions", limits: { free: 30, basic: 90, pro: 200, ultra: 700, team: 1500 } },

  // ---------------- Ghostae Command ----------------
  "command.chat": { panel: "command", label: "AI chat", limits: { free: 30, basic: 90, pro: 200, ultra: 700, team: 1500 } },
  "command.layer": { panel: "command", label: "Layer control actions", limits: { free: 50, basic: 150, pro: 300, ultra: 1000, team: 2500 } },
  "command.image": { panel: "command", label: "Image generations", limits: { free: 50, basic: 150, pro: 300, ultra: 1000, team: 2500 } },
  "command.video": { panel: "command", label: "Video generations", limits: { free: 10, basic: 40, pro: 100, ultra: 400, team: 1000 } },

  // ---------------- Ghostae Caption (basic = Lite) ----------------
  "caption.minutes": { panel: "caption", label: "Caption minutes / licence term", limits: { free: null, basic: 300, pro: 1500, ultra: 3600, team: 9000 } },
  "caption.minutes.day": { panel: "caption", label: "Caption minutes / day", limits: { free: 2, basic: null, pro: null, ultra: 120, team: 300 } },
};

export type QuotaMetric = keyof typeof QUOTA_METRICS;

/** Legacy / alternate metric names sub-servers may send. */
const ALIASES: Record<string, string> = {
  "preset.download": "presets.standard",
  "preset.premium": "presets.premium",
  "template.download": "presets.standard",
  "template.premium": "presets.premium",
  "text.animations": "text.animation",
  "text.colors": "text.color",
  "text.styles": "text.style",
  "text.style.download": "text.style",
  "presets.download": "presets.standard",
  "presets.premium.download": "presets.premium",
  "cache.asset": "cache.download",
  removebg: "cache.removebg",
};

export function normalizeMetric(metric: string): string | null {
  const key = String(metric || "").trim().toLowerCase();
  if (!key) return null;
  if (QUOTA_METRICS[key]) return key;
  const alias = ALIASES[key];
  return alias && QUOTA_METRICS[alias] ? alias : null;
}

/**
 * Strict plan resolver. Only explicitly known ids get a paid tier; anything
 * unrecognised falls back to `free` so a typo/unknown plan can never hand out
 * Lite/Pro limits or modules.
 */
export function normalizePlan(plan: string | null | undefined): PlanKey {
  const key = String(plan || "free").trim().toLowerCase();
  switch (key) {
    case "free":
    case "trial":
    case "":
      return "free";
    // Caption "Lite"/"Light" is the basic tier.
    case "lite":
    case "light":
    case "basic":
    case "caption_light":
    case "caption-light":
      return "basic";
    case "pro":
    case "premium":
    case "caption_pro":
    case "caption-pro":
    case "text_lifetime":
    case "lifetime":
      return "pro";
    case "ultra":
      return "ultra";
    case "team":
      return "team";
    default:
      return "free";
  }
}

/** True only for paid tiers — free/unknown keys are never premium. */
export function isPaidPlan(plan: string | null | undefined): boolean {
  return normalizePlan(plan) !== "free";
}

/** Monthly allowance for a metric on a plan. `null` = unlimited. */
export function limitFor(metric: string, plan: string | null | undefined): number | null {
  const key = normalizeMetric(metric);
  if (!key) return 0;
  return QUOTA_METRICS[key]!.limits[normalizePlan(plan)];
}

/** Current billing period in UTC, e.g. "2026-08". */
export function currentPeriod(now: Date = new Date()): string {
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** First instant of the next period (when the counter resets). */
export function periodResetAt(now: Date = new Date()): string {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)).toISOString();
}
