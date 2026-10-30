import { useQuery } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { Ticket } from 'lucide-react';
import { getPublishedCoupons } from '@/lib/public-coupons.functions';
import { findProduct } from '@/lib/products-catalog';

export function PublicCouponBanner({ slug, compact = false }: { slug: string; compact?: boolean }) {
  const read = useServerFn(getPublishedCoupons);
  const { data = [] } = useQuery({ queryKey: ['published-coupon-banners'], queryFn: () => read(), staleTime: 60_000, refetchInterval: 60_000, retry: 1 });
  const product = findProduct(slug);
  const plans = new Set([...(product?.plans ?? []), product?.checkoutPlan ?? '', slug,
    ...(slug === 'text' ? ['text_lifetime', 'lifetime', 'text'] : []),
    ...(slug === 'caption' ? ['light', 'lite', 'basic', 'pro', 'ultra', 'team', 'caption'] : []),
    ...(slug === 'cache' ? ['cache', 'cache_lifetime', 'cache_light'] : [])]);
  const coupons = data.filter(c => !c.plans.length || c.plans.some(p => plans.has(p)));
  if (!coupons.length) return null;
  return <aside aria-label="প্রকাশ্য কুপন" className={compact ? "account-typography flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground" : "account-typography mb-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 border-y border-primary/20 bg-primary/5 px-3 py-2 text-xs text-foreground sm:text-sm"}>
    {coupons.map(c => <span key={c.code} className="inline-flex min-w-0 flex-wrap items-center justify-center gap-1.5">
      <Ticket className="size-3.5 shrink-0 text-primary" aria-hidden="true" />
      <strong className="break-all font-mono font-semibold text-primary">{c.code}</strong> ব্যবহার করুন —
      <span className="font-semibold">{[c.percent_off ? `${c.percent_off.toLocaleString('bn-BD')}%` : '', c.flat_off ? `৳${c.flat_off.toLocaleString('bn-BD')}` : ''].filter(Boolean).join(' + ')} ছাড়</span>
    </span>)}
  </aside>;
}