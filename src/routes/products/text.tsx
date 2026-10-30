import { createFileRoute } from "@tanstack/react-router";
import { ArrowUpRight, ArrowRight, ShieldAlert, MessageCircle } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { PurchaseLoading } from '@/components/ghostae/PurchaseLoading';
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { RelatedProducts } from "@/components/ghost/RelatedProducts";
import { WhatsAppIcon } from "@/components/ghost/WhatsAppIcon";
import { TEXT_WINDOWS_DOWNLOAD } from "@/lib/text-downloads";
import { PublicCouponBanner } from "@/components/ghost/PublicCouponBanner";
import { GhostShell } from "../../components/ghost/Shell";
import { ProofCarousel } from "../../components/ghost/ProofCarousel";
const loadBuyDialog = () => import("../../components/ghostae/BuyDialog");
const BuyDialog = lazy(() => loadBuyDialog().then((m) => ({ default: m.BuyDialog })));
const warmBuyDialog = () => { void loadBuyDialog().catch(() => {}); };
const LicenceKeyDialog = lazy(() =>
  import("../../components/ghostae/LicenceKeyDialog").then((m) => ({ default: m.LicenceKeyDialog })),
);
const TextLaunchDialog = lazy(() => import("../../components/ghost/TextLaunchDialog"));
const TextMacSetupDialog = lazy(() => import("../../components/ghost/TextMacSetupDialog"));
const TextDeferredContent = lazy(() =>
  import("../../components/ghost/TextDeferredContent").then((m) => ({ default: m.TextDeferredContent })),
);
import { findProduct, type GhostProduct } from "../../lib/products-catalog";
import * as heroUi from "../../content/text-page/hero";
import * as featuresUi from "../../content/text-page/features";
import { TextFeatureVideo } from "../../components/ghost/TextFeatureVideo";
import { TextPriceCountdown, type PriceSchedule } from "../../components/ghost/TextPriceCountdown";
import showcaseGif from "../../assets/text/showcase/all-showcases.gif.asset.json";
import showcaseVideo from "../../assets/text/showcase/showcase.mp4.asset.json";
import showcasePoster from "../../assets/text/showcase/showcase-poster.jpg.asset.json";
const HERO_SHOWCASE = `
  <div class="group relative h-full w-full">
    <video class="h-full w-full object-contain" data-defer-src="${showcaseVideo.url}" poster="${showcasePoster.url}" width="720" height="405" muted loop playsinline preload="none" aria-label="Ghostae Text animation showcase"></video>
    <button type="button" data-zoom="${showcaseGif.url}" aria-label="অ্যানিমেশন বড় করে দেখুন" class="absolute bottom-3 right-3 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-slate-950/75 text-white shadow-lg backdrop-blur-sm transition hover:scale-105 hover:bg-blue-600">
      <svg aria-hidden="true" class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
    </button>
  </div>`;
import { getPublicOffer } from "../../lib/checkout.functions";

const TITLE = "Ghostae Text V2 — After Effects ও Premiere Pro টেক্সট অ্যানিমেশন";
const DESC =
  "After Effects ও Premiere Pro-তে এক ক্লিকে টেক্সট অ্যানিমেশন: ১১০+ প্রিমিয়াম, ১২০+ স্টাইলিশ অ্যানিমেশন ও ২০০+ ইমোজি। লাইফটাইম লাইসেন্সে ব্যবহার করুন।";

const WHATSAPP_GROUP = "https://chat.whatsapp.com/BdoH5Xpn4iFEGEbn4j5WLf";

const DESKTOP_EXE = TEXT_WINDOWS_DOWNLOAD;
const INSTALL_GUIDE = "/guides/ghostae-text-install.html";
function getTextProduct(): GhostProduct {
  const product = findProduct("text");
  if (!product) throw new Error("Ghostae Text product is missing from the catalog");
  return product;
}

const TEXT_PRODUCT = getTextProduct();

const FAQS = [
  {
    q: "এটি কি আফটার ইফেক্টস ও প্রিমিয়ার প্রো দুটোতেই কাজ করবে?",
    a: "হ্যাঁ, After Effects ও Premiere Pro ২০২৩+ এ কাজ করে। Windows ও macOS-এ একই এক্সটেনশন, তবে সেটআপ আলাদা।",
  },
  {
    q: "ফ্রি সংস্করণ কি পাওয়া যাচ্ছে?",
    a: "ফ্রি সংস্করণ আপাতত মেইনটেন্যান্সে আছে। ব্যবহার করতে লাইফটাইম লাইসেন্স নিন।",
  },
  {
    q: "দাম কত?",
    a: "অফার ও কুপন অনুযায়ী দাম পরিবর্তন হয়। বর্তমান দাম ও ছাড় দেখতে নিচের প্রাইসিং সেকশনটি দেখুন। কোনো মাসিক ফি নেই।",
  },
  {
    q: "কীভাবে ইনস্টল করবো?",
    a: "Windows-এ Ghostae ডেস্কটপ ইনস্টলার ব্যবহার করুন। Mac download থেকে আপনার Adobe অ্যাপের ZIP ও ম্যানুয়াল সেটআপ নির্দেশনা পাবেন। প্রিমিয়াম ব্যবহারে লাইসেন্স কী দিন।",
  },
  {
    q: "একটি কী কয়টি পিসিতে ব্যবহার করা যাবে?",
    a: "একটি লাইসেন্স কী একটি পিসিতে অ্যাক্টিভ থাকে। পিসি বদল করলে WhatsApp-এ জানালে আমরা কী রিসেট করে দিই।",
  },
  { q: "ইনস্টল করতে সমস্যা হলে?", a: "আমাদের WhatsApp গ্রুপে মেসেজ দিন — সরাসরি সাপোর্ট ও গাইড পাবেন।" },
];

const TERMS = [
  "লাইসেন্স ব্যক্তিগত ব্যবহারের জন্য; কী শেয়ার, বিক্রি বা পুনঃবিতরণ করা যাবে না।",
  "একটি কী একটি পিসিতে অ্যাক্টিভ থাকে; পিসি বদলালে সাপোর্টে যোগাযোগ করে রিসেট নিতে হবে।",
  "রিফান্ড শুধু কেনার সর্বোচ্চ ১ দিনের (২৪ ঘণ্টা) ভিতরে আবেদন করলে হবে — এরপর কোনো রিফান্ড হবে না। কেনার আগে বিস্তারিত ভিডিও ও সব তথ্য দেখে নিন।",
  "দাম ও অফার যেকোনো সময় পরিবর্তন হতে পারে; কেনার মুহূর্তের দামই প্রযোজ্য।",
  "কী অপব্যবহার করলে লাইসেন্স বাতিল হতে পারে।",
];

export const Route = createFileRoute("/products/text")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "product" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: "https://ghostae.com/products/text" },
      {
        property: "og:image",
        content:
          "https://ghostae.com/__l5e/assets-v1/56e155dc-2a5c-4ce8-816f-4daf0e2891f6/ghostae-text-share.jpg",
      },
      {
        name: "twitter:image",
        content:
          "https://ghostae.com/__l5e/assets-v1/56e155dc-2a5c-4ce8-816f-4daf0e2891f6/ghostae-text-share.jpg",
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "Ghostae Text",
          applicationCategory: "MultimediaApplication",
          operatingSystem: "Windows, macOS",
          url: "https://ghostae.com/products/text",
          image:
            "https://ghostae.com/__l5e/assets-v1/56e155dc-2a5c-4ce8-816f-4daf0e2891f6/ghostae-text-share.jpg",
          offers: [
            {
              "@type": "Offer",
              name: "Lifetime",
              price: "349",
              priceCurrency: "BDT",
              availability: "https://schema.org/InStock",
            },
          ],
        }),
      },
    ],
    links: [
      { rel: "preload", as: "image", href: showcasePoster.url, fetchPriority: "high" },
      { rel: "preload", as: "font", type: "font/woff2", href: "/fonts/payment-bengali-light.woff2", crossOrigin: "anonymous" },
      { rel: "canonical", href: "https://ghostae.com/products/text" },
    ],
  }),
  component: TextDetailPage,
});

function TextDetailPage() {
  const product = TEXT_PRODUCT;
  const [buyOpen, setBuyOpen] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(warmBuyDialog, 1200);
    return () => window.clearTimeout(timer);
  }, []);
  const [keyOpen, setKeyOpen] = useState(false);
  const [maintOpen, setMaintOpen] = useState(false);
  const [launchOpen, setLaunchOpen] = useState(false);
  const [macOpen, setMacOpen] = useState(false);
  const [downloadTarget, setDownloadTarget] = useState<HTMLElement | null>(null);
  const [purchaseTarget, setPurchaseTarget] = useState<HTMLElement | null>(null);
  const [priceTargets, setPriceTargets] = useState<HTMLElement[]>([]);
  const [pricingDownload, setPricingDownload] = useState<HTMLElement | null>(null);
  const [schedule, setSchedule] = useState<PriceSchedule | null>(null);
  const [priceRevision, setPriceRevision] = useState(0);
  const [offer, setOffer] = useState<null | { listPrice: number; discount: number; amount: number }>(null);
  const fetchPublicOffer = useServerFn(getPublicOffer);
  // Poster paints first; the showcase video starts only after the page has loaded.
  useEffect(() => {
    // Hero HTML can be re-rendered (price updates), so keep upgrading new video nodes.
    let timer = 0;
    const start = () => {
      document.querySelectorAll<HTMLVideoElement>("video[data-defer-src]").forEach((v) => {
        const source = v.dataset.deferSrc;
        if (!source) return;
        v.addEventListener("error", () => {
          const preview = document.createElement("img");
          preview.src = showcaseGif.url;
          preview.alt = "Ghostae Text animation showcase";
          preview.className = "h-full w-full object-contain";
          preview.width = 720;
          preview.height = 405;
          v.replaceWith(preview);
        }, { once: true });
        v.src = source; v.removeAttribute("data-defer-src"); v.autoplay = true; void v.play().catch(() => {});
      });
    };
    const kick = () => { start(); timer = window.setInterval(start, 1000); };
    if (document.readyState === "complete") kick(); else window.addEventListener("load", kick, { once: true });
    return () => { clearInterval(timer); window.removeEventListener("load", kick); };
  }, []);
  useEffect(() => {
    let active = true;
    void fetchPublicOffer({ data: { plan: "text_lifetime", cycle: "monthly" } })
      .then((result) => {
        if (active) { setOffer(result); setSchedule(result.schedule); }
      })
      .catch(() => {
        if (active) setOffer(null);
      });
    return () => {
      active = false;
    };
  }, [fetchPublicOffer, priceRevision]);
  useEffect(() => {
    return;
    let cancelled = false;
    let timer = 0;
    let idleId: number | undefined;
    const schedule = () => {
      timer = window.setTimeout(() => {
        const requestIdle = (
          window as unknown as { requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number }
        ).requestIdleCallback;
        if (requestIdle) {
          idleId = requestIdle(
            () => {
              if (!cancelled) setLaunchOpen(true);
            },
            { timeout: 2500 },
          );
        } else if (!cancelled) {
          setLaunchOpen(true);
        }
      }, 5000);
    };
    if (document.readyState === "complete") schedule();
    else window.addEventListener("load", schedule, { once: true });
    return () => {
      cancelled = true;
      window.removeEventListener("load", schedule);
      window.clearTimeout(timer);
      if (idleId !== undefined && "cancelIdleCallback" in window) window.cancelIdleCallback(idleId);
    };
  }, []);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [progress, setProgress] = useState<number | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [galleryTargets, setGalleryTargets] = useState<HTMLElement[]>([]);
  const [setupTarget, setSetupTarget] = useState<HTMLElement | null>(null);
  const [couponTarget, setCouponTarget] = useState<HTMLElement | null>(null);
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const sync = () => {
      setDownloadTarget(root.querySelector<HTMLElement>("#text-download-controls"));
      setPurchaseTarget(root.querySelector<HTMLElement>("#text-hero-purchase"));
      const galleries = Array.from(root.querySelectorAll<HTMLElement>('[data-gallery-control]'));
      setGalleryTargets(previous => previous.length === galleries.length && previous.every((node, index) => node === galleries[index]) ? previous : galleries);
      setSetupTarget(root.querySelector<HTMLElement>("#text-setup-controls"));
      setCouponTarget(root.querySelector<HTMLElement>("#text-coupon-controls"));
      setPricingDownload(root.querySelector<HTMLElement>("#text-pricing-download"));
      const targets = Array.from(root.querySelectorAll<HTMLElement>("#text-hero-countdown, #text-pricing-countdown"));
      setPriceTargets((previous) => previous.length === targets.length && previous.every((node, index) => node === targets[index]) ? previous : targets);
    };
    sync();
    const observer = new MutationObserver(records => {
      if (records.some(record => [...record.addedNodes, ...record.removedNodes].some(node => node instanceof Element && !node.closest('#text-hero-countdown, #text-pricing-countdown, .media-state-overlay')))) sync();
    });
    observer.observe(root, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [offer]);

  const startDownload = async () => {
    const href = product.downloadHref;
    if (!href) return;
    setProgress(0);
    try {
      const res = await fetch(href);
      const total = Number(res.headers.get("content-length") ?? 0);
      const reader = res.body?.getReader();
      if (!reader) throw new Error("no-stream");
      const chunks: Uint8Array[] = [];
      let got = 0;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          chunks.push(value);
          got += value.length;
          setProgress(total ? Math.min(99, Math.round((got / total) * 100)) : 50);
        }
      }
      setProgress(100);
      const url = URL.createObjectURL(new Blob(chunks as BlobPart[], { type: "application/zip" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = "Ghostae-Text-V1.3-FREE.zip";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    } catch {
      window.location.href = href;
    }
    setTimeout(() => {
      setProgress(null);
      setKeyOpen(true);
    }, 600);
  };

  const [zoomSrc, setZoomSrc] = useState<string | null>(null);
  const closeModal = () => setZoomSrc(null);
  const [showcase, setShowcase] = useState<Record<string, [string, string, string][]> | null>(null);
  const [full, setFull] = useState<{ k: string; i: number } | null>(null);
  useEffect(() => {
    let t = 0,
      n = 0,
      started = false,
      data: Record<string, [string, string, string][]> | null = null;
    const visible = new Set<HTMLImageElement>();
    const tick = () => {
      if (!data || document.hidden) return;
      visible.forEach((img) => {
         const list = data?.[img.dataset.gifSlot ?? ""];
        const idx = Number(img.dataset.idx ?? 0);
       if (list?.length && img.dataset.mediaState !== 'loading') img.src = list[(n * 6 + idx) % list.length][2];
      });
      n++;
    };
    // Load GIFs only for slots near the viewport; rotate only those.
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          const img = e.target as HTMLImageElement;
          if (e.isIntersecting) {
            visible.add(img);
            if (data && !img.getAttribute("src")) {
              const list = data[img.dataset.gifSlot ?? ""];
              const idx = Number(img.dataset.idx ?? 0);
              if (list?.length) img.src = list[((n ? n - 1 : 0) * 6 + idx) % list.length][2];
            }
          } else visible.delete(img);
        });
        if (!started && visible.size) {
          started = true;
          void import("../../content/text-page/showcase-data").then(({ SHOWCASE }) => {
            data = SHOWCASE;
            setShowcase(SHOWCASE);
            tick();
            t = window.setInterval(tick, 8000);
          });
        }
      },
      { rootMargin: "200px" },
    );
    const observe = () =>
      rootRef.current?.querySelectorAll<HTMLImageElement>("img[data-gif-slot]").forEach((img) => io.observe(img));
    observe();
    const mo = new MutationObserver(records => {
      if (records.some(record => [...record.addedNodes].some(node => node instanceof Element && (node.matches('img[data-gif-slot]') || node.querySelector('img[data-gif-slot]'))))) observe();
    });
    if (rootRef.current) mo.observe(rootRef.current, { childList: true, subtree: true });
    return () => {
      window.clearInterval(t);
      io.disconnect();
      mo.disconnect();
    };
  }, []);
  const fullList = full && showcase ? (showcase[full.k] ?? []) : [];
  const PAGE = 12;
  const pages = Math.max(1, Math.ceil(fullList.length / PAGE));
  const openModal = (src: string) => setZoomSrc(src);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeModal();
        setFull(null);
        setLaunchOpen(false);
        setMaintOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const onRootClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;

    const zoom = target.closest("[data-zoom]") as HTMLElement | null;
    if (zoom) {
      e.preventDefault();
      openModal(zoom.getAttribute("data-zoom") ?? "");
      return;
    }
    const fb = target.closest("[data-full]") as HTMLElement | null;
    if (fb) {
      e.preventDefault();
      setFull({ k: fb.getAttribute("data-full") ?? "", i: 0 });
      return;
    }
    if (target.closest("[data-modal-close]")) {
      e.preventDefault();
      closeModal();
      return;
    }

    const link = target.closest("a") as HTMLAnchorElement | null;
    if (!link) return;
    const hash = link.getAttribute("href") ?? "";
    if (hash === "#download") {
      e.preventDefault();
      window.location.href = DESKTOP_EXE;
    } else if (hash === "#mac-download") {
      e.preventDefault();
      setMacOpen(true);
    } else if (hash === "#buy") {
      e.preventDefault();
      setBuyOpen(true);
    } else if (hash === "#pricing") {
      e.preventDefault();
      rootRef.current?.querySelector("#pricing")?.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const items = Array.from(root.querySelectorAll<HTMLElement>(".tx-reveal"));
    if (typeof IntersectionObserver === "undefined") {
      items.forEach((el) => el.classList.add("tx-in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            en.target.classList.add("tx-in");
            io.unobserve(en.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    items.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const featuresSection = useMemo(() => (
    <section data-surface className="tx-anim bg-background px-4 py-24 text-foreground sm:px-6 sm:py-32" dangerouslySetInnerHTML={{ __html: featuresUi.html }} />
  ), []);

  const heroSection = useMemo(() => (
<section
            data-surface
             className="tx-hero"
            dangerouslySetInnerHTML={{
              __html: heroUi.html
                .replace("<!--HERO_SHOWCASE-->", HERO_SHOWCASE)
                .replace("<!--TEXT_DOWNLOAD_CONTROLS-->", '<div id="text-download-controls" class="grid w-full grid-cols-2 gap-2 sm:flex"></div>')
                .replace("<!--TEXT_OFFER_BADGE-->", offer && offer.discount > 0
                  ? `<span data-discount-badge class="tx-buy-badge">৳${offer.discount.toLocaleString("bn-BD")} ছাড়</span>` : ""),
            }}
          />
  ), [offer]);

  return (
    <GhostShell>
      <style
        dangerouslySetInnerHTML={{
          __html:
            heroUi.css.replace(/\bbody\s*\{/g, ".tx-raw {") + featuresUi.css +
            "\n.tx-raw { font-family: 'Ghostae Payment Bangla', -apple-system, system-ui, sans-serif; font-weight: 300; }" +
            "\n.tx-raw .tx-reveal{opacity:0;transform:translateY(24px);transition:opacity .5s ease,transform .5s ease}" +
            "\n.tx-raw .tx-reveal.tx-in{opacity:1;transform:none}" +
            "\n@media (prefers-reduced-motion: reduce){.tx-raw .tx-reveal{opacity:1;transform:none;transition:none}}",
        }}
      />
      <div ref={rootRef} onClick={onRootClick} onPointerOver={(event) => { if (event.target instanceof Element && event.target.closest('a[href="#buy"]')) warmBuyDialog(); }} onFocusCapture={(event) => { if (event.target.closest('a[href="#buy"]')) warmBuyDialog(); }} onTouchStart={(event) => { if (event.target instanceof Element && event.target.closest('a[href="#buy"]')) warmBuyDialog(); }} className="tx-raw">
        <main>
          {heroSection}
          <TextFeatureVideo />
          {featuresSection}
          <Suspense fallback={<div className="min-h-[40vh] bg-slate-100/80" aria-hidden="true" />}>
            <TextDeferredContent key={offer ? `offer-${offer.amount}` : "regular"} offer={offer} />
          </Suspense>

          <div className="tx-proof-section"><ProofCarousel title="পেমেন্টের প্রমাণ" previewCount={10} /></div>

          {/* FAQ */}
          <section data-surface className="tx-reveal bg-slate-100/80 py-24 sm:py-32 px-4 sm:px-6">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-10">
                <div className="inline-block px-8 py-3 rounded-2xl bg-white border border-slate-200/90 shadow-sm">
                  <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">সাধারণ প্রশ্ন</h2>
                </div>
              </div>
              <div className="space-y-3">
                {FAQS.map((f, i) => {
                  const open = openFaq === i;
                  return (
                    <div
                      key={f.q}
                      onClick={() => setOpenFaq(open ? null : i)}
                      className={`cursor-pointer rounded-2xl bg-white p-5 sm:p-6 border transition-all duration-300 ${open ? "border-blue-600 shadow-md shadow-blue-600/5" : "border-slate-200 hover:border-blue-400 hover:shadow-sm"}`}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <h3 className="text-[15px] sm:text-base font-bold text-slate-900">{f.q}</h3>
                        <span
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-lg font-bold transition-colors ${open ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-600"}`}
                        >
                          {open ? "−" : "+"}
                        </span>
                      </div>
                      {open && <p className="mt-3 text-sm text-slate-600 leading-relaxed">{f.a}</p>}
                    </div>
                  );
                })}
              </div>

              <div className="mt-10 border-y border-border border-l-2 border-l-danger py-6 pl-5 sm:pl-6">
                <h3 className="flex items-center gap-2 text-base font-medium text-danger"><ShieldAlert className="size-4" aria-hidden="true" />শর্তাবলী</h3>
                <ul className="mt-4 list-disc space-y-3 pl-5 text-sm leading-relaxed text-muted-fg marker:text-danger">
                  {TERMS.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
                <p className="mt-3 text-xs text-slate-500">
                  বিস্তারিত:{" "}
                  <a href="/terms" className="font-semibold text-blue-600 underline">
                    Terms
                  </a>{" "}
                  ·{" "}
                  <a href="/refund" className="font-semibold text-blue-600 underline">
                    Refund
                  </a>
                </p>
              </div>

              {/* WhatsApp group */}
              <div className="mt-16 border-y border-line py-8 sm:mt-20 sm:py-10">
                <div className="grid gap-6 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                  <div className="flex min-w-0 items-start gap-4">
                    <span className="grid size-12 shrink-0 place-items-center rounded-full bg-success/10 text-success"><WhatsAppIcon className="size-6" /></span>
                    <div className="min-w-0">
                      <p className="mb-1 text-xs font-light text-success">GHOSTAE · একসাথে তৈরি করি</p>
                      <h3 className="text-xl font-medium text-foreground sm:text-2xl">হোয়াটসঅ্যাপ কমিউনিটি</h3>
                      <p className="mt-2 text-sm font-light leading-6 text-muted-fg">নতুন আপডেট, কাজের কথা ও সরাসরি সাপোর্ট।</p>
                    </div>
                  </div>
                  <Button asChild variant="outline" className="h-11 w-full gap-2 border-success/40 bg-success/10 px-6 font-medium text-success hover:bg-success/15 hover:text-success sm:w-auto">
                    <a href={WHATSAPP_GROUP} target="_blank" rel="noreferrer"><WhatsAppIcon className="size-4" />যোগ দিন<ArrowUpRight className="size-4" /></a>
                  </Button>
                </div>
              </div>
            </div>
          </section>
          <div className="px-4 sm:px-6"><RelatedProducts currentSlug="text" /></div>
        </main>
      </div>

      {galleryTargets.map(target => createPortal(
        <Button variant="ghost" size="icon" className="size-10 shrink-0 text-primary" aria-label={`${target.dataset.galleryControl === 'presets' ? 'প্রিমিয়াম অ্যানিমেশন' : target.dataset.galleryControl === 'templates' ? 'স্টাইলিশ অ্যানিমেশন' : 'ইমোজি'} সব দেখুন`} title="সব দেখুন" onClick={() => { const key = target.dataset.galleryControl; if (key) setFull({ k: key, i: 0 }); }}><ArrowRight className="size-4" /></Button>, target, target.dataset.galleryControl,
      ))}
      {downloadTarget && createPortal(
        <>
           <Button asChild className="tx-download-button h-11 min-w-0 rounded-md px-3 text-xs font-semibold sm:px-5 sm:text-sm">
             <a href={DESKTOP_EXE}>Windows Download</a>
          </Button>
           <Button variant="outline" className="h-11 min-w-0 rounded-md px-3 text-xs font-semibold sm:px-5 sm:text-sm" onClick={() => setMacOpen(true)}>Mac Download</Button>
        </>,
        downloadTarget,
      )}
      {purchaseTarget && createPortal(
        <Button className="tx-buy h-auto whitespace-normal" onPointerEnter={warmBuyDialog} onFocus={warmBuyDialog} onClick={() => setBuyOpen(true)}>
          <span className="tx-buy-label">লাইফটাইম কিনুন</span>
          <span data-offer-price className="tx-buy-price">{offer ? `৳${offer.amount.toLocaleString("bn-BD")}` : "—"}</span>
          <ArrowUpRight className="tx-buy-arrow" aria-hidden="true" />
        </Button>, purchaseTarget,
      )}
      {setupTarget && createPortal(<div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground"><Button variant="link" className="h-auto p-0 text-xs" onClick={() => setMacOpen(true)}>সেটআপ দেখুন</Button></div>, setupTarget)}
      {couponTarget && createPortal(<PublicCouponBanner slug="text" compact />, couponTarget)}
      {pricingDownload && createPortal(<Button asChild className="tx-download-button h-11 w-full rounded-md text-sm font-semibold"><a href={DESKTOP_EXE}>উইন্ডোজ ডাউনলোড</a></Button>, pricingDownload)}
      {schedule && priceTargets.map((target) => createPortal(<TextPriceCountdown schedule={schedule} onExpire={() => setPriceRevision((value) => value + 1)} />, target, target.id))}
      {macOpen && (
        <Suspense fallback={null}>
          <TextMacSetupDialog open={macOpen} onOpenChange={setMacOpen} />
        </Suspense>
      )}
      {launchOpen && (
        <Suspense fallback={null}>
          <TextLaunchDialog onClose={() => setLaunchOpen(false)} />
        </Suspense>
      )}

      {full && fullList.length > 0 && (
        <div
          className="fixed inset-0 z-[120] flex items-center bg-slate-950/70 p-4 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setFull(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-blue-500/40 bg-gradient-to-br from-blue-700/90 via-slate-950 to-slate-950 p-4 shadow-2xl shadow-blue-600/40 sm:p-6"
          >
            <button
              type="button"
              onClick={() => setFull(null)}
              aria-label="বন্ধ করুন"
              className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-slate-950/60 text-white transition hover:bg-blue-600"
            >
              ✕
            </button>
            <p className="pr-12 text-sm font-bold text-white">
              সব প্রিভিউ{" "}
              <span className="font-normal text-white/60">
                · মোট {fullList.length}টি · পেজ {full.i + 1}/{pages}
              </span>
            </p>
            <div className="mt-4 grid min-h-0 grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3 lg:grid-cols-4">
              {fullList.slice(full.i * PAGE, full.i * PAGE + PAGE).map((it) => (
                <figure key={it[2]} className="overflow-hidden rounded-xl border border-white/10 bg-slate-900">
                  <div className={`aspect-video bg-black ${full.k === "emojis" ? "p-4" : ""}`}>
                    <img
                      src={it[2]}
                      alt={it[0]}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <figcaption className="truncate px-2 py-1.5 text-[11px] text-white/70">{it[0]}</figcaption>
                </figure>
              ))}
            </div>
            {pages > 1 && (
              <div className="mt-4 flex items-center gap-3">
                <button
                  type="button"
                  disabled={full.i === 0}
                  onClick={() => setFull({ ...full, i: full.i - 1 })}
                  className="rounded-full bg-white/10 px-4 py-1.5 text-xs font-bold text-white hover:bg-blue-600 disabled:opacity-30"
                >
                  ‹ আগের
                </button>
                <span className="text-xs text-white/60">
                  {full.i + 1} / {pages}
                </span>
                <button
                  type="button"
                  disabled={full.i >= pages - 1}
                  onClick={() => setFull({ ...full, i: full.i + 1 })}
                  className="rounded-full bg-white/10 px-4 py-1.5 text-xs font-bold text-white hover:bg-blue-600 disabled:opacity-30"
                >
                  পরের ›
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {zoomSrc && (
        <div
          className="fixed inset-0 z-[120] flex items-center bg-slate-950/70 p-4 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-4xl overflow-hidden rounded-2xl border border-blue-500/40 bg-gradient-to-br from-blue-700/90 via-slate-950 to-slate-950 p-4 shadow-2xl shadow-blue-600/40 sm:p-6"
          >
            <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-blue-600/50 blur-3xl" />
            <button
              type="button"
              onClick={closeModal}
              aria-label="বন্ধ করুন"
              className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-slate-950/60 text-white transition hover:bg-blue-600"
            >
              ✕
            </button>
            <div className="relative mt-8 aspect-video w-full overflow-hidden rounded-xl border border-white/15 bg-slate-950">
              <img src={zoomSrc} alt="Preview" className="h-full w-full object-contain" />
            </div>
            <button
              type="button"
              onClick={closeModal}
              className="relative mt-4 w-full rounded-full bg-blue-600 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
            >
              ঠিক আছে
            </button>
          </div>
        </div>
      )}

      {maintOpen && (
        <div
          className="fixed inset-0 z-[96] flex items-center bg-slate-950/50 p-4 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setMaintOpen(false);
          }}
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl dark:bg-slate-900">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-500/15">
              <svg aria-hidden="true" className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 0 0-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 0 0-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 0 0-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 0 0-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 0 0 1.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"
                />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-extrabold text-slate-900 dark:text-slate-50">মেইনটেন্যান্স চলছে</h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              ডাউনলোড সাময়িকভাবে বন্ধ আছে। আমরা খুব দ্রুত সব ঠিক করে ফিরিয়ে আনছি — আপডেট পেতে WhatsApp গ্রুপে থাকুন।
            </p>
            <a
              href={WHATSAPP_GROUP}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-emerald-600/25 transition-transform hover:scale-[1.02]"
            >
              <MessageCircle size={15} />
              WhatsApp গ্রুপে জয়েন করুন
            </a>
            <button
              type="button"
              onClick={() => setMaintOpen(false)}
              className="mt-4 block w-full rounded-full border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              ঠিক আছে
            </button>
          </div>
        </div>
      )}

      {progress !== null && (
        <div className="fixed inset-0 z-[95] flex items-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
              {progress < 100 ? "ডাউনলোড হচ্ছে…" : "ডাউনলোড সম্পন্ন!"}
            </p>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
              <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${progress}%` }} />
            </div>
            <p className="mt-2 text-right text-xs font-bold text-blue-600">{progress}%</p>
          </div>
        </div>
      )}

      <Suspense fallback={buyOpen ? <PurchaseLoading /> : null}>
        {buyOpen && <BuyDialog product={product} initialPlan="text_lifetime" onClose={() => setBuyOpen(false)} />}
        {keyOpen && (
          <LicenceKeyDialog
            product={product.name}
            plan="free"
            guideHref={INSTALL_GUIDE}
            onClose={() => setKeyOpen(false)}
          />
        )}
      </Suspense>
    </GhostShell>
  );
}
