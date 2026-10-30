import { createFileRoute, Link, notFound } from '@tanstack/react-router';
import { ArrowLeft, Check } from 'lucide-react';
import { lazy, Suspense, useState } from 'react';
import { GhostShell } from '@/components/ghost/Shell';
import { RelatedProducts } from '@/components/ghost/RelatedProducts';
import { LiveArt } from '@/components/ghost/LiveArt';
import { Button } from '@/components/ui/button';
import { formatBdt } from '@/lib/digital-products';
import { getLiveProduct } from '@/lib/shopbot.functions';
import { DigitalReviews } from '@/components/ghost/DigitalReviews';
const DigitalOrderDialog = lazy(() => import('@/components/ghost/DigitalOrderDialog').then(m => ({ default: m.DigitalOrderDialog })));

export const Route = createFileRoute('/digital/live/$id')({
  loader: async ({ params }) => {
    const id = Number(params.id);
    if (!Number.isInteger(id) || id <= 0) throw notFound();
    const p = await getLiveProduct({ data: { id } });
    if (!p) throw notFound();
    return p;
  },
  head: ({ loaderData }) => {
    const title = `${loaderData?.title ?? 'ডিজিটাল পণ্য'} | Ghostae`;
    const description = (loaderData?.description ?? 'Ghostae ডিজিটাল পণ্য').replace(/\s+/g, ' ').slice(0, 155);
    return { meta: [{ title }, { name: 'description', content: description }, { property: 'og:title', content: title }, { property: 'og:description', content: description }, { property: 'og:type', content: 'product' }, { name: 'twitter:card', content: 'summary' }] };
  },
  component: LivePage,
  notFoundComponent: () => <GhostShell><section className="mx-auto max-w-5xl py-12 text-foreground"><h1 className="text-xl font-semibold">পণ্যটি পাওয়া যায়নি</h1><Button asChild variant="link"><Link to="/digital">সব ডিজিটাল পণ্য</Link></Button></section></GhostShell>,
});

function LivePage() {
  const p = Route.useLoaderData();
  const [open, setOpen] = useState(false);
  const lines = p.description.split(/\r?\n/).map(l => l.replace(/^[\s\-•✅✨📌🎁💳🎉🛠️⚡️💝\[\]+]+/u, '').trim()).filter(Boolean);
  const price = p.inStock ? p.priceBdt : null;
  return <GhostShell><div lang="bn" className="account-typography mx-auto max-w-5xl pb-10 pt-4 text-foreground sm:py-10">
    <Button asChild variant="ghost" size="sm" className="mb-7 -ml-3 text-muted-fg"><Link to="/digital"><ArrowLeft />সব ডিজিটাল পণ্য</Link></Button>
    <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_300px]">
      <div className="min-w-0">
        <LiveArt name={p.name} className="aspect-[16/9] w-full rounded-xl" />
        <h1 className="mt-6 text-xl font-semibold sm:text-3xl">{p.title}</h1>
        <section aria-label="বিস্তারিত" className="mt-6 border-t border-line pt-5">
          <h2 className="text-lg font-semibold">যা যা পাবেন</h2>
          <ul className="mt-4 space-y-2.5">{lines.map((l, i) => <li key={i} className="flex gap-3 text-sm leading-6"><Check className="mt-1 size-4 shrink-0" aria-hidden="true" /><span className="min-w-0 break-words">{l}</span></li>)}</ul>
        </section>
      </div>
      <aside className="h-fit rounded-lg border border-line p-5" aria-label="মূল্য">
        <p className="text-xs text-muted-fg">মূল্য</p>
        <p className="mt-2 text-3xl font-semibold">{p.priceBdt ? formatBdt(p.priceBdt) : '—'}</p>
        {!p.inStock && <p className="mt-2 text-xs text-muted-fg">এখন পাওয়া যাচ্ছে না</p>}
        {price ? <Button className="mt-5 h-11 w-full bg-primary-hover text-media-foreground shadow-none hover:bg-primary" onClick={() => setOpen(true)}>অর্ডার করুন</Button> : null}
        <p className="mt-4 text-xs leading-5 text-muted-fg">যাচাইকৃত পেমেন্টের পর সরবরাহকারী থেকে স্বয়ংক্রিয় ডেলিভারি। সরবরাহকারীর সমস্যা হলে অর্ডার সমাধানের অপেক্ষায় থাকবে।</p>
        {open && price ? <Suspense fallback={null}><DigitalOrderDialog open={open} onOpenChange={setOpen} slug={`live-${p.id}`} name={p.title} price={price} /></Suspense> : null}
      </aside>
    </div>
    <section className="mt-8 border-t border-line pt-5 text-sm leading-7"><h2 className="text-lg font-semibold">ডেলিভারি, ওয়ারেন্টি ও প্রশ্নোত্তর</h2><p className="mt-3">প্যাকেজের মেয়াদ, অ্যাক্সেস ও ওয়ারেন্টি উপরের সরবরাহকারীর বিবরণ অনুযায়ী। বিবরণে ওয়ারেন্টি না থাকলে অতিরিক্ত ওয়ারেন্টির নিশ্চয়তা নেই।</p><details className="mt-3"><summary>কীভাবে ডেলিভারি পাবো?</summary><p>পেমেন্ট যাচাইয়ের পর এই ব্রাউজারে অর্ডারের স্ক্রিনে অ্যাক্সেস তথ্য দেখবেন। নিরাপদ স্থানে কপি করুন; ব্রাউজারের তথ্য মুছলে দেখার অনুমতি হারাতে পারেন।</p></details><details className="mt-3"><summary>পেমেন্টের পরে সরবরাহকারী ব্যর্থ হলে?</summary><p>অর্ডার ডেলিভারি হয়েছে বলা হবে না। Order ID দিয়ে সহায়তায় যোগাযোগ করুন; স্টক বা wallet-এর সমস্যা সমাধান করতে হবে।</p></details></section>
    <DigitalReviews slug={`live-${p.id}`} />
    <p className="mt-10 border-t border-line pt-5 text-xs leading-6 text-muted-fg">ব্র্যান্ডের নাম সংশ্লিষ্ট প্রতিষ্ঠানের; Ghostae-এর অফিসিয়াল অংশীদারিত্বের দাবি নয়।</p>
    <RelatedProducts currentSlug={`live-${p.id}`} />
  </div></GhostShell>;
}
