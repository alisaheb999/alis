import { useEffect, useMemo, useRef, useState } from "react";

type ContentModule = { html: string };

const contentLoaders = {
  process: () => import("../../content/text-page/process"),
  pricing: () => import("../../content/text-page/pricing"),
} satisfies Record<string, () => Promise<ContentModule>>;

function DeferredHtml({
  loader,
  className,
  transform,
  id,
}: {
  loader: () => Promise<ContentModule>;
  className: string;
  transform?: (html: string) => string;
  id?: string;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [html, setHtml] = useState<string | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || html !== null) return;
    let active = true;
    const load = () => {
      void loader().then((module) => {
        if (active) setHtml(transform ? transform(module.html) : module.html);
      });
    };
    if (!("IntersectionObserver" in window)) {
      load();
      return () => {
        active = false;
      };
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        observer.disconnect();
        load();
      },
      { rootMargin: "500px 0px", threshold: 0 },
    );
    observer.observe(node);
    return () => {
      active = false;
      observer.disconnect();
    };
  }, [html, loader, transform]);

  // Keep authored DOM stable when parent updates so portalled controls survive.
  return useMemo(() => (
    <section
      ref={ref}
      id={id}
      data-surface
      className={`${className} min-h-[40vh]`}
      dangerouslySetInnerHTML={html ? { __html: html } : undefined}
      aria-busy={html === null}
    />
  ), [html, id, className]);
}

export function TextDeferredContent({
  offer,
}: {
  offer?: { listPrice: number; amount: number } | null;
}) {
  return (
    <>
      <DeferredHtml
        loader={contentLoaders.process}
         className="bg-slate-100 px-4 py-28 text-slate-900 sm:px-6 sm:py-32 lg:px-8"
        transform={(html) => `<div class="max-w-5xl mx-auto">${html}</div>`}
      />
      <DeferredHtml
        id="pricing"
        loader={contentLoaders.pricing}
         className="flex items-center justify-center bg-slate-100 px-4 py-28 text-slate-900 sm:px-6 sm:py-32 lg:px-8"
        transform={(html) => {
          if (!offer) return html;
          return html
            .replace(
              '<span data-list-price class="text-sm font-semibold text-slate-400 line-through">৳৪৯৯</span>',
              offer.listPrice > offer.amount ? `<span data-list-price class="text-sm font-semibold text-muted-foreground line-through">৳${offer.listPrice.toLocaleString("bn-BD")}</span>` : "",
            )
            .replace(
              '<span data-offer-price class="text-3xl font-extrabold text-blue-600">৳৩৪৯</span>',
              `<span data-offer-price class="text-3xl font-extrabold text-blue-600">৳${offer.amount.toLocaleString("bn-BD")}</span>`,
            )
            ;
        }}
      />
    </>
  );
}