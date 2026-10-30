import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { Button } from '@/components/ui/button';
import { adminDigitalReviews, moderateDigitalReview } from '@/lib/digital-reviews.functions';
export function AdminDigitalReviews() {
  const { data = [], refetch } = useQuery({ queryKey: ['admin-digital-reviews'], queryFn: () => adminDigitalReviews() });
  return <section className="border-t border-line pt-6"><h3 className="font-semibold">Digital reviews</h3>{!data.length && <p className="mt-3 text-sm text-muted-fg">No reviews</p>}{data.map(r => <ReviewRow key={r.id} row={r} refresh={refetch} />)}</section>;
}
function ReviewRow({ row, refresh }: { row: Awaited<ReturnType<typeof adminDigitalReviews>>[number]; refresh: () => unknown }) {
  const save = useServerFn(moderateDigitalReview); const [reply, setReply] = useState(row.reply ?? ''); const [message, setMessage] = useState('');
  const update = async (approved: boolean) => { try { await save({ data: { id: row.id, approved, reply: reply || null } }); setMessage('Saved'); refresh(); } catch { setMessage('Save failed'); } };
  return <article className="space-y-3 border-b border-line py-4 text-sm"><p><b>{row.display_name}</b> · {row.product_slug} · {row.rating}/5 · {row.approved ? 'Published' : 'Hidden'}</p><p className="whitespace-pre-wrap">{row.body}</p>{row.screenshot && <img src={row.screenshot} alt="Review screenshot" className="max-h-48 max-w-full object-contain" />}<textarea aria-label="Reply" className="w-full rounded-md border border-line bg-background p-3" maxLength={2000} value={reply} onChange={e => setReply(e.target.value)} /><div className="flex gap-2"><Button size="sm" onClick={() => update(true)}>Publish / save reply</Button><Button size="sm" variant="outline" onClick={() => update(false)}>Hide</Button><span>{message}</span></div></article>;
}