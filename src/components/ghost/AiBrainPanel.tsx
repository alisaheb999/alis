import { useCallback, useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  adminAiBrainCode,
  adminSaveIdentitySectionCode,
  adminSetIdentityEnabledCode,
  adminSavePromptTemplateCode,
  adminSetPromptTemplateEnabledCode,
  adminImportBrainCode,
  adminBrainChatCode,
} from "@/lib/admin-code.functions";
import { Brain, Layers, Save, Plus, Power, Gauge, ClipboardPaste, BookOpen, Copy, Check, MessagesSquare, Send, Eraser } from "lucide-react";

/** Hand this to ChatGPT / Claude / Gemini, then paste the answer into the importer. */
const META_PROMPT = `You are writing a section of the permanent AI identity ("constitution") for Ghostae Command — an enterprise AI operating system inside Adobe After Effects.

Write it as a markdown document. Rules for the format:
- Every section starts with "## SECTION TITLE"
- Under the title, write the rules as short imperative lines
- Use exact numbers (frames, seconds, px, %, degrees, hex)
- No placeholders, no "as an AI", no meta commentary
- English or Bengali is fine; keep one language per section

Write sections about: <your topic here>`;

type Brain = Awaited<ReturnType<typeof adminAiBrainCode>>;
type Section = Brain["identity"][number];
type Template = Brain["templates"][number];

const card =
  "rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-white/[0.02] shadow-sm dark:shadow-none";
const input =
  "w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500/50";

/**
 * Ghost AI OS control surface.
 * Layer 1 = the permanent AI identity constitution used by every panel.
 * Layer 2 = per-category prompt rules merged on top of the identity.
 */
export function AiBrainPanel({ code }: { code: string }) {
  const load = useServerFn(adminAiBrainCode);
  const saveSection = useServerFn(adminSaveIdentitySectionCode);
  const toggleSection = useServerFn(adminSetIdentityEnabledCode);
  const saveTemplate = useServerFn(adminSavePromptTemplateCode);
  const toggleTemplate = useServerFn(adminSetPromptTemplateEnabledCode);

  const [data, setData] = useState<Brain | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [layer, setLayer] = useState<"identity" | "rules" | "import" | "guide" | "telemetry" | "test">("identity");
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<Section>>({});
  const [tplDraft, setTplDraft] = useState<Partial<Template> | null>(null);
  const runImport = useServerFn(adminImportBrainCode);
  const [importText, setImportText] = useState("");
  const [importTarget, setImportTarget] = useState<"identity" | "rules">("identity");
  const [importCategory, setImportCategory] = useState("motion-graphics");
  const [importKind, setImportKind] = useState<"rule" | "system">("rule");
  const [replaceExisting, setReplaceExisting] = useState(false);
  const [preview, setPreview] = useState<{ slug: string; title: string; chars: number }[] | null>(null);
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  /* --- Brain test chat: runs a real prompt through the live brain --- */
  const brainChat = useServerFn(adminBrainChatCode);
  const [chat, setChat] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatBusy, setChatBusy] = useState(false);
  const [chatMeta, setChatMeta] = useState<string | null>(null);
  const [chatCategory, setChatCategory] = useState("ui-design");
  const [chatModel, setChatModel] = useState("google/gemini-3.6-flash");
  const [useIdentity, setUseIdentity] = useState(true);
  const [useRules, setUseRules] = useState(true);

  const sendChat = async () => {
    const text = chatInput.trim();
    if (!text || chatBusy) return;
    const next = [...chat, { role: "user" as const, content: text }];
    setChat(next);
    setChatInput("");
    setChatBusy(true);
    setChatMeta(null);
    try {
      const res = await brainChat({
        data: { code, category: chatCategory, model: chatModel, useIdentity, useRules, messages: next.slice(-16) },
      });
      setChat([...next, { role: "assistant" as const, content: res.text || "(empty reply)" }]);
      setChatMeta(
        `${res.modelLabel} · ${res.promptTokens} in / ${res.completionTokens} out tokens · ≈${res.credits} credits (≈৳${res.bdt.toFixed(4)} · ১০০০ বার ≈ ৳${(res.bdt * 1000).toFixed(0)}) · ${(res.ms / 1000).toFixed(1)}s · identity ${res.identityChars} ch · rules ${res.ruleChars} ch · ${res.category}`,
      );
    } catch (err) {
      setChat([
        ...next,
        { role: "assistant" as const, content: err instanceof Error ? err.message : "Request failed." },
      ]);
    } finally {
      setChatBusy(false);
    }
  };

  const doImport = async (dryRun: boolean) => {
    setBusy(true);
    setImportMsg(null);
    try {
      const res = await runImport({
        data: {
          code,
          target: importTarget,
          text: importText,
          category: importCategory,
          kind: importKind,
          weight: 100,
          replaceExisting,
          dryRun,
        },
      });
      if (dryRun) {
        setPreview(res.blocks);
        setImportMsg(`${res.blocks.length} টি block পাওয়া গেছে — নিচে দেখে নিন, তারপর Import চাপুন।`);
      } else {
        setPreview(null);
        setImportText("");
        setImportMsg(`${res.imported} টি block সফলভাবে import হয়েছে এবং সব panel-এ live হয়েছে।`);
        await refresh();
      }
    } catch (err) {
      setImportMsg(err instanceof Error ? err.message : "Import ব্যর্থ হয়েছে।");
    } finally {
      setBusy(false);
    }
  };

  const refresh = useCallback(async () => {
    try {
      setError(null);
      setData(await load({ data: { code } }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load the AI brain.");
    }
  }, [load, code]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const sections = data?.identity ?? [];
  const active = useMemo(
    () => sections.find((s) => s.slug === activeSlug) ?? null,
    [sections, activeSlug],
  );

  useEffect(() => {
    if (active) setDraft(active);
  }, [active]);

  const commitSection = async () => {
    if (!draft.slug || !draft.title || !draft.body) return;
    setBusy(true);
    try {
      await saveSection({
        data: {
          code,
          id: (draft.id as string | undefined) || undefined,
          slug: String(draft.slug),
          title: String(draft.title),
          body: String(draft.body),
          ordinal: Number(draft.ordinal ?? 100),
          layer: Number(draft.layer ?? 1),
          enabled: draft.enabled !== false,
          notes: String(draft.notes ?? ""),
        },
      });
      await refresh();
      setActiveSlug(String(draft.slug));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setBusy(false);
    }
  };

  const commitTemplate = async () => {
    if (!tplDraft?.category || !tplDraft?.body) return;
    setBusy(true);
    try {
      await saveTemplate({
        data: {
          code,
          id: (tplDraft.id as string | undefined) || undefined,
          category: String(tplDraft.category),
          kind: (tplDraft.kind === "system" ? "system" : "rule") as "system" | "rule",
          title: String(tplDraft.title ?? ""),
          body: String(tplDraft.body),
          weight: Number(tplDraft.weight ?? 100),
          enabled: tplDraft.enabled !== false,
        },
      });
      setTplDraft(null);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setBusy(false);
    }
  };

  const runs = data?.runs ?? [];
  const avgExpansion = runs.length
    ? Math.round(
        runs.reduce((a, r) => a + Number(r.expanded_length || 0) / Math.max(1, Number(r.raw_length || 1)), 0) /
          runs.length,
      )
    : 0;

  return (
    <div className={`${card} p-0 overflow-hidden`}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/50 p-4 dark:border-white/5 dark:bg-white/[0.02] sm:p-6">
        <div>
          <h3 className="font-bold text-lg flex items-center gap-2 text-slate-900 dark:text-white">
            <Brain size={20} className="text-blue-500" />
            Ghost AI OS
          </h3>
          <p className="text-xs text-slate-500 dark:text-white/40 mt-0.5">
            Layer 1 identity · revision {data?.revision ?? "—"} · live for every installed panel
          </p>
        </div>
        <div className="-mx-1 flex w-full items-center gap-1 overflow-x-auto rounded-lg bg-slate-100 p-1 dark:bg-white/5 sm:w-auto">
          {[
            { id: "identity", label: "Identity", icon: Brain },
            { id: "rules", label: "Category rules", icon: Layers },
            { id: "import", label: "Paste import", icon: ClipboardPaste },
            { id: "guide", label: "গাইড", icon: BookOpen },
            { id: "test", label: "Test chat", icon: MessagesSquare },
            { id: "telemetry", label: "Quality", icon: Gauge },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setLayer(t.id as typeof layer)}
              className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs transition-colors sm:gap-2 sm:px-3 ${
                layer === t.id
                  ? "bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-500 dark:text-white/40"
              }`}
            >
              <t.icon size={14} />
              {t.label}
            </button>
          ))}
        </div>

      </div>

      {error && <p className="px-6 py-3 text-xs text-red-500">{error}</p>}

      {layer === "identity" && (
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr]">
          <div className="border-r border-slate-100 dark:border-white/5 max-h-[560px] overflow-y-auto">
            <button
              onClick={() => {
                setActiveSlug(null);
                setDraft({ slug: "", title: "", body: "", ordinal: 270, layer: 1, enabled: true });
              }}
              className="flex w-full items-center gap-2 px-4 py-3 text-xs text-blue-600 dark:text-blue-400 hover:bg-slate-50 dark:hover:bg-white/5"
            >
              <Plus size={14} /> New section
            </button>
            {sections.map((s) => (
              <div
                key={s.id}
                className={`flex items-center justify-between gap-2 px-4 py-3 border-t border-slate-100 dark:border-white/5 ${
                  activeSlug === s.slug ? "bg-blue-50 dark:bg-white/10" : ""
                }`}
              >
                <button onClick={() => setActiveSlug(s.slug)} className="flex-1 text-left">
                  <p
                    className={`text-sm font-medium ${
                      s.enabled ? "text-slate-900 dark:text-white" : "text-slate-400 dark:text-white/30 line-through"
                    }`}
                  >
                    {s.title}
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-white/30 font-mono">
                    {s.ordinal} · {s.slug}
                  </p>
                </button>
                <button
                  title={s.enabled ? "Disable" : "Enable"}
                  onClick={async () => {
                    await toggleSection({ data: { code, id: s.id, enabled: !s.enabled } });
                    await refresh();
                  }}
                  className={`p-1.5 rounded-md ${
                    s.enabled ? "text-green-500" : "text-slate-300 dark:text-white/20"
                  } hover:bg-slate-100 dark:hover:bg-white/5`}
                >
                  <Power size={14} />
                </button>
              </div>
            ))}
          </div>

          <div className="space-y-3 p-4 sm:p-6">
            <div className="grid grid-cols-2 gap-3">
              <input
                className={input}
                placeholder="slug"
                value={String(draft.slug ?? "")}
                onChange={(e) => setDraft({ ...draft, slug: e.target.value })}
              />
              <input
                className={input}
                placeholder="Title"
                value={String(draft.title ?? "")}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              />
              <input
                className={input}
                type="number"
                placeholder="Order"
                value={Number(draft.ordinal ?? 100)}
                onChange={(e) => setDraft({ ...draft, ordinal: Number(e.target.value) })}
              />
              <input
                className={input}
                placeholder="Why this section exists (internal note)"
                value={String(draft.notes ?? "")}
                onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
              />
            </div>
            <textarea
              className={`${input} min-h-[300px] font-mono text-[12px] leading-relaxed`}
              placeholder="Section body — this text becomes part of the permanent system prompt."
              value={String(draft.body ?? "")}
              onChange={(e) => setDraft({ ...draft, body: e.target.value })}
            />
            <div className="flex items-center justify-between">
              <p className="text-[11px] text-slate-400 dark:text-white/30">
                {String(draft.body ?? "").length} characters · saving bumps the revision and reaches every panel within a minute.
              </p>
              <button
                onClick={commitSection}
                disabled={busy}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-50"
              >
                <Save size={15} />
                {draft.id ? "Save section" : "Create section"}
              </button>
            </div>
          </div>
        </div>
      )}

      {layer === "rules" && (
        <div className="space-y-4 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500 dark:text-white/40">
              Category rules merge on top of the identity for the detected task category.
            </p>
            <button
              onClick={() =>
                setTplDraft({ category: "motion-graphics", kind: "rule", body: "", weight: 100, enabled: true })
              }
              className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400"
            >
              <Plus size={14} /> New rule
            </button>
          </div>

          {tplDraft && (
            <div className="rounded-lg border border-blue-500/30 p-4 space-y-3">
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3">
                <input
                  className={input}
                  placeholder="category"
                  value={String(tplDraft.category ?? "")}
                  onChange={(e) => setTplDraft({ ...tplDraft, category: e.target.value })}
                />
                <select
                  className={input}
                  value={String(tplDraft.kind ?? "rule")}
                  onChange={(e) => setTplDraft({ ...tplDraft, kind: e.target.value })}
                >
                  <option value="rule">rule</option>
                  <option value="system">system</option>
                </select>
                <input
                  className={input}
                  type="number"
                  placeholder="weight"
                  value={Number(tplDraft.weight ?? 100)}
                  onChange={(e) => setTplDraft({ ...tplDraft, weight: Number(e.target.value) })}
                />
              </div>
              <input
                className={input}
                placeholder="Title"
                value={String(tplDraft.title ?? "")}
                onChange={(e) => setTplDraft({ ...tplDraft, title: e.target.value })}
              />
              <textarea
                className={`${input} min-h-[120px] font-mono text-[12px]`}
                placeholder="Rule body"
                value={String(tplDraft.body ?? "")}
                onChange={(e) => setTplDraft({ ...tplDraft, body: e.target.value })}
              />
              <div className="flex gap-2 justify-end">
                <button onClick={() => setTplDraft(null)} className="text-xs text-slate-500 px-3 py-2">
                  Cancel
                </button>
                <button
                  onClick={commitTemplate}
                  disabled={busy}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-4 py-2 rounded-lg disabled:opacity-50"
                >
                  Save rule
                </button>
              </div>
            </div>
          )}

          <div className="space-y-2 max-h-[460px] overflow-y-auto">
            {(data?.templates ?? []).map((t) => (
              <div
                key={t.id}
                className="rounded-lg border border-slate-100 dark:border-white/5 p-3 flex items-start gap-3"
              >
                <div className="flex-1">
                  <p className="text-[11px] font-mono text-slate-400 dark:text-white/30">
                    {t.category} · {t.kind} · w{t.weight}
                  </p>
                  <p
                    className={`text-sm ${
                      t.enabled ? "text-slate-700 dark:text-white/80" : "text-slate-400 dark:text-white/25 line-through"
                    }`}
                  >
                    {t.body}
                  </p>
                </div>
                <button onClick={() => setTplDraft(t)} className="text-xs text-blue-500 px-2 py-1">
                  Edit
                </button>
                <button
                  onClick={async () => {
                    await toggleTemplate({ data: { code, id: t.id, enabled: !t.enabled } });
                    await refresh();
                  }}
                  className={`p-1.5 rounded-md ${t.enabled ? "text-green-500" : "text-slate-300 dark:text-white/20"}`}
                >
                  <Power size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {layer === "import" && (
        <div className="space-y-4 p-4 sm:p-6">
          <div className="rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-500/20 p-4 text-[13px] leading-relaxed text-slate-700 dark:text-white/70 space-y-1">
            <p className="font-semibold text-slate-900 dark:text-white">অন্য AI দিয়ে লিখিয়ে এনে paste করুন</p>
            <p>১. নিচের meta-prompt টা copy করে ChatGPT / Claude / Gemini-তে দিন।</p>
            <p>২. যা লিখে দেবে পুরোটা copy করে নিচের বড় box-এ paste করুন।</p>
            <p>৩. <b>Preview</b> চাপলে কয়টা section হবে দেখাবে, তারপর <b>Import</b> চাপুন।</p>
            <p>ফরম্যাট: প্রতিটা অংশ <code>## TITLE</code> দিয়ে শুরু হবে (heading না থাকলে <code>---</code> দিয়ে আলাদা করলেও চলবে)।</p>
          </div>

          <div className="relative">
            <pre className="rounded-lg bg-slate-900 text-white/80 text-[11px] p-4 pr-24 overflow-x-auto whitespace-pre-wrap">
{META_PROMPT}
            </pre>
            <button
              onClick={() => {
                void navigator.clipboard.writeText(META_PROMPT);
                setCopied(true);
                setTimeout(() => setCopied(false), 1600);
              }}
              className="absolute top-3 right-3 flex items-center gap-1.5 rounded-md bg-white/10 hover:bg-white/20 text-white text-[11px] px-2.5 py-1.5"
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? "Copied" : "Copy prompt"}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
            <select className={input} value={importTarget} onChange={(e) => setImportTarget(e.target.value as "identity" | "rules")}>
              <option value="identity">Layer 1 — Identity sections</option>
              <option value="rules">Layer 2 — Category rules</option>
            </select>
            <input
              className={input}
              placeholder="category (rules only)"
              value={importCategory}
              disabled={importTarget === "identity"}
              onChange={(e) => setImportCategory(e.target.value)}
            />
            <select
              className={input}
              value={importKind}
              disabled={importTarget === "identity"}
              onChange={(e) => setImportKind(e.target.value as "rule" | "system")}
            >
              <option value="rule">rule</option>
              <option value="system">system</option>
            </select>
            <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-white/60 px-1">
              <input type="checkbox" checked={replaceExisting} onChange={(e) => setReplaceExisting(e.target.checked)} />
              পুরনোগুলো disable করে দাও
            </label>
          </div>

          <textarea
            className={`${input} min-h-[260px] font-mono text-[12px] leading-relaxed`}
            placeholder={"## CORE MISSION\nExtremely short requests must become complete professional motion design outcomes...\n\n## MOTION PHILOSOPHY\n..."}
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
          />

          {importMsg && <p className="text-xs text-blue-600 dark:text-blue-400">{importMsg}</p>}

          {preview && (
            <div className="rounded-lg border border-slate-100 dark:border-white/5 divide-y divide-slate-100 dark:divide-white/5">
              {preview.map((b) => (
                <div key={b.slug} className="flex items-center justify-between px-3 py-2 text-xs">
                  <span className="text-slate-800 dark:text-white/80">{b.title}</span>
                  <span className="font-mono text-slate-400 dark:text-white/30">{b.slug} · {b.chars} ch</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button
              onClick={() => void doImport(true)}
              disabled={busy || importText.trim().length < 10}
              className="text-xs px-4 py-2 rounded-lg border border-slate-200 dark:border-white/10 text-slate-600 dark:text-white/60 disabled:opacity-40"
            >
              Preview
            </button>
            <button
              onClick={() => void doImport(false)}
              disabled={busy || importText.trim().length < 10}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-4 py-2 rounded-lg disabled:opacity-50"
            >
              <ClipboardPaste size={14} /> Import
            </button>
          </div>
        </div>
      )}

      {layer === "guide" && (
        <div className="p-4 sm:p-6 text-[13px] leading-relaxed text-slate-700 dark:text-white/70 space-y-5 max-w-3xl">
          <div>
            <p className="font-semibold text-slate-900 dark:text-white mb-1">Ghost AI OS কী?</p>
            <p>
              Layer 1 = Ghostae Command-এর স্থায়ী পরিচয় (identity)। প্রতিটা AI request-এর আগে এটা যুক্ত হয়, তাই user ছোট একটা কথা লিখলেও
              output senior motion designer-এর মতো আসে। Layer 2 = নির্দিষ্ট category-র (motion-graphics, coding, text…) অতিরিক্ত নিয়ম।
            </p>
          </div>
          <div>
            <p className="font-semibold text-slate-900 dark:text-white mb-1">নতুন Identity section কীভাবে add করবেন</p>
            <p>১. উপরে <b>Identity</b> tab → বাঁ পাশে <b>New section</b> চাপুন।</p>
            <p>২. <b>slug</b> = ইংরেজি ছোট হাতের নাম, space নেই (যেমন <code>motion-philosophy</code>)। এটা unique হতে হবে।</p>
            <p>৩. <b>Title</b> = section-এর নাম। <b>Order</b> = কত নম্বরে বসবে (ছোট সংখ্যা আগে আসে; নতুনগুলো ২৭০+ দিন)।</p>
            <p>৪. বড় box-এ নিয়মগুলো লিখুন — এটাই হুবহু system prompt-এ যাবে।</p>
            <p>৫. <b>Create section</b> চাপলে revision বেড়ে যায় এবং ১ মিনিটের ভিতরে সব installed panel-এ পৌঁছে যায়।</p>
          </div>
          <div>
            <p className="font-semibold text-slate-900 dark:text-white mb-1">নতুন Prompt / নিয়ম কীভাবে add করবেন</p>
            <p>১. <b>Category rules</b> tab → <b>New rule</b> চাপুন।</p>
            <p>২. <b>category</b> লিখুন (যেমন motion-graphics, expression, coding, text, general)। panel যে category detect করবে, সেটার নিয়মই যুক্ত হবে; <code>general</code> সব ক্ষেত্রে যুক্ত হয়।</p>
            <p>৩. <b>kind</b>: <code>rule</code> = সাধারণ নিয়ম, <code>system</code> = কড়া নির্দেশ। <b>weight</b> বেশি হলে আগে বসে (default 100)।</p>
            <p>৪. <b>Save rule</b> — সাথে সাথেই live।</p>
          </div>
          <div>
            <p className="font-semibold text-slate-900 dark:text-white mb-1">লেখার ভালো নিয়ম</p>
            <p>• ছোট, আদেশমূলক লাইন লিখুন — গল্প নয়।</p>
            <p>• সংখ্যা নির্দিষ্ট করুন (0.4s, 6% overshoot, 24fps)।</p>
            <p>• একটা section-এ একটা বিষয় রাখুন, যাতে পরে আলাদা করে off করা যায়।</p>
            <p>• ভুল হলে delete করার দরকার নেই — <b>Power</b> icon চেপে disable করে দিন।</p>
          </div>
          <div>
            <p className="font-semibold text-slate-900 dark:text-white mb-1">অন্য AI দিয়ে লিখিয়ে আনা</p>
            <p><b>Paste import</b> tab-এ meta-prompt copy করুন → ChatGPT/Claude/Gemini-তে দিন → উত্তর paste করুন → Preview → Import। একই slug থাকলে সেটা update হবে, নতুন হলে যোগ হবে।</p>
          </div>
        </div>
      )}

      {layer === "test" && (
        <div className="space-y-4 p-4 sm:p-6">
          <div className="grid grid-cols-2 items-center gap-2.5 sm:grid-cols-5 sm:gap-3">
            <select className={input} value={chatModel} onChange={(e) => setChatModel(e.target.value)}>
              {[
                ["google/gemini-3.6-flash", "Gemini 3.6 Flash — cheap"],
                ["google/gemini-3.1-pro-preview", "Gemini 3.1 Pro — best design"],
                ["openai/gpt-5.4-mini", "GPT-5.4 Mini — cheap reasoning"],
                ["openai/gpt-5.5", "GPT-5.5 — premium"],
              ].map(([id, label]) => (
                <option key={id} value={id}>{label}</option>
              ))}
            </select>
            <select className={input} value={chatCategory} onChange={(e) => setChatCategory(e.target.value)}>
              {["ui-design", "graphic-design", "motion-graphics", "video-editing", "coding", "automation", "text", "general"].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <label className="flex items-center gap-2 px-1 text-xs text-slate-600 dark:text-white/60">
              <input type="checkbox" checked={useIdentity} onChange={(e) => setUseIdentity(e.target.checked)} />
              Layer 1 identity
            </label>
            <label className="flex items-center gap-2 px-1 text-xs text-slate-600 dark:text-white/60">
              <input type="checkbox" checked={useRules} onChange={(e) => setUseRules(e.target.checked)} />
              Layer 2 rules
            </label>
            <button
              onClick={() => { setChat([]); setChatMeta(null); }}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-600 dark:border-white/10 dark:text-white/60"
            >
              <Eraser size={13} /> Clear
            </button>
          </div>

          <div className="max-h-[420px] min-h-[220px] space-y-3 overflow-y-auto rounded-xl border border-slate-100 p-3 dark:border-white/5">
            {!chat.length && (
              <p className="py-14 text-center text-xs text-slate-400 dark:text-white/30">
                এখানে লিখে দেখুন brain ঠিকভাবে কাজ করছে কিনা — identity ও category rules সহ উত্তর আসবে।
              </p>
            )}
            {chat.map((m, i) =>
              m.role === "user" ? (
                <div key={i} className="flex justify-end">
                  <p className="max-w-[80%] whitespace-pre-wrap rounded-2xl bg-blue-600 px-3.5 py-2 text-[13px] text-white">
                    {m.content}
                  </p>
                </div>
              ) : (
                <p key={i} className="max-w-[92%] whitespace-pre-wrap text-[13px] leading-relaxed text-slate-800 dark:text-white/80">
                  {m.content}
                </p>
              ),
            )}
            {chatBusy && <p className="animate-pulse text-xs text-slate-400 dark:text-white/30">Thinking...</p>}
          </div>

          {chatMeta && <p className="font-mono text-[11px] text-slate-400 dark:text-white/30">{chatMeta}</p>}

          <div className="flex items-end gap-2">
            <textarea
              className={`${input} min-h-[52px] resize-y`}
              placeholder="একটা ছোট request লিখুন — যেমন: price list এর একটা premium UI design দাও"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void sendChat();
                }
              }}
            />
            <button
              onClick={() => void sendChat()}
              disabled={chatBusy || !chatInput.trim()}
              className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white disabled:opacity-40"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}

      {layer === "telemetry" && (
        <div className="space-y-4 p-4 sm:p-6">
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-4">
            {[
              { label: "Logged runs", value: runs.length },
              { label: "Avg expansion", value: `${avgExpansion}x` },
              { label: "Failures", value: runs.filter((r) => !r.ok).length },
            ].map((s) => (
              <div key={s.label} className="rounded-lg bg-slate-50 dark:bg-white/5 p-4">
                <p className="text-[11px] uppercase tracking-wider text-slate-400 dark:text-white/30">{s.label}</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">{s.value}</p>
              </div>
            ))}
          </div>
          <div className="max-h-[420px] overflow-y-auto text-xs">
            {runs.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 py-2"
              >
                <span className="font-mono text-slate-500 dark:text-white/40">{r.category}</span>
                <span className="text-slate-400 dark:text-white/30">{r.model || r.provider || "—"}</span>
                <span className="text-slate-400 dark:text-white/30">
                  {r.raw_length} → {r.expanded_length}
                </span>
                <span className={r.ok ? "text-green-500" : "text-red-500"}>{r.ok ? "ok" : "fail"}</span>
              </div>
            ))}
            {!runs.length && <p className="text-slate-400 dark:text-white/30 py-6 text-center">No runs logged yet.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
