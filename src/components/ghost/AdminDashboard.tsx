import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { adminDashboardCode } from "@/lib/admin-dash.functions";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Eye,
  Key,
  Laptop,
  RefreshCw,
  ShieldAlert,
  ShoppingBag,
  Wallet,
} from "lucide-react";

type Half = { prev: number; now: number; delta: number };
type Dash = {
  kpi: {
    revenue: number;
    orders: number;
    pending_orders: number;
    licenses: number;
    active_licenses: number;
    devices: number;
    visitors: number;
    blocked: number;
  };
  trend: { revenue: Half; licenses: Half; visitors: Half };
  days: string[];
  series: { revenue: number[]; orders: number[]; licenses: number[]; visitors: number[] };
  pages: { path: string; views: number }[];
  plans: { plan: string; count: number }[];
};

const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div
    className={`rounded-xl border border-line bg-surface p-4 sm:p-5 ${className}`}
  >
    {children}
  </div>
);

const money = (n: number) => `৳${n.toLocaleString("en-US")}`;

function Delta({ value }: { value: number }) {
  if (!value) return <span className="text-xs text-faint">0%</span>;
  const up = value > 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-semibold ${
        up ? "text-success " : "text-danger"
      }`}
    >
      {up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
      {Math.abs(value)}%
    </span>
  );
}

/** Tiny dependency-free sparkline (SVG polyline). */
function Spark({ data, color = "#3b82f6" }: { data: number[]; color?: string }) {
  if (!data.length) return null;
  const max = Math.max(...data, 1);
  const pts = data
    .map((v, i) => `${(i / Math.max(data.length - 1, 1)) * 100},${28 - (v / max) * 26}`)
    .join(" ");
  return (
    <svg viewBox="0 0 100 28" preserveAspectRatio="none" className="h-8 w-full">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  sub,
  delta,
  series,
  color,
}: {
  icon: typeof Key;
  label: string;
  value: string;
  sub?: string;
  delta?: number;
  series?: number[];
  color: string;
}) {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-muted-fg">{label}</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
          {sub ? <p className="mt-0.5 text-xs text-faint">{sub}</p> : null}
        </div>
        <div className="flex flex-col items-end gap-1">
          <Icon size={18} className={color} />
          {typeof delta === "number" ? <Delta value={delta} /> : null}
        </div>
      </div>
      {series ? <Spark data={series} color={color.includes("emerald") ? "#10b981" : "#3b82f6"} /> : null}
    </Card>
  );
}

function Bars({ days, data }: { days: string[]; data: number[] }) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex h-40 items-end gap-1">
      {data.map((v, i) => (
        <div key={days[i] ?? i} className="group relative flex-1">
          <div
            className="w-full rounded-t bg-primary/80 transition-all group-hover:bg-primary-hover"
            style={{ height: `${Math.max((v / max) * 100, 2)}%` }}
          />
          <span className="pointer-events-none absolute -top-6 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-foreground px-1.5 py-0.5 text-[10px] text-background group-hover:block">
            {days[i]?.slice(5)} · {v}
          </span>
        </div>
      ))}
    </div>
  );
}

export function AdminDashboard({ adminCode }: { adminCode: string }) {
  const load = useServerFn(adminDashboardCode);
  const [data, setData] = useState<Dash | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metric, setMetric] = useState<"revenue" | "orders" | "licenses" | "visitors">("revenue");

  const refresh = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      setData((await load({ data: { code: adminCode } })) as Dash);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load dashboard");
    } finally {
      setBusy(false);
    }
  }, [load, adminCode]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">Dashboard</h2>
          <p className="text-xs text-muted-fg">Last 30 days across the whole ecosystem</p>
        </div>
        <button
          onClick={() => void refresh()}
          className="inline-flex items-center gap-2 rounded-xl border border-line px-3 py-2 text-sm font-medium text-muted-fg hover:bg-surface-2"
        >
          <RefreshCw size={14} className={busy ?"animate-spin" :""} /> Refresh
        </button>
      </div>

      {error ? (
        <Card className="border-red-200 text-sm text-danger">{error}</Card>
      ) : null}

      {!data ? (
        <Card className="text-sm text-muted-fg">Loading…</Card>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Kpi
              icon={Wallet}
              label="Revenue (30d)"
              value={money(data.kpi.revenue)}
              delta={data.trend.revenue.delta}
              series={data.series.revenue}
              color="text-success"
            />
            <Kpi
              icon={ShoppingBag}
              label="Paid orders"
              value={String(data.kpi.orders)}
              sub={`${data.kpi.pending_orders} pending`}
              series={data.series.orders}
              color="text-primary"
            />
            <Kpi
              icon={Key}
              label="Licenses"
              value={String(data.kpi.licenses)}
              sub={`${data.kpi.active_licenses} active`}
              delta={data.trend.licenses.delta}
              series={data.series.licenses}
              color="text-primary"
            />
            <Kpi
              icon={Eye}
              label="Page views (30d)"
              value={data.kpi.visitors.toLocaleString("en-US")}
              delta={data.trend.visitors.delta}
              series={data.series.visitors}
              color="text-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Card>
              <div className="flex items-center gap-2">
                <Laptop size={16} className="text-primary" />
                <span className="text-xs text-muted-fg">Active devices</span>
              </div>
              <p className="mt-1 text-xl font-bold text-foreground">{data.kpi.devices}</p>
            </Card>
            <Card>
              <div className="flex items-center gap-2">
                <ShieldAlert size={16} className="text-danger" />
                <span className="text-xs text-muted-fg">Blocked now</span>
              </div>
              <p className="mt-1 text-xl font-bold text-foreground">{data.kpi.blocked}</p>
            </Card>
            <Card className="col-span-2">
              <div className="flex items-center gap-2">
                <Activity size={16} className="text-primary" />
                <span className="text-xs text-muted-fg">Licenses by plan</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {data.plans.length === 0 ? (
                  <span className="text-xs text-faint">No licenses yet</span>
                ) : (
                  data.plans.map((p) => (
                    <span
                      key={p.plan}
                      className="rounded-full bg-surface-2 px-2.5 py-1 text-xs font-medium text-muted-fg"
                    >
                      {p.plan} · {p.count}
                    </span>
                  ))
                )}
              </div>
            </Card>
          </div>

          <Card>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-foreground">30-day trend</h3>
              <div className="flex gap-1">
                {(["revenue", "orders", "licenses", "visitors"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMetric(m)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-medium capitalize ${
                      metric === m
                        ? "bg-primary text-white"
                        : "text-muted-fg hover:bg-surface-2 "
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <Bars days={data.days} data={data.series[metric]} />
          </Card>

          <Card>
            <h3 className="mb-3 text-sm font-semibold text-foreground">Top pages</h3>
            {data.pages.length === 0 ? (
              <p className="text-xs text-faint">No page views recorded yet.</p>
            ) : (
              <div className="space-y-2">
                {data.pages.map((p) => {
                  const max = data.pages[0]?.views || 1;
                  return (
                    <div key={p.path} className="flex items-center gap-3">
                      <span className="w-48 shrink-0 truncate text-xs text-muted-fg">
                        {p.path}
                      </span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${(p.views / max) * 100}%` }}
                        />
                      </div>
                      <span className="w-12 shrink-0 text-right text-xs font-semibold text-muted-fg">
                        {p.views}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
