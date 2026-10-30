import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { CHATGPT_EXTENSION } from './chatgpt-extension';

export const getChatgptAvailability = createServerFn({ method: 'GET' }).handler(async () => {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  const { count, error } = await supabaseAdmin.from('digital_key_inventory').select('id', { count: 'exact', head: true }).eq('product_slug', CHATGPT_EXTENSION.slug).is('order_id', null);
  if (error) throw new Error('পণ্যের তথ্য যাচাই করা যায়নি');
  return { available: (count ?? 0) > 0 };
});

export const readDigitalDelivery = createServerFn({ method: 'POST' })
  .inputValidator((d: unknown) => z.object({ code: z.string().regex(/^GD-[A-F0-9]{6}$/) }).parse(d))
  .handler(async ({ data }) => {
    const { digitalBrowserAccess } = await import('./digital-access.server');
    const access = await digitalBrowserAccess();
    if (!access) throw new Error('এই ব্রাউজারে অর্ডারের অনুমতি নেই');
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { data: order, error } = await supabaseAdmin.from('digital_orders').select('id,status,delivery_status').eq('public_code', data.code).eq('delivery_access_hash', access).maybeSingle();
    if (error || !order) throw new Error('অর্ডারটি দেখা যাচ্ছে না');
    let payload: string | null = null;
    if (order.status === 'delivered' && order.delivery_status === 'delivered') {
      const { data: secret } = await supabaseAdmin.from('digital_delivery_secrets').select('payload').eq('order_id', order.id).maybeSingle();
      payload = secret?.payload ?? null;
    }
    return { status: order.status, deliveryStatus: order.delivery_status, payload };
  });

export const checkDigitalCheckout = createServerFn({ method: 'POST' })
  .inputValidator((d: unknown) => z.object({ slug: z.string().min(1).max(60) }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    if (data.slug === CHATGPT_EXTENSION.slug) {
      const { count, error } = await supabaseAdmin.from('digital_key_inventory').select('id', { count: 'exact', head: true }).eq('product_slug', data.slug).is('order_id', null);
      if (error || !count) throw new Error('পণ্যটি এখন পাওয়া যাচ্ছে না');
      return { price: CHATGPT_EXTENSION.priceBdt, checkedAt: Date.now() };
    }
    const match = /^live-(\d+)$/.exec(data.slug);
    if (!match) throw new Error('এই পণ্যটির ম্যানুয়াল অ্যাক্টিভেশন প্রয়োজন');
    const { verifyShopbotProduct } = await import('./shopbot.server');
    const price = await verifyShopbotProduct(supabaseAdmin, Number(match[1]));
    return { price, checkedAt: Date.now() };
  });
export const getChatgptExtensionDownload = createServerFn({ method: 'POST' })
  .inputValidator((d: unknown) => z.object({ code: z.string().regex(/^GD-[A-F0-9]{6}$/) }).parse(d))
  .handler(async ({ data }) => {
    const { digitalBrowserAccess } = await import('./digital-access.server');
    const access = await digitalBrowserAccess();
    if (!access) throw new Error('এই ব্রাউজারে অর্ডারের অনুমতি নেই');
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { data: order } = await supabaseAdmin.from('digital_orders').select('status,delivery_status,product_slug').eq('public_code', data.code).eq('delivery_access_hash', access).maybeSingle();
    if (!order || order.product_slug !== CHATGPT_EXTENSION.slug || order.status !== 'delivered' || order.delivery_status !== 'delivered') throw new Error('পেমেন্ট যাচাইয়ের পর ডাউনলোড চালু হবে');
    const { data: s, error } = await supabaseAdmin.storage.from('extension-releases').createSignedUrl(CHATGPT_EXTENSION.zipPath, 600, { download: 'ChatGPT-Extension-by-Ghostae.zip' });
    if (error || !s) throw new Error('ডাউনলোড লিংক তৈরি করা যায়নি');
    return { url: s.signedUrl };
  });
