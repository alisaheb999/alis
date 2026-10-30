import { type DigitalProduct } from '@/lib/digital-products';
import { DIGITAL_ART } from '@/lib/digital-art';
import type { DigitalPrice } from '@/lib/digital-prices.functions';
import { CompactCard } from './CompactCard';
import { LiveArt } from './LiveArt';
import type { LiveProduct } from '@/lib/shopbot.functions';
import image from '@/assets/chatgpt-extension-ghost.jpg';
import { CHATGPT_EXTENSION } from '@/lib/chatgpt-extension';

export function DigitalProductGrid({ products, prices, live = [], limit }: { products: DigitalProduct[]; prices?: Record<string, DigitalPrice>; live?: LiveProduct[]; limit?: number }) {
  // Automated supplier items come first. Legacy information remains available as manual details.
  const liveShown = limit === undefined ? live : live.slice(0, Math.max(0, limit - 1));
  const shown = products.filter(p => !live.some(l => l.name.toLowerCase().includes(p.name.toLowerCase()))).slice(0, limit === undefined ? undefined : Math.max(0, limit - 1 - liveShown.length));
  return <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
    <CompactCard to="/digital/live/chatgpt-plus-renew" params={{}} art={<img src={image} alt="" width={1280} height={800} loading="lazy" className="aspect-[16/10] w-full rounded-lg object-cover" />} title={CHATGPT_EXTENSION.name} price={null} />
    {liveShown.map(p => <CompactCard key={`l${p.id}`} to="/digital/live/$id" params={{ id: String(p.id) }}
      art={<LiveArt name={p.name} className="aspect-[16/10] w-full rounded-lg" />}
      title={p.title} price={null} />)}
    {shown.map(product => <CompactCard key={product.slug} to="/digital/$slug" params={{ slug: product.slug }}
      art={<img src={DIGITAL_ART[product.slug]} alt="" width={1264} height={848} loading="lazy" className="aspect-[16/10] w-full rounded-lg object-cover" />}
      title={product.name} price={null} />)}
  </div>;
}
