type Admin = Awaited<typeof import('@/integrations/supabase/client.server')>['supabaseAdmin'];
export type SupplierProduct = { productId: string; name: string; description?: string; productType: string; price: { amount: number; currency: string }; availability: { available: number | null }; purchaseRequirements?: { customerEmail?: boolean; customerAccounts?: boolean; slotMonths?: boolean; quantityFixed?: number; allowedMonths?: number[] } };
export async function callCanboso(path: string, init?: RequestInit) {
  const key = process.env.UDC_CANBOSO_API_KEY;
  const gatewayKey = process.env.LOVABLE_API_KEY;
  if (!key || !gatewayKey) throw new Error('Canboso connection unavailable');
  const res = await fetch(`https://connector-gateway.lovable.dev/udc_canboso/api/v2/telegram-buyer/${path}`, { ...init, signal: AbortSignal.timeout(20000), headers: { Authorization: `Bearer ${gatewayKey}`, 'X-Connection-Api-Key': key, 'Content-Type': 'application/json', ...init?.headers } });
  if (!res.ok) throw new Error(`Canboso request failed (${res.status})`);
  const result = await res.json() as any;
  if (!result.success) throw new Error('Canboso rejected request');
  return result;
}
export async function syncCanboso(sb: Admin) {
  const result = await callCanboso('products');
  const products = result.products as SupplierProduct[];
  const rows = products.map(p => ({ id: p.productId, name: p.name, description: p.description ?? '', product_type: p.productType, cost: p.price.amount, currency: p.price.currency, stock: p.availability.available, requirements: p.purchaseRequirements ?? {}, synced_at: new Date().toISOString() }));
  if (rows.length) { const { error } = await sb.from('canboso_products').upsert(rows, { onConflict: 'id' }); if (error) throw new Error('Catalogue save failed'); }
  return { count: rows.length };
}
export async function verifyCanboso(sb: Admin, id: string) {
  const { data: managed } = await sb.from('canboso_products').select('*').eq('id', id).maybeSingle();
  if (!managed?.visible || !managed.selling_price_bdt) throw new Error('এই পণ্যটির দাম নির্ধারিত হয়নি');
  const result = await callCanboso('products');
  const p = (result.products as SupplierProduct[]).find(p => p.productId === id);
  if (!p || p.availability.available === 0 || p.price.amount <= 0) throw new Error('পণ্যটি এখন পাওয়া যাচ্ছে না');
  if (p.productType === 'upgrade_account' || p.purchaseRequirements?.slotMonths) throw new Error('এই প্যাকেজের অতিরিক্ত তথ্য এখনও সমর্থিত নয়');
  if (p.price.currency !== managed.currency || p.price.amount !== Number(managed.cost)) throw new Error('সরবরাহকারীর দাম বদলেছে; দোকানের দাম পুনরায় যাচাই প্রয়োজন');
  return { price: managed.selling_price_bdt, cost: p.price.amount, currency: p.price.currency, name: p.name, type: p.productType };
}
export async function deliverCanboso(sb: Admin, orderId: string) {
  const { data: rows } = await sb.from('digital_orders').update({ delivery_status: 'processing', delivery_error: null }).eq('id', orderId).eq('status', 'paid').in('delivery_status', ['none', 'failed']).not('canboso_product_id', 'is', null).select('*');
  const order = rows?.[0]; if (!order?.canboso_product_id) return { ok: false };
  try {
    const p = await verifyCanboso(sb, order.canboso_product_id);
    if (p.cost !== Number(order.supplier_cost) || p.currency !== order.supplier_currency) throw new Error('Supplier cost changed');
    const result = await callCanboso('purchase', { method: 'POST', headers: { 'Idempotency-Key': `ghostae-${order.id}` }, body: JSON.stringify({ product_id: order.canboso_product_id, quantity: 1, ...(p.type === 'slot' ? { customer_email: order.buyer_email } : {}) }) });
    const payload = result.delivery ? JSON.stringify(result.delivery, null, 2) : null;
    const complete = result.order?.status === 'completed' && Boolean(payload);
    await sb.from('digital_orders').update({ supplier_order_code: result.order?.orderCode ?? null, delivery_payload: complete ? payload : null, delivery_status: complete ? 'delivered' : 'processing', status: complete ? 'delivered' : 'paid', delivery_error: complete ? null : 'Supplier fulfilment pending' }).eq('id', orderId);
    return { ok: complete };
  } catch { await sb.from('digital_orders').update({ delivery_error: 'Supplier outcome requires reconciliation', delivery_status: 'processing' }).eq('id', orderId); return { ok: false }; }
}