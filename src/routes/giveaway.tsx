import { createFileRoute, Link } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { useEffect, useState } from 'react';
import { Copy, MessageCircle, RotateCw, Check, ArrowRight } from 'lucide-react';
import { GiveawayWheel } from '@/components/ghost/GiveawayWheel';
import { GhostShell } from '../components/ghost/Shell';
import { Button } from '@/components/ui/button';
import { getGiveaway, myGiveawayState, spinGiveaway } from '../lib/giveaway.functions';
import { getFreeResources } from '../lib/free-resources.functions';
import { PRODUCTS } from '../lib/products-catalog';
import { SUPPORT_URL } from '../lib/site-contact';

export const Route = createFileRoute('/giveaway')({
  loader: async () => {
    const [campaign, free] = await Promise.all([getGiveaway(), getFreeResources().catch(() => [])]);
    return { campaign, free };
  },
  head: () => ({ meta: [
    { title: 'Community Giveaway — Ghostae' },
    { name: 'description', content: 'Ghostae কমিউনিটির মাসিক উপহার, অংশগ্রহণের নিয়ম এবং নতুন প্রোডাক্ট।' },
    { property: 'og:title', content: 'Community Giveaway — Ghostae' },
    { property: 'og:description', content: 'Ghostae কমিউনিটির জন্য মাসিক উপহার। লগইন ছাড়াই অংশ নিন।' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: GiveawayPage,
});

type Result = { label: string; win: boolean; code?: string | null };
function GiveawayPage() {
  const { campaign, free } = Route.useLoaderData();
  const stateFn = useServerFn(myGiveawayState);
  const enterFn = useServerFn(spinGiveaway);
  const [state, setState] = useState<Awaited<ReturnType<typeof myGiveawayState>>>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [rotation, setRotation] = useState(0);
  useEffect(() => {
    if (!campaign) return;
    let cancelled = false;
    stateFn().then(s => { if (!cancelled) setState(s); }).catch(() => { if (!cancelled) setError('সংযোগ হয়নি। আবার চেষ্টা করুন।'); });
    return () => { cancelled = true; };
  }, [campaign?.id, stateFn]);
  const enter = async () => {
    if (busy || !state || state.left <= 0) return;
    setBusy(true); setError(''); setCopied(false); setResult(null);
    try {
      const r = await enterFn();
      if (r.error) {
        setError(r.error === 'limit' ? 'এই ক্যাম্পেইনে আপনার সুযোগ শেষ।' : 'এখন অংশগ্রহণ করা যাচ্ছে না।');
      } else {
        const index = Math.max(0, campaign?.slices.indexOf(r.label ?? '') ?? 0);
        const segment = 360 / Math.max(campaign?.slices.length ?? 0, 2);
        const target = 360 - (index + 0.5) * segment;
        setRotation(previous => previous - previous % 360 + 360 * 5 + target);
        if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) await new Promise(resolve => setTimeout(resolve, 3300));
        setResult({ label: r.label ?? '', win: !!r.win, code: r.code });
      }
      setState(await stateFn());
    } catch { setError('সংযোগ হয়নি। আবার চেষ্টা করুন।'); }
    finally { setBusy(false); }
  };
  const win = result?.win ? { prize_label: result.label, claim_code: result.code } : state?.wins[0];
  const code = win?.claim_code;
  const claim = state?.claimUrl || SUPPORT_URL;
  const paid = PRODUCTS.filter(p => p.status === 'available');
  return <GhostShell><div className="community-giveaway mx-auto max-w-5xl">
    <section className="pt-7 text-center sm:pt-9">
      <h1 className="text-2xl font-semibold leading-tight text-foreground">Community Giveaway</h1>
    </section>
    {!campaign ? <section className="py-10 text-center"><h2 className="text-xl font-semibold text-foreground">পরবর্তী উপহার আসছে</h2></section> : <section className="mx-auto max-w-sm px-3 pb-8 pt-6 text-center">
      <GiveawayWheel labels={campaign.slices} rotation={rotation} busy={busy} />
      <div className="mx-auto max-w-xs">
        <Button onClick={enter} disabled={busy || !state || state.left <= 0} className="mt-5 h-12 w-full text-base">
          <RotateCw className={busy ? 'animate-spin' : ''} />{busy ? 'ঘুরছে…' : state?.left === 0 ? 'সুযোগ শেষ' : 'ঘুরান'}
        </Button>
        <p className="mt-3 text-sm text-muted-fg">বাকি {state ? state.left.toLocaleString('bn-BD') : '—'} / {campaign.spins.toLocaleString('bn-BD')}</p>
        {error && <div role="alert" className="mt-4 text-sm text-destructive">{error}{!state && <Button variant="link" onClick={() => stateFn().then(setState).catch(() => setError('সংযোগ হয়নি।'))}>আবার চেষ্টা করুন</Button>}</div>}
        <div aria-live="polite" aria-atomic="true">
          {!busy && win ? <div className="mt-6 border-t border-line pt-5">
            <p className="flex items-center gap-2 text-sm font-medium text-primary"><Check className="size-4" />আপনার উপহার</p>
            <h3 className="mt-2 text-xl font-semibold text-foreground">{win.prize_label}</h3>
            {code && <div className="mt-4 flex items-center gap-2 border border-line bg-surface p-3"><span className="min-w-0 flex-1 break-all font-mono text-xs text-foreground">{code}</span><Button variant="ghost" size="icon" aria-label="উপহারের কোড কপি করুন" title="কোড কপি করুন" onClick={async () => { try { await navigator.clipboard.writeText(code); setCopied(true); } catch { setError('কোড কপি হয়নি।'); } }}>{copied ? <Check /> : <Copy />}</Button></div>}
            <Button asChild variant="outline" className="mt-4 h-11 w-full"><a href={claim} target="_blank" rel="noreferrer"><MessageCircle />উপহার সংগ্রহ করুন</a></Button>
          </div> : !busy && result && <p className="mt-5 border-t border-line pt-5 text-base text-foreground">{result.label}</p>}
        </div>
      </div>
    </section>}
    <section className="border-t border-line py-8">
      <div className="flex items-center justify-between gap-4"><h2 className="text-lg font-semibold text-foreground">ফ্রি প্রোডাক্ট</h2><Button asChild variant="link" size="sm"><Link to="/products">সব প্রোডাক্ট <ArrowRight /></Link></Button></div>
      <div className="mt-4 flex gap-4 overflow-x-auto pb-2">
        {free.length ? free.map(r => <Link key={r.id} to="/products/$slug" params={{ slug: r.slug }} className="w-44 shrink-0 overflow-hidden rounded-lg border border-line bg-surface"><div className="aspect-[4/3] bg-surface-2">{r.image_url && <img src={r.image_url} alt={r.title} loading="lazy" className="h-full w-full object-cover" />}</div><p className="p-3 text-sm font-medium text-foreground">{r.title}</p></Link>) : <p className="text-sm text-muted-fg">শিগগিরই আসছে।</p>}
      </div>
      <h2 className="mt-8 text-lg font-semibold text-foreground">পেইড প্রোডাক্ট</h2>
      <div className="mt-4 flex gap-4 overflow-x-auto pb-2">{paid.map(p => <Link key={p.slug} to="/products/$slug" params={{ slug: p.slug }} className="w-56 shrink-0 overflow-hidden rounded-lg border border-line bg-surface"><div className="aspect-[16/10] bg-surface-2">{p.image && <img src={p.image} alt={p.name} loading="lazy" className="h-full w-full object-contain" />}</div><p className="p-3 text-sm font-medium text-foreground">{p.name} {p.version}</p></Link>)}</div>
    </section>
  </div></GhostShell>;
}
