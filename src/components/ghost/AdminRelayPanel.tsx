import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Copy, KeyRound, RefreshCw, Smartphone, ShieldX, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createRelayCode, relayOverview, relayTransactions, setRelayStatus } from "@/lib/relay.functions";

export function AdminRelayPanel() {
  const load = useServerFn(relayOverview);
  const create = useServerFn(createRelayCode);
  const update = useServerFn(setRelayStatus);
  const loadTx = useServerFn(relayTransactions);
  const [txs, setTxs] = useState<Awaited<ReturnType<typeof relayTransactions>>>([]);
  const [devices, setDevices] = useState<Awaited<ReturnType<typeof relayOverview>>>([]);
  const [pair, setPair] = useState<{ code: string; expires_at: string } | null>(null);
  const [now, setNow] = useState(Date.now());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [confirmRevoke, setConfirmRevoke] = useState<string | null>(null);

  async function refresh() { setDevices(await load()); setTxs(await loadTx()); }
  async function action(fn: () => Promise<void>) {
    setBusy(true); setError("");
    try { await fn(); } catch (e) { setError(e instanceof Error ? e.message : "Something went wrong."); }
    finally { setBusy(false); }
  }
  useEffect(() => {
    let active = true;
    const fetchDevices = () => { load().then((rows) => { if (active) setDevices(rows); }); loadTx().then((rows) => { if (active) setTxs(rows); }).catch(() => { if (active) setError("Could not load relay devices."); }); };
    fetchDevices();
    const poll = setInterval(fetchDevices, 15_000);
    const clock = setInterval(() => setNow(Date.now()), 1000);
    return () => { active = false; clearInterval(poll); clearInterval(clock); };
  }, [load, loadTx]);
  const remaining = pair ? Math.max(0, Math.ceil((Date.parse(pair.expires_at) - now) / 1000)) : 0;
  const minutes = `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")}`;

  return <section className="space-y-6 min-w-0">
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="text-2xl font-semibold text-foreground">Payment Relay <span className="text-sm text-muted-foreground">· Testing</span></h2></div>
      <Button variant="outline" size="icon" title="Refresh devices" aria-label="Refresh devices" disabled={busy} onClick={() => void action(refresh)}><RefreshCw size={16}/></Button>
    </header>
    <p className="text-sm text-muted-foreground">শুধু পরীক্ষামূলক ফোন সংযোগ। স্বয়ংক্রিয় পেমেন্ট যাচাই ও লাইসেন্স চালু নয়।</p>
    <div className="border-y border-border py-6 space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <Button disabled={busy} onClick={() => void action(async () => { setPair(await create()); setCopied(false); await refresh(); })}><KeyRound size={16}/> Create pairing code</Button>
        {pair && <div className="flex flex-wrap items-center gap-3">
          <output aria-label="Pairing code" className="font-mono text-2xl text-foreground tracking-widest">{remaining > 0 ? pair.code : "Expired"}</output>
          <Button variant="outline" size="icon" title={copied ? "Copied" : "Copy pairing code"} aria-label="Copy pairing code" disabled={!remaining} onClick={() => void action(async () => { await navigator.clipboard.writeText(pair.code); setCopied(true); })}><Copy size={16}/></Button>
          <span className="text-sm text-muted-foreground" role="status">{copied ? "Copied · " : ""}{remaining > 0 ? `${minutes} remaining` : "Create a new code"}</span>
        </div>}
      </div>
      <dl className="text-sm space-y-2 text-muted-foreground">
        <div><dt className="inline font-medium text-foreground">Server URL: </dt><dd className="inline break-all">https://ghostae.com</dd></div>
        <div><dt className="inline font-medium text-foreground">Pairing: </dt><dd className="inline break-all">/api/public/relay/v1/pair</dd></div>
      </dl>
      <p className="text-sm text-muted-foreground">মোবাইলের Pairing Device-এ কোড দিন। কোড একবার ব্যবহারযোগ্য; মেয়াদ ১০ মিনিট।</p>
      <p className="text-sm text-muted-foreground">ghostae.com-এর সংযোগ ব্যবহার করতে নতুন সংস্করণ প্রকাশ প্রয়োজন; ফোনের সফল সংযোগ এখনো যাচাই হয়নি।</p>
    </div>
    {error && <p role="alert" className="text-destructive">{error}</p>}
    <h3 className="font-semibold text-foreground">Paired devices</h3>
    {devices.length === 0 ? <div className="py-8 text-muted-foreground flex items-center gap-3"><Smartphone size={22}/> No paired devices</div> :
      <div className="divide-y divide-border">{devices.map((device) => <article key={device.id} className="py-4 flex flex-wrap justify-between items-center gap-4">
        <div className="min-w-0 space-y-1"><h4 className="text-foreground font-medium">{device.device_name}</h4>
          <p className="text-sm text-muted-foreground">{device.status} · Android {device.android_version ?? "—"} · App {device.app_version ?? "—"}</p>
          <p className="text-xs text-muted-foreground break-all">{device.device_uuid}</p>
          <p className="text-xs text-muted-foreground">Last seen: {device.last_seen_at ? new Date(device.last_seen_at).toLocaleString() : "—"}</p>
        </div>
        {device.status !== "REVOKED" && <div className="flex flex-wrap gap-2">
          <Button variant="outline" disabled={busy} onClick={() => void action(async () => { await update({ data: { id: device.id, status: device.status === "ACTIVE" ? "DISABLED" : "ACTIVE" } }); await refresh(); })}>{device.status === "ACTIVE" ? <Pause size={16}/> : <Play size={16}/>} {device.status === "ACTIVE" ? "Disable" : "Enable"}</Button>
          <Button variant="destructive" disabled={busy} onClick={() => setConfirmRevoke(device.id)}><ShieldX size={16}/> Revoke</Button>
          {confirmRevoke === device.id && <div className="w-full space-x-2"><span className="text-sm text-muted-foreground">Permanently revoke?</span><Button variant="destructive" disabled={busy} onClick={() => void action(async () => { await update({ data: { id: device.id, status: "REVOKED" } }); setConfirmRevoke(null); await refresh(); })}>Confirm revoke</Button><Button variant="outline" onClick={() => setConfirmRevoke(null)}>Cancel</Button></div>}
        </div>}
      </article>)}</div>}
    <h3 className="font-semibold text-foreground">প্রাপ্ত লেনদেন</h3>
    {txs.length === 0 ? <p className="py-4 text-sm text-muted-foreground">এখনো কোনো লেনদেন আসেনি</p> :
      <div className="divide-y divide-border">{txs.map((t) => <div key={t.id} className="py-3 flex flex-wrap justify-between gap-3 text-sm">
        <div className="min-w-0"><p className="font-mono text-foreground break-all">{t.trx_id}</p><p className="text-muted-foreground">{t.provider} · ৳{t.amount} · {t.sender ?? "—"} · {new Date(t.created_at).toLocaleString()}</p></div>
        <span className={t.match_status === "matched" ? "text-primary font-medium" : t.match_status === "amount_mismatch" ? "text-destructive font-medium" : "text-muted-foreground"}>{t.match_status === "matched" ? "Relay matched" : t.match_status === "amount_mismatch" ? "Amount mismatch" : "Unmatched"}</span>
      </div>)}</div>}
    <p className="text-xs text-muted-foreground">না মিললে বা টাকা কম-বেশি হলে অর্ডার অপেক্ষায় থাকে; Orders থেকে নিজে approve করুন।</p>
  </section>;
}