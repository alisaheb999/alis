import { createFileRoute, Link } from '@tanstack/react-router';
import { useCallback, useEffect, useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { getMyAffiliate, requestWithdrawal } from '@/lib/affiliate.functions';
import { AFFILIATE_MIN_WITHDRAW_BDT, canWithdraw } from '@/lib/affiliate-rules';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, Users, Wallet, TrendingUp, ArrowDownToLine, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export const Route = createFileRoute('/_authenticated/partner')({
  head: () => ({
    meta: [
      { title: 'Partner Dashboard — Ghostae' },
      { name: 'description', content: 'Ghostae টিম মেম্বারদের রেফারেল, কমিশন ও উইথড্র।' },
      { property: 'og:title', content: 'Partner Dashboard — Ghostae' },
      { property: 'og:description', content: 'Referral sales, commission balance and withdrawals for Ghostae team members.' },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary' },
      { name: 'robots', content: 'noindex' },
    ],
  }),
  component: PartnerPage,
});

type D = Awaited<ReturnType<typeof getMyAffiliate>>;
const STATUS: Record<string, string> = { pending: 'অপেক্ষমাণ', approved: 'যোগ হয়েছে', reversed: 'ফেরত', rejected: 'বাতিল', paid: 'পাঠানো হয়েছে' };

function PartnerPage() {
  const load = useServerFn(getMyAffiliate);
  const withdraw = useServerFn(requestWithdrawal);
  const [d, setD] = useState<D | null>(null);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<'bkash' | 'nagad' | 'rocket'>('bkash');
  const [account, setAccount] = useState('');
  const [busy, setBusy] = useState(false);
  const refresh = useCallback(() => load().then(setD).catch(() => toast.error('তথ্য আনা যায়নি')), [load]);
  useEffect(() => { refresh(); }, [refresh]);

  if (!d) return <main className="min-h-screen grid place-items-center"><Loader2 className="h-6 w-6 animate-spin" /></main>;
  if (!d.affiliate) return <main className="min-h-screen grid place-items-center p-6 text-center"><div className="space-y-3"><h1 className="text-xl font-semibold">আপনি এখনও টিম মেম্বার নন</h1><p className="text-sm text-muted-fg">যুক্ত হতে Ghostae টিমের সাথে যোগাযোগ করুন।</p><Button asChild variant="outline"><Link to="/dashboard">আমার অ্যাকাউন্ট</Link></Button></div></main>;

  const a = d.affiliate;
  const paidCount = d.commissions.filter(c => c.status === 'approved').length;
  const withdrawn = d.withdrawals.filter(w => w.status === 'paid').reduce((s, w) => s + w.amount_bdt, 0);
  const n = Number(amount);
  const hasPending = d.withdrawals.some(w => w.status === 'pending');
  const valid = canWithdraw(a.balance_bdt, n) && /^01[3-9]\d{8}$/.test(account) && !hasPending;

  const submit = async () => {
    setBusy(true);
    try { await withdraw({ data: { amount: n, method, account } }); toast.success('রিকোয়েস্ট পাঠানো হয়েছে'); setAmount(''); refresh(); }
    catch (e: any) { toast.error(e?.message ?? 'ব্যর্থ'); } finally { setBusy(false); }
  };

  const stats = [
    { icon: Users, label: 'মোট রেফার', value: d.commissions.length },
    { icon: TrendingUp, label: 'সফল বিক্রি', value: paidCount },
    { icon: Wallet, label: 'বর্তমান ব্যালেন্স', value: `${a.balance_bdt} ট` },
    { icon: ArrowDownToLine, label: 'মোট উইথড্র', value: `${withdrawn} ট` },
  ];

  return <main className="min-h-screen" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-10">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="text-2xl font-semibold">স্বাগতম, {a.name}</h1><p className="text-sm text-muted-fg">প্রতি সফল বিক্রিতে {a.commission_percent}% কমিশন{a.status !== 'active' && ' · অ্যাকাউন্ট স্থগিত'}</p></div>
        <Button asChild variant="outline" size="sm"><Link to="/dashboard">আমার অ্যাকাউন্ট</Link></Button>
      </header>

      <section className="flex flex-wrap gap-2">
        {d.codes.map(c => <button key={c.code} onClick={() => { navigator.clipboard.writeText(c.code); toast.success('কপি হয়েছে'); }} className="flex items-center gap-2 rounded-lg border border-line bg-surface px-4 py-2 text-sm">
          <b className="tracking-wider">{c.code}</b><span className="text-muted-fg">ক্রেতা পাবে {c.percent_off}% ছাড়</span><Copy className="h-4 w-4" /></button>)}
      </section>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map(s => <div key={s.label} className="rounded-xl border border-line bg-surface p-4"><s.icon className="h-5 w-5 text-primary" /><p className="mt-2 text-xs text-muted-fg">{s.label}</p><p className="text-xl font-semibold">{s.value}</p></div>)}
      </section>

      <section className="rounded-xl border border-line bg-surface p-4 space-y-3">
        <h2 className="font-semibold">উইথড্র</h2>
        <p className="text-xs text-muted-fg">সর্বনিম্ন {AFFILIATE_MIN_WITHDRAW_BDT} ট। রিকোয়েস্টের টাকা সঙ্গে সঙ্গে ব্যালেন্স থেকে আটকে রাখা হয়; বাতিল হলে ফেরত আসে।</p>
        <div className="grid gap-2 sm:grid-cols-4">
          <Input type="number" inputMode="numeric" placeholder="পরিমাণ (ট)" value={amount} onChange={e => setAmount(e.target.value)} />
          <select value={method} onChange={e => setMethod(e.target.value as any)} className="h-10 rounded-md border border-line bg-background px-3 text-sm"><option value="bkash">bKash</option><option value="nagad">Nagad</option><option value="rocket">Rocket</option></select>
          <Input inputMode="numeric" placeholder="01XXXXXXXXX" value={account} onChange={e => setAccount(e.target.value.replace(/\D/g, '').slice(0, 11))} />
          <Button disabled={!valid || busy || a.status !== 'active'} onClick={submit}>রিকোয়েস্ট পাঠান</Button>
        </div>
        {hasPending && <p className="text-xs text-muted-fg">আগের রিকোয়েস্ট অপেক্ষমাণ।</p>}
        {amount && n > a.balance_bdt && <p className="text-xs text-destructive">ব্যালেন্সের চেয়ে বেশি।</p>}
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">রেফারেল হিস্ট্রি</h2>
        {d.commissions.length === 0 && <p className="text-sm text-muted-fg">এখনও কোনো রেফার নেই।</p>}
        {d.commissions.map(c => <div key={c.id} className="flex flex-wrap justify-between gap-2 rounded-lg border border-line p-3 text-sm">
          <span>{new Date(c.created_at).toLocaleDateString('en-GB')} · {c.coupon_code} · অর্ডার {c.order_amount_bdt} ট</span>
          <span>+{c.commission_bdt} ট · {STATUS[c.status] ?? c.status}</span></div>)}
      </section>

      {d.withdrawals.length > 0 && <section className="space-y-2">
        <h2 className="font-semibold">উইথড্র হিস্ট্রি</h2>
        {d.withdrawals.map(w => <div key={w.id} className="flex flex-wrap justify-between gap-2 rounded-lg border border-line p-3 text-sm">
          <span>{new Date(w.created_at).toLocaleDateString('en-GB')} · {w.payment_method} {w.account_number}</span>
          <span>{w.amount_bdt} ট · {STATUS[w.status] ?? w.status}{w.trx_id ? ` · ${w.trx_id}` : ''}</span></div>)}
      </section>}
    </div>
  </main>;
}
