import { useState } from 'react';
import { GearOrdersAdmin } from './GearOrdersAdmin';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { adminDeleteGear, adminListGear, adminSaveGear, adminSaveGearCategory, adminUploadGearImage } from '@/lib/gear.functions';
import { grossProfit } from '@/lib/gear-rules';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = any;
const lines = (s: string) => s.split('\n').map(x => x.trim()).filter(Boolean);
const num = (s: string) => (s.trim() === '' ? null : Math.max(0, Math.round(Number(s))) || 0);
const empty = { slug: '', name: '', category_id: null, short_description: '', description: '', features: [], specs: [], compatibility: '', box_contents: [], delivery_info: '', warranty_info: '', return_info: '', image_paths: [], related_slugs: [], source_url: null, source_price_bdt: null, procurement_cost_bdt: null, extra_cost_bdt: null, sale_price_bdt: null, compare_price_bdt: null, brand: '', stock_qty: 0, variants: [], stock_status: 'in_stock', status: 'draft', sort_order: 100, preview_urls: [] };

export function AdminGearPanel() {
  const [tab, setTab] = useState<'dashboard' | 'products' | 'orders' | 'customers'>('dashboard');
  const tabs = [['dashboard', 'ড্যাশবোর্ড'], ['products', 'প্রোডাক্টস ও স্টক'], ['orders', 'অর্ডার ও ইনভয়েস'], ['customers', 'গ্রাহকগণ']] as const;
  return <div className="space-y-4"><div className="flex flex-wrap gap-2">{tabs.map(([k, l]) => <Button key={k} size="sm" variant={tab === k ? 'default' : 'outline'} onClick={() => setTab(k)}>{l}</Button>)}</div>
    {tab === 'products' ? <GearProducts /> : <GearOrdersAdmin view={tab} />}</div>;
}

function GearProducts() {
  const qc = useQueryClient();
  const list = useServerFn(adminListGear), save = useServerFn(adminSaveGear), del = useServerFn(adminDeleteGear), upload = useServerFn(adminUploadGearImage), saveCat = useServerFn(adminSaveGearCategory);
  const { data, isLoading, error } = useQuery({ queryKey: ['admin-gear'], queryFn: () => list() });
  const [edit, setEdit] = useState<Row | null>(null);
  const [busy, setBusy] = useState(false);
  const refresh = () => { qc.invalidateQueries({ queryKey: ['admin-gear'] }); qc.invalidateQueries({ queryKey: ['gear-products'] }); };

  if (isLoading) return <p className="text-sm text-muted-fg">লোড হচ্ছে…</p>;
  if (error) return <p className="text-sm text-destructive">{(error as Error).message}</p>;
  const field = 'w-full rounded-md border border-line bg-surface px-2 py-1.5 text-sm text-foreground';

  async function onSave() {
    if (!edit) return;
    setBusy(true);
    try {
      const { preview_urls: _p, id, created_at: _c, updated_at: _u, last_verified_at: _l, ...rest } = edit;
      await save({ data: { ...rest, ...(id ? { id } : {}), source_url: edit.source_url || null } });
      toast.success('সংরক্ষিত হয়েছে'); setEdit(null); refresh();
    } catch (e) { toast.error((e as Error).message); } finally { setBusy(false); }
  }
  async function onUpload(files: FileList | null) {
    if (!files || !edit?.slug) { toast.error('আগে slug দিন'); return; }
    setBusy(true);
    try {
      const paths: string[] = [];
      for (const f of Array.from(files)) {
        const b = new Uint8Array(await f.arrayBuffer());
        let s = ''; for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
        paths.push((await upload({ data: { bytes: btoa(s), slug: edit.slug } })).path);
      }
      setEdit({ ...edit, image_paths: [...edit.image_paths, ...paths] });
      toast.success('ছবি আপলোড হয়েছে — Save চাপুন');
    } catch (e) { toast.error((e as Error).message); } finally { setBusy(false); }
  }

  if (edit) {
    const set = (k: string, v: unknown) => setEdit({ ...edit, [k]: v });
    const profit = grossProfit(edit);
    return <div className="space-y-3 text-foreground">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs">Name<input className={field} value={edit.name} onChange={e => set('name', e.target.value)} /></label>
        <label className="text-xs">Slug<input className={field} value={edit.slug} onChange={e => set('slug', e.target.value.toLowerCase())} /></label>
        <label className="text-xs">Category<select className={field} value={edit.category_id ?? ''} onChange={e => set('category_id', e.target.value || null)}><option value="">—</option>{data!.categories.map((c: Row) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
        <label className="text-xs">Status<select className={field} value={edit.status} onChange={e => set('status', e.target.value)}><option value="draft">Draft</option><option value="published">Published</option><option value="unpublished">Unpublished</option></select></label>
        <label className="text-xs">Stock<select className={field} value={edit.stock_status} onChange={e => set('stock_status', e.target.value)}><option value="in_stock">In stock</option><option value="low_stock">Low</option><option value="out_of_stock">Out</option><option value="preorder">Preorder</option></select></label>
        <label className="text-xs">Sort order<input type="number" className={field} value={edit.sort_order} onChange={e => set('sort_order', Number(e.target.value) || 0)} /></label>
        {(['source_price_bdt', 'procurement_cost_bdt', 'extra_cost_bdt', 'sale_price_bdt', 'compare_price_bdt'] as const).map(k => <label key={k} className="text-xs">{k.replace(/_bdt$/, '').replace(/_/g, ' ')} (৳)<input inputMode="numeric" className={field} value={edit[k] ?? ''} onChange={e => set(k, num(e.target.value))} /></label>)}
        <label className="text-xs">ব্র্যান্ড<input className={field} value={edit.brand ?? ''} onChange={e => set('brand', e.target.value)} /></label>
        <label className="text-xs">স্টক পরিমাণ<input inputMode="numeric" className={field} value={edit.stock_qty ?? 0} onChange={e => set('stock_qty', num(e.target.value) ?? 0)} /></label>
        <label className="text-xs">ভ্যারিয়েন্ট (comma: Black, White)<input className={field} value={(edit.variants ?? []).join(', ')} onChange={e => set('variants', e.target.value.split(',').map((x: string) => x.trim()).filter(Boolean))} /></label>
        <label className="text-xs">Source URL<input className={field} value={edit.source_url ?? ''} onChange={e => set('source_url', e.target.value)} /></label>
      </div>
      <p className="text-xs text-muted-fg">Gross profit: {profit == null ? '—' : `৳${profit}`} {edit.last_verified_at && `· Verified ${new Date(edit.last_verified_at).toLocaleDateString()}`}</p>
      <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={!!edit.mark_verified} onChange={e => set('mark_verified', e.target.checked)} />আজ মূল্য যাচাই করেছি</label>
      <label className="block text-xs">Short description<input className={field} value={edit.short_description} onChange={e => set('short_description', e.target.value)} /></label>
      <label className="block text-xs">Description<textarea rows={4} className={field} value={edit.description} onChange={e => set('description', e.target.value)} /></label>
      <label className="block text-xs">Features (এক লাইনে একটি)<textarea rows={3} className={field} value={edit.features.join('\n')} onChange={e => set('features', lines(e.target.value))} /></label>
      <label className="block text-xs">Specs (Label: Value)<textarea rows={3} className={field} value={edit.specs.map((s: Row) => `${s.label}: ${s.value}`).join('\n')} onChange={e => set('specs', lines(e.target.value).map(l => { const [a, ...b] = l.split(':'); return { label: a.trim(), value: b.join(':').trim() }; }))} /></label>
      <label className="block text-xs">Box contents (এক লাইনে একটি)<textarea rows={2} className={field} value={edit.box_contents.join('\n')} onChange={e => set('box_contents', lines(e.target.value))} /></label>
      {(['compatibility', 'delivery_info', 'warranty_info', 'return_info'] as const).map(k => <label key={k} className="block text-xs">{k.replace(/_/g, ' ')}<input className={field} value={edit[k]} onChange={e => set(k, e.target.value)} /></label>)}
      <label className="block text-xs">Suggested product slugs (comma)<input className={field} value={edit.related_slugs.join(', ')} onChange={e => set('related_slugs', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} /></label>
      <div className="text-xs">Images: {edit.image_paths.length}
        <div className="mt-2 flex flex-wrap gap-2">{edit.image_paths.map((p: string, i: number) => <button key={p} title="Remove" onClick={() => set('image_paths', edit.image_paths.filter((x: string) => x !== p))} className="rounded border border-line px-2 py-1">{edit.preview_urls?.[i] ? <img src={edit.preview_urls[i]} alt="" className="size-12 object-cover" /> : 'new'} ✕</button>)}</div>
        <input type="file" accept="image/webp,image/jpeg,image/png" multiple className="mt-2" onChange={e => onUpload(e.target.files)} />
      </div>
      <div className="flex gap-2"><Button disabled={busy} onClick={onSave}>Save</Button><Button variant="ghost" onClick={() => setEdit(null)}>Cancel</Button></div>
    </div>;
  }

  return <div className="space-y-4 text-foreground">
    <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-lg font-semibold">Ghostae Gear</h2>
      <div className="flex gap-2"><Button variant="outline" size="sm" onClick={async () => { const name = prompt('Category name'); if (!name) return; try { await saveCat({ data: { name, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') } }); refresh(); } catch (e) { toast.error((e as Error).message); } }}>+ Category</Button><Button size="sm" onClick={() => setEdit({ ...empty })}>+ Product</Button></div>
    </div>
    <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left text-xs text-muted-fg"><th className="p-2">Name</th><th className="p-2">Status</th><th className="p-2">Stock</th><th className="p-2">Sale</th><th className="p-2">Profit</th><th className="p-2"></th></tr></thead>
      <tbody>{data!.products.map((r: Row) => <tr key={r.id} className="border-t border-line"><td className="p-2">{r.name}</td><td className="p-2">{r.status}</td><td className={`p-2 ${r.stock_qty <= 5 ? 'text-destructive' : ''}`}>{r.stock_qty}</td><td className="p-2">{r.sale_price_bdt ?? '—'}</td><td className="p-2">{grossProfit(r) ?? '—'}</td>
        <td className="p-2 text-right"><Button size="sm" variant="ghost" onClick={() => setEdit({ ...r })}>Edit</Button><Button size="sm" variant="ghost" onClick={() => { const { id: _i, created_at: _c, updated_at: _u, ...copy } = r; setEdit({ ...copy, slug: `${r.slug}-copy`, name: `${r.name} (copy)`, status: 'draft' }); }}>Copy</Button><Button size="sm" variant="ghost" className="text-destructive" onClick={async () => { if (!confirm('Delete?')) return; await del({ data: { id: r.id } }); refresh(); }}>Delete</Button></td></tr>)}</tbody></table></div>
  </div>;
}
