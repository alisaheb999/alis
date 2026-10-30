import { createFileRoute, Link } from "@tanstack/react-router";
import { ProofCarousel } from "../components/ghost/ProofCarousel";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { MessageCircle, Send, ArrowRight, Check } from "lucide-react";
import { SiteHeader } from "../components/ghost/SiteHeader";
import { SiteFooter } from "../components/ghost/SiteFooter";

const SystemCheck = lazy(() =>
  import("../components/ghost/SystemCheck")
    .then((m) => ({ default: m.SystemCheck }))
    .catch(() => {
      // Stale build after publish: hide the widget instead of blanking the page.
      if (typeof window !== "undefined" && !sessionStorage.getItem("ghost-chunk-reload")) {
        sessionStorage.setItem("ghost-chunk-reload", "1");
        window.location.reload();
      }
      return { default: () => null };
    }),
);
import * as homeUi from "../content/home-page/page";
import { initHomePage } from "../content/home-page/behavior";
import { ExtensionGrid } from "../components/ghost/ExtensionGrid";
import { DigitalProductsSection } from "../components/ghost/DigitalProductsSection";

const WHATSAPP = "https://chat.whatsapp.com/BdoH5Xpn4iFEGEbn4j5WLf";

const SUPPORT_GROUPS: { title: string; items: string[] }[] = [
  {
    title: "Supported software",
    items: ["Adobe After Effects 2023 → latest", "Adobe Premiere Pro 2023 → latest"],
  },
  {
    title: "Operating system",
    items: ["Windows 10 & Windows 11 (64-bit)", "Modern macOS — Ventura, Sonoma, Sequoia"],
  },
  {
    title: "Setup",
    items: ["One-click desktop installer", "Works offline after activation"],
  },
];

const FAQ: { q: string; a: string }[] = [
  {
    q: "What does Ghostae actually give me?",
    a: "Free resources, After Effects and Premiere Pro extensions, a WhatsApp AI agent and a desktop agent — all built to speed up video editing.",
  },
  {
    q: "Which versions are supported?",
    a: "After Effects and Premiere Pro 2023 up to the latest release, on Windows 10/11 and modern macOS.",
  },
  { q: "How do I install a panel?", a: "Install the Ghostae desktop app, sign in, and it sets up every panel for you in one click." },
  { q: "Can I try before paying?", a: "Yes. Free downloads and free resources are available without payment." },
  { q: "How do I pay?", a: "bKash, Nagad or Rocket. Send the amount, submit the transaction ID, and your key arrives after verification." },
  { q: "What if my key stops working?", a: "Message us in the WhatsApp community or email support and we re-issue or move your activation." },
];

const SLOGAN_TOP = "Everything a video editor needs.";
const SLOGAN_SUB = "Free resources, Adobe extensions & AI agents.";

const HERO_HTML = homeUi.html.replace(
  /<div id="heroParagraph"[\s\S]*?<\/div>/,
  `<div id="heroParagraph" class="max-w-md mx-auto" style="font-size:13px;line-height:1.5;font-weight:300"><p class="text-slate-700" style="font-weight:300">${SLOGAN_TOP}</p><p class="text-slate-500" style="font-weight:300">${SLOGAN_SUB}</p></div>`,
);

function WhatsAppLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="#25D366" aria-hidden="true">
      <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.07c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.62.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35zM12.04 21.8h-.01a9.8 9.8 0 0 1-5-1.37l-.36-.21-3.72.98 1-3.63-.24-.37a9.8 9.8 0 1 1 8.33 4.6zm8.35-18.16A11.73 11.73 0 0 0 12.04.2C5.53.2.23 5.5.23 12.01c0 2.08.54 4.11 1.58 5.9L.13 24l6.23-1.63a11.8 11.8 0 0 0 5.67 1.45h.01c6.51 0 11.81-5.3 11.81-11.81 0-3.16-1.23-6.12-3.46-8.36z" />
    </svg>
  );
}

const STEPS = [
  { t: "Download", d: "Pick a product and get the desktop installer." },
  { t: "Install", d: "One click — the panel is added to Adobe." },
  { t: "Create", d: "Open it inside After Effects and edit faster." },
];

const SECTION =
  "relative z-10 mx-auto flex min-h-[100svh] w-full max-w-5xl flex-col justify-center px-4 py-16 sm:px-6";

const TITLE = "Ghostae — Extensions, AI Agents & Free Resources for Video Editors";
const DESC =
  "Ghostae supports video editors with free resources, Premiere Pro & After Effects extensions, a WhatsApp AI agent and a desktop agent. Plans from ৳199.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://ghostae.com/" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:image", content: "https://ghostae.com/og-ghostae.jpg" },
      { name: "twitter:image", content: "https://ghostae.com/og-ghostae.jpg" },
    ],
    links: [{ rel: "canonical", href: "https://ghostae.com/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Ghostae",
          url: "https://ghostae.com/",
          description: DESC,
          makesOffer: [
            {
              "@type": "Offer",
              itemOffered: {
                "@type": "SoftwareApplication",
                name: "Ghostae Text",
                applicationCategory: "MultimediaApplication",
                operatingSystem: "Windows 10, Windows 11, macOS",
              },
              price: "349",
              priceCurrency: "BDT",
            },
          ],
        }),
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!rootRef.current) return;
    return initHomePage(rootRef.current);
  }, []);

  return (
    <div className="min-h-screen bg-[#fafcff]">
      <style
        dangerouslySetInnerHTML={{
          __html: `${homeUi.css}
            .gh2 .aurora-orb-1, .gh2 .aurora-orb-2, .gh2 #mouseSpotlight, .gh2 .bg-grid-ambient { display: none !important; }
            .gh2 #heroMain { min-height: calc(100svh - 64px) !important; padding-top: 0 !important; padding-bottom: 0 !important; }
            .gh2 #triggerWrapper { right: 10px !important; bottom: 14px !important; }
            .gh2 #triggerWrapper > span { display: none !important; }
            .gh2 #openTriggerBtn { height: 38px !important; width: 38px !important; padding: 0 !important; justify-content: center !important; }
            .gh2 #openTriggerBtn > span { display: none !important; }
            .gh2 #openTriggerBtn > div { width: 24px !important; height: 24px !important; margin: 0 !important; }
            .gh2 #heroHeadline { font-size: clamp(44px, 12vw, 88px) !important; margin-bottom: 1rem !important; }
            .gh2 #heroParagraph { font-size: 14px !important; margin-bottom: 1.5rem !important; }`,
        }}
      />
      <SiteHeader />
      <div
        ref={rootRef}
        className="gh2 tx-raw bg-[#fafcff] text-slate-800 relative overflow-x-hidden flex flex-col justify-between selection:bg-blue-100 selection:text-blue-700"
        dangerouslySetInnerHTML={{ __html: HERO_HTML }}
      />

      {/* Scroll 1 — products */}
      <section data-surface="light" aria-labelledby="panels-title" className="relative z-10 mx-auto w-full max-w-5xl px-4 pb-8 pt-16 sm:px-6">
        <h2 id="panels-title" className="text-xl font-bold text-slate-900 sm:text-2xl">
          Official Extensions
        </h2>
        <div className="mt-5 sm:mt-7"><ExtensionGrid /></div>
      </section>

      <div className="relative z-10 mx-auto w-full max-w-5xl px-4 sm:px-6"><DigitalProductsSection surface="light" /></div>

      {/* Scroll 2 — compatibility */}
      <section data-surface="light" aria-labelledby="device-title" className={SECTION}>
        <div>
          <h2 id="device-title" className="text-xl font-bold text-slate-900 sm:text-2xl">
            Works with
          </h2>
          <p className="mt-1.5 text-[12.5px] font-light text-slate-900">
            Built for current <span className="font-semibold text-blue-600">Adobe</span> versions on Windows and macOS.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {SUPPORT_GROUPS.map((g) => (
              <div key={g.title} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-600">
                  {g.title}
                </div>
                <ul className="mt-2.5 space-y-2">
                  {g.items.map((i) => (
                    <li key={i} className="flex items-start gap-2 text-[12.5px] leading-snug text-slate-900">
                      <Check size={14} className="mt-[2px] shrink-0 text-blue-600" />
                      <span>{i}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
            <div className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-600">
              Your device
            </div>
            <div className="mt-2">
              <Suspense fallback={null}>
                <SystemCheck />
              </Suspense>
            </div>
          </div>
        </div>
      </section>

      {/* Scroll 3 — AI */}
      <section data-surface="light" className={SECTION}>
        <HomeAiChat />
      </section>

      {/* Scroll 4 — how it works */}
      <section data-surface="light" aria-labelledby="steps-title" className={SECTION}>
        <h2 id="steps-title" className="text-xl font-bold text-slate-900 sm:text-2xl">
          How it works
        </h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <div key={s.t} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="text-[11px] font-black text-blue-600">0{i + 1}</div>
              <div className="mt-1.5 text-[14px] font-bold text-slate-900">{s.t}</div>
              <div className="mt-1 text-[12.5px] font-light text-slate-600">{s.d}</div>
            </div>
          ))}
        </div>
        <Link
          to="/products"
          className="mt-5 inline-flex items-center gap-1.5 text-[13px] font-semibold text-blue-600"
        >
          View products <ArrowRight size={14} />
        </Link>
      </section>

      {/* Scroll 5 — WhatsApp community */}
      <section data-surface="light" className={SECTION}>
        <div className="overflow-hidden rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-6 text-center sm:p-10">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white shadow-[0_12px_28px_-12px_rgba(37,211,102,0.7)] ring-1 ring-emerald-100">
            <WhatsAppLogo className="h-8 w-8" />
          </span>
          <h2 className="mt-4 text-xl font-bold text-slate-900 sm:text-2xl">
            Join our WhatsApp community
          </h2>
          <p className="mx-auto mt-2 max-w-md text-[13px] leading-relaxed text-slate-600">
            Nearly 500 video editors. Free presets, instant updates and direct support from the team.
          </p>
          <a
            href={WHATSAPP}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#25D366] px-6 py-3 text-[13px] font-semibold text-white transition hover:brightness-95 active:scale-95"
          >
            <MessageCircle size={16} />
            Join the community
          </a>
        </div>
      </section>

      <ProofCarousel language="en" />

      {/* Scroll 6 — FAQ */}
      <section data-surface="light" className={SECTION}>
        <h2 className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
          Frequently asked
        </h2>
        <div className="mt-6 grid gap-3 lg:grid-cols-2">
          {FAQ.map((f) => (
            <details
              key={f.q}
              className="group rounded-2xl border border-slate-200 bg-white p-5 transition-colors hover:border-blue-300"
            >
              <summary className="cursor-pointer list-none text-[13.5px] font-semibold text-slate-900">
                {f.q}
              </summary>
              <p className="mt-2.5 text-[12.5px] font-light leading-relaxed text-slate-600">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

const SUGGESTIONS = [
  "How do I install a panel?",
  "What does Ghostae Text include?",
  "How do I pay with bKash?",
];

type ChatMsg = { role: "user" | "assistant"; content: string };

function HomeAiChat() {
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send(text: string) {
    const question = text.trim();
    if (!question || busy) return;
    setInput("");
    setError(null);
    const next: ChatMsg[] = [...msgs, { role: "user", content: question }];
    setMsgs(next);
    setBusy(true);
    try {
      const res = await fetch("/api/site-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      if (!res.ok || !res.body) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error || "The assistant could not answer right now.");
      }
      setMsgs((m) => [...m, { role: "assistant", content: "" }]);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const payload = trimmed.slice(5).trim();
          if (!payload || payload === "[DONE]") continue;
          try {
            const json = JSON.parse(payload) as {
              choices?: { delta?: { content?: string } }[];
            };
            const delta = json.choices?.[0]?.delta?.content;
            if (delta) {
              setMsgs((m) => {
                const copy = [...m];
                const last = copy[copy.length - 1];
                if (last && last.role === "assistant") {
                  copy[copy.length - 1] = { role: "assistant", content: last.content + delta };
                }
                return copy;
              });
            }
          } catch {
            /* ignore partial chunks */
          }
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <h2 className="text-center text-xl font-bold text-slate-900 sm:text-2xl">Ask Ghostae AI</h2>
      <p className="mt-1.5 text-center text-[13px] text-slate-500">
        Any question about the products — instant answer.
      </p>

      <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_18px_44px_-28px_rgba(15,23,42,0.28)] sm:p-5">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void send(input);
          }}
          className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-1.5 focus-within:border-blue-400"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your question…"
            aria-label="Ask Ghostae AI"
            className="min-w-0 flex-1 bg-transparent px-3 py-2 text-[13px] text-slate-800 outline-none placeholder:text-slate-400"
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-blue-600 text-white transition hover:bg-blue-700 disabled:opacity-40"
            aria-label="Send question"
          >
            <Send size={15} />
          </button>
        </form>

        {msgs.length === 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => void send(s)}
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11.5px] font-medium text-slate-600 transition hover:border-blue-300 hover:text-blue-700"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {msgs.length > 0 && (
          <div className="mt-4 max-h-64 space-y-2.5 overflow-y-auto pr-1">
            {msgs.map((m, i) => (
              <div
                key={i}
                className={
                  m.role === "user"
                    ? "ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-blue-600 px-3.5 py-2 text-[12.5px] leading-relaxed text-white"
                    : "mr-auto max-w-[90%] whitespace-pre-wrap rounded-2xl rounded-bl-md bg-slate-100 px-3.5 py-2 text-[12.5px] leading-relaxed text-slate-700"
                }
              >
                {m.content || (busy ? "…" : "")}
              </div>
            ))}
          </div>
        )}

        {error && <p className="mt-3 text-[12px] font-medium text-rose-600">{error}</p>}
      </div>
    </div>
  );
}
