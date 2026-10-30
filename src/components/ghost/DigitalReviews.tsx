import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { Plus, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { listDigitalReviews, submitDigitalReview } from '@/lib/digital-reviews.functions';

export function DigitalReviews({ slug }: { slug: string }) {
  const submit = useServerFn(submitDigitalReview);
  const { data: reviews = [] } = useQuery({ queryKey: ['digital-reviews', slug], queryFn: () => listDigitalReviews({ data: { slug } }) });
  const [open, setOpen] = useState(false); const [busy, setBusy] = useState(false); const [message, setMessage] = useState('');
  const [form, setForm] = useState({ code: '', name: '', rating: 5, body: '', screenshot: null as string | null });
  return <section lang="bn" className="mt-10 border-t border-line pt-6"><div className="flex items-center justify-between"><h2 className="text-lg font-semibold">ক্রেতাদের রিভিউ</h2><Button variant="ghost" size="icon" aria-label="রিভিউ লিখুন" title="রিভিউ লিখুন" onClick={() => setOpen(!open)}><Plus /></Button></div>
    {reviews.length === 0 && <p className="mt-3 text-sm text-muted-fg">এখনও প্রকাশিত রিভিউ নেই।</p>}
    {reviews.map(r => <article key={r.id} className="border-b border-line py-5"><div className="flex flex-wrap items-center gap-3"><strong className="text-sm">{r.display_name}</strong><span className="text-xs text-success">যাচাইকৃত ক্রেতা</span><span className="text-sm text-warning">{'★'.repeat(r.rating)}</span></div><p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6">{r.body}</p>{r.screenshot && <img src={r.screenshot} alt="ক্রেতার স্ক্রিনশট" loading="lazy" className="mt-3 max-h-64 max-w-full rounded-lg object-contain" />}{r.reply && <p className="mt-3 border-l-2 border-primary pl-3 text-sm leading-6"><b>Ghostae:</b> {r.reply}</p>}</article>)}
    {open && <form className="mt-5 space-y-3" onSubmit={async e => { e.preventDefault(); setBusy(true); setMessage(''); try { await submit({ data: { ...form, slug } }); setMessage('রিভিউ জমা হয়েছে; যাচাইয়ের পর প্রকাশিত হবে।'); setOpen(false); } catch (e) { setMessage(e instanceof Error ? e.message : 'রিভিউ নেওয়া যায়নি'); } finally { setBusy(false); } }}>
      <div className="grid gap-3 sm:grid-cols-2"><Input required aria-label="রিভিউয়ের অর্ডার আইডি" placeholder="Order ID · GD-XXXXXX" value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} /><Input required aria-label="রিভিউয়ের নাম" placeholder="নাম" maxLength={50} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
      <div className="flex gap-1" aria-label="রেটিং">{[1,2,3,4,5].map(n => <Button key={n} type="button" variant="ghost" size="icon" aria-label={`${n} তারকা`} aria-pressed={form.rating === n} onClick={() => setForm({ ...form, rating: n })}><Star className={n <= form.rating ? 'fill-warning text-warning' : 'text-muted-fg'} /></Button>)}</div>
      <textarea required aria-label="রিভিউ" minLength={10} maxLength={2000} value={form.body} placeholder="আপনার অভিজ্ঞতা" onChange={e => setForm({ ...form, body: e.target.value })} className="min-h-28 w-full rounded-md border border-line bg-background p-3 text-sm" />
      <label className="block text-xs text-muted-fg">স্ক্রিনশট (ঐচ্ছিক, সর্বোচ্চ 150 KB)<input type="file" accept="image/png,image/jpeg,image/webp" className="mt-2 block max-w-full" onChange={e => { const file = e.target.files?.[0]; if (!file) { setForm({ ...form, screenshot: null }); return; } if (file.size > 150000 || !['image/png','image/jpeg','image/webp'].includes(file.type)) { setMessage('150 KB-এর মধ্যে PNG, JPEG বা WebP দিন'); return; } const reader = new FileReader(); reader.onload = () => { if (typeof reader.result === 'string') setForm(f => ({ ...f, screenshot: reader.result as string })); }; reader.readAsDataURL(file); }} /></label>
      <Button disabled={busy} type="submit">{busy ? 'জমা হচ্ছে…' : 'রিভিউ জমা দিন'}</Button>
    </form>}{message && <p role="status" className="mt-3 text-sm text-muted-fg">{message}</p>}
  </section>;
}