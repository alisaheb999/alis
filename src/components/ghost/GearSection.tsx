import { Link } from '@tanstack/react-router';
import { ArrowRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { getGearProducts } from '@/lib/gear.functions';
import { GearGrid } from './GearGrid';

export function GearSection() {
  const { data } = useQuery({ queryKey: ['gear-products'], queryFn: () => getGearProducts(), staleTime: 300_000 });
  if (!data?.length) return null;
  return <section lang="bn" className="account-typography mx-auto max-w-5xl border-t border-line py-8 text-foreground sm:py-10" aria-labelledby="gear-title">
    <div className="mb-5 flex items-center justify-between gap-3">
      <div><h2 id="gear-title" className="section-mark text-lg font-semibold sm:text-xl">Ghostae Gear</h2><p className="mt-1 text-xs text-muted-fg">Useful gear for creators.</p></div>
      <Button asChild variant="ghost" size="sm" className="-mr-2 shrink-0 text-primary"><Link to="/gear">See More<ArrowRight /></Link></Button>
    </div>
    <GearGrid products={data.slice(0, 5)} />
  </section>;
}
