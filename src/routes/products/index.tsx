import { createFileRoute, Link } from "@tanstack/react-router";
import { Download } from "lucide-react";
import { GhostShell } from "../../components/ghost/Shell";
import { useLang } from "../../lib/i18n";
import { ExtensionGrid } from "@/components/ghost/ExtensionGrid";
import { getFreeResources } from "../../lib/free-resources.functions";
import { DigitalProductsSection } from "@/components/ghost/DigitalProductsSection";
import { GearSection } from "@/components/ghost/GearSection";

export const Route = createFileRoute("/products/")({
  loader: () => getFreeResources().catch(() => [] as Awaited<ReturnType<typeof getFreeResources>>),
  head: () => ({
    meta: [
      { title: "GhostAE Products — After Effects Panels & Tools" },
      {
        name: "description",
        content: "Ghostae After Effects extensions, digital tools and AI product information, plus free creative resources.",
      },
      { property: "og:title", content: "GhostAE Products — After Effects Panels & Tools" },
      { property: "og:description", content: "Ghostae extensions, digital tools and AI product information, and free creative resources." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProductsPage,
});

function ProductsPage() {
  const { lang } = useLang();
  const en = lang === "en";
  const resources = Route.useLoaderData() ?? [];

  return (
    <GhostShell>
      <section className="mx-auto max-w-5xl pb-7 pt-4 sm:py-12">
        <h1 className="section-mark text-xl font-bold text-foreground sm:text-2xl">
          {en ? "Official Extensions" : "অফিসিয়াল এক্সটেনশন"}
        </h1>

        <div className="mt-4 sm:mt-7"><ExtensionGrid en={en} /></div>
      </section>

      <DigitalProductsSection />
      <GearSection />

      <section className="mx-auto max-w-5xl border-t border-slate-200 py-7 dark:border-blue-900/30 sm:py-10">
        <h2 className="section-mark flex items-center gap-2 text-lg font-bold text-foreground sm:text-xl">
          {en ? "Extensions & Resources" : "এক্সটেনশন ও রিসোর্স"}<span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">Free</span>
        </h2>

        {resources.length ? (
          <div className="mt-4 grid gap-2 sm:grid-cols-2 sm:gap-3">
            {resources.map((resource) => (
              <Link
                key={resource.id}
                to="/products/$slug"
                params={{ slug: resource.slug }}
                className="group grid grid-cols-[52px_minmax(0,1fr)] items-center gap-3 rounded-xl border border-slate-200 bg-white p-2 transition hover:border-blue-300 dark:border-blue-900/30 dark:bg-blue-950/10"
              >
                <div className="grid h-[52px] w-[52px] shrink-0 place-items-center overflow-hidden rounded-lg bg-slate-100 text-blue-600">
                  {resource.image_url ? (
                    <img src={resource.image_url} alt="" loading="lazy" decoding="async" width={104} height={104} className="h-full w-full object-cover" />
                  ) : (
                    <Download className="h-5 w-5" />
                  )}
                </div>
                <h3 className="line-clamp-2 min-w-0 text-xs font-bold leading-snug text-foreground sm:text-sm">{resource.title}</h3>
                
              </Link>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-xs text-slate-500">{en ? "Coming soon." : "শিগগিরই আসছে।"}</p>
        )}
      </section>
    </GhostShell>
  );
}