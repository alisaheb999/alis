import { useCallback, useEffect, useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { Button } from '@/components/ui/button';
import { adminDeliverDigital } from '@/lib/shopbot.functions';
import { adminListDigitalOrders, adminSetDigitalOrderStatus } from '@/lib/digital-orders.functions';
import { AdminDigitalReviews } from './AdminDigitalReviews';

type Row = Awaited<ReturnType<typeof adminListDigitalOrders>>[number];

export function AdminDigitalOrdersPanel() {
  const list = useServerFn(adminListDigitalOrders);
  const setStatus = useServerFn(adminSetDigitalOrderStatus);
  const deliver = useServerFn(adminDeliverDigital);
  const [rows, setRows] = useState<Row[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const load = useCallback(() => list().then(setRows).catch(e => setErr(String(e?.message ?? e))), [list]);
  useEffect(() => { load(); }, [load]);

  return <div className="space-y-3">
    <div className="flex items-center justify-between"><h3 className="text-base font-bold">Digital Orders</h3><Button size="sm" variant="outline" onClick={load}>Refresh</Button></div>
    {err && <p className="text-sm text-destructive">{err}</p>}
    {rows.length === 0 && !err && <p className="text-sm text-muted-fg">কোনো অর্ডার নেই।</p>}
    {rows.map(r => <div key={r.id} className="rounded-lg border border-line p-3 text-sm">
      <div className="flex flex-wrap justify-between gap-2"><b>{r.public_code} · {r.product_name}</b><span>{r.amount_bdt} ট</span></div>
      <p className="mt-1 text-xs text-muted-fg">{r.buyer_name} · {r.buyer_email} · WA {r.buyer_whatsapp}</p>
      <p className="text-xs text-muted-fg">{r.payment_method} · {r.sender_number} · TrxID {r.trx_id} · {new Date(r.created_at).toLocaleString()}</p>
      <div className="mt-2 rounded-md border border-line p-2 text-xs">
        <p>Auto delivery: <b>{r.delivery_status}</b>{r.supplier_order_code ? ` · ${r.supplier_order_code}` : ''}</p>
        {r.delivery_error && <p className="text-destructive">{r.delivery_error}</p>}
        {r.payment_verified_at && <p>Payment verified · {r.payment_verification_source?.startsWith('admin:') ? 'Admin' : 'Relay'}</p>}
        {r.delivery_status === 'failed' && r.status === 'paid' && <Button size="sm" variant="outline" className="mt-1" onClick={async () => { const x = await deliver({ data: { id: r.id } }); if (!x.ok) setErr(('reason' in x ? x.reason : null) ?? 'ডেলিভারি যাচাই প্রয়োজন'); load(); }}>আবার ডেলিভারি চেষ্টা</Button>}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5"><span>{r.status}</span>{r.status === 'pending' && <><Button size="sm" onClick={async () => { if (!window.confirm('এই লেনদেনের সঠিক পরিমাণ পাওয়া ও যাচাই হয়েছে?')) return; try { await setStatus({ data: { id: r.id, status: 'paid', confirmPayment: true } }); load(); } catch { setErr('পেমেন্ট নিশ্চিত করা যায়নি'); } }}>পেমেন্ট যাচাই হয়েছে</Button><Button size="sm" variant="outline" onClick={async () => { try { await setStatus({ data: { id: r.id, status: 'cancelled' } }); load(); } catch { setErr('বাতিল করা যায়নি'); } }}>বাতিল</Button></>}
        <Button size="sm" variant="ghost" asChild><a href={`https://wa.me/88${r.buyer_whatsapp.replace(/^\+?88/, '')}`} target="_blank" rel="noopener noreferrer">WhatsApp</a></Button></div>
    </div>)}
    <AdminDigitalReviews />
  </div>;
}
