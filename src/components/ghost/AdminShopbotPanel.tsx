import { useCallback, useEffect, useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { adminListShopbot, adminSyncShopbot, adminUpdateShopbot, adminShopbotWallet } from '@/lib/shopbot.functions';

type Row = Awaited<ReturnType<typeof adminListShopbot>>[number];

export function AdminShopbotPanel() {
  const list = useServerFn(adminListShopbot);
  const sync = useServerFn(adminSyncShopbot);
  const walletFn = useServerFn(adminShopbotWallet);
  const [wallet, setWallet] = useState<Awaited<ReturnType<typeof adminShopbotWallet>> | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const load = useCallback(() => list().then(setRows).catch(e => setMsg(String(e?.message ?? e))), [list]);
  useEffect(() => { load(); }, [load]);
  const doSync = async () => { setBusy(true); setMsg(null); try { const r = await sync(); setMsg(`${r.count}টি পণ্য আপডেট হয়েছে`); await load(); } catch (e: any) { setMsg(e?.message ?? 'Sync failed'); } setBusy(false); };

  return <div className="space-y-3">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div><h3 className="text-base font-bold">Shopbot পণ্য</h3></div>
      <Button size="sm" onClick={doSync} disabled={busy}>{busy ? 'আপডেট হচ্ছে…' : 'এখনই Sync করুন'}</Button>
    </div>
    {msg && <p className="text-sm text-muted-fg">{msg}</p>}
    <div className="flex flex-wrap items-center justify-between gap-2 border-y border-line py-3 text-sm"><span>Shopbot wallet · {wallet?.available ? `$${wallet.balance}` : wallet?.error ?? 'Not checked'}</span><Button variant="outline" size="sm" onClick={async () => { try { setWallet(await walletFn()); } catch { setMsg('Wallet unavailable'); } }}>Check balance</Button></div>
    {rows.map(r => <ShopbotRow key={r.id} row={r} onSaved={load} />)}
  </div>;
}

function ShopbotRow({ row, onSaved }: { row: Row; onSaved: () => void }) {
  const save = useServerFn(adminUpdateShopbot);
  const [title, setTitle] = useState(row.title_bn ?? '');
  const [desc, setDesc] = useState(row.description_bn ?? '');
  const [price, setPrice] = useState(row.price_override_bdt ? String(row.price_override_bdt) : '');
  const [visible, setVisible] = useState(row.visible);
  const [state, setState] = useState('');
  const submit = async () => {
    setState('…');
    try { await save({ data: { id: row.id, title_bn: title || null, description_bn: desc || null, price_override_bdt: price ? Number(price) : null, visible } }); setState('সেভ হয়েছে'); onSaved(); }
    catch (e: any) { setState(e?.message ?? 'Error'); }
  };
  return <details className="rounded-lg border border-line p-3 text-sm">
    <summary className="flex cursor-pointer flex-wrap justify-between gap-2"><b>#{row.id} {row.title_bn || row.name}</b>
      <span className="text-xs text-muted-fg">${Number(row.usd_price)} → {row.price_override_bdt ?? row.autoPriceBdt} ট · স্টক {row.stock_count}{row.visible ? '' : ' · লুকানো'}</span></summary>
    <div className="mt-3 grid gap-2">
      <p className="text-xs text-muted-fg">{row.category_name} · মূল নাম: {row.name}</p>
      <Input placeholder="বাংলা শিরোনাম (খালি = মূল নাম)" value={title} onChange={e => setTitle(e.target.value)} />
      <textarea className="min-h-24 rounded-md border border-line bg-transparent p-2 text-sm" rows={5} placeholder="বাংলা বিবরণ, প্রতি লাইনে একটি সুবিধা (খালি = সরবরাহকারীর বিবরণ)" value={desc} onChange={e => setDesc(e.target.value)} />
      <details className="text-xs text-muted-fg"><summary>সরবরাহকারীর বিবরণ</summary><pre className="mt-1 whitespace-pre-wrap">{row.description}</pre></details>
      <div className="flex flex-wrap items-center gap-3">
        <Input className="w-44" inputMode="numeric" placeholder={`দাম ওভাররাইড (${row.autoPriceBdt ?? '—'})`} value={price} onChange={e => setPrice(e.target.value.replace(/\D/g, ''))} />
        <label className="flex items-center gap-2"><input type="checkbox" checked={visible} onChange={e => setVisible(e.target.checked)} />ওয়েবসাইটে দেখাও</label>
        <Button size="sm" onClick={submit}>Save</Button><span className="text-xs">{state}</span>
      </div>
    </div>
  </details>;
}
