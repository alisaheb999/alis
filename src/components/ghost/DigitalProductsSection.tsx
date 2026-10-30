import { Link } from '@tanstack/react-router';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { DIGITAL_SHOWCASE } from '@/lib/digital-products';
import { getDigitalPrices } from '@/lib/digital-prices.functions';
import { DigitalProductGrid } from './DigitalProductGrid';
import { listLiveProducts } from '@/lib/shopbot.functions';

/** `surface` lets pages with their own background (home) opt out of the default section panel colour. */
export function DigitalProductsSection({ surface }: { surface?: 'light' } = {}) {
  const { data: prices } = useQuery({ queryKey: ['digital-prices'], queryFn: () => getDigitalPrices(), staleTime: 300_000 });
  const { data: live } = useQuery({ queryKey: ['live-products'], queryFn: () => listLiveProducts(), staleTime: 300_000 });
  return <section data-surface={surface} lang="bn" className="account-typography mx-auto max-w-5xl border-t border-line py-8 text-foreground sm:py-10" aria-labelledby="digital-products-title">
    <div className="mb-5 flex items-center justify-between gap-3"><h2 id="digital-products-title" className="section-mark text-lg font-semibold sm:text-xl">Digital Tools and AI</h2><Button asChild variant="ghost" size="sm" className="-mr-2 shrink-0 text-primary"><Link to="/digital">সব পণ্য<ArrowRight /></Link></Button></div>
    <DigitalProductGrid products={DIGITAL_SHOWCASE} prices={prices} live={live} limit={6} />
  </section>;
}
