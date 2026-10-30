import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

/* Thin top progress bar: shows the instant a navigation starts fetching its
   route chunk, so a click never feels "stuck" while the code downloads. */
function RouteProgress() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[200] h-[3px] overflow-hidden bg-blue-500/15"
    >
      <div className="h-full w-1/3 animate-[ghost-route-progress_0.9s_ease-in-out_infinite] bg-blue-500" />
    </div>
  );
}

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    /* "intent" keeps first paint light (no eager fetch of every linked route
       chunk on load) while still preloading the moment a link is hovered or
       touched, so section-to-section navigation stays instant. */
    defaultPreload: "intent",
    defaultPreloadDelay: 0,
    defaultPreloadStaleTime: 10 * 60_000,
    defaultPreloadGcTime: 30 * 60_000,
    /* Give immediate feedback instead of freezing on the old page. */
    defaultPendingComponent: RouteProgress,
    defaultPendingMs: 100,
    defaultPendingMinMs: 0,
  });

  /* Warm the most-visited routes once the browser is idle, so taps on mobile
     (where there is no hover to trigger "intent" preloading) are instant. */
  if (typeof window !== "undefined") {
    const warm = () => {
      void router.preloadRoute({ to: "/products" }).catch(() => {});
      void router.preloadRoute({ to: "/products/caption" }).catch(() => {});
    };
    const idle = (window as unknown as { requestIdleCallback?: (cb: () => void) => void })
      .requestIdleCallback;
    if (idle) idle(warm);
    else window.setTimeout(warm, 1500);
  }

  return router;
};

