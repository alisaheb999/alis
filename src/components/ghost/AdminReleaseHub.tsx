import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { releasesList, releasePublish, releaseDelete, releaseUpdate } from "@/lib/releases.functions";

const PANELS = [
  { key: "text", name: "Ghostae Text" },
  { key: "caption", name: "Ghostae Caption" },
  { key: "cache", name: "Ghostae Cache" },
  { key: "command", name: "Ghostae Command" },
  { key: "presets", name: "Ghostae Presets" },
  { key: "idea", name: "Ghostae Idea" },
  { key: "one", name: "Ghostae One" },
  { key: "tools", name: "Ghostae Tools" },
];

export function AdminReleaseHub() {
  const list = useServerFn(releasesList);
  const publish = useServerFn(releasePublish);
  const del = useServerFn(releaseDelete);
  const [rows, setRows] = useState<any[]>([]);
  const [key, setKey] = useState("text");
  const [host, setHost] = useState("after-effects");
  const [version, setVersion] = useState("");
  const [link, setLink] = useState("");
  const [busy, setBusy] = useState(false);
  const update = useServerFn(releaseUpdate);
  const [editId, setEditId] = useState<string | null>(null);
  const [eHost, setEHost] = useState("after-effects");
  const [eVer, setEVer] = useState("");
  const [eLink, setELink] = useState("");
  const saveEdit = async () => {
    if (!/^[0-9A-Za-z.\-]{1,20}$/.test(eVer)) return toast.error("Version দিন");
    if (!/^https:\/\/\S+$/i.test(eLink.trim())) return toast.error("লিংক https:// দিয়ে শুরু হতে হবে");
    try {
      await update({ data: { id: editId!, host_app: eHost as any, version: eVer, storage_path: eLink.trim() } });
      toast.success("আপডেট হয়েছে"); setEditId(null); await load();
    } catch (e: any) { toast.error(e?.message ?? "ব্যর্থ"); }
  };

  const load = useCallback(async () => setRows((await list()).releases), [list]);
  useEffect(() => { load().catch(() => toast.error("লোড হয়নি")); }, [load]);

  const submit = async () => {
    const url = link.trim();
    if (!/^[0-9A-Za-z.\-]{1,20}$/.test(version)) return toast.error("Version দিন (যেমন 2.0.0)");
    if (!/^https:\/\/\S+$/i.test(url)) return toast.error("লিংক https:// দিয়ে শুরু হতে হবে");
    const name = PANELS.find((p) => p.key === key)?.name ?? key;
    setBusy(true);
    try {
      await publish({ data: { product_key: key, name, host_app: host, version, cep_folder: `com.ghostae.${key}.${host === "premiere-pro" ? "ppro" : "ae"}`, changelog: "", thumbnail_url: "", is_free: true, storage_path: url } as any });
      toast.success("Release হয়েছে — desktop-এ দেখা যাবে");
      setVersion(""); setLink(""); await load();
    } catch (e: any) { toast.error(e?.message ?? "ব্যর্থ"); } finally { setBusy(false); }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-xl border bg-card p-4 space-y-3">
        <h2 className="font-semibold">নতুন Release</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <select className="h-10 rounded-md border bg-background px-3 text-sm" value={key} onChange={(e) => setKey(e.target.value)}>
            {PANELS.map((p) => <option key={p.key} value={p.key}>{p.name}</option>)}
          </select>
          <select className="h-10 rounded-md border bg-background px-3 text-sm" value={host} onChange={(e) => setHost(e.target.value)}>
            <option value="after-effects">After Effects</option>
            <option value="premiere-pro">Premiere Pro</option>
          </select>
          <Input placeholder="Version (2.0.0)" value={version} onChange={(e) => setVersion(e.target.value)} />
          <Input placeholder="ZIP link (https://...)" value={link} onChange={(e) => setLink(e.target.value)} />
        </div>
        <Button onClick={submit} disabled={busy}>{busy ? "হচ্ছে…" : "Release"}</Button>
      </section>

      <section className="rounded-xl border bg-card p-4 space-y-2">
        <h2 className="font-semibold">সব Release ({rows.length})</h2>
        {rows.length === 0 && <p className="text-sm text-muted-foreground">এখনো কিছু নেই</p>}
        {rows.map((r) => editId === r.id ? (
          <div key={r.id} className="grid gap-2 border-t py-3 text-sm sm:grid-cols-[1fr_1fr_2fr_auto]">
            <select className="h-9 rounded-md border bg-background px-2" value={eHost} onChange={(e) => setEHost(e.target.value)}>
              <option value="after-effects">After Effects</option>
              <option value="premiere-pro">Premiere Pro</option>
            </select>
            <Input value={eVer} onChange={(e) => setEVer(e.target.value)} placeholder="Version" />
            <Input value={eLink} onChange={(e) => setELink(e.target.value)} placeholder="https://..." />
            <div className="flex gap-2">
              <Button size="sm" onClick={saveEdit}>Save</Button>
              <Button size="sm" variant="outline" onClick={() => setEditId(null)}>Cancel</Button>
            </div>
          </div>
        ) : (
          <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 border-t py-3 text-sm">
            <div><b>{r.name}</b> <span className="text-muted-foreground">v{r.version} · {r.host_app ==="premiere-pro" ?"Premiere Pro" :"After Effects"}</span></div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => { setEditId(r.id); setEHost(r.host_app); setEVer(r.version); setELink(/^https:/i.test(r.storage_path ?? "") ? r.storage_path : ""); }}>Edit</Button>
              <Button size="sm" variant="destructive" onClick={() => { if (confirm(`${r.name} v${r.version} মুছবেন?`)) del({ data: { id: r.id } }).then(() => { toast.success("মুছে ফেলা হয়েছে"); load(); }).catch((e) => toast.error(e?.message ?? "ব্যর্থ")); }}>Delete</Button>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
