import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { CHATGPT_EXTENSION } from './chatgpt-extension';

export const DIGITAL_PAY_METHODS = ['bkash', 'nagad', 'rocket', 'upay'] as const;
export const DIGITAL_ORDER_STATUSES = ['pending', 'paid', 'delivered', 'cancelled'] as const;

const bdPhone = z.string().trim().regex(/^(?:\+?88)?01[3-9]\d{8}$/, 'সঠিক মোবাইল নম্বর দিন');

export const digitalOrderSchema = z.object({
  slug: z.string().trim().min(1).max(60),
  name: z.string().trim().min(2, 'নাম লিখুন').max(80),
  email: z.string().trim().email('সঠিক email দিন').max(160),
  whatsapp: bdPhone,
  method: z.enum(DIGITAL_PAY_METHODS),
  sender: bdPhone,
  trxId: z.string().trim().regex(/^[A-Za-z0-9]{6,30}$/, 'সঠিক Transaction ID দিন'),
  expectedAmount: z.number().int().positive().optional(),
});

async function sha(s: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export const createDigitalOrder = createServerFn({ method: 'POST' })
  .inputValidator((d: unknown) => digitalOrderSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    let product: { slug: string; name: string } | undefined;
    let live: { priceBdt: number | null; inStock: boolean } | undefined;
    let supplierId: number | null = null;
    const liveMatch = /^live-(\d+)$/.exec(data.slug);
    if (data.slug === CHATGPT_EXTENSION.slug) {
      const { count, error } = await supabaseAdmin.from('digital_key_inventory').select('id', { count: 'exact', head: true }).eq('product_slug', data.slug).is('order_id', null);
      if (error || !count) throw new Error('লাইসেন্স এখন পাওয়া যাচ্ছে না');
      product = { slug: data.slug, name: CHATGPT_EXTENSION.name };
      live = { priceBdt: CHATGPT_EXTENSION.priceBdt, inStock: true };
    } else if (liveMatch) {
      const { data: sp } = await supabaseAdmin.from('shopbot_products').select('id,name,title_bn,usd_price,price_override_bdt,in_stock,stock_count,visible').eq('id', Number(liveMatch[1])).maybeSingle();
      if (sp?.visible) {
        const { verifyShopbotProduct } = await import('./shopbot.server');
        product = { slug: data.slug, name: sp.title_bn || sp.name };
        live = { priceBdt: await verifyShopbotProduct(supabaseAdmin, sp.id), inStock: true };
        supplierId = sp.id;
      }
    }
    if (!product) throw new Error('পণ্যটি পাওয়া যায়নি');
    if (!live?.priceBdt || !live.inStock) throw new Error('পণ্যটি এখন পাওয়া যাচ্ছে না');
    if (data.expectedAmount !== undefined && data.expectedAmount !== live.priceBdt) throw new Error('দাম পরিবর্তন হয়েছে; আবার যাচাই করুন। টাকা পাঠানো থাকলে সহায়তায় যোগাযোগ করুন।');
    const { digitalBrowserAccess } = await import('./digital-access.server');
    const accessHash = await digitalBrowserAccess(true);

    const { getRequestIP } = await import('@tanstack/react-start/server');
    const ipHash = await sha(`dg:${getRequestIP({ xForwardedFor: true }) ?? 'unknown'}`);
    const since = new Date(Date.now() - 3600_000).toISOString();
    const { count } = await supabaseAdmin.from('digital_orders').select('id', { count: 'exact', head: true }).eq('ip_hash', ipHash).gte('created_at', since);
    if ((count ?? 0) >= 5) throw new Error('অনেকগুলো অর্ডার হয়েছে, কিছুক্ষণ পরে চেষ্টা করুন');

    const code = `GD-${crypto.randomUUID().replace(/-/g, '').slice(0, 6).toUpperCase()}`;
    const { data: row, error } = await supabaseAdmin.from('digital_orders').insert({
      public_code: code, product_slug: product.slug, product_name: product.name, amount_bdt: live.priceBdt,
      buyer_name: data.name, buyer_email: data.email.toLowerCase(), buyer_whatsapp: data.whatsapp,
      payment_method: data.method, sender_number: data.sender, trx_id: data.trxId.toUpperCase(), ip_hash: ipHash, supplier_product_id: supplierId, delivery_access_hash: accessHash,
    }).select('id').single();
    if (error || !row) throw new Error('অর্ডার নেওয়া যায়নি, আবার চেষ্টা করুন');
    try {
      const { relayMatchLateOrder } = await import('./relay-match.server');
      await relayMatchLateOrder(supabaseAdmin, 'digital', row.id, data.method, data.trxId.toUpperCase(), live.priceBdt);
    } catch { /* stays pending for manual review */ }
    return { code, amount: live.priceBdt, product: product.name };
  });

export const adminListDigitalOrders = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertAdmin } = await import('./admin-helpers.server');
    const admin = await assertAdmin(context);
    const { data, error } = await admin.from('digital_orders')
      .select('id,public_code,product_name,amount_bdt,buyer_name,buyer_email,buyer_whatsapp,payment_method,sender_number,trx_id,status,created_at,supplier_product_id,delivery_status,delivery_error,supplier_order_code,payment_verified_at,payment_verification_source')
      .order('created_at', { ascending: false }).limit(200);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const adminSetDigitalOrderStatus = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid(), status: z.enum(['paid', 'cancelled']), confirmPayment: z.literal(true).optional() }).parse(d))
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import('./admin-helpers.server');
    const admin = await assertAdmin(context);
    if (data.status === 'paid' && !data.confirmPayment) throw new Error('পেমেন্ট যাচাইয়ের নিশ্চিতকরণ প্রয়োজন');
    const { data: changed, error } = await admin.from('digital_orders').update({ status: data.status, ...(data.status === 'paid' ? { payment_verified_at: new Date().toISOString(), payment_verification_source: `admin:${context.userId}` } : {}) }).eq('id', data.id).eq('status', 'pending').select('id');
    if (error || !changed?.length) throw new Error('অর্ডারের অবস্থা পরিবর্তন করা যায়নি');
    if (data.status === 'paid') {
      const { deliverDigitalOrder } = await import('./shopbot.server');
      await deliverDigitalOrder(admin, data.id).catch(() => null);
    }
    return { ok: true };
  });
