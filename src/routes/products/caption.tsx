import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { PurchaseLoading } from '@/components/ghostae/PurchaseLoading';
import { createFileRoute } from "@tanstack/react-router";
import { RelatedProducts } from "@/components/ghost/RelatedProducts";
import { GhostShell } from "../../components/ghost/Shell";
import type { LicencePlan } from "../../components/ghostae/LicenceKeyDialog";
const BuyDialog = lazy(() => import("../../components/ghostae/BuyDialog").then((m) => ({ default: m.BuyDialog })));
const LicenceKeyDialog = lazy(() =>
  import("../../components/ghostae/LicenceKeyDialog").then((m) => ({ default: m.LicenceKeyDialog })),
);
import { findProduct } from "../../lib/products-catalog";
import type { PaidPlanId } from "../../lib/pricing-catalog";
import { useServerFn } from '@tanstack/react-start';
import { getPublicOffer } from '@/lib/checkout.functions';
import landingHtml from "../../content/caption-landing.html?raw";
import winInstaller from "../../assets/Ghostae-Caption-Windows.zip.asset.json";
import macInstaller from "../../assets/Ghostae-Caption-Mac-v2.zip.asset.json";
import captionGuide from "../../assets/caption/ghostae-caption-v2-guide.mp4.asset.json";
const CAPTION_THUMB_URL =
  "https://qzpvqycykdqxlwfcawli.supabase.co/storage/v1/object/public/uploads/images/1789659886596-y4xolh.webp";
import "../../content/caption-landing.css";


const WHATSAPP_GROUP = "https://chat.whatsapp.com/BdoH5Xpn4iFEGEbn4j5WLf";
const TITLE = "Ghostae Caption — এআই অটো ক্যাপশন, মাত্র এক মিনিটে";
const DESC =
  "After Effects-এর ভেতরেই এআই অটো ক্যাপশন। লেয়ার সিলেক্ট করুন, স্টাইল বাছুন, টাইমলাইনে ক্যাপশন তৈরি হয়ে যাবে। ফ্রি প্ল্যান সহ Light ও Pro সাবস্ক্রিপশন।";

export const Route = createFileRoute("/products/caption")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "product" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: "https://ghostae.com/products/caption" },
      { property: "og:image", content: "https://qzpvqycykdqxlwfcawli.supabase.co/storage/v1/object/public/uploads/images/1789659886596-y4xolh.webp" },
      { name: "twitter:image", content: "https://qzpvqycykdqxlwfcawli.supabase.co/storage/v1/object/public/uploads/images/1789659886596-y4xolh.webp" },
    ],
    links: [{ rel: "canonical", href: "https://ghostae.com/products/caption" }],
    scripts: [{ type: "application/ld+json", children: JSON.stringify({"@context": "https://schema.org", "@type": "SoftwareApplication", "name": "Ghostae Caption", "applicationCategory": "MultimediaApplication", "operatingSystem": "Windows, macOS", "url": "https://ghostae.com/products/caption", "image": "https://qzpvqycykdqxlwfcawli.supabase.co/storage/v1/object/public/uploads/images/1789659886596-y4xolh.webp", "offers": [{"@type": "Offer", "name": "Free", "price": "0", "priceCurrency": "BDT", "availability": "https://schema.org/InStock"}, {"@type": "Offer", "name": "Light", "price": "199", "priceCurrency": "BDT", "availability": "https://schema.org/InStock"}, {"@type": "Offer", "name": "Pro", "price": "699", "priceCurrency": "BDT", "availability": "https://schema.org/InStock"}]}) }],
  }),
  component: CaptionDetailPage,
});

function CaptionDetailPage() {
  const product = findProduct("caption");
  const rootRef = useRef<HTMLDivElement>(null);
  const [buyPlan, setBuyPlan] = useState<PaidPlanId | null>(null);
  const [keyPlan, setKeyPlan] = useState<LicencePlan | null>(null);
  const fetchPrice = useServerFn(getPublicOffer);
  const [prices, setPrices] = useState<Record<string, number>>({});
  useEffect(() => {
    let active = true;
    void Promise.all(['light', 'pro'].map(async plan => [plan, (await fetchPrice({ data: { plan, cycle: 'monthly' } })).amount] as const))
      .then(rows => { if (active) setPrices(Object.fromEntries(rows)); }).catch(() => {});
    return () => { active = false; };
  }, [fetchPrice]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || !product) return;

    const notice = () => root.querySelector<HTMLElement>("#aeNoticeModal");
    const showNotice = (msg?: string) => {
      const modal = notice();
      const textEl = root.querySelector<HTMLElement>("#aeNoticeCustomText");
      if (!modal) return;
      if (textEl) {
        textEl.innerHTML = msg
          ? `${msg}<br><span class="text-blue-400 text-[11px] block mt-1.5 font-medium">After Effects Live Interface Preview</span>`
          : 'এই ফিচারটি শুধুমাত্র <b>Adobe After Effects</b> এক্সটেনশনের ভেতরে কাজ করে। এখানে শুধুমাত্র লাইভ অ্যানিমেশন প্রিভিউ দেখানো হচ্ছে।';
      }
      modal.classList.add("show");
    };
    const hideNotice = () => notice()?.classList.remove("show");

    const thumbnail = root.querySelector<HTMLImageElement>("[data-caption-thumbnail]");
    if (thumbnail) thumbnail.src = CAPTION_THUMB_URL;

    const startDownload = (plan: LicencePlan, href?: string) => {
      const url = href || product.downloadHref;
      if (url) {
        const a = document.createElement("a");
        a.href = url;
        a.rel = "noreferrer";
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
      setTimeout(() => setKeyPlan(plan), 700);
    };

    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      if (target.closest("[data-close-notice]")) {
        hideNotice();
        return;
      }
      const stop = target.closest("[data-stop]");
      if (stop && !target.closest("[data-close-notice]")) return;

      const actionEl = target.closest<HTMLElement>("[data-action]");
      const action = actionEl?.dataset.action;
      if (action === "play-guide") {
        const shell = actionEl?.closest<HTMLElement>("[data-caption-video]");
        if (!shell || shell.querySelector("video")) return;
        const video = document.createElement("video");
        video.src = captionGuide.url;
        video.controls = true;
        video.autoplay = true;
        video.playsInline = true;
        video.preload = "metadata";
        shell.replaceChildren(video);
        void video.play().catch(() => undefined);
        return;
      }
      if (action === "download" || action === "plan-free") {
        event.preventDefault();
        const os = actionEl?.dataset.os;
        startDownload("free", os === "mac" ? macInstaller.url : os === "win" ? winInstaller.url : undefined);
        return;
      }
      if (action === "plan-light") {
        setBuyPlan("light");
        return;
      }
      if (action === "plan-pro") {
        setBuyPlan("pro");
        return;
      }

      if (action === "whatsapp-group") return;

      const preset = target.closest<HTMLElement>("[data-preset]");
      if (preset) {
        const id = preset.dataset.preset!;
        root.querySelectorAll<HTMLElement>(".preset-card").forEach((el) => {
          el.classList.toggle("active", el.id === `preset-${id}`);
        });
        const status = root.querySelector<HTMLElement>("#status");
        if (status) status.textContent = `Selected style: ${id.replace("_", " ").toUpperCase()} (Live Preview)`;
        return;
      }

      const group = target.closest<HTMLElement>(".anim-group");
      if (group) {
        root.querySelectorAll<HTMLElement>(".anim-group").forEach((b) => b.classList.remove("active"));
        group.classList.add("active");
        const active = group.getAttribute("data-group");
        ["premium", "bounce", "smooth", "3d"].forEach((g) => {
          const el = root.querySelector<HTMLElement>(`#cat-${g}`);
          if (el) el.style.display = g === active ? "grid" : "none";
        });
        return;
      }

      const faq = target.closest<HTMLElement>("[data-faq]");
      if (faq) {
        const content = faq.querySelector<HTMLElement>(".faq-content");
        const icon = faq.querySelector<HTMLElement>(".faq-icon");
        const isOpen = content ? !content.classList.contains("hidden") : false;
        root.querySelectorAll<HTMLElement>(".faq-content").forEach((el) => el.classList.add("hidden"));
        root.querySelectorAll<HTMLElement>(".faq-icon").forEach((el) => (el.textContent = "+"));
        if (!isOpen && content && icon) {
          content.classList.remove("hidden");
          icon.textContent = "-";
        }
        return;
      }

      const noticeEl = target.closest<HTMLElement>("[data-notice]");
      if (noticeEl) {
        showNotice(noticeEl.dataset.notice || undefined);
      }
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") hideNotice();
    };

    root.querySelectorAll<HTMLAnchorElement>('[data-action="whatsapp-group"]').forEach((a) => {
      a.href = WHATSAPP_GROUP;
    });

    root.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      root.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [product?.downloadHref, prices]);

  if (!product) return null;
  const pricedHtml = landingHtml
    .replace('>৳199</span>', `>${prices.light !== undefined ? `৳${prices.light}` : '…'}</span>`)
    .replace('>৳699</span>', `>${prices.pro !== undefined ? `৳${prices.pro}` : '…'}</span>`);

  return (
    <GhostShell>
      <div
        ref={rootRef}
        className="caption-landing -mx-4 sm:-mx-6"
        dangerouslySetInnerHTML={{ __html: pricedHtml }}
      />

      <RelatedProducts currentSlug="caption" />
      <Suspense fallback={buyPlan ? <PurchaseLoading /> : null}>
      {buyPlan && <BuyDialog product={product} initialPlan={buyPlan} onClose={() => setBuyPlan(null)} />}
      {keyPlan && (
        <LicenceKeyDialog
          product={product.name}
          plan={keyPlan}
          onClose={() => setKeyPlan(null)}
        />
      )}
      </Suspense>
    </GhostShell>
  );
}
