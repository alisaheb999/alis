import { createFileRoute, Link, notFound } from '@tanstack/react-router';
import { ArrowLeft, KeyRound, Package, ShieldCheck, Sparkles } from 'lucide-react';
import { RelatedProducts } from "@/components/ghost/RelatedProducts";
import { GhostShell } from '@/components/ghost/Shell';
import { DIGITAL_ART } from '@/lib/digital-art';

import { Button } from '@/components/ui/button';
import { findDigitalProduct, formatBdt, DIGITAL_DETAILS } from '@/lib/digital-products';
import { getDigitalPrices } from '@/lib/digital-prices.functions';
import { DIGITAL_GUIDES, DIGITAL_HIGHLIGHTS } from '@/lib/digital-guides';
import { Check } from 'lucide-react';
import { SUPPORT_URL } from '@/lib/site-contact';
import { useState } from 'react';

export const Route = createFileRoute('/digital/$slug')({
  loader: async ({ params }) => {
    const product = findDigitalProduct(params.slug);
    if (!product) throw notFound();
    const prices = await getDigitalPrices().catch(() => ({} as Awaited<ReturnType<typeof getDigitalPrices>>));
    return { ...product, live: prices[product.slug] ?? null };
  },
  head: ({ loaderData }) => {
    const title = `${loaderData?.name ?? 'ডিজিটাল পণ্য'} — তথ্য ও শর্ত | Ghostae`;
    const description = loaderData?.description ?? 'Ghostae-এর ডিজিটাল টুলসের তথ্য ও ওয়ারেন্টির শর্ত।';
    return { meta: [{ title }, { name: 'description', content: description }, { property: 'og:title', content: title }, { property: 'og:description', content: description }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }, { name: 'robots', content: 'noindex, follow' }] };
  },
  component: DigitalProductPage,
  notFoundComponent: () => <GhostShell><section className="mx-auto max-w-5xl py-12 text-foreground"><h1 className="text-xl font-semibold">পণ্যটি পাওয়া যায়নি</h1><Button asChild variant="link"><Link to="/products">পণ্যের তালিকায় ফিরুন</Link></Button></section></GhostShell>,
});

function DigitalProductPage() {
  const product = Route.useLoaderData();
  return <GhostShell><div lang="bn" className="account-typography mx-auto max-w-5xl pb-10 pt-4 text-foreground sm:py-10">
    <Button asChild variant="ghost" size="sm" className="mb-7 -ml-3 text-muted-fg"><Link to="/digital"><ArrowLeft />সব ডিজিটাল পণ্য</Link></Button>
    <img src={DIGITAL_ART[product.slug]} alt={`${product.name} প্যাকেজ`} width={1264} height={848} className="aspect-[3/2] w-full rounded-lg border border-line object-cover" />
    <h1 className="mt-6 text-2xl font-semibold sm:text-3xl">{product.name}</h1>
    <p className="mt-2 text-xs text-warning">Manual activation · প্যাকেজ নিশ্চিত করে নিতে হবে</p>
    <Highlights slug={product.slug} />
    <div className="mt-7 grid gap-8 border-t border-line pt-7 md:grid-cols-[minmax(0,1fr)_280px]">
      <div className="min-w-0">
        <dl className="divide-y divide-line text-sm">
          {([['মেয়াদ ও প্ল্যান', 'plan', Package], ['অ্যাক্টিভেশন', 'activation', KeyRound], ['কী কী কাজ', 'uses', Sparkles], ['ওয়ারেন্টি', 'warranty', ShieldCheck]] as const).map(([label, key, Icon]) => (
            <div key={key} className="flex items-start gap-3 py-5 first:pt-0"><Icon className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" /><div><dt className="text-xs text-muted-fg">{label}</dt><dd className="mt-2 leading-6">{key === 'warranty' ? 'এই ম্যানুয়াল প্যাকেজের বর্তমান ওয়ারেন্টি কেনার আগে নিশ্চিত করুন।' : DIGITAL_DETAILS[product.slug]?.[key] ?? 'তথ্য নিশ্চিত করা হয়নি'}</dd></div></div>
          ))}
        </dl>
        <p className="border-t border-line py-4 text-sm leading-6">বর্তমান সরবরাহকারী, অ্যাক্টিভেশন ও ডেলিভারি নিশ্চিত করতে যোগাযোগ করুন। এই তালিকা স্বয়ংক্রিয় ডেলিভারির নিশ্চয়তা নয়।</p>
      </div>
      <aside className="border-t border-line pt-6 md:border-l md:border-t-0 md:pl-7 md:pt-0" aria-label="মূল্য ও স্টক">
        <p className="text-xs text-muted-fg">মূল্য</p><p className="mt-2 text-3xl font-semibold">{product.live?.priceBdt ? formatBdt(product.live.priceBdt) : '—'}</p>
        <Button asChild className="mt-3 h-11 w-full shadow-none"><a href={SUPPORT_URL} target="_blank" rel="noopener noreferrer">প্যাকেজ নিশ্চিত করুন</a></Button>
      </aside>
    </div>
    <GuideTabs slug={product.slug} />
    <p className="mt-10 border-t border-line pt-5 text-xs leading-6 text-muted-fg">{product.name} সংশ্লিষ্ট প্রতিষ্ঠানের ব্র্যান্ড; Ghostae-এর অফিসিয়াল অংশীদারিত্বের দাবি নয়।</p>
    <RelatedProducts currentSlug={product.slug} />
  </div></GhostShell>;
}

const TABS = [['why', 'কেন আমাদেরটা'], ['features', 'কী কী কাজ'], ['steps', 'কীভাবে পাবেন'], ['terms', 'ওয়ারেন্টি ও শর্ত']] as const;
function GuideTabs({ slug }: { slug: string }) {
  const guide = DIGITAL_GUIDES[slug];
  const [tab, setTab] = useState<(typeof TABS)[number][0]>('why');
  if (!guide) return null;
  return <section className="mt-10 border-t border-line pt-7" aria-label="বিস্তারিত তথ্য">
    <div role="tablist" className="flex gap-1 overflow-x-auto border-b border-line">
      {TABS.map(([k, label]) => <Button variant="ghost" key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`-mb-px shrink-0 rounded-none border-b-2 px-3 py-2.5 text-sm ${tab === k ? 'border-primary text-foreground' : 'border-transparent text-muted-fg hover:text-foreground'}`}>{label}</Button>)}
    </div>
    <ol role="tabpanel" className="mt-5 space-y-3 text-sm leading-6">
      {(tab === 'terms' || tab === 'steps' ? ['এটি ম্যানুয়াল প্যাকেজের তথ্য; কেনার আগে বর্তমান মূল্য, অ্যাক্টিভেশন, ওয়ারেন্টি ও ডেলিভারি নিশ্চিত করুন।', 'বর্তমান প্যাকেজ নিশ্চিত না হলে টাকা পাঠাবেন না।'] : guide[tab]).map((t, i) => <li key={i} className="flex gap-3">{tab === 'steps' ? <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-line text-xs">{i + 1}</span> : <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />}<span>{t}</span></li>)}
    </ol>
  </section>;
}

function Highlights({ slug }: { slug: string }) {
  const h = DIGITAL_HIGHLIGHTS[slug];
  if (!h) return null;
  return <section aria-label="প্রধান সুবিধা" className="mt-6 border-t border-line pt-5">
    <h2 className="text-lg font-semibold sm:text-xl">{h.title}</h2>
    <p className="mt-1 text-sm opacity-80">Premium Features ও Benefits</p>
    <ul className="mt-5 grid gap-x-6 gap-y-3 sm:grid-cols-2">
      {h.items.map(([t, d]) => <li key={t} className="flex gap-3"><Check className="mt-0.5 size-4 shrink-0" aria-hidden="true" /><span className="min-w-0 text-sm leading-6"><b className="font-semibold">{t}</b><span className="opacity-85"> — {d}</span></span></li>)}
    </ul>
  </section>;
}
