import { createFileRoute, Link } from '@tanstack/react-router';
import { lazy, Suspense, useState } from 'react';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { GhostShell } from '@/components/ghost/Shell';
import { Button } from '@/components/ui/button';
import { CHATGPT_EXTENSION as product } from '@/lib/chatgpt-extension';
import { getChatgptAvailability } from '@/lib/digital-checkout.functions';
import showcase from '@/assets/chatgpt-extension-showcase.png.asset.json';
import { DigitalReviews } from '@/components/ghost/DigitalReviews';
import { RelatedProducts } from '@/components/ghost/RelatedProducts';
const OrderDialog = lazy(() => import('@/components/ghost/DigitalOrderDialog').then(m => ({ default: m.DigitalOrderDialog })));

export const Route = createFileRoute('/digital/live/chatgpt-plus-renew')({
  loader: () => getChatgptAvailability(),
  head: () => ({ meta: [{ title: 'ChatGPT Extension by Ghostae | Shared Plus' }, { name: 'description', content: 'Shared ChatGPT Plus through a browser extension. 199 BDT for one month, 30-day warranty. Shared usage limits and privacy conditions apply.' }, { property: 'og:title', content: 'ChatGPT Extension by Ghostae' }, { property: 'og:description', content: 'Shared Plus browser extension · 199 BDT/month · 30-day warranty.' }, { property: 'og:type', content: 'product' }, { name: 'twitter:card', content: 'summary_large_image' }] }),
  component: ChatgptPage,
});
function ChatgptPage() {
  const { available } = Route.useLoaderData();
  const [open, setOpen] = useState(false);
  return <GhostShell><div className="mx-auto max-w-5xl py-6 text-foreground sm:py-10">
    <Button asChild variant="ghost" className="mb-6"><Link to="/products"><ArrowLeft />Products</Link></Button>
    <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_280px]">
      <div className="min-w-0"><img src={showcase.url} alt={product.name} width={1280} height={800} className="w-full rounded-lg object-contain" /><h1 className="mt-6 text-2xl font-semibold sm:text-3xl">{product.name}</h1>
        <p className="mt-3 text-sm text-muted-fg">1M Shared Via Extension</p>
        <section lang="bn" className="account-typography mt-6 space-y-4 text-sm leading-7">
          <h2 className="text-lg font-semibold">সুবিধা ও ব্যবহার</h2>
          <p>ব্রাউজার এক্সটেনশনের মাধ্যমে shared ChatGPT Plus ব্যবহার। লেখা, আইডিয়া, কোড, ফাইল বিশ্লেষণ ও ছবি তৈরির সুবিধা অ্যাকাউন্টে বর্তমান উপলভ্যতা ও সীমা অনুযায়ী ব্যবহার করা যায়। এটি আপনার নিজস্ব ব্যক্তিগত Plus subscription নয়।</p>
          <p>একটি অ্যাকাউন্ট সর্বোচ্চ পাঁচজন ব্যবহার করেন। যেকোনো সময় usage limit আসতে পারে; সব model বা সুবিধা সবসময় পাওয়ার নিশ্চয়তা নেই। ওয়েব ব্রাউজারে ব্যবহার করতে হবে।</p>
          <h2 className="text-lg font-semibold">ইনস্টল করার নিয়ম (Chrome / Edge)</h2>
          <ol className="list-decimal space-y-1 pl-5">
            <li>পেমেন্ট যাচাইয়ের পর লাইসেন্স কি কপি করুন ও "এক্সটেনশন ডাউনলোড করুন" চাপুন।</li>
            <li>ডাউনলোড হওয়া ZIP ফাইলটি Extract (Unzip) করুন।</li>
            <li>Chrome-এ <code>chrome://extensions</code> (Edge-এ <code>edge://extensions</code>) খুলুন।</li>
            <li>উপরে ডানদিকে <strong>Developer mode</strong> চালু করুন।</li>
            <li><strong>Load unpacked</strong> চেপে extract করা ফোল্ডারটি নির্বাচন করুন।</li>
            <li>টুলবারে Ghostae আইকনে ক্লিক করে লাইসেন্স কি বসান, তারপর "ChatGPT খুলুন" চাপুন।</li>
          </ol>
          <h2 className="text-lg font-semibold">গোপনীয়তা ও শর্ত</h2>
          <p>আমাদের দেওয়া তথ্য অনুযায়ী এক্সটেনশনে ব্যবহারকারীদের চ্যাট আলাদা দেখানো হয়। তবে একই অ্যাকাউন্ট shared হওয়ায় সম্পূর্ণ গোপনীয়তা নিশ্চিত নয়—ব্যক্তিগত, আর্থিক বা সংবেদনশীল তথ্য ব্যবহার করবেন না।</p>
          <p>যাচাইকৃত পেমেন্টের পর একটি লাইসেন্স কি ডেলিভারি হবে। এখনই নিরাপদ স্থানে কপি করুন; এই ব্রাউজারের তথ্য মুছলে অর্ডার দেখার অনুমতি হারাতে পারেন।</p>
          <h2 className="text-lg font-semibold">প্রশ্ন ও উত্তর</h2>
          <p><strong>নিজের ChatGPT অ্যাকাউন্ট পাবো?</strong><br />না, এটি shared Plus access-এর এক্সটেনশন লাইসেন্স।</p>
          <p><strong>লিমিট আসলে কী হবে?</strong><br />অ্যাকাউন্টের সীমা পুনরায় চালু হওয়া পর্যন্ত অপেক্ষা করতে হতে পারে।</p>
          <p><strong>অফিসিয়াল OpenAI পণ্য?</strong><br />না। Ghostae-এর shared-access পণ্য; OpenAI-এর অংশীদারিত্বের দাবি নয়।</p>
        </section>
      </div>
      <aside className="h-fit border-t border-line pt-5 md:border-t-0 md:pt-0"><p className="text-3xl font-semibold">199 ট</p><p className="mt-2 text-sm text-muted-fg">1 month</p><p className="mt-5 flex items-center gap-2 rounded-md bg-success/10 px-3 py-2 text-sm text-success"><ShieldCheck className="size-4" />30-day warranty</p><Button disabled={!available} className="mt-5 h-12 w-full" onClick={() => setOpen(true)}>{available ? 'Buy Now' : 'Unavailable'}</Button>
      </aside>
    </div>
    <DigitalReviews slug={product.slug} />
    <RelatedProducts currentSlug={product.slug} />
    {open && <Suspense fallback={null}><OrderDialog open={open} onOpenChange={setOpen} slug={product.slug} name={product.name} price={product.priceBdt} /></Suspense>}
  </div></GhostShell>;
}