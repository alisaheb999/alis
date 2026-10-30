import { useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { CheckCircle2, Loader2, Minus, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { createPublicGearOrder } from '@/lib/gear.functions';
import { DELIVERY_CHARGE_BDT, type DeliveryZone } from '@/lib/gear-rules';
import { formatBdt } from '@/lib/digital-products';

const RECEIVE = '01949085128';
const PAY = [
  { id: 'cod', label: 'ক্যাশ অন ডেলিভারি' },
  { id: 'bkash', label: 'বিকাশ' },
  { id: 'nagad', label: 'নগদ' },
] as const;
type Pay = (typeof PAY)[number]['id'];

const input = 'w-full rounded-md border border-line bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary aria-[invalid=true]:border-destructive';

export function GearCheckoutDialog({ open, onOpenChange, product, initialQty }: { open: boolean; onOpenChange: (o: boolean) => void; product: { id: string; name: string; sale_price_bdt: number; image?: string }; initialQty: number }) {
  const submit = useServerFn(createPublicGearOrder);
  const [f, setF] = useState({ name: '', phone: '', district: '', thana: '', address: '', note: '', trx: '' });
  const [qty, setQty] = useState(initialQty);
  const [zone, setZone] = useState<DeliveryZone>('inside_dhaka');
  const [pay, setPay] = useState<Pay>('cod');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ orderNo: string; total: number } | null>(null);
  const subtotal = product.sale_price_bdt * qty;
  const total = subtotal + DELIVERY_CHARGE_BDT[zone];
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (f.name.trim().length < 2) err.name = 'নাম লিখুন';
    if (!/^(\+?88)?01[3-9]\d{8}$/.test(f.phone.trim())) err.phone = 'সঠিক মোবাইল নম্বর দিন';
    if (f.district.trim().length < 2) err.district = 'জেলা লিখুন';
    if (f.thana.trim().length < 2) err.thana = 'থানা লিখুন';
    if (f.address.trim().length < 5) err.address = 'পূর্ণ ঠিকানা লিখুন';
    if (pay !== 'cod' && f.trx.trim().length < 6) err.trx = 'Transaction ID দিন';
    setErrors(err);
    if (Object.keys(err).length) return;
    setBusy(true);
    try {
      const r = await submit({ data: { customer_name: f.name, customer_phone: f.phone, district: f.district, thana: f.thana, address: f.address, product_id: product.id, qty, delivery_zone: zone, payment_method: pay, trx_id: f.trx, note: f.note } });
      setDone({ orderNo: r.orderNo, total: r.total });
    } catch (x) {
      setErrors({ form: x instanceof Error ? x.message : 'অর্ডার নেওয়া যায়নি।' });
    } finally { setBusy(false); }
  }

  const Err = ({ k }: { k: string }) => errors[k] ? <p className="mt-1 text-xs text-destructive">{errors[k]}</p> : null;

  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent lang="bn" className="account-typography max-h-[92vh] overflow-y-auto sm:max-w-lg">
      {done ? <div className="py-6 text-center">
        <CheckCircle2 className="mx-auto size-12 text-primary" aria-hidden="true" />
        <DialogTitle className="mt-3 text-lg">অর্ডার সম্পন্ন হয়েছে</DialogTitle>
        <DialogDescription className="mt-2">অর্ডার নম্বর <b className="text-foreground">{done.orderNo}</b> · মোট {formatBdt(done.total)}</DialogDescription>
        <p className="mt-3 text-sm text-muted-fg">আমাদের টিম শীঘ্রই আপনার নম্বরে কল করে অর্ডার কনফার্ম করবে।</p>
        <Button className="mt-5" onClick={() => onOpenChange(false)}>ঠিক আছে</Button>
      </div> : <form onSubmit={onSubmit} noValidate className="space-y-4">
        <DialogHeader><DialogTitle>অর্ডার করুন</DialogTitle><DialogDescription>তথ্য দিন, আমরা ঘরে পৌঁছে দেব।</DialogDescription></DialogHeader>
        <div className="flex items-center gap-3 rounded-lg border border-line p-3">
          {product.image && <img src={product.image} alt="" className="size-14 rounded-md object-cover" />}
          <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{product.name}</p><p className="text-xs text-muted-fg">{formatBdt(product.sale_price_bdt)}</p></div>
          <div className="flex items-center rounded-md border border-line">
            <button type="button" aria-label="কমান" className="p-2" onClick={() => setQty(Math.max(1, qty - 1))}><Minus className="size-3" /></button>
            <span className="w-6 text-center text-sm">{qty}</span>
            <button type="button" aria-label="বাড়ান" className="p-2" onClick={() => setQty(Math.min(10, qty + 1))}><Plus className="size-3" /></button>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div><input className={input} placeholder="আপনার নাম" value={f.name} onChange={set('name')} aria-invalid={!!errors.name} /><Err k="name" /></div>
          <div><input className={input} inputMode="tel" placeholder="মোবাইল নম্বর (01XXXXXXXXX)" value={f.phone} onChange={set('phone')} aria-invalid={!!errors.phone} /><Err k="phone" /></div>
          <div><input className={input} placeholder="জেলা" value={f.district} onChange={set('district')} aria-invalid={!!errors.district} /><Err k="district" /></div>
          <div><input className={input} placeholder="থানা" value={f.thana} onChange={set('thana')} aria-invalid={!!errors.thana} /><Err k="thana" /></div>
        </div>
        <div><textarea className={input} rows={2} placeholder="পূর্ণ ঠিকানা (বাসা, রোড, এলাকা)" value={f.address} onChange={set('address')} aria-invalid={!!errors.address} /><Err k="address" /></div>
        <fieldset><legend className="mb-2 text-sm font-medium">ডেলিভারি এলাকা</legend><div className="grid grid-cols-2 gap-2">
          {(['inside_dhaka', 'outside_dhaka'] as const).map(z => <button type="button" key={z} onClick={() => setZone(z)} className={`rounded-md border px-3 py-2 text-left text-sm ${zone === z ? 'border-primary bg-primary/10' : 'border-line'}`}>{z === 'inside_dhaka' ? 'ঢাকার ভিতরে' : 'ঢাকার বাইরে'}<span className="block text-xs text-muted-fg">{formatBdt(DELIVERY_CHARGE_BDT[z])}</span></button>)}
        </div></fieldset>
        <fieldset><legend className="mb-2 text-sm font-medium">পেমেন্ট</legend><div className="grid grid-cols-3 gap-2">
          {PAY.map(m => <button type="button" key={m.id} onClick={() => setPay(m.id)} className={`rounded-md border px-2 py-2 text-xs ${pay === m.id ? 'border-primary bg-primary/10' : 'border-line'}`}>{m.label}</button>)}
        </div>
          {pay !== 'cod' && <div className="mt-3 space-y-2 rounded-md bg-muted p-3 text-xs text-muted-fg"><p>{RECEIVE} নম্বরে {formatBdt(total)} Send Money করে Transaction ID দিন।</p><input className={input} placeholder="Transaction ID" value={f.trx} onChange={set('trx')} aria-invalid={!!errors.trx} /><Err k="trx" /></div>}
        </fieldset>
        <input className={input} placeholder="নোট (ঐচ্ছিক)" value={f.note} onChange={set('note')} />
        <div className="space-y-1 border-t border-line pt-3 text-sm">
          <div className="flex justify-between text-muted-fg"><span>পণ্যের দাম</span><span>{formatBdt(subtotal)}</span></div>
          <div className="flex justify-between text-muted-fg"><span>ডেলিভারি চার্জ</span><span>{formatBdt(DELIVERY_CHARGE_BDT[zone])}</span></div>
          <div className="flex justify-between font-semibold"><span>মোট</span><span>{formatBdt(total)}</span></div>
        </div>
        {errors.form && <p className="text-sm text-destructive">{errors.form}</p>}
        <Button type="submit" className="w-full" disabled={busy}>{busy && <Loader2 className="animate-spin" />}অর্ডার কনফার্ম করুন</Button>
      </form>}
    </DialogContent>
  </Dialog>;
}
