import { createFileRoute, Link } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import { GhostShell } from '@/components/ghost/Shell';
import { Button } from '@/components/ui/button';
import { DigitalProductGrid } from '@/components/ghost/DigitalProductGrid';
import { DIGITAL_PRODUCTS } from '@/lib/digital-products';
import { getDigitalPrices } from '@/lib/digital-prices.functions';
import { listLiveProducts } from '@/lib/shopbot.functions';

export const Route = createFileRoute('/digital/')({
  loader: async () => { const [prices, live] = await Promise.all([getDigitalPrices(), listLiveProducts().catch(() => [])]); return { prices, live }; },
  head: () => ({ meta: [
    { title: 'ডিজিটাল টুলস ও এআই — সব পণ্য | Ghostae' },
    { name: 'description', content: 'Ghostae-এ CapCut, Gemini, Canva, ChatGPT ও অন্যান্য ডিজিটাল পণ্যের প্যাকেজ এবং বর্তমান দাম।' },
    { property: 'og:title', content: 'ডিজিটাল টুলস ও এআই | Ghostae' },
    { property: 'og:description', content: 'সব ডিজিটাল পণ্যের প্যাকেজ ও বর্তমান দাম একসঙ্গে।' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary' },
    { name: 'robots', content: 'noindex, follow' },
  ] }),
  component: DigitalCataloguePage,
});

function DigitalCataloguePage() {
  const { prices, live } = Route.useLoaderData();
  return <GhostShell><section lang="bn" className="account-typography mx-auto max-w-5xl pb-10 pt-4 text-foreground sm:py-10">
    <Button asChild variant="ghost" size="sm" className="-ml-3 mb-6 text-muted-fg"><Link to="/products"><ArrowLeft />সব বিভাগ</Link></Button>
    <h1 className="mb-6 text-2xl font-semibold">ডিজিটাল টুলস ও এআই</h1>
    <DigitalProductGrid products={DIGITAL_PRODUCTS} prices={prices} live={live} />
  </section></GhostShell>;
}