import { Link } from "@tanstack/react-router";
import { Wrench } from "lucide-react";
import { PRODUCTS, type GhostProduct } from "@/lib/products-catalog";

/** Panels that run inside Adobe apps show Ae/Pr marks; desktop apps (Frame AI) do not. */
const ADOBE: Record<string, ("Ae" | "Pr")[]> = { text: ["Ae", "Pr"], caption: ["Ae"], cache: ["Ae", "Pr"] };

const ORDER: Record<GhostProduct["status"], number> = { available: 0, maintenance: 1, "coming-soon": 2 };

function AppMark({ app }: { app: "Ae" | "Pr" }) {
  return <span title={app === "Ae" ? "After Effects" : "Premiere Pro"} className={`grid size-4 shrink-0 place-items-center rounded-[4px] text-[7px] font-black ${app === "Ae" ? "app-mark-ae" : "app-mark-pr"}`}>{app}</span>;
}

/** Shared Official Extensions grid: available products first, unavailable ones last. */
export function ExtensionGrid({ en = true }: { en?: boolean }) {
  const items = [...PRODUCTS].sort((a, b) => ORDER[a.status] - ORDER[b.status]);
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:gap-x-8 sm:gap-y-10">
      {items.map((product, index) => {
        const locked = product.status !== "available";
        const marks = locked ? [] : ADOBE[product.slug] ?? [];
        const version = product.version ?? (product.slug === "caption" ? "V2" : undefined);
        const body = (
          <>
            <div className="relative">
              <div className={`aspect-[16/10] overflow-hidden rounded-xl bg-muted sm:rounded-2xl ${locked ? "opacity-60 grayscale-[40%]" : ""}`}>
                {product.image && (
                  <img src={product.image} alt={product.name} loading={index < 2 ? "eager" : "lazy"} fetchPriority={index < 2 ? "high" : "auto"} decoding="async" width={1024} height={640}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]" />
                )}
              </div>
              {version && <span className="absolute left-1.5 top-1.5 rounded-md bg-background/85 px-1.5 py-0.5 text-[9px] font-bold text-primary shadow-sm backdrop-blur sm:left-2.5 sm:top-2.5 sm:text-[11px]">{version}</span>}
              {locked && (
                <span className="absolute right-1.5 top-1.5 inline-flex items-center gap-0.5 rounded-md bg-background/85 px-1.5 py-0.5 text-[9px] font-semibold text-warning shadow-sm backdrop-blur sm:right-2.5 sm:top-2.5 sm:text-[11px]">
                  <Wrench className="size-2.5 shrink-0" />
                  {product.status === "coming-soon" ? (en ? "Soon" : "শীঘ্রই") : en ? "Maintenance" : "রক্ষণাবেক্ষণ"}
                </span>
              )}
            </div>
            <div className="mt-2 flex min-w-0 items-center gap-1.5 px-0.5">
              <h3 className="min-w-0 truncate text-[13px] font-bold text-foreground sm:text-lg">{product.name}</h3>
              {marks.length > 0 && <span className="ml-auto flex shrink-0 gap-0.5 rounded-md border border-border bg-surface p-0.5">{marks.map((m) => <AppMark key={m} app={m} />)}</span>}
            </div>
          </>
        );
        return (
          <article key={product.slug} className="group min-w-0">
            {locked ? (
              <div className="block cursor-default select-none" aria-disabled="true">{body}</div>
            ) : product.slug === 'chatgpt-plus-renew' ? (
              <Link to="/digital/live/chatgpt-plus-renew" className="block">{body}</Link>
            ) : product.slug === "frame-ai" ? (
              <Link to="/products/frame-ai" className="block">{body}</Link>
            ) : (
              <Link to="/products/$slug" params={{ slug: product.slug }} className="block">{body}</Link>
            )}
          </article>
        );
      })}
    </div>
  );
}
