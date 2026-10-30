import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Link, useNavigate, createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import { adminIssueLicenseCode, adminSetLicenseStatusCode, adminSetDeviceRevokedCode, adminUpdateLicenseCode, adminGetFullOverview, adminPublishPatchCode, adminSetPatchEnabledCode, adminDeleteLicenseCode, adminDeleteDeviceCode, adminAutoLicenseGetCode, adminAutoLicenseSetCode } from "../lib/admin-code.functions";
import { adminWhoAmI, adminFeedback, adminUpdateReport, adminQueueFix, adminUpdateFix, adminDeleteFix, adminPatchStatus } from "../lib/admin.functions";
import { AiBrainPanel } from "@/components/ghost/AiBrainPanel";
import { AdminProductsHub } from "@/components/ghost/AdminProductsHub";
import { AdminDashboard } from "@/components/ghost/AdminDashboard";
import { AdminReleaseHub } from "@/components/ghost/AdminReleaseHub";
import { AdminRelayPanel } from "@/components/ghost/AdminRelayPanel";
import { AdminPricingPanel } from '@/components/ghost/AdminPricingPanel';
import { AdminGiveawayPanel } from '@/components/ghost/AdminGiveawayPanel';
import { AdminDigitalOrdersPanel } from '@/components/ghost/AdminDigitalOrdersPanel';
import { AdminShopbotPanel } from '@/components/ghost/AdminShopbotPanel';
import { AdminGearPanel } from '@/components/ghost/AdminGearPanel';
import { AdminAffiliatesPanel } from '@/components/ghost/AdminAffiliatesPanel';

import { Shield, Key, Laptop, Activity, MessageSquare, Package, LogOut, RefreshCw, Lock, Users, Clock, AlertTriangle, AlertCircle, CheckCircle2, Terminal, CalendarPlus, Brain, Copy, Settings2, X, CreditCard, MoreVertical, Search, ChevronDown, Trash2, Mail, LayoutDashboard, UploadCloud, Gift } from "lucide-react";



export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Ghostae Admin — Management Console" },
      { property: "og:title", content: "Ghostae Admin — Management Console" },
      { property: "og:description", content: "Authorized Ghostae administration." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "description", content: "Secure control center for Ghostae licenses, devices, and patch distribution." },
    ],
  }),
  component: AdminPage,
});


const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`rounded-xl border border-line bg-surface p-4 sm:p-6 shadow-sm dark:shadow-none ${className}`}>
    {children}
  </div>
);

const PageTitle = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <div>
    <h1 className="text-2xl font-bold text-foreground tracking-tight">{title}</h1>
    <p className="text-sm text-muted-fg">{subtitle}</p>
  </div>
);


type Overview = Awaited<ReturnType<typeof adminGetFullOverview>>;

function fmt(v: string | null | undefined) {
  if (!v) return "—";
  return new Date(v).toLocaleString();
}

function AdminPage() {
  const load = useServerFn(adminGetFullOverview);
  const whoAmI = useServerFn(adminWhoAmI);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const issue = useServerFn(adminIssueLicenseCode);
  const setStatus = useServerFn(adminSetLicenseStatusCode);
  const setDevice = useServerFn(adminSetDeviceRevokedCode);
  const patchLicense = useServerFn(adminUpdateLicenseCode);
  const publishPatch = useServerFn(adminPublishPatchCode);
  const setPatchEnabled = useServerFn(adminSetPatchEnabledCode);
  const deleteLicense = useServerFn(adminDeleteLicenseCode);
  const deleteDevice = useServerFn(adminDeleteDeviceCode);
  const autoGet = useServerFn(adminAutoLicenseGetCode);
  const autoSet = useServerFn(adminAutoLicenseSetCode);
  const [auto, setAuto] = useState<{ enabled: boolean; plan: string; trial_days: number; daily_limit: number; issued_today: number } | null>(null);
  const [autoBusy, setAutoBusy] = useState(false);

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  // Legacy payload field only; never used for authorization.
  const adminCode = "";
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"dashboard" | "keys" | "devices" | "logs" | "feedback" | "patch" | "diagnostics" | "brain" | "billing" | "products" | "releases" | "relay" | "pricing" | "giveaway" | "digital" | "partners" | "gear">("dashboard");
  const [isVerifying, setIsVerifying] = useState(false);
  const [navOpen, setNavOpen] = useState(false);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "revoked" | "expired" | "suspended">("all");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [deviceQuery, setDeviceQuery] = useState("");
  const [deletingLicense, setDeletingLicense] = useState<null | { id: string; key: string }>(null);

  const [form, setForm] = useState({
    email: "",
    plan: "pro",
    max_activations: 1,
    expires_in_days: 0,
    quantity: 1,
    notes: "",
  });
  const [patchForm, setPatchForm] = useState({
    version: "",
    title: "",
    url: "",
    sha256: "",
    mandatory: true,
  });
  const [patchBusy, setPatchBusy] = useState(false);
  const [fresh, setFresh] = useState<string[]>([]);
  const [issueOpen, setIssueOpen] = useState(false);
  const [issuing, setIssuing] = useState(false);
  const [editing, setEditing] = useState<null | {
    id: string; key: string; max_activations: number; expires_in_days: number; email: string; notes: string;
  }>(null);


  const refresh = useCallback(async () => {
    if (!isAuthenticated) return;
    setError(null);
    try {
      setData(await load({ data: { code: adminCode } }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load admin data.");
    }
  }, [load, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) void refresh();
  }, [isAuthenticated, refresh]);

  useEffect(() => {
    if (!isAuthenticated) return;
    autoGet({ data: { code: adminCode } })
      .then((res) => setAuto(res as never))
      .catch(() => {});
  }, [isAuthenticated, adminCode, autoGet]);

  useEffect(() => {
    let active = true;
    setIsVerifying(true);
    whoAmI().then((res) => {
      if (!active) return;
      setIsAuthenticated(res.isAdmin);
      if (!res.isAdmin) setError("Admin permission is required.");
    }).catch(() => {
      if (active) setError("Sign in with an authorized admin account.");
    }).finally(() => { if (active) setIsVerifying(false); });
    return () => { active = false; };
  }, [whoAmI]);

  const handleSignOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    setData(null);
    setIsAuthenticated(false);
    await supabase.auth.signOut();
    await navigate({ to: "/auth", replace: true });
  };

  if (!isAuthenticated) {
    return <div className="flex min-h-screen items-center justify-center bg-background text-foreground p-6">
      <div className="max-w-md space-y-4 text-center">
        <Shield className="mx-auto text-primary" size={32} />
        <h1 className="text-xl font-bold">Ghostae Admin</h1>
        <p className="text-sm text-muted-foreground">{isVerifying ?"Checking access…" : error}</p>
        {!isVerifying && <Button asChild><Link to="/auth" search={{ redirect: "/admin" }}>Sign in</Link></Button>}
      </div>
    </div>;
  }


  const licenseName = (id: string) => data?.licenses.find((l: any) => l.id === id)?.license_key ?? id.slice(0, 8);
  const activeDevices = (licenseId: string) =>
    (data?.activations ?? []).filter((a: any) => a.license_id === licenseId && !a.revoked).length;

  // ---- Licenses grouped by plan (category view) ----
  const needle = query.trim().toLowerCase();
  const filteredLicenses = (data?.licenses ?? []).filter((l: any) => {
    if (statusFilter !== "all" && l.status !== statusFilter) return false;
    if (!needle) return true;
    return [l.license_key, l.email, l.notes].some((v: string | null) =>
      (v ?? "").toLowerCase().includes(needle),
    );
  });

  const licenseGroups = Object.entries(
    filteredLicenses.reduce<Record<string, any[]>>((acc, l: any) => {
      const plan = String(l.plan || "other");
      (acc[plan] ??= []).push(l);
      return acc;
    }, {}),
  )
    .sort((a, b) => b[1].length - a[1].length)
    .map(([plan, rows]) => ({
      plan,
      rows,
      activeCount: rows.filter((r: any) => r.status === "active").length,
      seats: rows.reduce((s: number, r: any) => s + activeDevices(r.id), 0),
    }));

  // ---- Devices grouped by activation key ----
  const dNeedle = deviceQuery.trim().toLowerCase();
  const deviceGroups = (data?.licenses ?? [])
    .map((l: any) => {
      const devices = (data?.activations ?? []).filter((a: any) => a.license_id === l.id);
      return {
        licenseId: l.id,
        key: l.license_key,
        plan: l.plan as string,
        email: l.email as string | null,
        max: l.max_activations as number,
        used: devices.filter((a: any) => !a.revoked).length,
        devices,
      };
    })
    .filter((g) => g.devices.length > 0)
    .filter((g) => {
      if (!dNeedle) return true;
      if (g.key.toLowerCase().includes(dNeedle)) return true;
      return g.devices.some((a: any) =>
        [a.hostname, a.device_fingerprint].some((v: string | null) =>
          (v ?? "").toLowerCase().includes(dNeedle),
        ),
      );
    });

  const PLAN_OPTIONS = [
    { id: "free", label: "Ghostae Caption — Free (2 min/day)", devices: 1 },
    { id: "basic", label: "Ghostae Caption — Light ৳199 / 3 Months (300 min)", devices: 1 },
    { id: "pro", label: "Ghostae Caption — Pro ৳699 / 1 Year (1,500 min)", devices: 2 },
  ];

  const submitIssue = async () => {
    setIssuing(true);
    setError(null);
    try {
      const res = await issue({ data: { code: adminCode, ...form } });
      setFresh((res.created ?? []).map((c: any) => c.license_key));
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not issue the key.");
    } finally {
      setIssuing(false);
    }
  };

  const NAV_ITEMS = [
    { id: "dashboard", label: "হোম", short: "হোম", icon: LayoutDashboard },
    { id: "products", label: "প্রোডাক্ট", short: "প্রোডাক্ট", icon: Package },
    { id: 'pricing', label: 'Pricing', short: 'Pricing', icon: CreditCard },
    { id: 'giveaway', label: 'Giveaway', short: 'Giveaway', icon: Gift },
    { id: 'digital', label: 'Digital Orders', short: 'Digital', icon: CreditCard },
    { id: 'gear', label: 'Ghostae Gear', short: 'Gear', icon: CreditCard },
    { id: 'partners', label: 'Team Partners', short: 'Partners', icon: Users },
    { id: "releases", label: "রিলিজ হাব", short: "রিলিজ", icon: UploadCloud },
    { id: "relay", label: "Payment Relay", short: "Relay", icon: Laptop },
    { id: "brain", label: "AI ব্রেইন", short: "ব্রেইন", icon: Brain },
    { id: "logs", label: "অ্যাক্টিভিটি লগ", short: "লগ", icon: Activity },
  ] as const;

  const activeItem = NAV_ITEMS.find((n) => n.id === tab);

  const NavList = ({ onPick }: { onPick?: () => void }) => (
    <nav className="space-y-1 p-3 md:p-4">
      {NAV_ITEMS.map((item) => (
        <button
          key={item.id}
          onClick={() => { setTab(item.id as any); onPick?.(); }}
          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
            tab === item.id
              ? "bg-primary/10 font-semibold text-primary shadow-[inset_3px_0_0_var(--primary)]"
              : "text-muted-fg hover:text-foreground hover:bg-surface-2 "
          }`}
        >
          <item.icon size={16} className={tab === item.id ?"text-primary" :""} />
          <span className="truncate">{item.label}</span>
        </button>
      ))}
    </nav>
  );

  return (
      <div className="min-h-screen bg-background text-foreground">
        {/* Desktop sidebar */}
        <aside className="fixed left-0 top-0 z-40 hidden h-full w-64 border-r border-line bg-surface md:block">
          <div className="flex h-16 items-center px-6 border-b border-line">
            <Shield className="mr-2 text-primary" size={20} />
            <span className="font-bold tracking-tight">Ghostae Admin</span>
          </div>
          <NavList />
          <div className="absolute bottom-0 w-full p-4 border-t border-line">
             <button
                onClick={handleSignOut}
                className="flex w-full items-center gap-3 px-3 py-2 text-sm text-danger/70 hover:text-danger hover:bg-danger/5 rounded-lg transition-colors"
             >
               <LogOut size={16} />
               সাইন আউট
             </button>
          </div>
        </aside>

        {/* Mobile top bar */}
        <header className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b border-line bg-surface px-3 md:hidden">
          <button
            onClick={() => setNavOpen(true)}
            aria-label="Open menu"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-line text-muted-fg"
          >
            <MoreVertical size={18} />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold leading-tight">{activeItem?.label ??"Admin"}</p>
            <p className="truncate text-[10px] text-faint">Ghostae Console</p>
          </div>
          <button
            onClick={refresh}
            aria-label="Refresh"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-line text-muted-fg"
          >
            <RefreshCw size={16} />
          </button>
          <button
            onClick={handleSignOut}
            aria-label="Sign out"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-line text-danger"
          >
            <LogOut size={16} />
          </button>
        </header>

        {/* Mobile drawer */}
        {navOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div className="absolute inset-0 bg-background/70" onClick={() => setNavOpen(false)} />
            <div className="absolute left-0 top-0 h-full w-[78%] max-w-xs border-r border-line bg-surface">
              <div className="flex h-14 items-center justify-between border-b border-line px-4">
                <span className="flex items-center gap-2 font-bold"><Shield size={18} className="text-primary" /> Admin</span>
                <button onClick={() => setNavOpen(false)} className="rounded-lg p-1.5 text-faint"><X size={18} /></button>
              </div>
              <NavList onPick={() => setNavOpen(false)} />
            </div>
          </div>
        )}

        <main className="md:pl-64">
          <div className="mx-auto max-w-6xl px-3 pb-24 pt-4 sm:px-5 md:p-8 md:pb-10">
            <header className="mb-5 hidden items-center justify-between md:mb-8 md:flex">
               <PageTitle title={activeItem?.label ?? "হোম"} subtitle="Ghostae কন্ট্রোল প্যানেল" />
               <div className="flex items-center gap-3">
                 <button
                   onClick={refresh}
                   className="p-2 rounded-lg hover:bg-surface-2 text-faint hover:text-foreground transition-colors"
                   title="Refresh Data"
                 >
                   <RefreshCw size={18} />
                 </button>
               </div>
            </header>

            {error && <Card><p className="text-sm text-danger">{error}</p></Card>}
            {data && (
              <div className="space-y-4 duration-500 animate-in fade-in md:space-y-8">
                {/* Stats Grid */}
                {tab === 'keys' && (
                <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-4">
                  {[
                    { label: "মোট লাইসেন্স", value: data.stats.total, icon: Key, color: "text-primary" },
                    { label: "অ্যাক্টিভ", value: data.stats.active, icon: Users, color: "text-success" },
                    { label: "বাতিল", value: data.stats.revoked, icon: AlertTriangle, color: "text-danger" },
                    { label: "অ্যাক্টিভ ডিভাইস", value: data.stats.devices, icon: Laptop, color: "text-primary" },
                  ].map((stat, i) => (
                    <Card key={i} className="flex min-w-0 items-center gap-3 p-3 sm:gap-4 sm:p-4">
                      <div className={`shrink-0 rounded-xl bg-surface-2 p-2 sm:p-3 ${stat.color}`}>
                        <stat.icon size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-[10px] font-medium uppercase tracking-wider text-muted-fg sm:text-xs">{stat.label}</p>
                        <p className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">{stat.value}</p>
                      </div>
                    </Card>
                  ))}
                </div>
                )}


                {/* Tab Content */}
{tab === 'dashboard' && <AdminDashboard adminCode={adminCode} />}

{tab === 'products' && <AdminProductsHub adminCode={adminCode} />}
{tab === 'pricing' && <AdminPricingPanel />}
{tab === 'giveaway' && <AdminGiveawayPanel />}
{tab === 'digital' && <div className="space-y-8"><AdminShopbotPanel /><AdminDigitalOrdersPanel /></div>}
{tab === 'gear' && <AdminGearPanel />}
{tab === 'partners' && <AdminAffiliatesPanel />}
{tab === 'releases' && <AdminReleaseHub />}
{tab === 'relay' && <AdminRelayPanel />}

{tab === 'keys' && (
  <div className="space-y-4">
    {/* Auto licence (night mode) */}
    <Card className="border-line">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base font-bold sm:text-lg">ফ্রি কী — নিজে নিজে ইস্যু</h3>
          <p className="mt-0.5 text-[11px] text-muted-fg sm:text-xs">
            ON রাখলে নতুন user ওয়েবসাইট থেকেই সাথে সাথে একটা <b>ফ্রি</b> কী পাবে। পেইড (Light/Pro) কী কখনোই এভাবে দেওয়া হয় না — শুধু অর্ডার অনুমোদন করলেই।
            {auto ? ` · আজ দেওয়া হয়েছে: ${auto.issued_today}` : ""}
          </p>
        </div>
        <button
          disabled={autoBusy}
          onClick={async () => {
            setAutoBusy(true);
            try {
              const next = !(auto?.enabled ?? false);
              await autoSet({ data: { code: adminCode, enabled: next, plan: auto?.plan ?? "free", trial_days: auto?.trial_days ?? 7, daily_limit: auto?.daily_limit ?? 50 } });
              const fresh = await autoGet({ data: { code: adminCode } });
              setAuto(fresh as any);
            } catch { /* ignore */ }
            setAutoBusy(false);
          }}
          className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold text-white transition ${auto?.enabled ?"bg-success hover:bg-success" :"bg-faint hover:opacity-90"}`}
        >
          {autoBusy ? "…" : auto?.enabled ? "ON — auto key চালু" : "OFF — WhatsApp only"}
        </button>
      </div>
      {auto?.enabled && (
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          <div className="rounded-lg border border-line bg-surface-2 px-3 py-2 text-[11px] font-semibold text-muted-fg">
            প্ল্যান
            <p className="mt-0.5 text-sm font-bold text-foreground">ফ্রি (নির্ধারিত)</p>
          </div>
          <label className="text-[11px] font-semibold text-muted-fg">
            দিনে সর্বোচ্চ কতটি
            <input
              type="number" min={1} value={auto.daily_limit}
              onChange={(e) => setAuto({ ...auto, daily_limit: Number(e.target.value) })}
              onBlur={async () => { await autoSet({ data: { code: adminCode, enabled: true, plan: "free", trial_days: 0, daily_limit: auto.daily_limit } }); }}
              className="mt-1 w-full rounded-lg border border-line bg-surface px-2 py-1.5 text-sm"
            />
          </label>
        </div>
      )}
    </Card>

    {/* Toolbar */}
    <Card className="border-line">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="min-w-0">
          <h3 className="flex items-center gap-2 text-base font-bold sm:text-lg">
            <Key size={18} className="shrink-0 text-primary" />
            <span className="truncate">License Management</span>
          </h3>
          <p className="mt-0.5 text-[11px] text-muted-fg sm:text-xs">
            Grouped by plan · search, edit, revoke or delete
          </p>
        </div>
        <button
          onClick={() => { setFresh([]); setIssueOpen(true); }}
          className="shrink-0 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-primary-hover active:scale-95 sm:px-4"
        >
          Generate
        </button>
      </div>

      <div className="mt-4 space-y-2.5">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search key, email or note…"
            className="w-full rounded-lg border border-line bg-surface py-2 pl-9 pr-3 text-sm outline-none focus:border-primary"
          />
        </div>
        <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
          {(["all", "active", "revoked", "expired", "suspended"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition ${
                statusFilter === s
                  ? "border-primary bg-primary/10 text-primary "
                  : "border-line text-muted-fg "
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </Card>

    {/* Category (plan) groups */}
    {licenseGroups.map((group) => (
      <Card key={group.plan} className="border-line">
        <button
          onClick={() => setCollapsed((c) => ({ ...c, [group.plan]: !c[group.plan] }))}
          className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 text-left"
        >
          <div className="flex min-w-0 items-center gap-2">
            <span className="rounded-md bg-primary/10 px-2 py-1 text-[11px] font-black uppercase tracking-wider text-primary">
              {group.plan}
            </span>
            <span className="truncate text-xs text-muted-fg">
              {group.rows.length} key{group.rows.length === 1 ? "" : "s"} · {group.activeCount} active · {group.seats} device{group.seats === 1 ? "" : "s"}
            </span>
          </div>
          <ChevronDown
            size={16}
            className={`shrink-0 text-faint transition-transform ${collapsed[group.plan] ?"-rotate-90" :""}`}
          />
        </button>

        {!collapsed[group.plan] && (
          <div className="mt-4 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
            {group.rows.map((l: any) => (
              <div key={l.id} className="min-w-0 space-y-2.5 rounded-xl border border-line bg-surface-2/60 p-3">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
                  <code className="truncate rounded border border-line bg-surface px-2 py-1 font-mono text-[11px] font-medium text-muted-fg">
                    {l.license_key}
                  </code>
                  <button
                    onClick={() => { void navigator.clipboard.writeText(l.license_key); }}
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-faint hover:text-primary"
                    aria-label="Copy key"
                  >
                    <Copy size={14} />
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                    l.status === 'active'
                      ? 'border border-success/20 bg-success/10 text-success '
                      : 'border border-danger/20 bg-danger/10 text-danger text-danger'
                  }`}>
                    {l.status === 'active' ? <CheckCircle2 size={10} /> : <AlertCircle size={10} />}{l.status}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-md bg-surface-2 px-2 py-0.5 text-[10px] font-bold text-muted-fg">
                    <Laptop size={10} />{activeDevices(l.id)}/{l.max_activations}
                  </span>
                </div>

                <div className="space-y-0.5 text-[10px] text-muted-fg">
                  <p className="flex items-center gap-1 truncate">
                    <Mail size={10} className="shrink-0" />{l.email ||"no email"}
                  </p>
                  <p className="flex items-center gap-1">
                    <Clock size={10} className="shrink-0" />{l.expires_at ? fmt(l.expires_at) :"Lifetime access"}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-1.5 pt-0.5">
                  <button
                    onClick={() => setEditing({
                      id: l.id, key: l.license_key, max_activations: l.max_activations,
                      expires_in_days: 0, email: l.email ?? "", notes: l.notes ?? "",
                    })}
                    className="inline-flex items-center justify-center gap-1 rounded-lg border border-line py-2 text-[11px] font-bold text-primary"
                  >
                    <Settings2 size={12} /> Edit
                  </button>
                  <button
                    onClick={() => setStatus({ data: { code: adminCode, license_id: l.id, status: l.status === 'active' ? 'revoked' : 'active' } }).then(() => refresh())}
                    className={`rounded-lg border py-2 text-[11px] font-bold ${
                      l.status === 'active' ? 'border-danger/20 text-danger' : 'border-success/20 text-success'
                    }`}
                  >
                    {l.status === 'active' ? 'Revoke' : 'Activate'}
                  </button>
                  <button
                    onClick={() => setDeletingLicense({ id: l.id, key: l.license_key })}
                    className="inline-flex items-center justify-center gap-1 rounded-lg border border-danger/20 py-2 text-[11px] font-bold text-danger"
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    ))}

    {!licenseGroups.length && (
      <Card className="border-line">
        <p className="py-8 text-center text-sm text-faint">
          No licenses match this filter.
        </p>
      </Card>
    )}
  </div>
)}

                {tab === 'keys' && (
                  <div className="space-y-4">
                    <Card className="border-line">
                      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                        <div className="min-w-0">
                          <h3 className="flex items-center gap-2 text-base font-bold sm:text-lg">
                            <Laptop size={18} className="shrink-0 text-primary" />
                            <span className="truncate">Device Tracking</span>
                          </h3>
                          <p className="mt-0.5 text-[11px] text-muted-fg sm:text-xs">
                            Grouped per activation key · seat usage, machine ID and last check-in
                          </p>
                        </div>
                        <span className="shrink-0 rounded-lg bg-surface-2 px-2.5 py-1.5 text-[11px] font-bold text-muted-fg">
                          {data.stats.devices} live
                        </span>
                      </div>
                      <div className="relative mt-4">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
                        <input
                          value={deviceQuery}
                          onChange={(e) => setDeviceQuery(e.target.value)}
                          placeholder="Search key, hostname or machine ID…"
                          className="w-full rounded-lg border border-line bg-surface py-2 pl-9 pr-3 text-sm outline-none focus:border-primary"
                        />
                      </div>
                    </Card>

                    {deviceGroups.map((group) => (
                      <Card key={group.licenseId} className="border-line">
                        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-line pb-3">
                          <div className="min-w-0">
                            <code className="truncate font-mono text-[11px] font-semibold text-primary">
                              {group.key}
                            </code>
                            <p className="truncate text-[10px] text-faint">
                              {group.plan?.toUpperCase() ?? "—"} · {group.email || "no email"}
                            </p>
                          </div>
                          <span className="shrink-0 rounded-md bg-surface-2 px-2 py-1 text-[10px] font-bold text-muted-fg">
                            {group.used}/{group.max} seats
                          </span>
                        </div>

                        <div className="mt-3 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
                          {group.devices.map((a: any) => (
                            <div key={a.id} className="min-w-0 rounded-xl border border-line bg-surface-2/60 p-3">
                              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
                                <div className="min-w-0">
                                  <p className="truncate text-xs font-semibold" title={a.hostname}>
                                    {a.hostname || "Unknown device"}
                                  </p>
                                  <p className="truncate font-mono text-[10px] text-faint" title={a.device_fingerprint}>
                                    {(a.device_fingerprint ?? "").slice(0, 22) || "no machine id"}
                                  </p>
                                </div>
                                <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold ${a.revoked ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success'}`}>
                                  {a.revoked ? 'Revoked' : 'Active'}
                                </span>
                              </div>

                              <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[10px] text-faint">
                                <span className="rounded bg-surface-2 px-1.5 py-0.5">{a.platform ||"platform n/a"}</span>
                                <span className="rounded bg-surface-2 px-1.5 py-0.5">v{a.app_version ||"?"}</span>
                              </div>
                              <p className="mt-1.5 flex items-center gap-1 text-[10px] text-faint">
                                <Clock size={10} /> {fmt(a.last_seen_at)}
                              </p>

                              <div className="mt-2.5 grid grid-cols-2 gap-1.5">
                                <button
                                  onClick={() => setDevice({ data: { code: adminCode, activation_id: a.id, revoked: !a.revoked } }).then(() => refresh())}
                                  className={`rounded-lg border py-1.5 text-[11px] font-bold ${a.revoked ? 'border-success/20 text-success' : 'border-danger/20 text-danger'}`}
                                >
                                  {a.revoked ? 'Restore' : 'Revoke'}
                                </button>
                                <button
                                  onClick={async () => {
                                    await deleteDevice({ data: { code: adminCode, activation_id: a.id } });
                                    await refresh();
                                  }}
                                  className="inline-flex items-center justify-center gap-1 rounded-lg border border-line py-1.5 text-[11px] font-bold text-muted-fg"
                                >
                                  <Trash2 size={12} /> Free seat
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </Card>
                    ))}

                    {!deviceGroups.length && (
                      <Card className="border-line">
                        <p className="py-8 text-center text-sm text-faint">No devices tracked yet.</p>
                      </Card>
                    )}
                  </div>
                )}


                {tab === 'logs' && (
                  <Card className="border-line">
                    <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 text-foreground">
                      <Activity size={18} className="text-orange-500" />
                      System Activity
                    </h3>

                    <div className="space-y-3">
                       {data.logs.map((log: any) => (
                         <div key={log.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 p-3 rounded-lg bg-surface-2 border border-line hover:bg-surface-2 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${log.status === 'ok' ? 'bg-primary' : 'bg-danger'}`} />
                            <div>
                              <p className="text-sm font-medium capitalize text-foreground">{log.event.replace(/\./g, ' ')}</p>
                              <p className="text-[10px] text-faint">{log.license_key ||"System Event"}</p>
                               {log.event === "runtime.error" && (
                                 <p className="mt-1 max-w-2xl break-words font-mono text-[10px] leading-relaxed text-danger text-danger">
                                   {log.details?.panel || "Unknown panel"}: {log.details?.message || "Runtime error"}
                                   {log.details?.line ? ` · line ${log.details.line}` : ""}
                                 </p>
                               )}

                            </div>
                          </div>
                          <div className="text-right">
                             <p className="text-[10px] text-faint font-mono">{fmt(log.created_at)}</p>
                             <p className="text-[10px] text-primary uppercase font-bold">{log.app_version}</p>

                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                {tab === 'patch' && (
                  <Card className="border-line">

                    <div className="flex items-center justify-between mb-6">
                      <h3 className="font-semibold text-lg flex items-center gap-2 text-foreground">
                        <Package size={18} className="text-success" />
                        Patch Distribution
                      </h3>

                      <div className="flex items-center gap-2">
                         <button 
                           onClick={() => setPatchEnabled({ data: { code: adminCode, enabled: !data.patch.enabled } }).then(() => refresh())}
                           className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-widest transition-colors ${data.patch.enabled ? 'bg-success/10 text-success hover:bg-success/20' : 'bg-danger/10 text-danger hover:bg-danger/20'}`}
                         >
                           {data.patch.enabled ? 'Live' : 'Paused'}
                         </button>
                      </div>
                    </div>

                    {/* Publish form */}
                    <div className="mb-5 grid grid-cols-2 gap-3 rounded-xl border border-line p-4 md:grid-cols-4">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-faint">
                        Version
                        <input
                          value={patchForm.version}
                          onChange={(e) => setPatchForm((f) => ({ ...f, version: e.target.value }))}
                          placeholder="3.12.1"
                          className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm font-normal normal-case tracking-normal"
                        />
                      </label>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-faint">
                        Title
                        <input
                          value={patchForm.title}
                          onChange={(e) => setPatchForm((f) => ({ ...f, title: e.target.value }))}
                          placeholder="Stability patch"
                          className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm font-normal normal-case tracking-normal"
                        />
                      </label>
                      <label className="col-span-2 text-[10px] font-bold uppercase tracking-wider text-faint">
                        Download URL
                        <input
                          value={patchForm.url}
                          onChange={(e) => setPatchForm((f) => ({ ...f, url: e.target.value }))}
                          placeholder="/patches/GHOST_patch_3.12.0_to_3.12.1.json"
                          className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm font-normal normal-case tracking-normal"
                        />
                      </label>
                      <label className="col-span-2 text-[10px] font-bold uppercase tracking-wider text-faint">
                        SHA-256 (64 characters)
                        <input
                          value={patchForm.sha256}
                          onChange={(e) => setPatchForm((f) => ({ ...f, sha256: e.target.value.trim() }))}
                          className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 font-mono text-xs font-normal normal-case tracking-normal"
                        />
                      </label>
                      <label className="flex items-center gap-2 text-xs text-muted-fg">
                        <input
                          type="checkbox"
                          checked={patchForm.mandatory}
                          onChange={(e) => setPatchForm((f) => ({ ...f, mandatory: e.target.checked }))}
                        />
                        Mandatory update
                      </label>
                      <div className="col-span-2 flex items-center justify-end md:col-span-1 md:col-start-4">
                        <button
                          disabled={
                            patchBusy ||
                            !/^\d+\.\d+\.\d+$/.test(patchForm.version) ||
                            !patchForm.url.trim() ||
                            !/^[a-fA-F0-9]{64}$/.test(patchForm.sha256)
                          }
                          onClick={async () => {
                            setPatchBusy(true);
                            try {
                              await publishPatch({
                                data: {
                                  code: adminCode,
                                  version: patchForm.version.trim(),
                                  title: patchForm.title.trim() || undefined,
                                  url: patchForm.url.trim(),
                                  sha256: patchForm.sha256,
                                  mandatory: patchForm.mandatory,
                                  enabled: true,
                                },
                              });
                              setPatchForm({ version: "", title: "", url: "", sha256: "", mandatory: true });
                              await refresh();
                            } finally {
                              setPatchBusy(false);
                            }
                          }}
                          className="w-full rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white hover:bg-primary-hover disabled:opacity-40"
                        >
                          {patchBusy ? "Publishing…" : "Publish patch"}
                        </button>
                      </div>
                    </div>

                    {data.patch.data ? (
                      <div className="space-y-4">
                        <div className="p-4 rounded-xl bg-surface-2 border border-line">
                          <div className="flex justify-between items-start mb-2">
                            <p className="text-sm font-bold text-foreground">v{(data.patch.data as any).version} — {(data.patch.data as any).title}</p>
                            <span className="text-[10px] text-faint">{fmt(data.patch.updated_at)}</span>
                          </div>
                          <p className="text-xs text-muted-fg font-mono mb-4 break-all opacity-80">{(data.patch.data as any).url}</p>
                          <div className="flex flex-wrap gap-2 text-[10px] text-faint font-medium">
                            <span className="bg-surface-2 px-2 py-1 rounded">SHA256: {(data.patch.data as any).sha256.slice(0, 16)}...</span>
                            <span className="bg-surface-2 px-2 py-1 rounded">Mandatory: {(data.patch.data as any).mandatory ? 'Yes' : 'No'}</span>
                            <span className="bg-surface-2 px-2 py-1 rounded">{data.patch.enabled ? 'Delivered to panels' : 'Held back'}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="py-8 text-center text-faint text-sm">
                        No patch published. Every panel runs unlocked.
                      </div>
                    )}


                  </Card>
                )}


                {tab === 'brain' && <AiBrainPanel code={adminCode} />}


              </div>
            )}

          </div>
        </main>

        {/* Mobile bottom tab bar */}
        <nav className="fixed bottom-0 left-0 right-0 z-40 grid grid-cols-5 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] md:hidden">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id as any)}
              className={`flex flex-col items-center gap-0.5 py-2 text-[10px] font-semibold ${
                tab === item.id ? "text-primary " : "text-faint "
              }`}
            >
              <item.icon size={18} />
              {item.short}
            </button>
          ))}
        </nav>

        {issueOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/70 p-0 backdrop-blur-sm sm:items-center sm:p-4">
            <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-line bg-surface p-4 shadow-2xl sm:rounded-xl sm:p-6">

              <div className="mb-5 flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold">Generate activation key</h3>
                  <p className="text-xs text-muted-fg">Plan, device limit and expiry — all set here.</p>
                </div>
                <button onClick={() => setIssueOpen(false)} className="rounded-lg p-1.5 text-faint hover:bg-surface-2">
                  <X size={16} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <label className="col-span-2 text-xs font-semibold text-muted-fg">
                  Plan
                  <select
                    value={form.plan}
                    onChange={(e) => setForm((f) => ({ ...f, plan: e.target.value, max_activations: 1 }))}
                    className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm font-normal text-foreground"
                  >
                    {PLAN_OPTIONS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
                  </select>
                </label>

                <div className="flex items-center justify-between rounded-lg border border-line bg-surface-2 px-3 py-2">
                  <span className="text-xs font-semibold text-muted-fg">Device limit</span>
                  <span className="text-sm font-bold text-foreground">1 <span className="text-[10px] font-normal text-faint">fixed</span></span>
                </div>


                <label className="text-xs font-semibold text-muted-fg">
                  Expiry (days, 0 = lifetime)
                  <input
                    type="number" min={0} max={3650} value={form.expires_in_days}
                    onChange={(e) => setForm((f) => ({ ...f, expires_in_days: Math.min(Math.max(Number(e.target.value) || 0, 0), 3650) }))}
                    className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm font-normal"
                  />
                </label>

                <label className="text-xs font-semibold text-muted-fg">
                  Quantity
                  <input
                    type="number" min={1} max={50} value={form.quantity}
                    onChange={(e) => setForm((f) => ({ ...f, quantity: Math.min(Math.max(Number(e.target.value) || 1, 1), 50) }))}
                    className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm font-normal"
                  />
                </label>

                <label className="text-xs font-semibold text-muted-fg">
                  Email (optional)
                  <input
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="buyer@mail.com"
                    className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm font-normal"
                  />
                </label>

                <label className="col-span-2 text-xs font-semibold text-muted-fg">
                  Notes (optional)
                  <textarea
                    value={form.notes} rows={2}
                    onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm font-normal"
                  />
                </label>
              </div>

              {fresh.length > 0 && (
                <div className="mt-5 space-y-2 rounded-xl border border-success/20 bg-success/5 p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-success">New keys</p>
                  {fresh.map((k) => (
                    <div key={k} className="flex items-center justify-between gap-3">
                      <code className="font-mono text-xs text-foreground">{k}</code>
                      <button
                        onClick={() => { void navigator.clipboard.writeText(k); }}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-bold text-primary hover:bg-primary/10"
                      >
                        <Copy size={12} /> Copy
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-6 flex justify-end gap-3">
                <button onClick={() => setIssueOpen(false)} className="rounded-lg px-4 py-2 text-sm font-semibold text-muted-fg hover:bg-surface-2">
                  Close
                </button>
                <button
                  onClick={submitIssue} disabled={issuing}
                  className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-50"
                >
                  {issuing ? "Generating…" : "Generate"}
                </button>
              </div>
            </div>
          </div>
        )}

        {editing && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/70 p-0 backdrop-blur-sm sm:items-center sm:p-4">
            <div className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-2xl border border-line bg-surface p-4 shadow-2xl sm:rounded-xl sm:p-6">

              <div className="mb-5 flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold">Edit license</h3>
                  <code className="font-mono text-[11px] text-primary">{editing.key}</code>
                </div>
                <button onClick={() => setEditing(null)} className="rounded-lg p-1.5 text-faint hover:bg-surface-2">
                  <X size={16} />
                </button>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border border-line bg-surface-2 px-3 py-2">
                  <span className="text-xs font-semibold text-muted-fg">Device limit</span>
                  <span className="text-sm font-bold text-foreground">1 <span className="text-[10px] font-normal text-faint">fixed</span></span>
                </div>

                <label className="block text-xs font-semibold text-muted-fg">
                  Expiry from today (days, 0 = lifetime)
                  <input
                    type="number" min={0} max={3650} value={editing.expires_in_days}
                    onChange={(e) => setEditing((s) => s && ({ ...s, expires_in_days: Math.min(Math.max(Number(e.target.value) || 0, 0), 3650) }))}
                    className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm font-normal"
                  />
                </label>
                <label className="block text-xs font-semibold text-muted-fg">
                  Email
                  <input
                    value={editing.email}
                    onChange={(e) => setEditing((s) => s && ({ ...s, email: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm font-normal"
                  />
                </label>
                <label className="block text-xs font-semibold text-muted-fg">
                  Notes
                  <textarea
                    rows={2} value={editing.notes}
                    onChange={(e) => setEditing((s) => s && ({ ...s, notes: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm font-normal"
                  />
                </label>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button onClick={() => setEditing(null)} className="rounded-lg px-4 py-2 text-sm font-semibold text-muted-fg hover:bg-surface-2">
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    const payload = editing;
                    setEditing(null);
                    await patchLicense({ data: {
                      code: adminCode,
                      license_id: payload.id,
                      max_activations: payload.max_activations,
                      expires_in_days: payload.expires_in_days,
                      email: payload.email,
                      notes: payload.notes,
                    } });
                    await refresh();
                  }}
                  className="inline-flex items-center gap-1 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white hover:bg-primary-hover"
                >
                  <CalendarPlus size={14} /> Save
                </button>
              </div>
            </div>
          </div>
        )}

        {deletingLicense && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/70 p-0 backdrop-blur-sm sm:items-center sm:p-4">
            <div className="w-full max-w-sm rounded-t-2xl border border-line bg-surface p-5 shadow-2xl sm:rounded-xl sm:p-6">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-danger/10 p-2 text-danger">
                  <Trash2 size={18} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-bold">Delete this license?</h3>
                  <code className="break-all font-mono text-[11px] text-primary">{deletingLicense.key}</code>
                  <p className="mt-2 text-xs text-muted-fg">
                    The key and all of its device activations are removed permanently. This cannot be undone.
                  </p>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-2">
                <button
                  onClick={() => setDeletingLicense(null)}
                  className="rounded-lg border border-line py-2 text-sm font-semibold text-muted-fg"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    const target = deletingLicense;
                    setDeletingLicense(null);
                    try {
                      await deleteLicense({ data: { code: adminCode, license_id: target.id } });
                      await refresh();
                    } catch (err) {
                      setError(err instanceof Error ? err.message : "Could not delete the license.");
                    }
                  }}
                  className="rounded-lg bg-danger py-2 text-sm font-semibold text-white hover:opacity-90"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}



      </div>
  );
}
