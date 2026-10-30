import { Clapperboard, Sparkles, AudioLines, PenTool, Film } from 'lucide-react';
import type { DigitalProduct } from '@/lib/digital-products';

const ICONS = { editing: Clapperboard, writing: Sparkles, voice: AudioLines, design: PenTool, video: Film };

export function DigitalProductIcon({ category }: { category: DigitalProduct['category'] }) {
  const Icon = ICONS[category];
  return <div className="grid size-12 shrink-0 place-items-center rounded-lg border border-line bg-surface-2 text-primary" aria-hidden="true"><Icon className="size-6" strokeWidth={1.5} /></div>;
}