/**
 * Authoritative purchase catalogue.
 *
 * Browser-safe (no secrets) but the *server* is the only thing allowed to read
 * the amount from here — checkout never trusts a price sent by the client.
 */

export type Cycle = "monthly" | "yearly";
export type PaidPlanId = "light" | "pro" | "ultra" | "team" | "text_lifetime";

export type CatalogItem = {
  id: PaidPlanId;
  name: { en: string; bn: string };
  /** BDT, whole taka. */
  price: Record<Cycle, number>;
  /** Activation seats granted with the licence. */
  deviceLimit: number;
  tokens: number;
  /** One-time purchase: licence never expires. */
  lifetime?: boolean;
  /** Fixed validity used instead of the selected billing cycle. */
  validityDays?: number;
};

export const CATALOG: Record<PaidPlanId, CatalogItem> = {
  light: {
    id: "light",
    name: { en: "Light", bn: "লাইট" },
    price: { monthly: 199, yearly: 199 },
    deviceLimit: 1,
    tokens: 300,
    validityDays: 90,
  },
  pro: {
    id: "pro",
    name: { en: "Pro", bn: "প্রো" },
    price: { monthly: 699, yearly: 699 },
    deviceLimit: 2,
    tokens: 1500,
    validityDays: 365,
  },
  ultra: {
    id: "ultra",
    name: { en: "Ultra", bn: "আলট্রা" },
    price: { monthly: 999, yearly: 9999 },
    deviceLimit: 3,
    tokens: 3000,
  },
  text_lifetime: {
    id: "text_lifetime",
    name: { en: "Lifetime", bn: "লাইফটাইম" },
    price: { monthly: 349, yearly: 349 },
    deviceLimit: 1,
    tokens: 0,
    lifetime: true,
  },
  team: {
    id: "team",
    name: { en: "Team", bn: "টিম" },
    price: { monthly: 1999, yearly: 19999 },
    deviceLimit: 5,
    tokens: 10000,
  },
};

export const PAID_PLAN_IDS = Object.keys(CATALOG) as PaidPlanId[];

export function isPaidPlan(value: unknown): value is PaidPlanId {
  return typeof value === "string" && value in CATALOG;
}

export function isCycle(value: unknown): value is Cycle {
  return value === "monthly" || value === "yearly";
}

/** Licence validity in days for a billing cycle. */
export function cycleDays(cycle: Cycle, plan?: PaidPlanId) {
  if (plan && CATALOG[plan]?.lifetime) return 36_500;
  if (plan && CATALOG[plan]?.validityDays) return CATALOG[plan].validityDays;
  return cycle === "yearly" ? 365 : 30;
}

export function formatTaka(amount: number) {
  return `৳${amount.toLocaleString("en-US")}`;
}
