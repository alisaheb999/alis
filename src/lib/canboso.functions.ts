import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
export const adminCanboso = createServerFn({ method: 'GET' }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const { assertAdmin } = await import('./admin-helpers.server'); const sb = await assertAdmin(context);
  const { data, error } = await sb.from('canboso_products').select('*').order('name'); if (error) throw new Error('Canboso catalogue unavailable'); return data ?? [];
});
export const adminSyncCanboso = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const { assertAdmin } = await import('./admin-helpers.server'); const sb = await assertAdmin(context);
  const { syncCanboso } = await import('./canboso.server'); return syncCanboso(sb);
});
export const adminSaveCanboso = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator((d: unknown) => z.object({ id: z.string().max(100), price: z.number().int().positive().max(1000000), visible: z.boolean() }).parse(d)).handler(async ({ context, data }) => {
  const { assertAdmin } = await import('./admin-helpers.server'); const sb = await assertAdmin(context);
  const { error } = await sb.from('canboso_products').update({ selling_price_bdt: data.price, visible: data.visible }).eq('id', data.id); if (error) throw new Error('Save failed'); return { ok: true };
});