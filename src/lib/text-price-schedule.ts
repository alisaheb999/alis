/** Shared deterministic schedule; payable amounts are always enforced server-side. */
export const TEXT_PRICE_START = Date.parse("2026-10-07T10:52:00Z");
export const TEXT_PRICE_INTERVAL = 24 * 60 * 60 * 1000;

export function textPriceSchedule(plan: string, now = Date.now()) {
  if (plan !== "text_lifetime") return null;
  const steps = Math.max(0, Math.floor((now - TEXT_PRICE_START) / TEXT_PRICE_INTERVAL));
  return {
    increase: steps,
    nextIncreaseAt: TEXT_PRICE_START + (steps + 1) * TEXT_PRICE_INTERVAL,
    serverNow: now,
  };
}