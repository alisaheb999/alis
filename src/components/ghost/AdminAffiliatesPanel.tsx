import { useCallback, useEffect, useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { adminListAffiliates, adminCreateAffiliate, adminSetAffiliateStatus, adminSettleWithdrawal } from '@/lib/affiliate.functions';

type Data = Awaited<ReturnType<typeof adminListAffiliates>>;

export function AdminAffiliatesPanel() {
  const list = useServerFn(adminListAffiliates);
  const create = useServerFn(adminCreateAffiliate);
  const setStatus = useServerFn(adminSetAffiliateStatus);
  const settle = useServerFn(adminSettleWithdrawal);
  const [d, setD] = useState<Data | null>(null);
  const [f, setF] = useState({ email: '', name: '', phone: '', code: '', buyer: '10', com: '10' });
  const [busy, setBusy] = useState(false);
  const load = useCallback(() => list().then(setD).catch(e => toast.error(String(e?.message ?? e))), [list]);
  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    setBusy(true);
    try {
      await create({ data: { email: f.email, name: f.name, phone: f.phone, code: f.code, buyerPercentOff: Number(f.buyer), commissionPercent: Number(f.com) } });
      toast.success('টিম মেম্বার যুক্ত হয়েছে');
      setF({ email: '', name: '', phone: '', code: '', buyer: '10', com: '10' });
      load();
    } catch (e: any) { toast.error(e?.message ?? 'ব্যর্থ'); } finally { setBusy(false); }
  };

  const settleW = async (id: string, status: 'paid' | 'rejected') => {
    const trx = status === 'paid' ? (window.prompt('পাঠানো টাকার TrxID') ?? '') : '';
    if (status === 'paid' && !trx.trim()) return;
    try { await settle({ data: { id, status, trx, note: '' } }); load(); } catch (e: any) { toast.error(e?.message); }
  };

  const name = (id: string) => d?.affiliates.find(a => a.id === id)?.name ?? '—';

  return <div className="space-y-6">
    <section className="rounded-lg border border-line p-4 space-y-3">
      <h3 className="font-bold">নতুন টিম মেম্বার</h3>
      <p className="text-xs text-muted-fg">মেম্বারকে আগে সাইটে অ্যাকাউন্ট খুলতে হবে; সেই ইমেইল দিন।</p>
      <div className="grid gap-2 sm:grid-cols-3">
        <Input placeholder="অ্যাকাউন্ট ইমেইল" value={f.email} onChange={e => setF({ ...f, email: e.target.value })} />
        <Input placeholder="নাম" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} />
        <Input placeholder="মোবাইল" value={f.phone} onChange={e => setF({ ...f, phone: e.target.value })} />
        <Input placeholder="কুপন কোড (যেমন ALI10)" value={f.code} onChange={e => setF({ ...f, code: e.target.value.toUpperCase() })} />
        <label className="text-xs">ক্রেতার ছাড় %<Input type="number" value={f.buyer} onChange={e => setF({ ...f, buyer: e.target.value })} /></label>
        <label className="text-xs">কমিশন %<Input type="number" value={f.com} onChange={e => setF({ ...f, com: e.target.value })} /></label>
      </div>
      <Button disabled={busy} onClick={submit}>যুক্ত করুন</Button>
    </section>

    <section className="space-y-2">
      <div className="flex justify-between"><h3 className="font-bold">টিম মেম্বার</h3><Button size="sm" variant="outline" onClick={load}>Refresh</Button></div>
      {d?.affiliates.map(a => <div key={a.id} className="rounded-lg border border-line p-3 text-sm flex flex-wrap justify-between gap-2">
        <div><b>{a.name}</b> · {a.email}<p className="text-xs text-muted-fg">কোড: {d.codes.filter(c => c.affiliate_id === a.id).map(c => `${c.code} (${c.redeemed_count})`).join(', ') || '—'} · কমিশন {a.commission_percent}%</p></div>
        <div className="text-right"><p>ব্যালেন্স {a.balance_bdt} ট · মোট {a.total_earned_bdt} ট</p>
          <Button size="sm" variant="outline" onClick={async () => { await setStatus({ data: { id: a.id, status: a.status === 'active' ? 'suspended' : 'active' } }); load(); }}>{a.status === 'active' ? 'স্থগিত করুন' : 'চালু করুন'}</Button></div>
      </div>)}
      {d && d.affiliates.length === 0 && <p className="text-sm text-muted-fg">এখনও কেউ নেই।</p>}
    </section>

    <section className="space-y-2">
      <h3 className="font-bold">উইথড্র রিকোয়েস্ট</h3>
      {d?.withdrawals.map(w => <div key={w.id} className="rounded-lg border border-line p-3 text-sm flex flex-wrap justify-between gap-2">
        <div><b>{name(w.affiliate_id)}</b> · {w.amount_bdt} ট · {w.payment_method} {w.account_number}<p className="text-xs text-muted-fg">{new Date(w.created_at).toLocaleString()} · {w.status}{w.trx_id ? ` · ${w.trx_id}` : ''}</p></div>
        {w.status === 'pending' && <div className="flex gap-1.5"><Button size="sm" onClick={() => settleW(w.id, 'paid')}>Paid</Button><Button size="sm" variant="outline" onClick={() => settleW(w.id, 'rejected')}>Reject</Button></div>}
      </div>)}
    </section>
  </div>;
}
