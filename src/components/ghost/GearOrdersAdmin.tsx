import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { adminDeleteGearOrder, adminListGear, adminListGearOrders, adminSaveGearOrder } from '@/lib/gear.functions';
import { DELIVERY_CHARGE_BDT, GEAR_ORDER_STATUS, LOW_STOCK_QTY, orderTotals, type DeliveryZone } from '@/lib/gear-rules';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = any;
const tk = (n: number) => `৳${(n ?? 0).toLocaleString('en-IN')}`;
const field = 'w-full rounded-md border border-line bg-surface px-2 py-1.5 text-sm text-foreground';
const waLink = (phone: string, text: string) => `https://wa.me/${phone.replace(/\D/g, '').replace(/^0/, '880')}?text=${encodeURIComponent(text)}`;
const emptyOrder = { customer_name: '', customer_phone: '', district: '', thana: '', address: '', items: [] as Row[], delivery_zone: 'inside_dhaka' as DeliveryZone, discount_bdt: 0, payment_method: 'cod', payment_status: 'unpaid', trx_id: '', courier: '', tracking_code: '', status: 'pending', note: '' };

function esc(s: string) { return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!)); }

function printInvoice(o: Row) {
  const w = window.open('', '_blank', 'width=800,height=900');
  if (!w) { toast.error('পপআপ ব্লক হয়েছে'); return; }
  const rows = (o.items ?? []).map((i: Row) => `<tr><td>${esc(i.name)}${i.variant ? ` (${esc(i.variant)})` : ''}</td><td style="text-align:center">${i.qty}</td><td style="text-align:right">${tk(i.price_bdt * i.qty)}</td></tr>`).join('');
  w.document.write(`<!doctype html><html lang="bn"><head><meta charset="utf-8"><title>Invoice ${esc(o.public_code)}</title>
<link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@300;500;700&display=swap" rel="stylesheet">
<style>body{font-family:'Hind Siliguri',sans-serif;color:#0f172a;padding:32px;max-width:720px;margin:auto}table{width:100%;border-collapse:collapse;margin:20px 0}th,td{padding:10px;border-bottom:1px solid #e2e8f0;text-align:left}.r{text-align:right}.h{display:flex;justify-content:space-between;border-bottom:2px solid #0f172a;padding-bottom:12px}small{color:#64748b}</style></head><body>
<div class="h"><div><h2 style="margin:0">Ghostae Gear</h2><small>অফিশিয়াল ক্যাশমেমো ও ইনভয়েস</small></div><div class="r"><b>#${esc(o.public_code)}</b><br><small>তারিখ: ${new Date(o.created_at).toLocaleDateString('bn-BD')}</small></div></div>
<p><b>${esc(o.customer_name)}</b><br><small>${esc(o.address)}, ${esc(o.thana)}, ${esc(o.district)}<br>মোবাইল: ${esc(o.customer_phone)}</small></p>
<p><small>পেমেন্ট: ${esc(o.payment_method.toUpperCase())} · ${o.payment_status === 'paid' ? 'পরিশোধিত' : 'অপরিশোধিত'}${o.trx_id ? ` · TrxID ${esc(o.trx_id)}` : ''}</small></p>
<table><thead><tr><th>প্রোডাক্ট</th><th style="text-align:center">পরিমাণ</th><th class="r">মূল্য</th></tr></thead><tbody>${rows}</tbody></table>
<div class="r">সাবটোটাল: ${tk(o.subtotal_bdt)}<br>ডেলিভারি চার্জ: ${tk(o.delivery_charge_bdt)}<br>${o.discount_bdt ? `ছাড়: -${tk(o.discount_bdt)}<br>` : ''}<h3>সর্বমোট: ${tk(o.total_bdt)}</h3></div>
<p style="margin-top:40px;text-align:center"><small>ধন্যবাদ · ghostae.com · WhatsApp +880 1345 407572</small></p>
<script>window.onload=()=>setTimeout(()=>window.print(),400)</script></body></html>`);
  w.document.close();
}

export function GearOrdersAdmin({ view }: { view: 'dashboard' | 'orders' | 'customers' }) {
  const qc = useQueryClient();
  const listO = useServerFn(adminListGearOrders), listP = useServerFn(adminListGear), save = useServerFn(adminSaveGearOrder), del = useServerFn(adminDeleteGearOrder);
  const orders = useQuery({ queryKey: ['admin-gear-orders'], queryFn: () => listO() });
  const prods = useQuery({ queryKey: ['admin-gear'], queryFn: () => listP() });
  const [edit, setEdit] = useState<Row | null>(null);
  const [filter, setFilter] = useState('all');
  const [busy, setBusy] = useState(false);
  const all: Row[] = orders.data ?? [];
  const products: Row[] = prods.data?.products ?? [];

  const customers = useMemo(() => {
    const m = new Map<string, Row>();
    for (const o of all) {
      const c = m.get(o.customer_phone) ?? { name: o.customer_name, phone: o.customer_phone, district: o.district, orders: [] as Row[], spent: 0 };
      c.orders.push(o); if (o.status !== 'cancelled' && o.status !== 'returned') c.spent += o.total_bdt;
      m.set(o.customer_phone, c);
    }
    return [...m.values()].sort((a, b) => b.spent - a.spent);
  }, [all]);

  if (orders.isLoading || prods.isLoading) return <p className="text-sm text-muted-fg">লোড হচ্ছে…</p>;
  if (orders.error) return <p className="text-sm text-destructive">{(orders.error as Error).message}</p>;

  async function onSave() {
    if (!edit) return;
    setBusy(true);
    try {
      const { public_code: _p, created_at: _c, updated_at: _u, subtotal_bdt: _s, delivery_charge_bdt: _d, total_bdt: _t, cost_bdt: _k, ...rest } = edit;
      await save({ data: { ...rest, items: edit.items.map((i: Row) => ({ product_id: i.product_id, variant: i.variant ?? '', qty: i.qty })), trx_id: edit.trx_id || null, courier: edit.courier || null, tracking_code: edit.tracking_code || null, note: edit.note || null } });
      toast.success('অর্ডার সংরক্ষিত'); setEdit(null); qc.invalidateQueries({ queryKey: ['admin-gear-orders'] });
    } catch (e) { toast.error((e as Error).message); } finally { setBusy(false); }
  }

  if (edit) {
    const set = (k: string, v: unknown) => setEdit({ ...edit, [k]: v });
    const priced = edit.items.map((i: Row) => { const p = products.find(x => x.id === i.product_id); return { ...i, price_bdt: p?.sale_price_bdt ?? 0, cost_bdt: (p?.procurement_cost_bdt ?? 0) + (p?.extra_cost_bdt ?? 0) }; });
    const t = orderTotals(priced, edit.delivery_zone, edit.discount_bdt);
    return <div className="space-y-3 text-foreground">
      <h3 className="font-semibold">{edit.id ? `অর্ডার #${edit.public_code}` : 'নতুন অর্ডার'}</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs">গ্রাহকের নাম<input className={field} value={edit.customer_name} onChange={e => set('customer_name', e.target.value)} /></label>
        <label className="text-xs">মোবাইল<input className={field} value={edit.customer_phone} onChange={e => set('customer_phone', e.target.value)} placeholder="01XXXXXXXXX" /></label>
        <label className="text-xs">জেলা<input className={field} value={edit.district} onChange={e => set('district', e.target.value)} /></label>
        <label className="text-xs">থানা<input className={field} value={edit.thana} onChange={e => set('thana', e.target.value)} /></label>
      </div>
      <label className="block text-xs">পূর্ণ ঠিকানা<input className={field} value={edit.address} onChange={e => set('address', e.target.value)} /></label>
      <div className="space-y-2 rounded-md border border-line p-3">
        <p className="text-xs font-medium">প্রোডাক্টস</p>
        {edit.items.map((i: Row, idx: number) => { const p = products.find(x => x.id === i.product_id); const upd = (k: string, v: unknown) => set('items', edit.items.map((x: Row, j: number) => j === idx ? { ...x, [k]: v } : x)); return <div key={idx} className="flex flex-wrap items-center gap-2 text-sm">
          <select className={`${field} sm:w-64`} value={i.product_id} onChange={e => upd('product_id', e.target.value)}>{products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
          {(p?.variants ?? []).length > 0 && <select className={`${field} w-32`} value={i.variant} onChange={e => upd('variant', e.target.value)}><option value="">—</option>{p.variants.map((v: string) => <option key={v}>{v}</option>)}</select>}
          <input type="number" min={1} className={`${field} w-20`} value={i.qty} onChange={e => upd('qty', Math.max(1, Number(e.target.value) || 1))} />
          <span className="text-muted-fg">{tk((p?.sale_price_bdt ?? 0) * i.qty)}</span>
          <Button size="sm" variant="ghost" onClick={() => set('items', edit.items.filter((_: Row, j: number) => j !== idx))}>✕</Button></div>; })}
        <Button size="sm" variant="outline" disabled={!products.length} onClick={() => set('items', [...edit.items, { product_id: products[0].id, variant: '', qty: 1 }])}>+ প্রোডাক্ট</Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="text-xs">ডেলিভারি<select className={field} value={edit.delivery_zone} onChange={e => set('delivery_zone', e.target.value)}><option value="inside_dhaka">ঢাকার ভিতরে ({tk(DELIVERY_CHARGE_BDT.inside_dhaka)})</option><option value="outside_dhaka">ঢাকার বাইরে ({tk(DELIVERY_CHARGE_BDT.outside_dhaka)})</option></select></label>
        <label className="text-xs">ছাড় (৳)<input inputMode="numeric" className={field} value={edit.discount_bdt} onChange={e => set('discount_bdt', Math.max(0, Number(e.target.value) || 0))} /></label>
        <label className="text-xs">স্ট্যাটাস<select className={field} value={edit.status} onChange={e => set('status', e.target.value)}>{Object.entries(GEAR_ORDER_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
        <label className="text-xs">পেমেন্ট মাধ্যম<select className={field} value={edit.payment_method} onChange={e => set('payment_method', e.target.value)}><option value="cod">ক্যাশ অন ডেলিভারি</option><option value="bkash">bKash</option><option value="nagad">Nagad</option><option value="rocket">Rocket</option></select></label>
        <label className="text-xs">পেমেন্ট স্ট্যাটাস<select className={field} value={edit.payment_status} onChange={e => set('payment_status', e.target.value)}><option value="unpaid">অপরিশোধিত</option><option value="paid">পরিশোধিত</option><option value="refunded">রিফান্ড</option></select></label>
        <label className="text-xs">TrxID<input className={field} value={edit.trx_id ?? ''} onChange={e => set('trx_id', e.target.value)} /></label>
        <label className="text-xs">কুরিয়ার<select className={field} value={edit.courier ?? ''} onChange={e => set('courier', e.target.value)}><option value="">—</option><option>Steadfast</option><option>Pathao</option><option>RedX</option><option>Sundarban</option></select></label>
        <label className="text-xs">ট্র্যাকিং কোড<input className={field} value={edit.tracking_code ?? ''} onChange={e => set('tracking_code', e.target.value)} /></label>
      </div>
      <label className="block text-xs">নোট<textarea rows={2} className={field} value={edit.note ?? ''} onChange={e => set('note', e.target.value)} /></label>
      <p className="text-sm">সাবটোটাল {tk(t.subtotal)} + ডেলিভারি {tk(t.delivery)} − ছাড় {tk(edit.discount_bdt)} = <b>{tk(t.total)}</b> · লাভ {tk(t.profit)}</p>
      <div className="flex gap-2"><Button disabled={busy || !edit.items.length} onClick={onSave}>সংরক্ষণ</Button><Button variant="ghost" onClick={() => setEdit(null)}>বাতিল</Button></div>
    </div>;
  }

  const live = all.filter(o => o.status !== 'cancelled' && o.status !== 'returned');
  const today = new Date().toDateString();
  const todays = live.filter(o => new Date(o.created_at).toDateString() === today);
  const month = new Date().toISOString().slice(0, 7);
  const monthly = live.filter(o => o.created_at.startsWith(month));
  const profit = (rows: Row[]) => rows.reduce((s, o) => s + o.total_bdt - o.delivery_charge_bdt - o.cost_bdt, 0);
  const low = products.filter(p => p.status === 'published' && p.stock_qty <= LOW_STOCK_QTY);

  const OrderTable = ({ rows }: { rows: Row[] }) => <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left text-xs text-muted-fg"><th className="p-2">আইডি</th><th className="p-2">গ্রাহক</th><th className="p-2">আইটেম</th><th className="p-2">মোট</th><th className="p-2">স্ট্যাটাস</th><th className="p-2"></th></tr></thead>
    <tbody>{rows.map(o => <tr key={o.id} className="border-t border-line"><td className="p-2 font-medium">#{o.public_code}</td><td className="p-2">{o.customer_name}<div className="text-xs text-muted-fg">{o.customer_phone}</div></td><td className="p-2 text-xs">{o.items.map((i: Row) => `${i.name}×${i.qty}`).join(', ')}</td><td className="p-2">{tk(o.total_bdt)}<div className="text-xs text-muted-fg">{o.payment_status === 'paid' ? 'পরিশোধিত' : o.payment_method.toUpperCase()}</div></td><td className="p-2">{GEAR_ORDER_STATUS[o.status]}{o.tracking_code && <div className="text-xs text-muted-fg">{o.courier} {o.tracking_code}</div>}</td>
      <td className="whitespace-nowrap p-2 text-right"><Button size="sm" variant="ghost" onClick={() => printInvoice(o)}>ইনভয়েস</Button><Button size="sm" variant="ghost" asChild><a href={waLink(o.customer_phone, `আসসালামু আলাইকুম ${o.customer_name}, আপনার Ghostae Gear অর্ডার #${o.public_code} (মোট ${tk(o.total_bdt)}) কনফার্ম করার জন্য যোগাযোগ করছি।`)} target="_blank" rel="noreferrer">WhatsApp</a></Button><Button size="sm" variant="ghost" onClick={() => setEdit({ ...o })}>Edit</Button><Button size="sm" variant="ghost" className="text-destructive" onClick={async () => { if (!confirm('ডিলিট?')) return; await del({ data: { id: o.id } }); qc.invalidateQueries({ queryKey: ['admin-gear-orders'] }); }}>✕</Button></td></tr>)}
      {!rows.length && <tr><td colSpan={6} className="p-4 text-center text-muted-fg">কোনো অর্ডার নেই</td></tr>}</tbody></table></div>;

  if (view === 'dashboard') return <div className="space-y-4 text-foreground">
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {[['আজকের বিক্রি', tk(todays.reduce((s, o) => s + o.total_bdt, 0))], ['আজকের নেট লাভ', tk(profit(todays))], ['এই মাসের লাভ', tk(profit(monthly))], ['পেন্ডিং অর্ডার', `${all.filter(o => o.status === 'pending').length} টি`]].map(([l, v]) => <div key={l} className="rounded-lg border border-line bg-surface p-4"><p className="text-xs text-muted-fg">{l}</p><p className="mt-1 text-xl font-semibold">{v}</p></div>)}
    </div>
    {low.length > 0 && <div className="rounded-lg border border-destructive/40 p-3 text-sm"><b className="text-destructive">লো-স্টক:</b> {low.map(p => `${p.name} (${p.stock_qty})`).join(', ')}</div>}
    <div className="flex items-center justify-between"><h3 className="font-semibold">সাম্প্রতিক অর্ডার</h3><Button size="sm" onClick={() => setEdit({ ...emptyOrder })}>+ নতুন অর্ডার</Button></div>
    <OrderTable rows={all.slice(0, 8)} />
  </div>;

  if (view === 'customers') return <div className="space-y-3 text-foreground">
    <h3 className="font-semibold">গ্রাহক তালিকা ({customers.length})</h3>
    <div className="grid gap-3 md:grid-cols-3">{customers.map(c => <details key={c.phone} className="rounded-lg border border-line bg-surface p-3 text-sm">
      <summary className="cursor-pointer"><b>{c.name}</b> · {c.orders.length} অর্ডার · {tk(c.spent)}<div className="text-xs text-muted-fg">{c.phone} {c.district && `· ${c.district}`}</div></summary>
      <div className="mt-2 flex gap-2"><Button size="sm" variant="outline" asChild><a href={waLink(c.phone, `আসসালামু আলাইকুম ${c.name}, Ghostae Gear থেকে বলছি।`)} target="_blank" rel="noreferrer">WhatsApp</a></Button><Button size="sm" variant="outline" asChild><a href={`tel:${c.phone}`}>Call</a></Button></div>
      <ul className="mt-2 space-y-1 text-xs text-muted-fg">{c.orders.map((o: Row) => <li key={o.id}>#{o.public_code} · {tk(o.total_bdt)} · {GEAR_ORDER_STATUS[o.status]}</li>)}</ul>
    </details>)}</div>
    {!customers.length && <p className="text-sm text-muted-fg">এখনো কোনো গ্রাহক নেই।</p>}
  </div>;

  const rows = filter === 'all' ? all : all.filter(o => o.status === filter);
  return <div className="space-y-3 text-foreground">
    <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold">অর্ডার ও ইনভয়েস</h3>
      <div className="flex gap-2"><select className={`${field} w-40`} value={filter} onChange={e => setFilter(e.target.value)}><option value="all">সব</option>{Object.entries(GEAR_ORDER_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select><Button size="sm" onClick={() => setEdit({ ...emptyOrder })}>+ নতুন অর্ডার</Button></div></div>
    <OrderTable rows={rows} />
  </div>;
}
