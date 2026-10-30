import { RelatedProducts } from "@/components/ghost/RelatedProducts";
import { lazy, Suspense, useState } from "react";
import { PurchaseLoading } from '@/components/ghostae/PurchaseLoading';
const BuyDialog = lazy(() => import("../../components/ghostae/BuyDialog").then((m) => ({ default: m.BuyDialog })));
const LicenceKeyDialog = lazy(() =>
  import("../../components/ghostae/LicenceKeyDialog").then((m) => ({ default: m.LicenceKeyDialog })),
);
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowRight, Check, Clock, Download, ExternalLink, MessageCircle, Tag, X } from "lucide-react";
import { GhostShell } from "../../components/ghost/Shell";
import { useLang } from "../../lib/i18n";
import { findProduct } from "../../lib/products-catalog";
import { getFreeResourceBySlug, type FreeResource } from "../../lib/free-resources.functions";
import { ProductNotFound } from "../../components/ghost/ProductNotFound";

const COMMUNITY = "https://chat.whatsapp.com/BdoH5Xpn4iFEGEbn4j5WLf";

export const Route = createFileRoute("/products/$slug")({
  loader: async ({ params }) => {
    const product = findProduct(params.slug);
    if (product) return { product, resource: null };
    const resource = await getFreeResourceBySlug({ data: { slug: params.slug } });
    if (!resource) throw notFound();
    return { product: null, resource };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Product not found — GhostAE" }, { name: "robots", content: "noindex" }] };
    }
    const { product, resource } = loaderData;
    const title = `${product?.name ?? resource?.title ?? "Resource"} — GhostAE`;
    const description = product?.tagline.en ?? resource?.description ?? "Free Ghostae resource.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: product ? "product" : "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: ProductPage,
  notFoundComponent: ProductNotFound,
});

function ProductPage() {
  const { product, resource } = Route.useLoaderData();
  if (resource) return <ResourcePage resource={resource} />;
  if (!product) return <ProductNotFound />;
  const { lang } = useLang();
  const en = lang === "en";
  const available = product.status === "available";
  const [buyOpen, setBuyOpen] = useState(false);
  const [keyOpen, setKeyOpen] = useState(false);


  return (
    <GhostShell>
      <section className="mx-auto max-w-4xl py-10 sm:py-14">
        <Link to="/products" className="text-[12px] font-semibold text-blue-600 dark:text-blue-300">
          ← {en ? "All products" : "সব প্রোডাক্ট"}
        </Link>

        <div className="mt-4 flex flex-wrap items-center gap-2.5">
          {available ? (
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[9.5px] font-black tracking-[0.2em] text-emerald-600 uppercase dark:text-emerald-300">
              {en ? "Available now" : "এখনই উপলব্ধ"}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full border border-blue-500/25 bg-blue-500/10 px-3 py-1 text-[9.5px] font-black tracking-[0.2em] text-blue-600 uppercase dark:text-blue-300">
              <Clock className="h-3 w-3" /> {en ? "Coming soon" : "শীঘ্রই"}
            </span>
          )}
        </div>

        <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#0b1020] sm:text-5xl dark:text-white">
          {product.name}
        </h1>
        <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-slate-600 sm:text-lg dark:text-blue-200/60">
          {en ? product.tagline.en : product.tagline.bn}
        </p>

        {available && (
          <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
            {product.downloadHref && (
              <div className="relative">
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[8.5px] font-black tracking-[0.16em] text-emerald-600 uppercase dark:text-emerald-300">
                  {en ? "Try free" : "ফ্রি ট্রাই"}
                </span>
                <a
                  href={product.downloadHref}
                  onClick={() => setTimeout(() => setKeyOpen(true), 700)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-[14px] font-bold text-slate-900 transition-all hover:border-blue-500/60 hover:text-blue-600 hover:scale-105 active:scale-95 dark:border-blue-900/40 dark:bg-blue-900/10 dark:text-white"
                >
                  <Download className="h-4 w-4" />
                  Download
                </a>
              </div>
            )}

            <button
              type="button"
              onClick={() => setBuyOpen(true)}
              className="group inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-[14px] font-bold !text-white shadow-[0_10px_30px_-10px_rgba(37,99,235,0.5)] transition-all hover:bg-blue-500 hover:scale-105 active:scale-95"
            >
              <Tag className="h-4 w-4" />
              {en ? "Buy now" : "এখনই কিনুন"}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        )}

        {available && (
          <p className="mt-4 text-[12px] text-slate-600 dark:text-blue-200/60">
            {en ? "Need help or a licence key? " : "সাহায্য বা লাইসেন্স কী দরকার? "}
            <a
              href="https://wa.me/8801345407572"
              target="_blank"
              rel="noreferrer"
              className="font-bold text-blue-600 dark:text-blue-300"
            >
              WhatsApp +880 1345 407572
            </a>
            {" · "}
            <a href="tel:+8801345407572" className="font-bold text-blue-600 dark:text-blue-300">
              {en ? "Call" : "কল"}
            </a>
          </p>
        )}


        <Suspense fallback={buyOpen ? <PurchaseLoading /> : null}>
        {buyOpen && <BuyDialog product={product} onClose={() => setBuyOpen(false)} />}
        {keyOpen && <LicenceKeyDialog product={product.name} onClose={() => setKeyOpen(false)} />}
        </Suspense>



        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 dark:border-blue-900/30 dark:bg-blue-950/10">
            <h2 className="text-[15px] font-bold text-[#0b1020] dark:text-white">
              {en ? "About this product" : "এই প্রোডাক্ট সম্পর্কে"}
            </h2>
            <p className="mt-2.5 text-[13px] leading-relaxed text-slate-600 dark:text-blue-200/60">
              {en ? product.description.en : product.description.bn}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 dark:border-blue-900/30 dark:bg-blue-950/10">
            <h2 className="text-[15px] font-bold text-[#0b1020] dark:text-white">
              {en ? "What you get" : "কী কী পাচ্ছেন"}
            </h2>
            <ul className="mt-2.5 space-y-2">
              {product.highlights.map((h) => (
                <li key={h.en} className="flex gap-2 text-[13px] leading-snug text-slate-600 dark:text-blue-100/70">
                  <Check className="mt-[2px] h-3.5 w-3.5 shrink-0 text-blue-500" />
                  <span>{en ? h.en : h.bn}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
      <RelatedProducts currentSlug={product.slug} />
    </GhostShell>
  );
}

function ResourcePage({ resource }: { resource: FreeResource }) {
  const { lang } = useLang();
  const en = lang === "en";
  const [communityOpen, setCommunityOpen] = useState(false);

  const download = () => {
    const seen = window.localStorage.getItem("ghostae-community-invite-seen") === "1";
    if (!seen) {
      setCommunityOpen(true);
      return;
    }
    window.open(resource.download_url, "_blank", "noopener,noreferrer");
  };
  const continueDownload = (join: boolean) => {
    window.localStorage.setItem("ghostae-community-invite-seen", "1");
    setCommunityOpen(false);
    if (join) window.open(COMMUNITY, "_blank", "noopener,noreferrer");
    window.open(resource.download_url, "_blank", "noopener,noreferrer");
  };

  return (
    <GhostShell>
      <article className="mx-auto max-w-4xl py-8 sm:py-14">
        <Link to="/products" className="text-xs font-semibold text-blue-600">← {en ? "Free resources" : "ফ্রি রিসোর্স"}</Link>
        <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_22px_60px_-46px_rgba(15,23,42,.65)] sm:rounded-3xl">
          {resource.image_url && <img src={resource.image_url} alt={resource.title} width={960} height={540} className="aspect-video w-full object-cover" />}
          <div className="p-5 sm:p-8">
            <span className="text-[10px] font-black uppercase text-blue-600">Free Extension &amp; Resource</span>
            <h1 className="mt-2 text-2xl font-bold text-slate-950 sm:text-4xl">{resource.title}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">{resource.description}</p>
            <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
              <button type="button" onClick={download} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white">
                <Download className="h-4 w-4" /> Download
              </button>
              {resource.tutorial_url && <a href={resource.tutorial_url} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-800">
                <ExternalLink className="h-4 w-4" /> Tutorial
              </a>}
            </div>
          </div>
        </div>
        <RelatedProducts currentSlug={resource.slug} />
      </article>

      {communityOpen && <div className="fixed inset-0 z-[90] grid place-items-center bg-slate-950/45 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
        <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl">
          <button type="button" aria-label="Close" onClick={() => continueDownload(false)} className="absolute right-3 top-3 rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X className="h-4 w-4" /></button>
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-emerald-50 text-emerald-600"><MessageCircle className="h-6 w-6" /></span>
          <h2 className="mt-4 text-xl font-bold text-slate-950">{en ? "Join our creative community" : "আমাদের ক্রিয়েটিভ কমিউনিটিতে যুক্ত হন"}</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">{en ? "Get new free resources, updates and support in our WhatsApp group." : "নতুন ফ্রি রিসোর্স, আপডেট ও সহায়তা পেতে WhatsApp গ্রুপে যুক্ত হন।"}</p>
          <button type="button" onClick={() => continueDownload(true)} className="mt-5 w-full rounded-xl bg-emerald-500 px-4 py-3 text-sm font-bold text-white">Join &amp; Download</button>
          <button type="button" onClick={() => continueDownload(false)} className="mt-2 w-full px-4 py-2 text-xs font-semibold text-slate-500">Continue without joining</button>
        </div>
      </div>}
    </GhostShell>
  );
}
