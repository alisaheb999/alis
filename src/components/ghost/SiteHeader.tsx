import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Menu, X, User } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/products", label: "Products" },
  { to: "/docs", label: "Docs" },
  { to: "/security", label: "Security" },
  { to: "/trust", label: "Trust" },
] as const;

/**
 * SiteHeader — the single capsule header used on every page.
 * Visual language matches the home page hero header exactly.
 */
export function SiteHeader() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [menuOpen, setMenuOpen] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Hide on scroll down, reveal on scroll up.
  useEffect(() => {
    let last = window.scrollY;
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const y = window.scrollY;
        if (Math.abs(y - last) > 6) {
          setHidden(y > last && y > 120);
          last = y;
        }
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  const { data: session } = useQuery({
    queryKey: ["supabase-session"],
    queryFn: async () => (await supabase.auth.getSession()).data.session,
  });

  const isActive = (to: string) => (to === "/" ? pathname === "/" : pathname.startsWith(to));

  return (
    <header
      className={`sticky top-2 z-30 mx-3 mt-2 flex max-w-7xl items-center justify-between rounded-2xl border border-slate-200/80 bg-gradient-to-b from-white/95 to-white/80 px-4 py-2.5 shadow-[0_14px_40px_-18px_rgba(15,23,42,.35),inset_0_1px_0_rgba(255,255,255,.9)] ring-1 ring-white/70 backdrop-blur-2xl transition-all duration-300 sm:top-3 sm:mx-auto sm:mt-3 sm:w-[calc(100%-2rem)] sm:px-7 sm:py-3 ${
        hidden ? "pointer-events-none -translate-y-full opacity-0" : "translate-y-0 opacity-100"
      }`}
    >
      {/* Brand */}
      <Link to="/" aria-label="Ghostae home" className="group flex shrink-0 items-center gap-3.5">
        <div className="h-9 w-9 overflow-hidden rounded-xl border border-primary/30 shadow-sm transition-transform duration-300 group-hover:scale-105">
          <img src="/web-app-manifest-192x192.png" alt="Ghostae logo" width={36} height={36} fetchPriority="high" className="h-full w-full object-cover" />
        </div>
        <span className="text-[18px] font-extrabold text-foreground transition-colors group-hover:text-primary">
          Ghostae
        </span>
      </Link>

      {/* Capsule nav */}
      <nav className="hidden items-center rounded-full border border-slate-200/80 bg-white/80 px-1.5 py-1 shadow-[0_4px_20px_rgba(0,0,0,0.03)] ring-1 ring-white/90 backdrop-blur-xl md:flex">
        {NAV.map((n) => {
          const active = isActive(n.to);
          return (
            <Link
              key={n.to}
              to={n.to}
              className={
                active
                  ? "relative rounded-full bg-[#2563eb] px-4 py-1.5 text-[12.5px] font-medium tracking-wide !text-white shadow-sm shadow-blue-500/25 transition-all"
                  : "rounded-full px-4 py-1.5 text-[12.5px] font-light text-slate-600 transition-colors hover:bg-slate-100/60 hover:text-slate-950"
              }
            >
              {n.label}
            </Link>
          );
        })}
      </nav>

      {/* Right controls */}
      <div className="flex items-center gap-2">
        <Link
          to={session?.user ? "/dashboard" : "/auth"}
          aria-label={session?.user ? "Dashboard" : "Sign in"}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2563eb] text-white shadow-md shadow-blue-500/25 ring-2 ring-white transition-all duration-200 hover:bg-blue-700 active:scale-95"
        >
          {session?.user ? (
            <span className="text-[12px] font-bold">
              {session.user.email?.[0]?.toUpperCase() ?? "G"}
            </span>
          ) : (
            <User size={16} />
          )}
        </Link>

        <button
          onClick={() => setMenuOpen((v) => !v)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:text-blue-600 md:hidden"
        >
          {menuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="absolute left-4 right-4 top-[62px] z-40 rounded-2xl border border-slate-200 bg-white/95 p-2 shadow-xl backdrop-blur-xl md:hidden">
          <nav className="grid gap-1">
            {NAV.map((n) => {
              const active = isActive(n.to);
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  onClick={() => setMenuOpen(false)}
                  className={`rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                    active ? "bg-[#2563eb] !text-white" : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {n.label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}
