import { useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { adminCanboso, adminSaveCanboso, adminSyncCanboso } from '@/lib/canboso.functions';
export function AdminCanbosoPanel() {
  const list = useServerFn(adminCanboso); const sync = useServerFn(adminSyncCanboso);
  const [rows, setRows] = useState<Awaited<ReturnType<typeof adminCanboso>>>([]); const [message, setMessage] = useState('');
  const load = async () => { try { setRows(await list()); } catch { setMessage('Catalogue unavailable'); } };
  return <section className="space-y-3 border-t border-line pt-5"><div className="flex items-center justify-between"><h3 className="font-semibold">Canboso</h3><div className="flex gap-2"><Button variant="outline" size="sm" onClick={load}>Load</Button><Button size="sm" onClick={async () => { try { const r = await sync(); setMessage(`${r.count} products synced`); await load(); } catch { setMessage('Sync unavailable'); } }}>Sync</Button></div></div><p className="text-sm text-muted-fg">{message}</p>{rows.map(row => <CanbosoRow key={row.id} row={row} />)}</section>;
}
function CanbosoRow({ row }: { row: Awaited<ReturnType<typeof adminCanboso>>[number] }) {
  const save = useServerFn(adminSaveCanboso); const [price, setPrice] = useState(String(row.selling_price_bdt ?? '')); const [visible, setVisible] = useState(row.visible); const [message, setMessage] = useState('');
  return <details className="rounded-lg border border-line p-3 text-sm"><summary>{row.name} · {row.cost} {row.currency}</summary><p className="my-3 whitespace-pre-wrap">{row.description}</p><div className="flex flex-wrap items-center gap-3"><Input aria-label="Selling price BDT" className="w-32" value={price} onChange={e => setPrice(e.target.value)} /><label><input type="checkbox" checked={visible} onChange={e => setVisible(e.target.checked)} /> Published</label><Button size="sm" onClick={async () => { try { await save({ data: { id: row.id, price: Number(price), visible } }); setMessage('Saved'); } catch { setMessage('Valid price required'); } }}>Save</Button><span>{message}</span></div></details>;
}