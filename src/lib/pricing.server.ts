import { createClient } from '@supabase/supabase-js';
import { CATALOG, type PaidPlanId, type Cycle } from './pricing-catalog';

export const pricingAliases: Record<PaidPlanId, string[]> = {
  text_lifetime: ['text_lifetime', 'lifetime', 'text'],
  light: ['light', 'basic', 'lite'], pro: ['pro'], ultra: ['ultra'], team: ['team'],
};

/** Published prices only; no customer data or privileged client. */
export async function readPricingRows() {
  const url = process.env['SUPABASE_URL'];
  const key = process.env['SUPABASE_PUBLISHABLE_KEY'];
  if (!url || !key) throw new Error('Pricing is temporarily unavailable.');
  const db = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => {
      const headers = new Headers(init?.headers);
      if (key.startsWith('sb_') && headers.get('Authorization') === `Bearer ${key}`) headers.delete('Authorization');
      headers.set('apikey', key);
      return fetch(input, { ...init, headers });
    } },
  });
  const { data, error } = await db.from('pricing_plans').select('plan_key,price_monthly,price_yearly').eq('visible', true);
  if (error) throw new Error('Pricing is temporarily unavailable.');
  return data ?? [];
}

export function resolvePricing(plan: PaidPlanId, cycle: Cycle, rows: { plan_key: string; price_monthly: number; price_yearly: number }[]) {
  const row = pricingAliases[plan].map(key => rows.find(r => r.plan_key === key)).find(Boolean);
  if (!row) return CATALOG[plan].price[cycle];
  return CATALOG[plan].lifetime || CATALOG[plan].validityDays
    ? row.price_monthly
    : cycle === 'yearly' ? row.price_yearly : row.price_monthly;
}

export async function readPlanPrice(plan: PaidPlanId, cycle: Cycle) {
  return resolvePricing(plan, cycle, await readPricingRows());
}