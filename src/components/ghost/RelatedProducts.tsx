import { Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { ArrowRight, ArrowUpRight, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PRODUCTS } from '@/lib/products-catalog';
import { DIGITAL_PRODUCTS } from '@/lib/digital-products';
import { DIGITAL_ART } from '@/lib/digital-art';
import { getDigitalPrices } from '@/lib/digital-prices.functions';
import { getFreeResources } from '@/lib/free-resources.functions';
import { selectRelatedProducts, type RelatedItem } from '@/lib/related-products';

export function RelatedProducts({ currentSlug }: { currentSlug: string }) {
 const sectionRef = useRef<HTMLElement>(null);
 const [nearby, setNearby] = useState(false);
 useEffect(() => {
  const section = sectionRef.current; if (!section) return;
  const observer = new IntersectionObserver(entries => { if (entries.some(e => e.isIntersecting)) { setNearby(true); observer.disconnect(); } }, { rootMargin: '400px' });
  observer.observe(section); return () => observer.disconnect();
 }, []);
 const { data: resources = [] } = useQuery({ queryKey: ['free-resources'], queryFn: () => getFreeResources(), staleTime: 300_000, enabled: nearby });
 const { data: prices } = useQuery({ queryKey: ['digital-prices'], queryFn: () => getDigitalPrices(), staleTime: 300_000, enabled: nearby });
 const paid: RelatedItem[] = [
  ...PRODUCTS.filter(p => p.status === 'available' && p.plans?.length).map(p => ({ slug: p.slug, title: p.name, image: p.image ?? null, kind: 'extension' as const })),
  ...DIGITAL_PRODUCTS.filter(p => prices?.[p.slug]?.inStock !== false).map(p => ({ slug: p.slug, title: p.name, image: DIGITAL_ART[p.slug] ?? null, kind: 'digital' as const })),
 ];
 const free: RelatedItem[] = resources.filter(p => p.is_published).map(p => ({ slug: p.slug, title: p.title, image: p.image_url, kind: 'free' }));
 const items = selectRelatedProducts(currentSlug, paid, free);
 return <section ref={sectionRef} data-surface lang="bn" aria-label="আরও পছন্দ হতে পারে" className="account-typography mx-auto mt-12 max-w-5xl border-t border-line bg-background py-10 text-foreground sm:mt-16 sm:py-14">
  <div className="mb-6 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
   <h2 className="min-w-0 text-lg font-medium sm:text-2xl">আরও পছন্দ হতে পারে</h2>
   <Button asChild variant="ghost" size="sm" className="shrink-0 text-primary"><Link to="/products">সব পণ্য<ArrowRight className="size-4" /></Link></Button>
  </div>
  <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 sm:gap-x-5">
   {items.map(item => {
    const body = <><div className="relative aspect-[3/2] overflow-hidden rounded-lg border border-line bg-surface-2">
     {item.image ? <img src={item.image} alt={item.title} width={630} height={420} loading="lazy" decoding="async" className={`h-full w-full ${item.kind === 'extension' ? 'object-contain' : 'object-cover'}`} /> : <div className="grid h-full place-items-center text-primary"><Download className="size-7" /></div>}
     <span className={`absolute left-2 top-2 rounded border border-line bg-surface px-2 py-1 text-[10px] font-medium ${item.kind === 'free' ? 'text-success' : 'text-primary'}`}>{item.kind === 'free' ? 'Free' : 'Premium'}</span>
    </div><div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2"><h3 className="min-w-0 text-sm font-medium leading-5 sm:text-base">{item.title}</h3><ArrowUpRight className="mt-0.5 size-4 shrink-0 text-muted-fg transition-colors group-hover:text-primary" /></div></>;
    const className = 'group block min-w-0 rounded-lg focus-visible:outline-2 focus-visible:outline-primary';
    return <article key={item.slug} className="min-w-0">{item.kind === 'digital' ? <Link to="/digital/$slug" params={{ slug: item.slug }} className={className}>{body}</Link> : item.slug === 'text' ? <Link to="/products/text" className={className}>{body}</Link> : <Link to="/products/$slug" params={{ slug: item.slug }} className={className}>{body}</Link>}</article>;
   })}
  </div>
 </section>;
}
