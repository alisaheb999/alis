/**
 * Plan → module entitlements (single source of truth for the extension).
 * `/api/public/v1/sync/config` sends `locked_modules` from this map and the
 * panels lock every `[data-premium="<module>"]` control accordingly.
 */
import { normalizePlan, type PlanKey } from "@/lib/ghost-quotas";

export const PREMIUM_MODULES = [
  "cloud.premium",
  "command.reasoning",
  "caption.ai",
  "storyboard.ai",
  "removebg",
  "template.full",
  "tools.backup",
  "text.ffx.custom",
  "team.share",
] as const;

export type PremiumModule = (typeof PREMIUM_MODULES)[number];

/** Modules a plan may NOT use. Unknown plans are treated as `free` (deny-all). */
export const PLAN_LOCKS: Record<PlanKey, PremiumModule[]> = {
  free: [...PREMIUM_MODULES],
  basic: ["team.share", "tools.backup", "template.full", "storyboard.ai", "command.reasoning"],
  pro: ["team.share"],
  ultra: [],
  team: [],
};

/** Default device seats per plan — admins can still override per license. */
export const PLAN_DEVICE_LIMIT: Record<PlanKey, number> = {
  free: 1,
  basic: 1,
  pro: 2,
  ultra: 3,
  team: 5,
};

/**
 * Fail-closed entitlements: no valid licence, or an unrecognised plan id, both
 * end up with every premium module locked.
 */
export function lockedModulesForPlan(plan: string | null | undefined, licensed: boolean) {
  if (!licensed) return [...PREMIUM_MODULES];
  return [...PLAN_LOCKS[normalizePlan(plan)]];
}

/** Seats allowed for a plan (deny-by-default: unknown = 1 device). */
export function deviceLimitForPlan(plan: string | null | undefined) {
  return PLAN_DEVICE_LIMIT[normalizePlan(plan)];
}

/**
 * Automatic AI mode: when one provider errors out, the next configured one in
 * this chain answers instead. Order = quality/latency balance.
 */
export const AI_FALLBACK_CHAIN: { provider: string; model: string }[] = [
  { provider: "gemini", model: "gemini-3.6-flash" },
  { provider: "groq", model: "llama-3.3-70b-versatile" },
  { provider: "openrouter", model: "google/gemini-2.5-flash" },
  { provider: "mistral", model: "mistral-large-latest" },
  { provider: "together", model: "meta-llama/Llama-3.3-70B-Instruct-Turbo" },
  { provider: "cohere", model: "command-a-03-2025" },
  { provider: "huggingface", model: "meta-llama/Llama-3.1-8B-Instruct" },
];
