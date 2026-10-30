import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { CATALOG, PAID_PLAN_IDS } from './pricing-catalog';
import { textPriceSchedule } from './text-price-schedule';

export const adminPricing = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertAdmin } = await import('./admin-helpers.server');
    await assertAdmin(context);
    const { supabaseAdmin: db } = await import('@/integrations/supabase/client.server');
    const { pricingAliases, resolvePricing } = await import('./pricing.server');
    const [plans, offers] = await Promise.all([
      db.from('pricing_plans').select('*'), db.from('public_offers').select('plan,discount,active'),
    ]);
    if (plans.error || offers.error) throw new Error('দাম লোড হয়নি। আবার চেষ্টা করুন।');
    return PAID_PLAN_IDS.map(id => {
      const item = CATALOG[id];
      const offer = pricingAliases[id].map(key => offers.data?.find(o => o.plan === key && o.active)).find(Boolean);
      const rows = (plans.data ?? []).filter(p => p.visible);
      return { id, name: `${id === 'text_lifetime' ? 'Ghostae Text' : 'Ghostae Caption'} · ${item.name.en}`,
        monthly: resolvePricing(id, 'monthly', rows), yearly: resolvePricing(id, 'yearly', rows),
        dualCycle: !item.lifetime && !item.validityDays,
        discount: Number(offer?.discount ?? 0), offerActive: Boolean(offer),
        increase: textPriceSchedule(id)?.increase ?? 0,
      };
    });
  });

export const adminSavePricing = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({
    plan: z.enum(['text_lifetime', 'light', 'pro', 'ultra', 'team']),
    monthly: z.number().int().min(1).max(1000000), yearly: z.number().int().min(1).max(10000000),
    discount: z.number().int().min(0).max(1000000), offerActive: z.boolean(),
  }).parse(input))
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import('./admin-helpers.server');
    await assertAdmin(context);
    const item = CATALOG[data.plan];
    const yearly = item.lifetime || item.validityDays ? data.monthly : data.yearly;
    if (data.offerActive && (data.discount < 1 || data.discount >= Math.min(data.monthly, yearly)))
      throw new Error('অফারের দাম মূল দামের কম এবং শূন্যের বেশি হতে হবে।');
    const { supabaseAdmin: db } = await import('@/integrations/supabase/client.server');
    const { pricingAliases } = await import('./pricing.server');
    const aliases = pricingAliases[data.plan];
    const existing = await db.from('pricing_plans').select('*').in('plan_key', aliases);
    if (existing.error) throw new Error('বর্তমান দাম পড়া যায়নি।');
    const previous = aliases.map(key => existing.data?.find(p => p.plan_key === key)).find(Boolean);
    const row = { ...(previous ?? { name_en: item.name.en, name_bn: item.name.bn, currency: 'BDT',
      tokens_monthly: item.tokens, device_limit: item.deviceLimit, description_en: '', description_bn: '', sort_order: 100 }),
      plan_key: data.plan, price_monthly: data.monthly, price_yearly: yearly, visible: true };
    // Canonical row takes precedence over historical aliases; preserve licence settings.
    delete (row as { id?: string }).id;
    const saved = await db.from('pricing_plans').upsert(row, { onConflict: 'plan_key' });
    if (saved.error) throw new Error('মূল দাম সেভ হয়নি। আবার চেষ্টা করুন।');
    const offer = await db.from('public_offers').upsert({ plan: data.plan,
      discount: data.offerActive ? data.discount : 0, active: data.offerActive }, { onConflict: 'plan' });
    if (offer.error) throw new Error('মূল দাম সেভ হয়েছে, কিন্তু অফার সেভ হয়নি। আবার সেভ করুন।');
    const legacy = aliases.filter(key => key !== data.plan);
    if (legacy.length) {
      const disabled = await db.from('public_offers').update({ active: false }).in('plan', legacy);
      if (disabled.error) throw new Error('পুরোনো অফার বন্ধ হয়নি। আবার সেভ করুন।');
    }
    return { ok: true };
  });