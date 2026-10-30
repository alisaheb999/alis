import { createFileRoute, Link, useNavigate, useRouter } from '@tanstack/react-router';
import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { ArrowLeft } from 'lucide-react';
import { GhostShell } from '@/components/ghost/Shell';
import { Button } from '@/components/ui/button';
import { GearGrid } from '@/components/ghost/GearGrid';
import { getGearProducts } from '@/lib/gear.functions';
import { sortGear, type GearSort } from '@/lib/gear-rules';

const gearQuery = queryOptions({ queryKey: ['gear-products'], queryFn: () => getGearProducts(), staleTime: 300_000 });
const search = z.object({ cat: z.string().max(80).optional(), sort: z.enum(['featured', 'newest', 'price-asc', 'price-desc']).optional() });

export const Route = createFileRoute('/gear/')({
  validateSearch: (s) => search.parse(s),
  loader: ({ context }) => context.queryClient.ensureQueryData(gearQuery),
  head: () => ({ meta: [
    { title: 'Ghostae Gear — ক্রিয়েটরদের জন্য দরকারি অ্যাকসেসরিজ' },
    { name: 'description', content: 'ভিডিও এডিটর ও মোশন ডিজাইনারদের জন্য USB-C হাব, কার্ড রিডার, ল্যাপটপ স্ট্যান্ডসহ দরকারি গিয়ার।' },
    { property: 'og:title', content: 'Ghostae Gear — Useful gear for creators' },
    { property: 'og:description', content: 'ভিডিও এডিটর ও মোশন ডিজাইনারদের জন্য দরকারি ফিজিক্যাল অ্যাকসেসরিজ।' },
    { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' },
  ] }),
  component: GearStore,
  pendingComponent: () => <GhostShell><p className="mx-auto max-w-5xl py-12 text-muted-fg">লোড হচ্ছে…</p></GhostShell>,
  errorComponent: () => { const r = useRouter(); return <GhostShell><div className="mx-auto max-w-5xl py-12 text-foreground"><p>স্টোর লোড করা যায়নি।</p><Button className="mt-3" onClick={() => r.invalidate()}>আবার চেষ্টা করুন</Button></div></GhostShell>; },
});

function GearStore() {
  const { data } = useSuspenseQuery(gearQuery);
  const { cat, sort = 'featured' } = Route.useSearch();
  const navigate = useNavigate({ from: '/gear/' });
  const cats = Array.from(new Map(data.filter(p => p.category).map(p => [p.category!.slug, p.category!.name])).entries());
  const shown = sortGear(cat ? data.filter(p => p.category?.slug === cat) : data, sort as GearSort);
  const chip = (active: boolean) => `rounded-md border px-3 py-1.5 text-xs ${active ? 'border-primary text-primary' : 'border-line text-muted-fg hover:text-foreground'}`;
  return <GhostShell>
    <section lang="bn" className="account-typography mx-auto max-w-5xl py-8 text-foreground">
      <Button asChild variant="ghost" size="sm" className="-ml-2 mb-4"><Link to="/products"><ArrowLeft />Products</Link></Button>
      <h1 className="text-2xl font-semibold">Ghostae Gear</h1>
      <p className="mt-1 text-sm text-muted-fg">ভিডিও এডিটর ও ক্রিয়েটরদের জন্য দরকারি অ্যাকসেসরিজ · {data.length}টি পণ্য</p>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <button className={chip(!cat)} onClick={() => navigate({ search: (p) => ({ ...p, cat: undefined }) })}>সব</button>
          {cats.map(([slug, name]) => <button key={slug} className={chip(cat === slug)} onClick={() => navigate({ search: (p) => ({ ...p, cat: slug }) })}>{name}</button>)}
        </div>
        <select aria-label="Sort" value={sort} onChange={(e) => navigate({ search: (p) => ({ ...p, sort: e.target.value as GearSort }) })} className="rounded-md border border-line bg-surface px-2 py-1.5 text-xs text-foreground">
          <option value="featured">Featured</option><option value="newest">Newest</option><option value="price-asc">Price: low to high</option><option value="price-desc">Price: high to low</option>
        </select>
      </div>
      <div className="mt-5">{shown.length ? <GearGrid products={shown} /> : <p className="rounded-lg border border-line p-8 text-center text-sm text-muted-fg">এখনো কোনো পণ্য নেই। শীঘ্রই যোগ হবে।</p>}</div>
    </section>
  </GhostShell>;
}
