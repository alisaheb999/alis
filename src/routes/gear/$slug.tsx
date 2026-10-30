import { createFileRoute, Link, notFound, useRouter } from '@tanstack/react-router';
import { queryOptions, useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { ArrowLeft, Banknote, Check, Minus, Package, Plus, RotateCcw, ShieldCheck, ShoppingBag, Truck } from 'lucide-react';
import { GhostShell } from '@/components/ghost/Shell';
import { Button } from '@/components/ui/button';
import { GearGrid } from '@/components/ghost/GearGrid';
import { GearCheckoutDialog } from '@/components/ghost/GearCheckoutDialog';
import { getGearProduct, getGearProducts } from '@/lib/gear.functions';
import { GEAR_STOCK_LABEL, suggestGear } from '@/lib/gear-rules';
import { formatBdt } from '@/lib/digital-products';

const productQuery = (slug: string) => queryOptions({ queryKey: ['gear-product', slug], queryFn: () => getGearProduct({ data: { slug } }), staleTime: 300_000 });

export const Route = createFileRoute('/gear/$slug')({
  loader: async ({ params, context }) => {
    const p = await context.queryClient.ensureQueryData(productQuery(params.slug));
    if (!p) throw notFound();
    return p;
  },
  head: ({ loaderData }) => {
    const title = loaderData ? `${loaderData.name} — Ghostae Gear` : 'পণ্যটি পাওয়া যায়নি | Ghostae Gear';
    const description = loaderData?.short_description || 'Ghostae Gear-এর পণ্য।';
    return { meta: [{ title }, { name: 'description', content: description }, { property: 'og:title', content: title }, { property: 'og:description', content: description }, { property: 'og:type', content: 'product' }, { name: 'twitter:card', content: 'summary' }, ...(loaderData ? [] : [{ name: 'robots', content: 'noindex' }])] };
  },
  component: GearDetail,
  notFoundComponent: () => <GhostShell><section className="mx-auto max-w-5xl py-12 text-foreground"><h1 className="text-xl font-semibold">পণ্যটি পাওয়া যায়নি</h1><Button asChild variant="link"><Link to="/gear">Ghostae Gear-এ ফিরুন</Link></Button></section></GhostShell>,
  errorComponent: () => { const r = useRouter(); return <GhostShell><div className="mx-auto max-w-5xl py-12 text-foreground"><p>পণ্যটি লোড করা যায়নি।</p><Button className="mt-3" onClick={() => r.invalidate()}>আবার চেষ্টা করুন</Button></div></GhostShell>; },
});

const TRUST = [
  { icon: Banknote, t: 'ক্যাশ অন ডেলিভারি', d: 'হাতে পেয়ে মূল্য দিন' },
  { icon: Truck, t: 'দ্রুত ডেলিভারি', d: 'ঢাকা ৳60 · বাইরে ৳130' },
  { icon: ShieldCheck, t: 'অরিজিনাল পণ্য', d: 'যাচাই করে পাঠানো হয়' },
  { icon: RotateCcw, t: 'সহজ রিপ্লেসমেন্ট', d: 'পলিসি অনুযায়ী' },
];

function GearDetail() {
  const { slug } = Route.useParams();
  const { data: p } = useSuspenseQuery(productQuery(slug));
  const { data: all } = useQuery({ queryKey: ['gear-products'], queryFn: () => getGearProducts(), staleTime: 300_000 });
  const [img, setImg] = useState(0);
  const [qty, setQty] = useState(1);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('overview');
  if (!p) return null;
  const suggested = all ? suggestGear(all, p, 8) : [];
  const out = p.stock_status === 'out_of_stock';
  const off = p.compare_price_bdt && p.compare_price_bdt > p.sale_price_bdt ? Math.round((1 - p.sale_price_bdt / p.compare_price_bdt) * 100) : 0;
  const tabs = [
    { id: 'overview', label: 'ওভারভিউ', show: !!p.description },
    { id: 'features', label: 'ফিচার', show: p.features.length > 0 },
    { id: 'specs', label: 'স্পেসিফিকেশন', show: p.specs.length > 0 || !!p.compatibility },
    { id: 'box', label: 'বক্সে যা আছে', show: p.box_contents.length > 0 },
    { id: 'policy', label: 'ডেলিভারি ও ওয়ারেন্টি', show: !!(p.delivery_info || p.warranty_info || p.return_info) },
  ].filter(t => t.show);
  const active = tabs.find(t => t.id === tab) ? tab : tabs[0]?.id;
  return <GhostShell>
    <article lang="bn" className="account-typography mx-auto max-w-6xl py-8 pb-28 text-foreground md:pb-8">
      <nav className="mb-4 flex items-center gap-1 text-xs text-muted-fg"><Link to="/gear" className="inline-flex items-center gap-1 hover:text-foreground"><ArrowLeft className="size-3" />Ghostae Gear</Link>{p.category && <><span>/</span><span>{p.category.name}</span></>}</nav>
      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <div className="relative overflow-hidden rounded-xl border border-line bg-muted">
            {off > 0 && <span className="absolute left-3 top-3 z-10 rounded-full bg-destructive px-2 py-0.5 text-xs font-semibold text-destructive-foreground">-{off}%</span>}
            {p.images[img]
              ? <img src={p.images[img]} alt={p.name} className="aspect-square w-full object-cover" />
              : <div className="flex aspect-square w-full items-center justify-center text-muted-fg"><Package className="size-12" aria-hidden="true" /></div>}
          </div>
          {p.images.length > 1 && <div className="mt-3 flex gap-2 overflow-x-auto">{p.images.map((src, i) => <button key={src} onClick={() => setImg(i)} aria-label={`ছবি ${i + 1}`} className={`size-16 shrink-0 overflow-hidden rounded-md border-2 ${i === img ? 'border-primary' : 'border-line'}`}><img src={src} alt="" className="size-full object-cover" /></button>)}</div>}
        </div>
        <div>
          {p.category && <p className="text-xs uppercase tracking-wide text-primary">{p.category.name}</p>}
          <h1 className="mt-1 text-2xl font-semibold md:text-3xl">{p.name}</h1>
          {p.short_description && <p className="mt-2 text-sm leading-6 text-muted-fg">{p.short_description}</p>}
          <div className="mt-5 flex items-baseline gap-3"><span className="text-3xl font-semibold">{formatBdt(p.sale_price_bdt)}</span>{off > 0 && <s className="text-base text-muted-fg">{formatBdt(p.compare_price_bdt!)}</s>}</div>
          <p className={`mt-1 text-xs ${out ? 'text-destructive' : 'text-primary'}`}>● {GEAR_STOCK_LABEL[p.stock_status]}</p>
          {p.features.length > 0 && <ul className="mt-5 space-y-1.5 text-sm">{p.features.slice(0, 4).map(f => <li key={f} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-primary" />{f}</li>)}</ul>}
          <div className="mt-6 flex items-center gap-3">
            <div className="flex items-center rounded-md border border-line">
              <button aria-label="কমান" className="p-3" onClick={() => setQty(Math.max(1, qty - 1))}><Minus className="size-4" /></button>
              <span className="w-8 text-center">{qty}</span>
              <button aria-label="বাড়ান" className="p-3" onClick={() => setQty(Math.min(10, qty + 1))}><Plus className="size-4" /></button>
            </div>
            <Button size="lg" disabled={out} className="hidden flex-1 md:inline-flex" onClick={() => setOpen(true)}><ShoppingBag />{out ? 'স্টক শেষ' : 'এখনই অর্ডার করুন'}</Button>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-2">{TRUST.map(({ icon: I, t, d }) => <div key={t} className="flex gap-2 rounded-lg border border-line p-3"><I className="size-5 shrink-0 text-primary" aria-hidden="true" /><div><p className="text-xs font-medium">{t}</p><p className="text-[11px] text-muted-fg">{d}</p></div></div>)}</div>
        </div>
      </div>
      {tabs.length > 0 && <section className="mt-10 rounded-xl border border-line">
        <div role="tablist" className="flex overflow-x-auto border-b border-line">{tabs.map(t => <button key={t.id} role="tab" aria-selected={active === t.id} onClick={() => setTab(t.id)} className={`shrink-0 border-b-2 px-4 py-3 text-sm ${active === t.id ? 'border-primary text-foreground' : 'border-transparent text-muted-fg'}`}>{t.label}</button>)}</div>
        <div className="p-5 text-sm leading-6 text-muted-fg">
          {active === 'overview' && <p className="whitespace-pre-line">{p.description}</p>}
          {active === 'features' && <ul className="grid gap-2 sm:grid-cols-2">{p.features.map(f => <li key={f} className="flex gap-2"><Check className="mt-1 size-4 shrink-0 text-primary" />{f}</li>)}</ul>}
          {active === 'specs' && <div>{p.specs.length > 0 && <dl className="divide-y divide-line overflow-hidden rounded-lg border border-line">{p.specs.map(s => <div key={s.label} className="grid grid-cols-[40%_1fr] gap-3 px-3 py-2"><dt>{s.label}</dt><dd className="text-foreground">{s.value}</dd></div>)}</dl>}{p.compatibility && <p className="mt-3">Compatibility: {p.compatibility}</p>}</div>}
          {active === 'box' && <ul className="list-disc space-y-1 pl-5">{p.box_contents.map(b => <li key={b}>{b}</li>)}</ul>}
          {active === 'policy' && <div className="space-y-2">{p.delivery_info && <p><b className="text-foreground">ডেলিভারি:</b> {p.delivery_info}</p>}{p.warranty_info && <p><b className="text-foreground">ওয়ারেন্টি:</b> {p.warranty_info}</p>}{p.return_info && <p><b className="text-foreground">রিটার্ন:</b> {p.return_info}</p>}</div>}
        </div>
      </section>}
      {suggested.length > 0 && <section className="mt-10"><h2 className="mb-4 text-lg font-semibold">অনুরূপ গ্যাজেট</h2><GearGrid products={suggested} /></section>}
    </article>
    <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t border-line bg-background/95 p-3 backdrop-blur md:hidden">
      <div className="flex-1"><p className="text-xs text-muted-fg">মোট</p><p className="font-semibold">{formatBdt(p.sale_price_bdt * qty)}</p></div>
      <Button size="lg" disabled={out} onClick={() => setOpen(true)}><ShoppingBag />{out ? 'স্টক শেষ' : 'অর্ডার করুন'}</Button>
    </div>
    {open && <GearCheckoutDialog open={open} onOpenChange={setOpen} initialQty={qty} product={{ id: p.id, name: p.name, sale_price_bdt: p.sale_price_bdt, image: p.images[0] }} />}
  </GhostShell>;
}
