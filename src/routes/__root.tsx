import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,

  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { I18nProvider } from "../lib/i18n";
import { Toaster } from "@/components/ui/sonner";
const GhostAssistant = lazy(() =>
  import("@/components/ghost/GhostAssistant").then((m) => ({ default: m.GhostAssistant })),
);

function DeferredAssistant() {
  const [ready, setReady] = useState(false);
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  useEffect(() => {
    const w = window as any;
    if (w.requestIdleCallback) {
      const id = w.requestIdleCallback(() => setReady(true), { timeout: 5000 });
      return () => w.cancelIdleCallback?.(id);
    }
    const t = window.setTimeout(() => setReady(true), 3500);
    return () => window.clearTimeout(t);
  }, []);
  return ready && pathname !== '/payment' ? <Suspense fallback={null}><GhostAssistant /></Suspense> : null;
}


function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  const safeError = error instanceof Error ? error : new Error(String(error));
  console.error(safeError);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(safeError, { boundary: "tanstack_root_error_component" });
  }, [safeError]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "author", content: "Ghostae" },
      { name: "robots", content: "index, follow, max-image-preview:large, max-snippet:-1" },
      { name: "theme-color", content: "#0b1020" },
      { name: "google-site-verification", content: "googlea0b534636e583c8e.html" },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Ghostae" },
      { property: "og:locale", content: "en_US" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@ghostae" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.png", type: "image/png", sizes: "64x64" },
      { rel: "icon", href: "/favicon-96x96.png", type: "image/png", sizes: "96x96" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png", sizes: "180x180" },
      { rel: "manifest", href: "/site.webmanifest" },
      { rel: "dns-prefetch", href: "https://qzpvqycykdqxlwfcawli.supabase.co" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Ghostae",
          url: "https://ghostae.com",
          logo: "https://ghostae.com/web-app-manifest-512x512.png",
          description:
            "Ghostae builds creative automation extensions for Adobe After Effects.",
        }),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

/** Paths already counted in this browser session. */
const seenPaths = new Set<string>();

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="antialiased">
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  // The homepage renders the same widget inline (with its hero particle effect),
  // so mount the shared one everywhere else.
  const hideAssistant = pathname === "/" || pathname.startsWith("/products");

  // After a new publish, old hashed chunks disappear; reload once to fetch the new build.
  useEffect(() => {
    const onErr = (e: Event) => {
      const k = "ghost-chunk-reload";
      if (sessionStorage.getItem(k)) return;
      sessionStorage.setItem(k, "1");
      e.preventDefault();
      window.location.reload();
    };
    window.addEventListener("vite:preloadError", onErr);
    const t = window.setTimeout(() => sessionStorage.removeItem("ghost-chunk-reload"), 10000);
    return () => {
      window.removeEventListener("vite:preloadError", onErr);
      window.clearTimeout(t);
    };
  }, []);

  // Visitor counting for the admin dashboard: idle-deferred, once per path per
  // session, so it never competes with a navigation the user just triggered.
  useEffect(() => {
    if (pathname.startsWith("/admin")) return;
    if (seenPaths.has(pathname)) return;
    seenPaths.add(pathname);
    let cancelled = false;
    const run = () => {
      void (async () => {
        try {
          const { trackPageView } = await import("../lib/admin-dash.functions");
          if (!cancelled) await trackPageView({ data: { path: pathname } });
        } catch {
          /* ignore */
        }
      })();
    };
    const idle = (window as unknown as { requestIdleCallback?: (cb: () => void) => number })
      .requestIdleCallback;
    const id = idle ? idle(run) : window.setTimeout(run, 1200);
    return () => {
      cancelled = true;
      if (!idle) window.clearTimeout(id);
    };
  }, [pathname]);


  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
        <Outlet />
        {!hideAssistant && <DeferredAssistant />}
        <Toaster position="bottom-center" theme="dark" />
      </I18nProvider>
    </QueryClientProvider>
  );
}

