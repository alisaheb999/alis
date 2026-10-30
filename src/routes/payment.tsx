import { createFileRoute, Link } from '@tanstack/react-router';
import { lazy, Suspense } from 'react';
import { Copy } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { PurchaseLoading } from '@/components/ghostae/PurchaseLoading';
import { findProduct } from '@/lib/products-catalog';
import type { PaidPlanId } from '@/lib/pricing-catalog';
const BuyDialog = lazy(() => import('@/components/ghostae/BuyDialog').then(m => ({ default: m.BuyDialog })));

export const Route = createFileRoute('/payment')({
  validateSearch: (input: Record<string, unknown>) => ({ product: typeof input.product === 'string' ? input.product.slice(0, 60) : 'text' }),
  head: () => ({ meta: [
    { title: 'Ghostae Payment — পেমেন্ট করুন' },
    { name: 'description', content: 'Pay for your Ghostae product using mobile banking.' },
    { property: 'og:title', content: 'Ghostae Payment — পেমেন্ট করুন' },
    { property: 'og:description', content: 'Complete your Ghostae product payment securely.' },
    { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' },
  ] }),
  component: PaymentPage,
});

function PaymentPage() {
  const { product: slug } = Route.useSearch();
  const product = findProduct(slug);
  const available = product?.status === 'available' && product.plans?.length;
  return <main className="account-typography min-h-screen bg-background px-3 py-5 text-foreground sm:py-8">
    <div className="mx-auto mb-5 flex max-w-xl items-center justify-between gap-3"><Button asChild variant="ghost"><Link to="/products">GHOSTAE</Link></Button><Button variant="outline" size="icon" title="পেমেন্ট লিংক কপি করুন" aria-label="পেমেন্ট লিংক কপি করুন" onClick={async () => { try { await navigator.clipboard.writeText(`${window.location.origin}/payment?product=${encodeURIComponent(slug)}`); toast.success('পেমেন্ট লিংক কপি হয়েছে'); } catch { toast.error('কপি করা যায়নি'); } }}><Copy className="size-4"/></Button></div>
    {available && product ? <Suspense fallback={<PurchaseLoading/>}><BuyDialog product={product} initialPlan={product.checkoutPlan as PaidPlanId} standalone onClose={() => window.location.assign('/products')}/></Suspense> : <div className="mx-auto max-w-xl py-10 text-center"><h1 className="text-xl">এই পণ্যের পেমেন্ট এখন চালু নেই।</h1><Button asChild variant="outline" className="mt-5"><Link to="/products">পণ্য দেখুন</Link></Button></div>}
  </main>;
}