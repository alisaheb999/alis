import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Bot, Layers, Monitor, Play, Sparkles } from "lucide-react";
import { RelatedProducts } from "@/components/ghost/RelatedProducts";
import ss1 from "@/assets/frame-ai-ss-1.png.asset.json";
import ss2 from "@/assets/frame-ai-ss-2.png.asset.json";
import ss3 from "@/assets/frame-ai-ss-3.png.asset.json";
import ss4 from "@/assets/frame-ai-ss-4.png.asset.json";
import ss5 from "@/assets/frame-ai-ss-5.png.asset.json";
import logo from "@/assets/frame-ai-logo.png.asset.json";
import installer from "@/assets/FrameAI-Setup-1.1.0.exe.asset.json";
import thumb from "@/assets/frame-ai-thumb.png.asset.json";
import installerZip from "@/assets/FrameAI-Setup-1.1.0.zip.asset.json";

const TITLE = "Frame AI — Desktop AI Motion Video App | Ghostae";
const DESC =
  "Frame AI is a standalone desktop app for motion designers. Generate motion videos with Claude and import them as layers in After Effects.";

export const Route = createFileRoute("/products/frame-ai")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "product" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FrameAiPage,
});

const FEATURES = [
  { icon: Bot, title: "Claude দিয়ে চালিত", text: "ছোট একটা প্রম্পট থেকে মোশন ভিডিও" },
  { icon: Monitor, title: "আলাদা ডেস্কটপ সফটওয়্যার", text: "কোনো প্লাগইন ছাড়াই নিজে চলে" },
  { icon: Layers, title: "After Effects-এ ইমপোর্ট", text: "তৈরি ভিডিও লেয়ার হিসেবে আনুন" },
];

const FAQ = [
  { q: "Frame AI কি Premiere Pro বা After Effects-এর প্লাগইন?", a: "না, এটা আলাদা ডেস্কটপ সফটওয়্যার। তৈরি ভিডিও চাইলে After Effects-এ লেয়ার হিসেবে আনতে পারবেন।" },
  { q: "কোন AI মডেল ব্যবহার হয়?", a: "Frame AI-তে Claude মডেল দিয়ে মোশন ভিডিও তৈরি হয়।" },
  { q: "খরচ কীভাবে কাটে?", a: "যতটুকু ব্যবহার করবেন ততটুকুই — প্রতি মিলিয়ন টোকেনে ৳3। অ্যাপের ভেতর থেকে ক্রেডিট কিনে নিন।" },
  { q: "কোন কম্পিউটারে চলবে?", a: "বর্তমানে Windows-এর জন্য ইনস্টলার দেওয়া আছে।" },
];

const INSTALL_STEPS = [
  { n: "১", text: "FrameAI-Setup-1.1.0.exe ফাইলত ডাবল-ক্লিক করুন। ZIP পেলে আগে ZIP খুলে ভেতরের .exe চালাুন।" },
  { n: "২", text: "Windows “protected your PC” দেখালে More info চাপুন, তারপর Run anyway চাপুন।" },
  { n: "৩", text: "জানালায় “ইনস্টল করুন” চাপুন — বাকি সব নিজে থেকে হবে। Node.js, Git, Claude Code, ffmpeg পিসিতে না থাকলে নিজে নামিয়ে বসাবে।" },
  { n: "৪", text: "প্রথমবার মোট প্রায় ৪০০ MB নামততে পারতে — ধীর নেটত ১০–২০ মিনিট লাগতে। জানালা বন্ধ করবেন না।" },
  { n: "৫", text: "শেষ হলতে “Frame AI খুলুন” চাপুন। লগইন: Frame AI ক্রেডিট (ইমতইল ও পাসওয়ার্ড) অথবা নিজতর Claude অ্যাকাউন্ট দিতয়ে।" },
];

const SCREENSHOTS = [
  { src: ss1.url, caption: "প্রম্পট দিয়ে AI-এর সাথে মোশন তৈরি" },
  { src: ss2.url, caption: "নতুন প্রজেক্ট ও ফ্রি ক্যানভাস" },
  { src: ss3.url, caption: "প্রজেক্ট, ক্যানভাস ও ফোল্ডার" },
  { src: ss4.url, caption: "ক্রেডিট কিনুন — ৭/১৫/৩০/৯০ দিন" },
  { src: ss5.url, caption: "ক্রেডিট ব্যালেন্স ও ব্যবহার" },
];

function FrameAiPage() {
  return (
    <div className="frame-ai-page mx-auto w-full max-w-3xl px-4 py-10 text-left">
      <Link to="/products" className="text-sm text-muted-foreground hover:text-foreground">
        ← সব পণ্য
      </Link>

      <header className="mt-6">
        <div className="flex items-center gap-3">
          <img src={logo.url} alt="Frame AI লোগো" width={44} height={44} className="h-11 w-11 rounded-lg bg-card object-contain p-1" />
          <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">Frame AI</h1>
          <span className="rounded-full border border-primary/40 bg-primary/10 px-2.5 py-0.5 text-xs text-primary">
            এখনই পাওয়া যাচ্ছে
          </span>
        </div>
        <p className="mt-2 font-light text-muted-foreground">মোশন ডিজাইনারদের জন্য AI মোশন ভিডিও ডেস্কটপ অ্যাপ</p>
      </header>

      <div className="relative mt-8">
        <FrameVideo />
        <span title="After Effects" className="absolute -right-3 -top-3 grid h-10 w-10 rotate-12 place-items-center rounded-lg border border-border bg-card text-sm font-bold text-primary">Ae</span>
        <span title="Desktop app" className="absolute -bottom-3 -left-3 grid h-10 w-10 -rotate-12 place-items-center rounded-lg border border-border bg-card text-primary"><Monitor className="h-5 w-5" /></span>
      </div>

      <section className="mt-10 grid gap-3 sm:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, text }) => (
          <div key={title} className="rounded-lg border border-border bg-card p-4">
            <Icon className="h-5 w-5 text-primary" />
            <h2 className="mt-3 text-sm font-medium text-foreground">{title}</h2>
            <p className="mt-1 text-xs font-light text-muted-foreground">{text}</p>
          </div>
        ))}
      </section>


      <section
        className="frame-ai-price mt-10 overflow-hidden rounded-2xl border border-primary/30 p-6 text-media-foreground md:p-8"
        style={{ background: "var(--text-purchase-gradient)", color: "var(--media-foreground)" }}
      >
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-media-foreground/20 bg-media-foreground/10 px-3 py-1 text-xs tracking-wide">
              <Sparkles className="h-3.5 w-3.5" /> Pay as you go
            </div>
            <div className="mt-5 flex items-center gap-2 text-sm opacity-80">
              <Bot className="h-4 w-4" /> Claude
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-6xl font-semibold tracking-tight md:text-7xl">৳3</span>
              <span className="text-sm opacity-75">/ million tokens</span>
            </div>
            <p className="mt-3 text-xs opacity-70">No subscription · Pay only for what you use</p>
          </div>
          <div className="flex flex-col items-stretch gap-2 md:shrink-0">
            <a
              href={installer.url}
              download="FrameAI-Setup-1.1.0.exe"
              aria-label="Download Frame AI for Windows"
              className="flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-medium text-media-foreground transition-colors hover:bg-primary-hover"
            >
              <Monitor className="h-4 w-4" /> Download for Windows · v1.1.0
            </a>
            <a
              href={installerZip.url}
              download="FrameAI-Setup-1.1.0.zip"
              className="text-center text-xs text-media-foreground underline underline-offset-4 opacity-80 hover:opacity-100"
            >
              .exe ভাইরাস দেখালে ZIP ডাউনলোড করুন
            </a>
          </div>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-medium text-foreground">ইনস্টল করার নিয়ম</h2>
        <ol className="mt-4 space-y-3 rounded-xl border border-border bg-card p-5">
          {INSTALL_STEPS.map(({ n, text }) => (
            <li key={n} className="flex gap-3 text-sm font-light text-muted-foreground">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-primary/40 bg-primary/10 text-xs text-primary">{n}</span>
              <span>{text}</span>
            </li>
          ))}
        </ol>
        <p className="mt-3 text-xs font-light text-muted-foreground">
          সমস্যা হলতে জানালার নিচতর “বিস্তারিত লগ” চেপে স্ক্রিনশট পাঠান · মুচতে ফেলতে: Settings → Apps → Frame AI → Uninstall · সাহায্য:{" "}
          <a href="https://wa.me/8801949085128" className="text-primary underline underline-offset-2">
            WhatsApp 01949085128
          </a>
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-medium text-foreground">স্ক্রিনশট</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {SCREENSHOTS.map(({ src, caption }, i) => (
            <figure key={src} className={i === SCREENSHOTS.length - 1 ? "sm:col-span-2" : undefined}>
              <img src={src} alt={`Frame AI স্ক্রিনশট ${i + 1}`} loading="lazy" className="w-full rounded-lg border border-border bg-card object-contain" />
              <figcaption className="mt-1.5 text-xs font-light text-muted-foreground">{caption}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-medium text-foreground">সাধারণ প্রশ্ন</h2>
        <div className="mt-4 divide-y divide-border rounded-xl border border-border bg-card">
          {FAQ.map(({ q, a }) => (
            <details key={q} className="group p-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium text-foreground">
                {q}
                <span className="text-primary transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-2 text-sm font-light text-muted-foreground">{a}</p>
            </details>
          ))}
        </div>
      </section>

      <RelatedProducts currentSlug="frame-ai" />
    </div>
  );
}

function FrameVideo() {
  const [play, setPlay] = useState(false);
  if (play)
    return (
      <iframe
        className="aspect-video w-full rounded-xl border border-border"
        src="https://www.youtube-nocookie.com/embed/VovwVDucFYA?autoplay=1&rel=0"
        title="Frame AI ভিডিও"
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
        allowFullScreen
      />
    );
  return (
    <button type="button" onClick={() => setPlay(true)} aria-label="Frame AI ভিডিও চালান" className="group relative block w-full overflow-hidden rounded-xl border border-border">
      <img src={thumb.url} alt="Frame AI ভিডিও থাম্বনেইল" width={1672} height={941} className="aspect-video w-full object-cover" />
      <span className="absolute inset-0 grid place-items-center">
        <span className="grid h-16 w-16 place-items-center rounded-full bg-primary text-primary-foreground transition-transform group-hover:scale-110">
          <Play className="h-7 w-7 translate-x-0.5" />
        </span>
      </span>
    </button>
  );
}
