import { Link, useRouterState } from "@tanstack/react-router";
import { useState, useEffect, type ReactNode } from "react";
import { useLang, useT, LOCALES, type StringKey, type Lang } from "../../lib/i18n";
import { Globe, Check, ChevronDown, Mail, Phone, Facebook, Youtube, MessageSquare, Search, User, LogOut, Settings, Key, Sun, Moon, Menu, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";
import { PublicCouponBanner } from './PublicCouponBanner';
import { ImageLoadingStates } from './ImageLoadingStates';
import { Gift } from 'lucide-react';
import { getGiveaway } from '@/lib/giveaway.functions';
import { Button } from '@/components/ui/button';



export const VERSION = "3.12.3";
export const ZIP_URL = "/Ghostae-Installer.zip";
export const ZIP_SHA256 = "1b5832a911a35f4f9a4af60d315a09e294a8a764aa9343d3f05fc16702ce616c";


const NAV: { to: string; key: StringKey }[] = [
  { to: "/", key: "nav_home" },
  { to: "/products", key: "nav_products" },

  { to: "/docs", key: "nav_docs" },

  { to: "/security", key: "nav_security" },
];


const CONTROL_BTN =
  "flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:border-blue-500/60 hover:text-blue-600 dark:border-blue-900/40 dark:bg-[#0b1020] dark:text-blue-100 dark:hover:text-white";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function LangToggle() {
  const { lang, setLang } = useLang();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={CONTROL_BTN}
        aria-label="Change language"
        aria-expanded={open}
      >
        <Globe size={16} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 z-50 max-h-[70vh] w-60 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-2xl dark:border-blue-900/40 dark:bg-[#0b1020]">
            {LOCALES.map((l) => {
              const active = lang === l.code;
              return (
                <button
                  key={l.code}
                  onClick={() => {
                    setLang(l.code as Lang);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left transition ${
                    active
                      ? "bg-blue-600 text-white"
                      : "text-slate-700 hover:bg-slate-100 dark:text-blue-100/70 dark:hover:bg-blue-600/15 dark:hover:text-white"
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[12px] font-semibold">{l.label}</span>
                    <span className={`block truncate text-[10px] ${active ? "text-white/70" : "text-slate-400 dark:text-blue-200/40"}`}>
                      {l.region}
                    </span>
                  </span>
                  {active && <Check size={12} className="shrink-0" />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function UserMenu() {
  const [open, setOpen] = useState(false);
  const { lang } = useLang();
  
  const { data: session } = useQuery({
    queryKey: ['supabase-session'],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    }
  });

  const user = session?.user;

  if (!user) {
    return (
      <Link
        to="/auth"
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-blue-500/30 bg-blue-600 text-white transition hover:bg-blue-500"
        title={lang === "en" ? "LOGIN" : "লগইন"}
      >
        <User size={16} />
      </Link>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={CONTROL_BTN}
      >
        <div className="h-5 w-5 rounded-full bg-blue-500/20 flex items-center justify-center text-[10px] font-bold">
          {user.email?.[0].toUpperCase()}
        </div>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 z-50 w-48 overflow-hidden rounded-xl border border-blue-900/40 bg-[#0b1020] p-1 shadow-2xl backdrop-blur-xl">
            <div className="px-3 py-2 border-b border-blue-900/20 mb-1">
              <div className="text-[10px] text-blue-200/40 truncate">{user.email}</div>
            </div>
            <Link
              to="/dashboard"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[11px] font-medium text-slate-700 transition hover:bg-slate-100 dark:text-blue-200/60 dark:hover:bg-blue-600/10 dark:hover:text-white"
            >
              <Settings size={14} />
              {lang === "en" ? "Dashboard" : "ড্যাশবোর্ড"}
            </Link>
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                window.location.reload();
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[11px] font-medium text-red-400 transition hover:bg-red-500/10"
            >
              <LogOut size={14} />
              {lang === "en" ? "Logout" : "লগআউট"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function ThemeButton() {
  return (
    <button
      onClick={() => {
        const isDark = document.documentElement.classList.contains("dark");
        const newTheme = isDark ? "light" : "dark";
        document.documentElement.classList.toggle("dark", newTheme === "dark");
        document.documentElement.classList.toggle("light", newTheme === "light");
        localStorage.setItem("theme", newTheme);
      }}
      className={CONTROL_BTN}
      aria-label="Toggle light or dark theme"
    >
      <Sun size={16} className="hidden dark:block" />
      <Moon size={16} className="block dark:hidden" />
    </button>
  );
}

export function GhostShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { data: giveaway } = useQuery({ queryKey: ['giveaway-public'], queryFn: () => getGiveaway().catch(() => null), staleTime: 300_000 });
  const t = useT();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Scroll-reveal for any element tagged .reveal-on-scroll
  useEffect(() => {
    if (typeof window === "undefined") return;
    const nodes = Array.from(document.querySelectorAll<HTMLElement>(".reveal-on-scroll"));
    if (!nodes.length) return;
    if (!("IntersectionObserver" in window)) {
      nodes.forEach((n) => n.classList.add("is-visible"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.08 },
    );
    nodes.forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, [pathname]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check for saved theme preference
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      document.documentElement.classList.toggle("dark", savedTheme === "dark");
      document.documentElement.classList.toggle("light", savedTheme === "light");
    } else {
      // Light mode is the default experience
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
      localStorage.setItem("theme", "light");
    }

    let lastScroll = 0;
    let frame = 0;
    const handleScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const currentScroll = window.pageYOffset;
        const header = document.getElementById("main-header");
        if (!header) return;
        const hide = currentScroll > lastScroll && currentScroll > 150;
        header.classList.toggle("-translate-y-full", hide);
        header.classList.toggle("opacity-0", hide);
        header.classList.toggle("nav-scrolled", currentScroll > 8);
        lastScroll = currentScroll;

      });
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);


  return (
    <div className="ghost-shell-root min-h-screen bg-[#fafcff] antialiased">
      <SiteHeader />
      <main className="ghost-main mx-auto w-full max-w-7xl px-4 pb-10 pt-2 sm:px-12 sm:pb-20 sm:pt-4">
        {/^\/products\/.+/.test(pathname) && (
          <Link
            to="/products"
            aria-label="সব পণ্যে ফিরুন"
            title="সব পণ্য"
            className="fixed bottom-5 left-4 z-40 inline-flex size-11 items-center justify-center rounded-full border border-slate-200 bg-white/90 text-slate-700 shadow-lg backdrop-blur transition hover:border-blue-300 hover:text-blue-600"
          >
            <ChevronDown className="h-4 w-4 rotate-90" />
          </Link>
        )}
        {/^\/products\/.+/.test(pathname) && pathname !== '/products/text' && <PublicCouponBanner slug={pathname.split('/')[2] ?? ''} />}
        {children}
      </main>

      {giveaway && pathname !== "/giveaway" && pathname !== "/products/text" && !pathname.startsWith("/admin") && (
        <Button asChild variant="ghost" className="fixed bottom-4 left-4 z-40 h-10 border border-line bg-surface px-3 text-xs text-foreground hover:bg-surface-2"><Link to="/giveaway"><Gift className="text-primary" /> Community Giveaway</Link></Button>
      )}
      <SiteFooter />
      <ImageLoadingStates />
    </div>
  );
}


export function GradientButton({
  children,
  onClick,
  disabled,
  as,
  href,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  as?: "a" | "button";
  href?: string;
}) {
  const style = {
    background: "#2680eb",
    boxShadow:
      "0 10px 30px -10px rgba(38,128,235,0.55), 0 0 0 1px rgba(255,255,255,0.08) inset",
  };
  const cls =
    "group relative inline-flex items-center gap-2 overflow-hidden rounded-xl px-6 py-3 text-callout font-semibold text-white transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 interactive";
  if (as === "a" && href)
    return (
      <a href={href} className={cls} style={style}>
        {children}
      </a>
    );
  return (
    <button onClick={onClick} disabled={disabled} className={cls} style={style}>
      {children}
    </button>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={
        "rounded-[16px] border border-slate-200 bg-white p-6 shadow-[0_10px_40px_rgba(15,23,42,.06)] transition-all duration-300 hover:border-blue-500/40 dark:border-blue-900/40 dark:bg-blue-900/10 dark:shadow-none " +
        (className ?? "")
      }
    >
      {children}
    </div>
  );
}

export function PageTitle({ eyebrow, title, subtitle }: { eyebrow?: string; title: string; subtitle?: string }) {
  return (
    <div className="mb-10">
      {eyebrow && (
        <div className="text-xs font-bold tracking-[0.3em] text-[#2680eb]">
          {eyebrow}
        </div>
      )}
      <h1 className="mt-3 text-3xl font-bold text-[#0b1020] md:text-5xl dark:text-white">{title}</h1>
      {subtitle && (
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 md:text-base dark:text-blue-200/60">
          {subtitle}
        </p>
      )}
    </div>
  );
}
