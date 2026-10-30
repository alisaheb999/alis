import { createFileRoute, Link } from '@tanstack/react-router';
import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { getMyAccount, setMyLicenseEnabled } from '@/lib/account.functions';
import { PRODUCTS } from '@/lib/products-catalog';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { SUPPORT_NUMBER, SUPPORT_URL, UPDATE_GROUP_URL } from '@/lib/site-contact';
import { downloadInvoice } from '@/lib/account-invoice';
import { Copy, Info, RefreshCw, MessageCircle, Users, Home, Download, Package, Loader2, LogOut } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { resolvePurchaseGuide } from '@/lib/purchase-guide';

export const Route = createFileRoute('/_authenticated/dashboard')({
  head: () => ({
    meta: [
      { title: 'Your Products — Ghostae' },
      { name: 'description', content: 'View your Ghostae products, licence keys and active devices.' },
      { property: 'og:title', content: 'Your Products — Ghostae' },
      { property: 'og:description', content: 'View your Ghostae products, licence keys and active devices.' },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary' },
    ],
    links: [
      { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@300;400;500&display=swap' },
    ],
  }),
  component: DashboardPage,
});

type Account = Awaited<ReturnType<typeof getMyAccount>>;
type Lic = Account['licenses'][number];
const productFor = (plan: string) => PRODUCTS.find(x => x.slug === (plan.toLowerCase().includes('text') || plan === 'lifetime' ? 'text' : 'caption'));
const date = (value: string) => new Date(value).toLocaleString('en-GB');
const PurchaseInstallGuide = lazy(() => import('@/components/ghost/PurchaseInstallGuide').then(module => ({ default: module.PurchaseInstallGuide })));
function DashboardPage() {
  const load = useServerFn(getMyAccount);
  const toggle = useServerFn(setMyLicenseEnabled);
  const [data, setData] = useState<Account | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [open, setOpen] = useState<Lic | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);
  const [invoiceBusy, setInvoiceBusy] = useState<string | null>(null);
  const [guideOrderId, setGuideOrderId] = useState<string | null>(null);
  useEffect(() => {
    if (!data?.email) return;
    try {
      const saved = localStorage.getItem('ghostae-purchase-guide');
      if (!saved) return;
      const purchase = JSON.parse(saved) as { orderId?: string; email?: string; product?: string };
      if (purchase.email?.toLowerCase() !== data.email.toLowerCase()) return;
      const guide = resolvePurchaseGuide(data, purchase);
      if (!guide) return;
      setGuideOrderId(guide.orderId);
      localStorage.removeItem('ghostae-purchase-guide');
    } catch { localStorage.removeItem('ghostae-purchase-guide'); }
  }, [data]);
  const refresh = useCallback(async () => {
    setBusy(true); setError('');
    try { setData(await load()); } catch { setError('আপনার পণ্য লোড করা যায়নি। আবার চেষ্টা করুন।'); } finally { setBusy(false); }
  }, [load]);
  useEffect(() => { void refresh(); }, [refresh]);
  const pendingOrders = data?.orders.filter(order => ['pending', 'processing', 'review', 'submitted'].includes(order.status)) ?? [];
  useEffect(() => {
    if (!pendingOrders.length) return;
    const timer = setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      void load().then(setData).catch(() => {});
    }, guideOrderId ? 5_000 : 15_000);
    return () => clearInterval(timer);
  }, [pendingOrders.length, load, guideOrderId]);
  const guideState = data && guideOrderId ? resolvePurchaseGuide(data, { orderId: guideOrderId, email: data.email ?? undefined }) : null;
  const orders = open ? data?.orders.filter(x => x.license_key === open.license_key) ?? [] : [];
  async function copy(key: string) { try { await navigator.clipboard.writeText(key); toast.success('লাইসেন্স কী কপি হয়েছে'); } catch { toast.error('কপি করা যায়নি'); } }
  async function change(license: Lic, enabled: boolean) {
    setToggling(license.license_key);
    try { await toggle({ data: { license_key: license.license_key, enabled } }); await refresh(); } catch { toast.error('পরিবর্তন করা যায়নি'); } finally { setToggling(null); }
  }
  async function invoice(order: Account['orders'][number]) {
    setInvoiceBusy(order.id);
    try { await downloadInvoice(order, productFor(order.plan)?.name ?? order.plan, data?.email ?? null); } catch { toast.error('Invoice ডাউনলোড করা যায়নি'); } finally { setInvoiceBusy(null); }
  }
  return <main className="account-typography min-h-screen bg-background px-4 py-8 text-foreground sm:py-12">
    <div className="mx-auto max-w-2xl">
      <header className="mb-8 flex items-center justify-between gap-3 border-b border-border pb-6">
        <div><Link to="/" className="text-sm font-medium text-primary">GHOSTAE</Link><h1 className="mt-2 text-3xl font-medium">আপনার পণ্য</h1><p className="mt-2 break-all text-sm text-muted-fg">{data?.email ?? 'আপনার অ্যাকাউন্ট'}</p></div>
        <div className="flex shrink-0 gap-1"><Button variant="ghost" size="icon" aria-label="রিফ্রেশ করুন" title="রিফ্রেশ করুন" onClick={() => void refresh()} disabled={busy}><RefreshCw className={busy ? 'animate-spin' : ''} /></Button><Button variant="ghost" size="icon" aria-label="Sign out" title="Sign out" onClick={async () => { await supabase.auth.signOut(); window.location.assign('/auth'); }}><LogOut /></Button></div>
      </header>
      {error && <p role="alert" className="mb-5 text-sm text-danger">{error}</p>}
      {!data && busy && <p role="status" className="py-10 text-center text-muted-fg">লোড হচ্ছে…</p>}
      <section aria-label="আপনার পণ্য" className="space-y-4">
        {data?.licenses.map(license => {
          const product = productFor(license.plan);
          return <article key={license.license_key} className="rounded-lg border border-border bg-surface p-5 sm:p-6">
            <div className="flex items-center gap-4">
              {product?.image ? <img src={product.image} width={56} height={56} alt={product.name} className="size-14 shrink-0 rounded-md object-cover" /> : <Package className="size-10 shrink-0 text-primary" />}
              <div className="min-w-0 flex-1"><h2 className="text-lg font-medium">{product?.name ?? license.plan}</h2><p className="mt-1 text-xs text-muted-fg">{license.plan.includes('text') || license.plan === 'lifetime' ? 'Lifetime' : license.plan.toUpperCase()} · {license.status}</p></div>
              <Button variant="outline" size="icon" aria-label={`${product?.name ?? license.plan} details`} title="Payment details" onClick={() => setOpen(license)}><Info className="size-4" /></Button>
            </div>
            <div className="mt-5 flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2"><code className="min-w-0 flex-1 break-all font-mono text-xs sm:text-sm">{license.license_key}</code><Button variant="ghost" size="icon" aria-label="লাইসেন্স কী কপি করুন" onClick={() => void copy(license.license_key)}><Copy className="size-4" /></Button></div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-fg"><span>ডিভাইস: {license.activation_count}/{license.max_activations} · {license.expires_at && !license.plan.includes('text') && license.plan !== 'lifetime' ? `মেয়াদ: ${new Date(license.expires_at).toLocaleDateString('en-GB')}` : 'Lifetime'}</span>
              {(license.status === 'active' || license.status === 'suspended') && <Switch checked={license.status === 'active'} disabled={toggling === license.license_key} onCheckedChange={enabled => void change(license, enabled)} aria-label="লাইসেন্স চালু/বন্ধ" />}
            </div>
          </article>;
        })}
        {pendingOrders.map(order => {
          const product = productFor(order.plan);
          return <article key={order.id} className="rounded-lg border border-border bg-surface p-5 sm:p-6">
            <div className="flex items-center gap-4">{product?.image ? <img src={product.image} width={56} height={56} alt={product.name} className="size-14 shrink-0 rounded-md object-cover"/> : <Package className="size-10 text-primary"/>}<div><h2 className="text-lg font-medium">{product?.name ?? order.plan}</h2><p className="mt-1 text-xs text-muted-fg">{order.plan.includes('text') || order.plan === 'lifetime' ? 'Lifetime' : order.plan.toUpperCase()} · {order.currency} {order.amount}</p></div></div>
            <div role="status" className="mt-5 flex min-h-12 items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm text-primary"><Loader2 className="size-4 animate-spin motion-reduce:animate-none"/><span className="animate-pulse motion-reduce:animate-none">যাচাই চলছে…</span></div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2"><span className="text-xs text-muted-fg">অর্ডার: {order.invoice_id ?? order.id}</span><Button asChild variant="link" className="h-auto px-0 py-1 text-xs font-normal"><a href={`${SUPPORT_URL}?text=${encodeURIComponent(`Ghostae manual activation support\nOrder: ${order.invoice_id ?? order.id}\nProduct: ${product?.name ?? order.plan}`)}`} target="_blank" rel="noreferrer"><MessageCircle className="size-3.5"/>ম্যানুয়াল অ্যাক্টিভেশন সহায়তা</a></Button></div>
          </article>;
        })}
        {data && data.licenses.length === 0 && pendingOrders.length === 0 && <div className="py-10 text-center"><Package className="mx-auto mb-4 size-10 text-muted-fg" /><p>এখনো কোনো পণ্য নেই।</p><Button asChild variant="outline" className="mt-4"><Link to="/products">View products</Link></Button></div>}
        {data?.orders.filter(order => order.status !== 'paid' && !['pending', 'processing', 'review', 'submitted'].includes(order.status)).map(order => <div key={order.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-border py-4 text-sm"><span>{productFor(order.plan)?.name ?? order.plan} · {order.status}</span><span className="text-muted-fg">{order.currency} {order.amount}</span></div>)}
      </section>
      <section className="mt-10 grid gap-3 sm:grid-cols-2" aria-label="Support">
        <a href={SUPPORT_URL} target="_blank" rel="noreferrer" className="group relative overflow-hidden rounded-xl border border-success/25 bg-gradient-to-br from-success/10 via-surface to-surface p-5 transition hover:-translate-y-0.5 hover:border-success/50 hover:shadow-lg">
          <div className="flex items-center gap-3"><span className="flex size-11 items-center justify-center rounded-full bg-success/15 text-success"><MessageCircle className="size-5" /></span><div><p className="text-xs uppercase tracking-wider text-muted-fg">Helpline · WhatsApp</p><p className="mt-1 text-lg font-medium">{SUPPORT_NUMBER}</p></div></div>
          <p className="mt-4 flex items-center justify-between text-sm text-success">সরাসরি সহায়তা নিন<span className="transition group-hover:translate-x-1">→</span></p>
        </a>
        <a href={UPDATE_GROUP_URL} target="_blank" rel="noreferrer" className="group relative overflow-hidden rounded-xl border border-primary/25 bg-gradient-to-br from-primary/10 via-surface to-surface p-5 transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lg">
          <div className="flex items-center gap-3"><span className="flex size-11 items-center justify-center rounded-full bg-primary/15 text-primary"><Users className="size-5" /></span><div><p className="text-xs uppercase tracking-wider text-muted-fg">Community</p><p className="mt-1 text-lg font-medium">Update group</p></div></div>
          <p className="mt-4 flex items-center justify-between text-sm text-primary">নতুন আপডেট ও টিপস পান<span className="transition group-hover:translate-x-1">→</span></p>
        </a>
      </section>
      <Button asChild variant="outline" className="mt-6 w-full"><Link to="/partner"><Users className="size-4" />টিম পার্টনার ড্যাশবোর্ড</Link></Button>
      <Button asChild variant="ghost" className="mt-6 w-full"><Link to="/"><Home className="size-4" />Go to home</Link></Button>
    </div>
    <Dialog open={Boolean(open)} onOpenChange={value => { if (!value) setOpen(null); }}><DialogContent className="account-typography max-h-[85dvh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-lg bg-surface text-foreground">
      <DialogTitle>{open ? productFor(open.plan)?.name ?? open.plan : 'Payment details'}</DialogTitle><DialogDescription>আপনার পেমেন্টের বিবরণ</DialogDescription>
      {orders.length === 0 && <p className="py-4 text-sm text-muted-fg">এই লাইসেন্সের সঙ্গে কোনো পেমেন্ট রেকর্ড পাওয়া যায়নি। প্রয়োজনে Support-এ যোগাযোগ করুন।</p>}
      {orders.map(order => <div key={order.id} className="border-t border-border pt-4">
        <dl className="divide-y divide-border text-sm">{[['অর্ডার', order.invoice_id ?? order.id], ['পেমেন্টের তারিখ', date(order.paid_at ?? order.created_at)], ['পরিমাণ', `${order.currency} ${order.amount}`], ['মাধ্যম', order.payment_method ?? '—'], ['Transaction ID', order.transaction_id ?? '—'], ['অবস্থা', order.status]].map(([label, value]) => <div key={label} className="flex justify-between gap-4 py-3"><dt className="shrink-0 text-muted-fg">{label}</dt><dd className="min-w-0 break-all text-right">{value}</dd></div>)}</dl>
        {order.status === 'paid' && <Button className="mt-4 h-11 w-full" disabled={invoiceBusy === order.id} onClick={() => void invoice(order)}>{invoiceBusy === order.id ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}Invoice download</Button>}
      </div>)}
    </DialogContent></Dialog>
    {guideState && <Suspense fallback={null}><PurchaseInstallGuide product="Ghostae Text V2" licenseKey={guideState.licenseKey} onClose={() => setGuideOrderId(null)} /></Suspense>}
  </main>;
}
