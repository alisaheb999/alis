import { Link } from '@tanstack/react-router';
import type { ReactNode } from 'react';

// One compact card shape shared by digital product grids: art, one-line name, price.
export function CompactCard({ to, params, art, title, price }: { to: string; params: Record<string, string>; art: ReactNode; title: string; price: string | null }) {
  return <article className="group min-w-0">
    <Link to={to as any} params={params as any} className="block focus-visible:outline-2 focus-visible:outline-primary">
      <div className="overflow-hidden rounded-xl transition duration-300 group-hover:-translate-y-0.5">{art}</div>
      <div className="mt-2 px-0.5">
        <div className="min-w-0">
          <h3 className="truncate text-[13px] font-semibold text-foreground sm:text-[15px]">{title.split(/\s+[—–-]\s+/)[0]}</h3>
        </div>
      </div>
    </Link>
  </article>;
}
