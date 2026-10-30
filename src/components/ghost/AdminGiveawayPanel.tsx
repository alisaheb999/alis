import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Plus, Trash2 } from "lucide-react";
import { adminGetGiveaway, adminSaveGiveaway, type GiveawayPrize } from "@/lib/giveaway.functions";

type Form = {
  id: string | null; title: string; active: boolean; spins_per_user: number;
  prizes: GiveawayPrize[]; rules: string; win_message: string; claim_url: string;
};

const input = "w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-foreground";

export function AdminGiveawayPanel() {
  const load = useServerFn(adminGetGiveaway);
  const save = useServerFn(adminSaveGiveaway);
  const [f, setF] = useState<Form | null>(null);
  const [winners, setWinners] = useState<{ email: string | null; prize_label: string; claim_code: string | null; created_at: string }[]>([]);
  const [total, setTotal] = useState(0);
  const [msg, setMsg] = useState("");

  const refresh = () => load().then((d) => {
    const c = d.campaign;
    setF(c ? { id: c.id, title: c.title, active: c.active, spins_per_user: c.spins_per_user, prizes: c.prizes as GiveawayPrize[], rules: c.rules, win_message: c.win_message, claim_url: c.claim_url ?? "" }
      : { id: null, title: "Community Giveaway", active: false, spins_per_user: 3, prizes: [{ label: "উপহার", weight: 5, win: true }, { label: "আবার চেষ্টা করুন", weight: 95, win: false }], rules: "", win_message: "", claim_url: "" });
    setWinners(d.winners); setTotal(d.totalSpins);
  });
  useEffect(() => { refresh(); }, []);

  if (!f) return <p className="text-sm text-faint">লোড হচ্ছে…</p>;
  const set = (p: Partial<Form>) => setF({ ...f, ...p });
  const setPrize = (i: number, p: Partial<GiveawayPrize>) => set({ prizes: f.prizes.map((x, j) => (j === i ? { ...x, ...p } : x)) });
  const totalWeight = f.prizes.reduce((s, p) => s + (p.weight || 0), 0) || 1;

  const submit = async (newCampaign: boolean) => {
    setMsg("");
    try {
      await save({ data: { ...f, newCampaign, claim_url: f.claim_url.trim() || null } });
      setMsg(newCampaign ? "নতুন giveaway তৈরি হয়েছে।" : "সেভ হয়েছে।");
      refresh();
    } catch (e) { setMsg(e instanceof Error ? e.message : "সেভ হয়নি।"); }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-line bg-surface p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">Giveaway</h2>
          <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <input type="checkbox" checked={f.active} onChange={(e) => set({ active: e.target.checked })} /> চালু
          </label>
        </div>
        <label className="block text-xs text-faint">নাম<input className={input} value={f.title} onChange={(e) => set({ title: e.target.value })} /></label>
        <label className="block text-xs text-faint">প্রতি ব্রাউজারে অংশগ্রহণের সুযোগ
          <input type="number" min={1} max={10} className={input} value={f.spins_per_user} onChange={(e) => set({ spins_per_user: Number(e.target.value) })} />
        </label>
        <div>
          <p className="text-xs text-faint">উপহার ও ফলাফল (সম্ভাবনা = ওজন)</p>
          {f.prizes.map((p, i) => (
            <div key={i} className="mt-2 grid grid-cols-[1fr_70px_auto_auto] items-center gap-2">
              <input className={input} value={p.label} onChange={(e) => setPrize(i, { label: e.target.value })} />
              <input type="number" min={0} className={input} value={p.weight} onChange={(e) => setPrize(i, { weight: Number(e.target.value) })} />
              <label className="flex items-center gap-1 text-xs text-foreground"><input type="checkbox" checked={p.win} onChange={(e) => setPrize(i, { win: e.target.checked })} />উপহার · {Math.round((p.weight / totalWeight) * 100)}%</label>
              <button onClick={() => set({ prizes: f.prizes.filter((_, j) => j !== i) })} disabled={f.prizes.length <= 2} className="text-danger disabled:opacity-30"><Trash2 size={16} /></button>
            </div>
          ))}
          {f.prizes.length < 10 && <button onClick={() => set({ prizes: [...f.prizes, { label: "নতুন", weight: 10, win: false }] })} className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary"><Plus size={14} /> ঘর যোগ করুন</button>}
        </div>
        <label className="block text-xs text-faint">নিয়ম<textarea rows={4} className={input} value={f.rules} onChange={(e) => set({ rules: e.target.value })} /></label>
        <label className="block text-xs text-faint">জিতলে যা দেখাবে<textarea rows={2} className={input} value={f.win_message} onChange={(e) => set({ win_message: e.target.value })} /></label>
        <label className="block text-xs text-faint">ক্লেইম লিঙ্ক (খালি = WhatsApp support)<input className={input} value={f.claim_url} onChange={(e) => set({ claim_url: e.target.value })} /></label>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => submit(false)} className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">সেভ</button>
          <button onClick={() => submit(true)} className="rounded-lg border border-line px-4 py-2 text-sm font-semibold text-foreground">নতুন giveaway হিসেবে সেভ</button>
        </div>
        {msg && <p className="text-xs text-faint">{msg}</p>}
      </div>
      <div className="rounded-xl border border-line bg-surface p-4">
        <p className="text-sm font-bold text-foreground">বিজয়ী ({winners.length}) · মোট অংশগ্রহণ {total}</p>
        <div className="mt-2 space-y-1">
          {winners.map((w) => (
            <div key={w.claim_code ?? w.created_at} className="flex justify-between gap-2 text-xs text-foreground">
              <span className="truncate">{w.email}</span><span>{w.prize_label}</span><span className="font-mono">{w.claim_code}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
