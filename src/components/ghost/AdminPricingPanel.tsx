import { useCallback, useEffect, useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { Check, Loader2, RefreshCw, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { adminPricing, adminSavePricing } from '@/lib/admin-pricing.functions';

type PriceRow = Awaited<ReturnType<typeof adminPricing>>[number];
const money = (amount: number) => `৳${amount.toLocaleString('bn-BD')}`;

export function AdminPricingPanel() {
  const load = useServerFn(adminPricing);
  const save = useServerFn(adminSavePricing);
  const [rows, setRows] = useState<PriceRow[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    setLoading(true); setError('');
    try { setRows(await load()); }
    catch (e) { setError(e instanceof Error ? e.message : 'দাম লোড হয়নি।'); }
    finally { setLoading(false); }
  }, [load]);
  useEffect(() => { void refresh(); }, [refresh]);
  return <section className="account-typography space-y-5">
    <header className="flex items-center justify-between gap-3">
      <h2 className="text-xl font-semibold text-foreground">মূল দাম ও অফার</h2>
      <Button variant="outline" size="icon" aria-label="দাম রিফ্রেশ করুন" title="দাম রিফ্রেশ করুন" disabled={loading} onClick={refresh}><RefreshCw size={16} /></Button>
    </header>
    {error && <p role="alert" className="text-sm text-danger">{error}</p>}
    {loading ? <Loader2 className="animate-spin text-primary" aria-label="দাম লোড হচ্ছে" /> :
      <div className="grid gap-4 lg:grid-cols-2">{rows.map(row => <PriceControl key={row.id} row={row} onSave={async data => {
        await save({ data });
        const latest = await load();
        setRows(latest);
      }} />)}</div>}
  </section>;
}

function PriceControl({ row, onSave }: { row: PriceRow; onSave: (data: { plan: PriceRow['id']; monthly: number; yearly: number; discount: number; offerActive: boolean }) => Promise<void> }) {
  const [cycle, setCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [monthly, setMonthly] = useState(String(row.monthly));
  const [yearly, setYearly] = useState(String(row.yearly));
  const [enabled, setEnabled] = useState(row.offerActive);
  const [discount, setDiscount] = useState(row.discount);
  const [offerText, setOfferText] = useState(String(row.monthly - row.discount));
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    setMonthly(String(row.monthly)); setYearly(String(row.yearly));
    setEnabled(row.offerActive); setDiscount(row.discount);
    setOfferText(String((cycle === 'monthly' ? row.monthly : row.yearly) - row.discount));
  }, [row]);
  const base = Number(cycle === 'monthly' ? monthly : yearly);
  const offer = enabled ? Number(offerText) : base;
  const valid = Number.isInteger(base) && base > 0 && Number.isInteger(offer) && offer > 0 && (!enabled || offer < base)
    && Number.isInteger(Number(monthly)) && Number(monthly) > 0 && Number.isInteger(Number(yearly)) && Number(yearly) > 0
    && (!enabled || discount < Math.min(Number(monthly), row.dualCycle ? Number(yearly) : Number(monthly)));
  const change = () => { setSaved(false); setError(''); };
  return <form className="rounded-lg border border-line bg-surface p-5" onSubmit={async event => {
    event.preventDefault(); if (!valid || busy) return;
    setBusy(true); setError(''); setSaved(false);
    try { await onSave({ plan: row.id, monthly: Number(monthly), yearly: Number(yearly), discount, offerActive: enabled }); setSaved(true); }
    catch (e) { setError(e instanceof Error ? e.message : 'দাম সেভ হয়নি।'); }
    finally { setBusy(false); }
  }}>
    <h3 className="text-base font-semibold text-foreground">{row.name}</h3>
    {row.dualCycle && <select aria-label={`${row.name} মেয়াদ`} className="mt-3 rounded-md border border-line bg-background px-3 py-2 text-sm" value={cycle} onChange={e => {
      const next = e.target.value === 'yearly' ? 'yearly' : 'monthly'; setCycle(next);
      setOfferText(String(Number(next === 'monthly' ? monthly : yearly) - discount)); change();
    }}><option value="monthly">মাসিক</option><option value="yearly">বার্ষিক</option></select>}
    <div className="mt-5 grid grid-cols-2 gap-4">
      <label className="text-sm text-muted-fg">মূল দাম (৳)<input aria-label={`${row.name} মূল দাম`} type="number" min="1" step="1" required value={cycle === 'monthly' ? monthly : yearly} className="mt-2 h-11 w-full rounded-md border border-line bg-background px-3 text-base text-foreground" onChange={e => {
        if (cycle === 'monthly') setMonthly(e.target.value); else setYearly(e.target.value);
        setOfferText(String(Number(e.target.value) - discount)); change();
      }} /></label>
      <label className="text-sm text-muted-fg">অফারের দাম (৳)<input aria-label={`${row.name} অফারের দাম`} type="number" min="1" step="1" required disabled={!enabled} value={enabled ? offerText : String(base)} className="mt-2 h-11 w-full rounded-md border border-line bg-background px-3 text-base text-foreground disabled:opacity-50" onChange={e => {
        setOfferText(e.target.value); setDiscount(base - Number(e.target.value)); change();
      }} /></label>
    </div>
    <div className="mt-4 flex items-center justify-between gap-3"><label htmlFor={`${row.id}-offer`} className="text-sm text-foreground">অফার {enabled ? 'চালু' : 'বন্ধ'}</label><Switch id={`${row.id}-offer`} checked={enabled} onCheckedChange={value => { setEnabled(value); change(); }} /></div>
    <div className="mt-5 border-t border-line pt-4 text-sm">
      <div className="flex justify-between gap-3 text-muted-fg"><span>ছাড়</span><span>{money(enabled ? discount : 0)}</span></div>
      {row.increase > 0 && <div className="mt-2 flex justify-between gap-3 text-muted-fg"><span>সময়সূচির মূল্য বৃদ্ধি</span><span>+{money(row.increase)}</span></div>}
      <div className="mt-3 flex justify-between gap-3 font-semibold text-foreground"><span>ক্রেতার প্রদেয়</span><span>{money(offer + row.increase)}</span></div>
    </div>
    {enabled && !valid && <p className="mt-3 text-xs text-danger">অফারের দাম মূল দামের কম এবং শূন্যের বেশি হতে হবে।</p>}
    {error && <p role="alert" className="mt-3 text-sm text-danger">{error}</p>}
    <div className="mt-5 flex items-center justify-between gap-3"><span role="status" className="text-xs text-success">{saved ? 'দাম সেভ হয়েছে' : ''}</span><Button type="submit" disabled={!valid || busy}>{busy ? <Loader2 size={15} className="animate-spin" /> : saved ? <Check size={15} /> : <Save size={15} />} সেভ করুন</Button></div>
  </form>;
}