import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { retailPriceBdt } from './digital-products';

export type LiveProduct = { id: number; name: string; category: string; title: string; description: string; image: string | null; priceBdt: number | null; stock: number; inStock: boolean; maxQty: number };

function publicClient() {
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  return createClient(process.env.SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => { const h = new Headers(init?.headers); if (key.startsWith('sb_') && h.get('Authorization') === `Bearer ${key}`) h.delete('Authorization'); h.set('apikey', key); return fetch(input, { ...init, headers: h }); } },
  });
}

const COLS = 'id,category_name,name,description,image_url,usd_price,stock_count,in_stock,max_qty,title_bn,description_bn,price_override_bdt';
function toLive(r: any): LiveProduct {
  const priceBdt = r.price_override_bdt > 0 ? r.price_override_bdt : retailPriceBdt(Number(r.usd_price));
  return { id: r.id, name: r.name, category: r.category_name, title: r.title_bn || r.name, description: r.description_bn || r.description, image: r.image_url, priceBdt, stock: r.stock_count, inStock: r.in_stock && r.stock_count > 0, maxQty: r.max_qty };
}

export const listLiveProducts = createServerFn({ method: 'GET' }).handler(async () => {
  const { data } = await publicClient().from('shopbot_products').select(COLS).eq('visible', true).order('category_name');
  return (data ?? []).map(toLive).filter(p => p.inStock);
});

export const getLiveProduct = createServerFn({ method: 'GET' })
  .inputValidator((d: unknown) => z.object({ id: z.number().int().positive() }).parse(d))
  .handler(async ({ data }) => {
    const { data: row } = await publicClient().from('shopbot_products').select(COLS).eq('id', data.id).eq('visible', true).maybeSingle();
    return row ? toLive(row) : null;
  });

export const adminListShopbot = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertAdmin } = await import('./admin-helpers.server');
    const admin = await assertAdmin(context);
    const { data, error } = await admin.from('shopbot_products').select('*').order('category_name');
    if (error) throw new Error(error.message);
    return (data ?? []).map((r: any) => ({ ...r, autoPriceBdt: retailPriceBdt(Number(r.usd_price)) }));
  });

export const adminSyncShopbot = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertAdmin } = await import('./admin-helpers.server');
    const admin = await assertAdmin(context);
    const { syncShopbotCatalog } = await import('./shopbot.server');
    return syncShopbotCatalog(admin);
  });

export const adminUpdateShopbot = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    id: z.number().int(), title_bn: z.string().max(200).nullable(), description_bn: z.string().max(5000).nullable(),
    price_override_bdt: z.number().int().positive().max(1_000_000).nullable(), visible: z.boolean(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import('./admin-helpers.server');
    const admin = await assertAdmin(context);
    const { id, ...patch } = data;
    const { error } = await admin.from('shopbot_products').update({ ...patch, title_bn: patch.title_bn || null, description_bn: patch.description_bn || null }).eq('id', id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeliverDigital = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import('./admin-helpers.server');
    const admin = await assertAdmin(context);
    const { deliverDigitalOrder } = await import('./shopbot.server');
    return deliverDigitalOrder(admin, data.id);
  });

export const adminShopbotWallet = createServerFn({ method: 'GET' }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const { assertAdmin } = await import('./admin-helpers.server'); await assertAdmin(context);
  const { shopbotWallet } = await import('./shopbot.server'); return shopbotWallet();
});
