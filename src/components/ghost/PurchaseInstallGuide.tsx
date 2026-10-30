import { lazy, Suspense, useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Play, CheckCircle2, Download, Copy, Loader2 } from 'lucide-react';
import { TEXT_WINDOWS_DOWNLOAD } from '@/lib/text-downloads';
import { toast } from 'sonner';
import featurePoster from '@/assets/text/full-feature-video.jpg.asset.json';
import textImage from '@/assets/product-text.webp';

const videos = [
  { id: 'XXHps_M6Sis', title: 'ইনস্টলেশন ভিডিও', poster: textImage },
  { id: 'TeGPNolfHgs', title: 'ফুল-ফিচার ভিডিও', poster: featurePoster.url },
];

const TextMacSetupDialog = lazy(() => import('./TextMacSetupDialog'));
export function PurchaseInstallGuide({ product, licenseKey, onClose }: { product: string; licenseKey: string | null; onClose: () => void }) {
  const [playing, setPlaying] = useState<string | null>(null);
  const [macOpen, setMacOpen] = useState(false);
  async function copy() {
    if (!licenseKey) return;
    try { await navigator.clipboard.writeText(licenseKey); toast.success('লাইসেন্স কী কপি হয়েছে'); } catch { toast.error('কপি করা যায়নি'); }
  }
  return <Dialog open onOpenChange={open => { if (!open) onClose(); }}>
    <DialogContent className="account-typography max-h-[90dvh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-lg bg-surface text-foreground">
      <DialogTitle className="pr-5 text-xl font-medium leading-8">{product}</DialogTitle>
      <DialogDescription className="text-sm leading-7">{licenseKey ? 'লাইসেন্স প্রস্তুত। এই কী দিয়ে এক্সটেনশন অ্যাক্টিভ করুন।' : 'আপনার license key verification চলছে। অনুগ্রহ করে software টি download করুন।'}</DialogDescription>
      <div role="status" aria-live="polite" className="flex min-h-14 items-center gap-3 rounded-md border border-border bg-background px-3 py-2">
        {licenseKey ? <><CheckCircle2 className="size-5 shrink-0 text-success" /><code className="min-w-0 flex-1 break-all font-mono text-sm">{licenseKey}</code><Button variant="ghost" size="icon" aria-label="লাইসেন্স কী কপি করুন" onClick={() => void copy()}><Copy className="size-4" /></Button></> : <><Loader2 className="size-5 shrink-0 animate-spin text-primary motion-reduce:animate-none" /><span className="text-sm text-muted-foreground">লাইসেন্স কী যাচাই চলছে…</span></>}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button asChild className="h-12 px-2 text-xs sm:text-sm"><a href={TEXT_WINDOWS_DOWNLOAD}><Download className="size-4 shrink-0" />Windows download</a></Button>
        <Button variant="outline" className="h-12 px-2 text-xs sm:text-sm" onClick={() => setMacOpen(true)}><Download className="size-4 shrink-0" />Mac download</Button>
      </div>
      <p className="text-sm leading-7 text-muted-foreground">সফটওয়্যার ডাউনলোড করে এক্সটেনশনগুলো ইনস্টল করুন। লাইসেন্স কী প্রস্তুত হলে সেটি দিয়ে অ্যাক্টিভ করুন।</p>
      <Button variant="link" className="h-auto w-fit p-0 text-xs" onClick={() => setMacOpen(true)}>সেটআপ দেখুন</Button>
      <details className="border-t border-border pt-3">
      <summary className="cursor-pointer text-sm text-muted-foreground">ইনস্টলেশন ও বিস্তারিত ভিডিও</summary>
      <div className="mt-3 grid gap-5 sm:grid-cols-2">
        {videos.map(video => <div key={video.id}>
          <h3 className="mb-2 text-base font-medium">{video.title}</h3>
          <div className="relative aspect-video overflow-hidden rounded-md border border-border bg-muted">
            {playing === video.id ? <iframe title={video.title} src={`https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&rel=0`} className="absolute inset-0 h-full w-full" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen /> : <>
              <img src={video.poster} width={480} height={270} alt={video.title} className="absolute inset-0 h-full w-full object-cover" />
              <Button size="icon" aria-label={`${video.title} চালান`} className="absolute left-1/2 top-1/2 size-12 -translate-x-1/2 -translate-y-1/2 rounded-full" onClick={() => setPlaying(video.id)}><Play className="size-5" fill="currentColor" /></Button>
            </>}
          </div>
        </div>)}
      </div>
      </details>
      <Button variant="outline" className="mt-2 h-12 font-normal" onClick={onClose}>আমার পণ্য দেখুন</Button>
      {macOpen && <Suspense fallback={null}><TextMacSetupDialog open={macOpen} onOpenChange={setMacOpen} /></Suspense>}
    </DialogContent>
  </Dialog>;
}