import { Link } from '@tanstack/react-router';
import { ArrowUpRight, Package } from 'lucide-react';
import { formatBdt } from '@/lib/digital-products';
import type { GearPublicProduct } from '@/lib/gear-rules';

export function GearGrid({ products }: { products: GearPublicProduct[] }) {
  return <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
    {products.map((p) => <article key={p.slug} className="group min-w-0">
      <Link to="/gear/$slug" params={{ slug: p.slug }} className="flex h-full flex-col rounded-lg border border-line bg-surface p-3 transition-colors hover:border-primary focus-visible:outline-2 focus-visible:outline-primary">
        {p.images[0]
          ? <img src={p.images[0]} alt={p.name} loading="lazy" width={600} height={400} className="mb-4 aspect-[3/2] w-full rounded-md border border-line object-cover" />
          : <div className="mb-4 flex aspect-[3/2] w-full items-center justify-center rounded-md border border-line bg-muted text-muted-fg"><Package className="size-8" aria-hidden="true" /></div>}
        <div className="flex min-w-0 flex-1 items-start justify-between gap-3">
          <div className="min-w-0 flex-1"><h3 className="text-base font-semibold text-foreground">{p.name}</h3><p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-fg">{p.short_description}</p></div>
          <ArrowUpRight className="mt-1 size-4 shrink-0 text-faint group-hover:text-primary" aria-hidden="true" />
        </div>
        <div className="mt-4 flex items-baseline gap-2 border-t border-line pt-3">
          <span className="text-base font-semibold text-foreground">{formatBdt(p.sale_price_bdt)}</span>
          {p.compare_price_bdt && p.compare_price_bdt > p.sale_price_bdt && <s className="text-xs text-muted-fg">{formatBdt(p.compare_price_bdt)}</s>}
        </div>
      </Link>
    </article>)}
  </div>;
}
