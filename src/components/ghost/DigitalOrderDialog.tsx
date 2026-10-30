import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useServerFn } from '@tanstack/react-start';
import { ArrowLeft, Check, Copy, Loader2, MessageCircle, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { createDigitalOrder, digitalOrderSchema } from '@/lib/digital-orders.functions';
import { checkDigitalCheckout, getChatgptExtensionDownload, readDigitalDelivery } from '@/lib/digital-checkout.functions';
import { formatBdt } from '@/lib/digital-products';
import brandMark from '@/assets/ghostae-mark.png.asset.json';
import bkashLogo from '@/assets/pay/bkash.png.asset.json';
import nagadLogo from '@/assets/pay/nagad.png.asset.json';
import rocketLogo from '@/assets/pay/rocket.png.asset.json';
import upayLogo from '@/assets/pay/upay.png.asset.json';

const RECEIVE = '01949085128';
const WHATSAPP = '8801345407572';
// Same payment template as the premium Text checkout (BuyDialog).
const METHODS = [
  { id: 'bkash', label: 'bKash', name: 'বিকাশ', logo: bkashLogo.url, ussd: '*247#' },
  { id: 'nagad', label: 'Nagad', name: 'নগদ', logo: nagadLogo.url, ussd: '*167#' },
  { id: 'rocket', label: 'Rocket', name: 'রকেট', logo: rocketLogo.url, ussd: '*322#' },
  { id: 'upay', label: 'Upay', name: 'উপায়', logo: upayLogo.url, ussd: '*268#' },
] as const;
type Method = (typeof METHODS)[number]['id'];
type Field = 'name' | 'email' | 'whatsapp' | 'sender' | 'trxId';

export function DigitalOrderDialog({ open, onOpenChange, slug, name, price }: { open: boolean; onOpenChange: (o: boolean) => void; slug: string; name: string; price: number }) {
  const submit = useServerFn(createDigitalOrder);
  const checkStock = useServerFn(checkDigitalCheckout);
  const readDelivery = useServerFn(readDigitalDelivery);
  const getZip = useServerFn(getChatgptExtensionDownload);
  const [confirmedPrice, setConfirmedPrice] = useState(price);
  const [delivery, setDelivery] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<'info' | 'pay'>('info');
  const [form, setForm] = useState({ name: '', email: '', whatsapp: '', sender: '', trxId: '', method: 'bkash' as Method });
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [busy, setBusy] = useState(false);
  const [fail, setFail] = useState<string | null>(null);
  const [done, setDone] = useState<{ code: string; amount: number } | null>(null);
  const close = () => onOpenChange(false);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onOpenChange(false); };
    document.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; document.removeEventListener('keydown', onKey); };
  }, [open, onOpenChange]);

  const set = (k: keyof typeof form, v: string) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: undefined })); };
  const active = METHODS.find(m => m.id === form.method) ?? METHODS[0];

  const validate = (fields: Field[]) => {
    const parsed = digitalOrderSchema.safeParse({ ...form, slug, expectedAmount: confirmedPrice });
    if (parsed.success) { setErrors({}); return parsed.data; }
    const errs: Partial<Record<Field, string>> = {};
    for (const i of parsed.error.issues) { const k = i.path[0] as Field; if (fields.includes(k)) errs[k] ??= i.message; }
    setErrors(errs);
    return Object.keys(errs).length ? null : undefined;
  };

  const goPay = async () => {
    if (validate(['name', 'email', 'whatsapp']) === null) return;
    setBusy(true); setFail(null);
    try {
      const checked = await checkStock({ data: { slug } });
      if (!checked.price || checked.price <= 0) throw new Error('পণ্যের দাম যাচাই করা যায়নি');
      setConfirmedPrice(checked.price);
      if (checked.price !== confirmedPrice) { setFail(`বর্তমান মূল্য ${formatBdt(checked.price)}। সম্মত হলে আবার এগিয়ে যান।`); return; }
      setStep('pay');
    } catch (err) { setFail(err instanceof Error ? err.message : 'স্টক যাচাই করা যায়নি'); }
    finally { setBusy(false); }
  };

  useEffect(() => {
    if (!done || !open) return;
    let cancelled = false;
    const poll = async () => {
      try { const result = await readDelivery({ data: { code: done.code } }); if (!cancelled && result.payload) setDelivery(result.payload); } catch { /* do not expose private errors */ }
    };
    void poll();
    const timer = window.setInterval(() => { void poll(); }, 15000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [done, open, readDelivery]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setFail(null);
    const data = validate(['name', 'email', 'whatsapp', 'sender', 'trxId']);
    if (!data) return;
    setBusy(true);
    try { setDone(await submit({ data })); }
    catch (err) { setFail(err instanceof Error ? err.message : 'অর্ডার নেওয়া যায়নি'); }
    finally { setBusy(false); }
  };

  const copy = async () => { try { await navigator.clipboard.writeText(RECEIVE); toast.success('নম্বর কপি হয়েছে'); } catch { toast.error('কপি করা যায়নি'); } };
  const wa = done ? `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(`Order ID: ${done.code}\nপণ্য: ${name}\nমূল্য: ${done.amount} ট\nনাম: ${form.name}\nMethod: ${active.label} · TrxID: ${form.trxId}`)}` : '';

  const input = (k: Field, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div className="min-w-0">
      <label htmlFor={`dg-${k}`} className="mb-2 block text-sm text-muted-fg">{label}</label>
      <input id={`dg-${k}`} {...props} value={form[k]} onChange={e => set(k, k === 'trxId' ? e.target.value.toUpperCase() : e.target.value)} aria-invalid={!!errors[k]}
        className={`payment-input h-12 w-full min-w-0 rounded-md border bg-background px-3 text-base outline-none ${errors[k] ? 'border-danger focus:border-danger focus:ring-2 focus:ring-danger/15' : 'border-border focus:border-primary'}`} />
      {errors[k] && <p role="alert" className="mt-1 text-xs text-danger">{errors[k]}</p>}
    </div>
  );

  if (!mounted || !open) return null;
  return createPortal(
    <div lang="bn" className="payment-overlay fixed inset-0 z-[2147483600] flex items-center justify-center overflow-hidden overscroll-contain p-3 sm:p-6" onClick={close}>
      <div role="dialog" aria-modal="true" aria-labelledby="dg-title" onClick={e => e.stopPropagation()} className="payment-dialog relative max-h-[calc(100dvh-1.5rem)] w-full max-w-xl overflow-y-auto overscroll-contain rounded-lg border border-border bg-surface px-4 pb-5 pt-4 text-foreground sm:max-h-[calc(100dvh-3rem)] sm:px-7 sm:pb-7">
        <div className="flex items-center justify-between gap-3">
          <Button type="button" variant="ghost" size="icon" aria-label="পিছনে" className="text-muted-fg" onClick={() => (step === 'pay' && !done ? setStep('info') : close())}><ArrowLeft /></Button>
          <span className="text-sm text-muted-fg">{done ? 'অর্ডার জমা হয়েছে' : step === 'info' ? 'পেমেন্ট মাধ্যম' : 'টাকা পাঠান'}</span>
          <Button type="button" variant="ghost" size="icon" aria-label="বন্ধ করুন" onClick={close} className="text-muted-fg"><X /></Button>
        </div>
        <div className="flex items-center gap-3 border-b border-border py-5">
          <img src={brandMark.url} alt="Ghostae" width={48} height={48} className="payment-logo size-12 rounded-lg object-contain p-1" />
          <div className="min-w-0 flex-1"><h2 id="dg-title" className="text-xl font-medium leading-8">Ghostae</h2><p className="text-xs text-muted-fg">{name} · {formatBdt(confirmedPrice)}</p></div>
        </div>

        {done ? <div className="pb-2 pt-6 text-center">
          <Check className="mx-auto size-10 text-success" />
          <p className="mt-3 text-xs text-muted-fg">Order ID</p>
          <p className="text-2xl font-semibold tracking-wider">{done.code}</p>
          {delivery && <div className="mt-5 text-left"><pre className="whitespace-pre-wrap break-all rounded-md border border-border bg-background p-4 text-sm">{delivery}</pre><Button variant="outline" className="mt-3 w-full" onClick={async () => { try { await navigator.clipboard.writeText(delivery); toast.success('কপি হয়েছে'); } catch { toast.error('কপি করা যায়নি'); } }}><Copy />ডেলিভারি কপি করুন</Button><p className="mt-2 text-xs text-warning">এখনই নিরাপদ স্থানে কপি করুন। ব্রাউজারের তথ্য মুছলে আর দেখা নাও যেতে পারে।</p>{slug === 'chatgpt-plus-renew' && done && <Button className="mt-3 w-full" onClick={async () => { try { const r = await getZip({ data: { code: done.code } }); window.location.href = r.url; } catch (e) { toast.error(e instanceof Error ? e.message : 'ডাউনলোড ব্যর্থ'); } }}>এক্সটেনশন ডাউনলোড করুন</Button>}</div>}
          <p className="mt-2 text-sm leading-7 text-muted-fg">পেমেন্ট মিলে গেলেই অর্ডার স্বয়ংক্রিয়ভাবে সম্পন্ন হবে। কোনো সমস্যা হলে নিচে যোগাযোগ করুন।</p>
          <Button asChild className="mt-4 h-12 w-full bg-primary-hover text-media-foreground hover:bg-primary"><a href={wa} target="_blank" rel="noopener noreferrer"><MessageCircle />WhatsApp-এ যোগাযোগ করুন</a></Button>
        </div> : step === 'info' ? <div className="pt-5">
          <h3 className="mb-5 flex h-14 items-center justify-center rounded-md bg-primary-hover text-lg font-light text-media-foreground">মোবাইল ব্যাংকিং</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">{input('name', 'আপনার নাম', { autoComplete: 'name', maxLength: 80, placeholder: 'পুরো নাম' })}</div>
            {input('email', 'Email', { type: 'email', autoComplete: 'email', maxLength: 200, placeholder: 'you@example.com' })}
            {input('whatsapp', 'WhatsApp নম্বর', { inputMode: 'tel', maxLength: 20, placeholder: '01XXXXXXXXX' })}
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3" role="group" aria-label="পেমেন্ট মাধ্যম নির্বাচন">
            {METHODS.map(m => <Button key={m.id} type="button" variant="outline" aria-label={m.name} aria-pressed={form.method === m.id} onClick={() => set('method', m.id)} className={`payment-method relative flex h-28 w-full flex-col gap-1 rounded-lg border-2 p-3 sm:h-32 ${form.method === m.id ? 'border-primary ring-2 ring-primary/15' : 'border-border'}`}>
              <img alt={m.label} src={m.logo} width={120} height={56} className="h-14 w-full object-contain" />
              {form.method === m.id && <Check className="payment-method-check absolute right-2 top-2" />}
            </Button>)}
          </div>
          {fail && <p role="alert" className="mt-3 text-sm text-danger">{fail}</p>}
          <Button type="button" disabled={busy} onClick={goPay} className="mt-6 h-14 w-full bg-primary-hover px-2 text-base font-normal text-media-foreground hover:bg-primary">{busy ? <Loader2 className="animate-spin" /> : null}{busy ? 'দাম ও স্টক যাচাই হচ্ছে…' : `পেমেন্ট সম্পূর্ণ করুন · ${formatBdt(confirmedPrice)}`}</Button>
        </div> : <form onSubmit={onSubmit} noValidate className="pt-5">
          <div className="grid grid-cols-[56px_minmax(0,1fr)_auto] items-center gap-2 border-b border-border pb-5 sm:grid-cols-[80px_minmax(0,1fr)_auto] sm:gap-4">
            <img alt={active.label} src={active.logo} width={80} height={48} className="payment-logo h-12 w-full rounded-md object-contain p-1" />
            <div className="min-w-0 text-center"><p className="text-xs text-muted-fg">প্রাপক নম্বর</p>
              <Button type="button" variant="ghost" onClick={copy} aria-label="প্রাপক নম্বর কপি করুন" className="h-9 gap-1 px-0 font-sans text-base font-semibold text-foreground sm:text-xl">{RECEIVE}<Copy className="size-3.5" /></Button></div>
            <div className="text-right"><p className="text-xs text-muted-fg">পরিমাণ</p><p className="whitespace-nowrap text-lg font-medium leading-9 sm:text-xl">{formatBdt(confirmedPrice)}</p></div>
          </div>
          <div className="payment-instructions mt-5 rounded-lg px-3 py-4 sm:px-5">
            <h3 className="mb-2 text-base font-normal">পেমেন্টের নির্দেশনা</h3>
            <ol className="divide-y divide-media-foreground/15">
              {[`${active.name} অ্যাপ খুলুন / ${active.ussd}`, 'Send Money বেছে নিন', `${RECEIVE} নম্বরে টাকা পাঠান`, `পরিমাণ দিন: ${formatBdt(confirmedPrice)}`, 'ট্রান্সজেকশন আইডি কপি করুন'].map((t, i) => <li key={i} className="flex min-h-11 items-center gap-3 py-2">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-media-foreground/30 text-xs">{i + 1}</span><span className="text-sm font-normal leading-6">{t}</span></li>)}
            </ol>
          </div>
          <div className="mt-6 grid gap-3">
            {input('sender', 'যে নম্বর থেকে টাকা পাঠিয়েছেন', { inputMode: 'tel', maxLength: 20, placeholder: '01XXXXXXXXX' })}
            {input('trxId', 'ট্রান্সজেকশন আইডি দিন', { autoComplete: 'off', maxLength: 40, placeholder: 'ট্রান্সজেকশন আইডি' })}
          </div>
          {fail && <p role="alert" className="mt-3 text-sm text-danger">{fail}</p>}
          <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto] gap-2">
            <Button type="submit" disabled={busy} className="h-12 bg-primary-hover px-2 text-sm font-normal text-media-foreground hover:bg-primary">{busy ? <Loader2 className="animate-spin" /> : <Check />}{busy ? 'অর্ডার পাঠানো হচ্ছে…' : 'ট্রান্সজেকশন যাচাই করুন'}</Button>
            <Button asChild variant="outline" className="h-12 border-border bg-surface px-3 font-normal text-foreground"><a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noreferrer" aria-label="পেমেন্ট সহায়তা"><MessageCircle /><span className="text-sm">সহায়তা</span></a></Button>
          </div>
        </form>}
      </div>
    </div>,
    document.body,
  );
}
