import { Link } from "@tanstack/react-router";
import bkashLogo from "../../assets/pay/bkash.png.asset.json";
import nagadLogo from "../../assets/pay/nagad.png.asset.json";
import rocketLogo from "../../assets/pay/rocket.png.asset.json";
import { Mail, Phone } from "lucide-react";

const PAYMENTS = [
  { label: "bKash", url: bkashLogo.url },
  { label: "Nagad", url: nagadLogo.url },
  { label: "Rocket", url: rocketLogo.url },
];

const COLS: { title: string; links: { to: string; label: string }[] }[] = [
  { title: "Products", links: [{ to: "/products", label: "All products" }, { to: "/products/text", label: "Ghostae Text" }, { to: "/digital", label: "Digital tools" }] },
  { title: "Help", links: [{ to: "/docs", label: "Documentation" }, { to: "/trust", label: "Trust" }, { to: "/security", label: "Security" }] },
  { title: "Legal", links: [{ to: "/terms", label: "Terms" }, { to: "/refund", label: "Refund policy" }, { to: "/auth", label: "Sign in" }] },
];

/** One minimal footer for every page: brand, three short link columns, payments. */
export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="relative z-10 mt-4 border-t border-border bg-card/60 backdrop-blur-xl">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-5 py-8 sm:grid-cols-[1.4fr_repeat(3,1fr)] sm:px-10 sm:py-12">
        <div>
          <Link to="/" className="inline-flex items-center gap-2.5">
            <img src="/web-app-manifest-192x192.png" alt="" width={32} height={32} loading="lazy" className="size-8 rounded-lg object-cover" />
            <span className="text-lg font-bold tracking-tight text-foreground">Ghostae</span>
          </Link>
          <p className="mt-3 text-sm text-muted-foreground">Tools for After Effects &amp; Premiere Pro editors.</p>
          <ul className="mt-4 space-y-2 text-[13px] text-muted-foreground">
            <li><a href="mailto:info@ghostae.com" className="inline-flex items-center gap-2 transition hover:text-primary"><Mail className="size-4 shrink-0" aria-hidden="true" />info@ghostae.com</a></li>
            <li><a href="tel:+8801345407572" className="inline-flex items-center gap-2 transition hover:text-primary"><Phone className="size-4 shrink-0" aria-hidden="true" />+880 1345 407572</a></li>
          </ul>
        </div>
        <div className="grid grid-cols-3 gap-4 sm:contents">
          {COLS.map((c) => (
            <nav key={c.title} aria-label={c.title}>
              <p className="text-xs font-semibold uppercase tracking-wider text-foreground">{c.title}</p>
              <ul className="mt-3 space-y-2 text-[13px] text-muted-foreground">
                {c.links.map((l) => <li key={l.to}><Link to={l.to as any} className="transition hover:text-primary">{l.label}</Link></li>)}
              </ul>
            </nav>
          ))}
        </div>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-10">
          <div className="flex items-center gap-2" aria-label="Accepted payment methods">
            {PAYMENTS.map((p) => (
              <span key={p.label} className="inline-flex h-7 w-14 items-center justify-center rounded-md border border-border bg-background px-1.5">
                <img src={p.url} alt={p.label} width={52} height={18} loading="lazy" decoding="async" className="max-h-4 w-full object-contain" />
              </span>
            ))}
          </div>
          <span className="text-xs text-muted-foreground">© {year} Ghostae</span>
        </div>
      </div>
    </footer>
  );
}
