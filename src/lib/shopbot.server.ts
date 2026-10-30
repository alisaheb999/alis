// Server-only Shopbot supplier client: catalogue sync and wallet-paid delivery.
import { retailPriceBdt } from './digital-products';
import { canUseSupplierProduct, deliveryPriceMatches } from './digital-safety';

const BASE = 'https://shopbot.00969600.xyz/shop-api/v1';
type Admin = any;

async function call(path: string, init?: RequestInit) {
  const key = process.env.SHOPBOT_API_KEY;
  if (!key) throw new Error('SHOPBOT_API_KEY missing');
  const res = await fetch(`${BASE}${path}`, { ...init, signal: AbortSignal.timeout(15000), headers: { 'X-Shop-API-Key': key, 'Content-Type': 'application/json', ...(init?.headers ?? {}) } });
  const json = (await res.json().catch(() => ({}))) as any;
  return { ok: res.ok && json?.ok !== false, status: res.status, json };
}

type SbProduct = { id: number; category_id: number; name: string; description?: string; image_url?: string; unit_price: number; stock_count: number; in_stock: boolean; min_qty: number; max_qty: number };

export async function syncShopbotCatalog(sb: Admin) {
  const [cats, prods] = await Promise.all([call('/categories'), call('/products')]);
  if (!prods.ok) throw new Error(`Shopbot products failed (${prods.status})`);
  const catName = new Map<number, string>((cats.json?.categories ?? []).map((c: any) => [c.id, c.name]));
  const list: SbProduct[] = prods.json.products ?? [];
  const now = new Date().toISOString();
  const rows = list.map(p => ({
    id: p.id, category_name: catName.get(p.category_id) ?? '', name: String(p.name).trim(),
    description: p.description ?? '', image_url: p.image_url ?? null, usd_price: Number(p.unit_price) || 0,
    stock_count: Number(p.stock_count) || 0, in_stock: !!p.in_stock, min_qty: p.min_qty || 1, max_qty: p.max_qty ?? 1, synced_at: now,
  }));
  if (rows.length) {
    const { error } = await sb.from('shopbot_products').upsert(rows, { onConflict: 'id' });
    if (error) throw new Error(error.message);
  }
  // Products no longer listed by the supplier become out of stock (admin overrides kept).
  const ids = rows.map(r => r.id);
  await sb.from('shopbot_products').update({ in_stock: false, stock_count: 0 }).not('id', 'in', `(${ids.length ? ids.join(',') : 0})`);
  return { count: rows.length };
}

export function shopbotPriceBdt(p: { usd_price: number | string; price_override_bdt: number | null }) {
  if (p.price_override_bdt && p.price_override_bdt > 0) return p.price_override_bdt;
  return retailPriceBdt(Number(p.usd_price));
}

export async function verifyShopbotProduct(sb: Admin, id: number) {
  const response = await call('/products');
  if (!response.ok) throw new Error('সরবরাহকারীর স্টক যাচাই করা যায়নি');
  const current = (response.json.products as SbProduct[] | undefined)?.find(p => p.id === id);
  if (!current || !canUseSupplierProduct(current)) throw new Error('পণ্যটি এখন স্টকে নেই');
  const { data: managed, error } = await sb.from('shopbot_products').select('visible,price_override_bdt').eq('id', id).maybeSingle();
  if (error || !managed?.visible) throw new Error('পণ্যটি পাওয়া যাচ্ছে না');
  await sb.from('shopbot_products').update({ usd_price: current.unit_price, stock_count: current.stock_count, in_stock: current.in_stock, synced_at: new Date().toISOString() }).eq('id', id);
  return shopbotPriceBdt({ usd_price: current.unit_price, price_override_bdt: managed.price_override_bdt });
}

/** Buys from the supplier wallet once per paid order. Claims the row first so retries never double-buy. */
export async function deliverDigitalOrder(sb: Admin, orderId: string) {
  const { data: order } = await sb.from('digital_orders').select('product_slug,canboso_product_id').eq('id', orderId).maybeSingle();
  if (order?.canboso_product_id) return { ok: false, reason: 'Canboso is deferred' };
  if (order?.product_slug === 'chatgpt-plus-renew') {
    const { data, error } = await sb.rpc('allocate_digital_key', { p_order: orderId });
    return { ok: !error && data === true };
  }
  const { data: claimed } = await sb.from('digital_orders').update({ delivery_status: 'processing', delivery_error: null })
    .eq('id', orderId).eq('status', 'paid').in('delivery_status', ['none', 'failed'])
    .not('supplier_product_id', 'is', null).select('id,supplier_product_id,quantity,amount_bdt');
  const row = claimed?.[0];
  if (!row) return { ok: false, reason: 'not_eligible' };
  try {
    const price = await verifyShopbotProduct(sb, row.supplier_product_id);
    if (row.quantity !== 1 || !price || !deliveryPriceMatches(price, row.amount_bdt)) {
      await sb.from('digital_orders').update({ delivery_status: 'failed', delivery_error: 'Price or quantity changed; owner review required' }).eq('id', orderId);
      return { ok: false, reason: 'price_changed' };
    }
    const r = await call('/orders', { method: 'POST', body: JSON.stringify({ product_id: row.supplier_product_id, quantity: row.quantity || 1 }) });
    if (!r.ok) {
      const msg = String(r.json?.error ?? `HTTP ${r.status}`) + (r.json?.shortfall ? ` (shortfall $${r.json.shortfall})` : '');
      await sb.from('digital_orders').update({ delivery_status: 'processing', delivery_error: msg.slice(0, 300) }).eq('id', orderId);
      return { ok: false, reason: msg };
    }
    const keys: string[] = r.json.delivered_keys ?? [];
    if (!keys.length) throw new Error('Supplier returned no delivery; reconcile before retry');
    const { error: secretError } = await sb.from('digital_delivery_secrets').upsert({ order_id: orderId, payload: keys.join('\n') });
    if (secretError) throw new Error('Delivery save failed');
    const { error: finishError } = await sb.from('digital_orders').update({ delivery_status: 'delivered', status: 'delivered', supplier_order_code: r.json.order_code ?? null }).eq('id', orderId);
    if (finishError) throw new Error('Delivery state save failed');
    return { ok: true };
  } catch (e) {
    // Unknown outcome: never retry purchasing automatically.
    await sb.from('digital_orders').update({ delivery_status: 'processing', delivery_error: 'Unknown outcome — reconcile supplier orders before retry' }).eq('id', orderId);
    return { ok: false, reason: 'network' };
  }
}

export async function shopbotWallet() {
  try {
    const result = await call('/balance');
    if (!result.ok) return { available: false, balance: null, error: `Shopbot access unavailable (${result.status})` };
    const n = Number(result.json.balance ?? result.json.wallet_balance ?? result.json.wallet?.balance);
    return Number.isFinite(n) ? { available: true, balance: n, error: null } : { available: false, balance: null, error: 'Wallet response could not be verified' };
  } catch { return { available: false, balance: null, error: 'Shopbot connection unavailable' }; }
}
