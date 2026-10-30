import { createServerFn } from '@tanstack/react-start';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import type { Database } from '@/integrations/supabase/types';
import { canReviewPurchase } from './digital-safety';

const slugSchema = z.string().min(1).max(60);
export const listDigitalReviews = createServerFn({ method: 'GET' }).inputValidator((d: unknown) => z.object({ slug: slugSchema }).parse(d)).handler(async ({ data }) => {
  const key = process.env.SUPABASE_PUBLISHABLE_KEY; const url = process.env.SUPABASE_URL;
  if (!key || !url) throw new Error('Reviews unavailable');
  const db = createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: (input, init) => { const h = new Headers(init?.headers); if (h.get('Authorization') === `Bearer ${key}` && key.startsWith('sb_')) h.delete('Authorization'); h.set('apikey', key); return fetch(input, { ...init, headers: h }); } } });
  const { data: rows, error } = await db.rpc('public_digital_reviews', { p_slug: data.slug });
  if (error) throw new Error('Reviews unavailable'); return rows ?? [];
});
export const submitDigitalReview = createServerFn({ method: 'POST' }).inputValidator((d: unknown) => z.object({ slug: slugSchema, code: z.string().regex(/^GD-[A-F0-9]{6}$/), name: z.string().trim().min(2).max(50), rating: z.number().int().min(1).max(5), body: z.string().trim().min(10).max(2000), screenshot: z.string().max(210000).regex(/^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/).nullable().optional() }).parse(d)).handler(async ({ data }) => {
  const { digitalBrowserAccess } = await import('./digital-access.server'); const access = await digitalBrowserAccess();
  if (!access) throw new Error('যে ব্রাউজারে কিনেছেন সেটি থেকে রিভিউ দিন');
  const { supabaseAdmin: db } = await import('@/integrations/supabase/client.server');
  const { data: order } = await db.from('digital_orders').select('id,product_slug,status,delivery_status').eq('public_code', data.code).eq('product_slug', data.slug).eq('delivery_access_hash', access).eq('status', 'delivered').maybeSingle();
  if (!order || !canReviewPurchase(order, data.slug)) throw new Error('এই পণ্যের সম্পন্ন ক্রয় যাচাই করা যায়নি');
  const { error } = await db.from('digital_reviews').insert({ order_id: order.id, product_slug: data.slug, display_name: data.name, rating: data.rating, body: data.body, screenshot: data.screenshot ?? null });
  if (error) throw new Error('রিভিউ আগে দেওয়া হয়েছে অথবা জমা নেওয়া যায়নি'); return { ok: true };
});
export const adminDigitalReviews = createServerFn({ method: 'GET' }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const { assertAdmin } = await import('./admin-helpers.server'); const db = await assertAdmin(context);
  const { data, error } = await db.from('digital_reviews').select('id,product_slug,display_name,rating,body,screenshot,reply,approved,created_at').order('created_at', { ascending: false }).limit(200);
  if (error) throw new Error('Reviews unavailable'); return data ?? [];
});
export const moderateDigitalReview = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator((d: unknown) => z.object({ id: z.string().uuid(), approved: z.boolean(), reply: z.string().trim().max(2000).nullable() }).parse(d)).handler(async ({ data, context }) => {
  const { assertAdmin } = await import('./admin-helpers.server'); const db = await assertAdmin(context);
  const { error } = await db.from('digital_reviews').update({ approved: data.approved, reply: data.reply }).eq('id', data.id);
  if (error) throw new Error('Save failed'); return { ok: true };
});