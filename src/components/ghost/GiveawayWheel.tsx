import { Gift } from 'lucide-react';

export function GiveawayWheel({ labels, rotation, busy }: { labels: string[]; rotation: number; busy: boolean }) {
  const count = Math.max(labels.length, 2);
  const step = 360 / count;
  const point = (angle: number, radius: number) => {
    const radians = (angle - 90) * Math.PI / 180;
    return [200 + radius * Math.cos(radians), 200 + radius * Math.sin(radians)];
  };
  return <div className="giveaway-wheel relative mx-auto aspect-square w-full max-w-[360px]" aria-label="উপহারের স্পিনার" aria-busy={busy}>
    <svg viewBox="0 0 400 400" className="giveaway-wheel-disc h-full w-full" style={{ transform: `rotate(${rotation}deg)` }} aria-hidden="true">
      {labels.map((label, i) => {
        const start = point(i * step, 192);
        const end = point((i + 1) * step, 192);
        const middle = i * step + step / 2;
        const [x, y] = point(middle, 123);
        return <g key={`${label}-${i}`}>
          <path className={`giveaway-sector giveaway-sector-${i % 4}`} d={`M 200 200 L ${start.join(' ')} A 192 192 0 ${step > 180 ? 1 : 0} 1 ${end.join(' ')} Z`} />
          <text x={x} y={y} transform={`rotate(${middle},${x},${y})`} textAnchor="middle" dominantBaseline="middle" className="giveaway-wheel-label">{label.length > 23 ? `${label.slice(0, 21)}…` : label}</text>
        </g>;
      })}
      <circle cx="200" cy="200" r="193" className="giveaway-wheel-rim" />
    </svg>
    <svg viewBox="0 0 28 36" className="giveaway-wheel-pointer absolute left-1/2 top-0 z-10 h-9 w-7 -translate-x-1/2" aria-hidden="true"><path d="M2 2H26L14 33Z" /></svg>
    <div className="absolute left-1/2 top-1/2 grid size-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-line bg-surface text-primary"><Gift className="size-7" /></div>
  </div>;
}