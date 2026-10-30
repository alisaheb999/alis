import { createFileRoute } from "@tanstack/react-router";
import { GhostShell, PageTitle, Card } from "../components/ghost/Shell";

export const Route = createFileRoute("/docs")({
  head: () => ({
    meta: [
      { title: "Documentation — Ghostae" },
      {
        name: "description",
        content:
          "Complete guide to installing and using GhostAE Caption inside Adobe After Effects — install, plans, licence activation, and caption workflow.",
      },
      { property: "og:title", content: "Documentation — Ghostae" },
      {
        property: "og:description",
        content:
          "Install, configure, and master every Ghostae panel feature.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:image", content: "https://ghostae.com/og-ghostae-world.jpg" },
      { name: "twitter:image", content: "https://ghostae.com/og-ghostae-world.jpg" },
    ],
    links: [{ rel: "canonical", href: "https://ghostae.com/docs" }],
  }),
  component: DocsPage,
});

const SECTIONS = [
  {
    id: "install",
    title: "1. Installation (Desktop installer)",
    body: [
      "Download the Ghostae desktop installer from the product page.",
      "Windows: run the .exe. macOS: open the .zip and run the app (first time: right-click → Open).",
      "The installer sets everything up automatically — no manual copying or registry edits.",
      "Restart After Effects, then open Window → Extensions → your Ghostae panel.",
    ],
  },
  {
    id: "unsigned",
    title: "2. Panel not showing?",
    body: [
      "Fully close After Effects and run the installer again.",
      "Still missing? Message us on WhatsApp +880 1345 407572 — we fix it the same day.",
    ],
  },
  {
    id: "caption",
    title: "3. GhostAE Caption — workflow",
    body: [
      "Open the panel and drop an audio file (MP3/WAV). Video files are not accepted — export audio first.",
      "The AI transcribes the audio and builds word-timed caption layers directly in your composition, in a dedicated Ghostae Captions comp.",
      "Edit any caption manually, then apply caption presets for style and animation.",
      "Import or export SRT files for use with other editors and platforms.",
      "Bangla and English audio are both supported.",
    ],
  },
  {
    id: "plans",
    title: "4. Plans & licence",
    body: [
      "Free: 2 Minutes Every Day — no monthly limit.",
      "Light: ৳199 / 3 Months — 300 Minutes, No Limit — Any Time, All Standard Features.",
      "Pro: ৳699 / 1 Year — 1,500 Minutes, No Limit — Any Time, All Features Unlocked.",
      "Buy from Products → GhostAE Caption → Buy now. Pay via bKash / Nagad / Rocket / Upay and submit your transaction ID.",
      "Once payment is verified, your licence key is delivered — activate it inside the panel to unlock your plan.",
    ],
  },
  {
    id: "updates",
    title: "5. Safe patch updates",
    body: [
      "Every install writes a timestamped backup under .ghost-backups. Rollback from the panel or restore manually.",
      "Updates are verified with SHA-256 before install. A failed verification aborts and leaves your working copy intact.",
      "Updates are transactional: if any step fails the previous version is restored automatically.",
    ],
  },
];

function DocsPage() {
  return (
    <GhostShell>
      <div className="mx-auto w-full min-w-0 max-w-6xl py-6 sm:py-10 md:py-16">
        <PageTitle
          eyebrow="HANDBOOK"
          title="Documentation"
          subtitle="Everything you need to install, configure, and get productive with Ghostae inside After Effects."
        />
        <div className="grid min-w-0 gap-5 sm:gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
          <nav className="h-fit min-w-0 space-y-1 rounded-2xl lg:sticky lg:top-24 border border-slate-200 bg-white p-3 text-sm shadow-[0_10px_40px_rgba(15,23,42,.06)] dark:border-white/10 dark:bg-white/[0.03] dark:shadow-none">
            <p className="px-3 pb-2 font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
              On this page
            </p>
            {SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="block truncate rounded-lg px-3 py-2 text-[13px] font-medium text-slate-600 transition hover:bg-blue-500/10 hover:text-blue-700 dark:text-slate-400 dark:hover:text-white sm:text-sm"
              >
                {s.title}
              </a>
            ))}
          </nav>
          <div className="min-w-0 space-y-3 sm:space-y-4">
            {SECTIONS.map((s) => (
              <Card key={s.id}>
                <h2
                  id={s.id}
                  className="scroll-mt-28 text-xl font-bold text-[#0b1020] dark:text-white"
                >
                  {s.title}
                </h2>
                <ul className="mt-3 space-y-2.5 break-words text-[13.5px] leading-relaxed sm:text-[14px] text-slate-600 dark:text-slate-400">
                  {s.body.map((line) => (
                    <li key={line} className="flex min-w-0 gap-2.5">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" />
                      <span className="min-w-0 [overflow-wrap:anywhere]">{line}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </GhostShell>
  );
}

