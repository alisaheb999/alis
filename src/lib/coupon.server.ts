/**
 * Coupon evaluation — server only.
 *
 * The browser may *ask* what a code is worth, but the discount that reaches the
 * payment gateway is always recomputed here from the database row.
 */

export type CouponVerdict =
  | { ok: false; reason: string }
  | {
      ok: true;
      id: string;
      code: string;
      discount: number;
      amount: number;
      percentOff: number;
      flatOff: number;
    };

export type PublicOffer = {
  discount: number;
  amount: number;
};

/**
 * Return the admin-configured store offer for `plan`. The discount is set
 * manually in the admin panel — it is never derived from coupon codes.
 * The order endpoint calls this again and never trusts the UI.
 */
export async function getBestPublicOffer(plan: string, amount: number): Promise<PublicOffer | null> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { pricingAliases } = await import('./pricing.server');
  const { isPaidPlan } = await import('./pricing-catalog');
  const aliases = isPaidPlan(plan) ? pricingAliases[plan] : [plan];
  const { data, error } = await supabaseAdmin
    .from("public_offers")
    .select("plan,discount,active")
    .in("plan", aliases);

  if (error) throw new Error('Offer is temporarily unavailable.');
  const offer = aliases.map(key => data?.find(row => row.plan === key)).find(Boolean);
  if (!offer?.active) return null;

  const discount = Math.min(amount - 1, Math.round(Number(offer.discount) || 0));
  return discount > 0 ? { discount, amount: amount - discount } : null;
}

/** Validate `raw` against `plan` and return the payable amount. */
export async function evaluateCoupon(
  raw: string,
  plan: string,
  amount: number,
): Promise<CouponVerdict> {
  const code = raw.trim().toUpperCase();
  if (!code) return { ok: false, reason: "Enter a coupon code." };

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("coupons")
    .select("id, code, percent_off, flat_off, plans, max_redemptions, redeemed_count, active, starts_at, expires_at")
    .eq("code", code)
    .maybeSingle();

  if (!data) return { ok: false, reason: "This coupon code is not valid." };
  if (!data.active) return { ok: false, reason: "This coupon is no longer active." };

  const now = Date.now();
  if (data.starts_at && new Date(data.starts_at).getTime() > now)
    return { ok: false, reason: "This coupon is not active yet." };
  if (data.expires_at && new Date(data.expires_at).getTime() < now)
    return { ok: false, reason: "This coupon has expired." };
  if (data.max_redemptions > 0 && data.redeemed_count >= data.max_redemptions)
    return { ok: false, reason: "This coupon has reached its usage limit." };

  const plans = (data.plans ?? []) as string[];
  if (plans.length && !plans.includes(plan))
    return { ok: false, reason: "This coupon does not apply to the selected plan." };

  const percent = Math.round((amount * (data.percent_off ?? 0)) / 100);
  const discount = Math.min(amount - 1, percent + (data.flat_off ?? 0));
  if (discount <= 0) return { ok: false, reason: "This coupon has no discount value." };

  return {
    ok: true,
    id: data.id,
    code: data.code,
    discount,
    amount: amount - discount,
    percentOff: data.percent_off ?? 0,
    flatOff: data.flat_off ?? 0,
  };
}

/** Bump the redemption counter once an invoice is created for the coupon. */
export async function markCouponRedeemed(id: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("coupons")
    .select("redeemed_count")
    .eq("id", id)
    .maybeSingle();
  await supabaseAdmin
    .from("coupons")
    .update({ redeemed_count: (data?.redeemed_count ?? 0) + 1 })
    .eq("id", id);
}
