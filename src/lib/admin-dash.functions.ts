import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const db = async () => (await import("@/integrations/supabase/client.server")).supabaseAdmin;
const codeInput = (input: unknown) => z.object({ code: z.string() }).parse(input);

const dayKey = (iso: string) => new Date(iso).toISOString().slice(0, 10);
const lastDays = (n: number) =>
  Array.from({ length: n }, (_, i) =>
    new Date(Date.now() - (n - 1 - i) * 86400_000).toISOString().slice(0, 10),
  );

/** One call for the whole dashboard: KPIs, 30-day trend, visitors, products. */
export const adminDashboardCode = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator(codeInput)
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./admin-helpers.server");
    await assertAdmin(context);
    const sb = await db();
    const since = new Date(Date.now() - 30 * 86400_000).toISOString();
    const sinceDay = since.slice(0, 10);

    const [licenses, orders, devices, views, blocks] = await Promise.all([
      sb.from("licenses").select("id, plan, status, created_at, expires_at").limit(2000),
      sb
        .from("orders")
        .select("id, amount, status, plan, created_at, paid_at")
        .gte("created_at", since)
        .limit(2000),
      sb
        .from("license_activations")
        .select("id, revoked, last_seen_at")
        .eq("revoked", false)
        .limit(3000),
      sb
        .from("page_views")
        .select("path, day, views")
        .gte("day", sinceDay)
        .order("views", { ascending: false })
        .limit(1000),
      sb
        .from("security_blocks")
        .select("id", { count: "exact", head: true })
        .is("unblocked_at", null),
    ]);

    const lic = licenses.data ?? [];
    const ord = orders.data ?? [];
    const paid = ord.filter((o) => o.status === "paid" || o.status === "activated");
    const days = lastDays(30);
    const zero = () => Object.fromEntries(days.map((d) => [d, 0])) as Record<string, number>;

    const licSeries = zero();
    for (const l of lic) {
      const k = dayKey(l.created_at as string);
      if (k in licSeries) licSeries[k] += 1;
    }
    const revSeries = zero();
    const ordSeries = zero();
    for (const o of paid) {
      const k = dayKey((o.paid_at ?? o.created_at) as string);
      if (k in revSeries) {
        revSeries[k] += Number(o.amount ?? 0);
        ordSeries[k] += 1;
      }
    }

    const byPath: Record<string, number> = {};
    const viewSeries = zero();
    for (const v of views.data ?? []) {
      byPath[v.path] = (byPath[v.path] ?? 0) + Number(v.views ?? 0);
      const k = String(v.day);
      if (k in viewSeries) viewSeries[k] += Number(v.views ?? 0);
    }

    const planCount: Record<string, number> = {};
    for (const l of lic) planCount[String(l.plan ?? "unknown")] = (planCount[String(l.plan ?? "unknown")] ?? 0) + 1;

    const half = (s: Record<string, number>) => {
      const v = days.map((d) => s[d] ?? 0);
      const a = v.slice(0, 15).reduce((x, y) => x + y, 0);
      const b = v.slice(15).reduce((x, y) => x + y, 0);
      return { prev: a, now: b, delta: a === 0 ? (b > 0 ? 100 : 0) : Math.round(((b - a) / a) * 100) };
    };

    return {
      kpi: {
        revenue: paid.reduce((s, o) => s + Number(o.amount ?? 0), 0),
        orders: paid.length,
        pending_orders: ord.filter((o) => o.status === "pending").length,
        licenses: lic.length,
        active_licenses: lic.filter((l) => l.status === "active").length,
        devices: (devices.data ?? []).length,
        visitors: Object.values(byPath).reduce((s, n) => s + n, 0),
        blocked: blocks.count ?? 0,
      },
      trend: { revenue: half(revSeries), licenses: half(licSeries), visitors: half(viewSeries) },
      days,
      series: {
        revenue: days.map((d) => revSeries[d] ?? 0),
        orders: days.map((d) => ordSeries[d] ?? 0),
        licenses: days.map((d) => licSeries[d] ?? 0),
        visitors: days.map((d) => viewSeries[d] ?? 0),
      },
      pages: Object.entries(byPath)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15)
        .map(([path, views]) => ({ path, views })),
      plans: Object.entries(planCount)
        .sort((a, b) => b[1] - a[1])
        .map(([plan, count]) => ({ plan, count })),
    };
  });

/** Purchases: everything a customer paid for, newest first. */
export const adminOrdersCode = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator(codeInput)
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./admin-helpers.server");
    await assertAdmin(context);
    const sb = await db();
    const { data: rows, error } = await sb
      .from("orders")
      .select(
        "id, customer_name, email, plan, cycle, amount, currency, provider, payment_method, transaction_id, status, license_key, device_limit, paid_at, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(300);
    if (error) throw new Error(error.message);
    return { orders: rows ?? [] };
  });

/** Manual order (bKash etc. paid outside the site): recorded as pending until approved. */
export const adminCreateManualOrderCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        code: z.string(),
        email: z.string().trim().email().max(255),
        customer_name: z.string().trim().max(120).optional(),
        plan: z.string().trim().min(1).max(40),
        amount: z.number().int().min(0).max(1_000_000),
        payment_method: z.string().trim().max(40).optional(),
        transaction_id: z.string().trim().max(80).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./admin-helpers.server");
    await assertAdmin(context);
    const sb = await db();
    const { error } = await sb.from("orders").insert({
      email: data.email.toLowerCase(),
      customer_name: data.customer_name || null,
      plan: data.plan,
      cycle: "lifetime",
      amount: data.amount,
      currency: "BDT",
      provider: "manual_admin",
      payment_method: data.payment_method || "manual",
      transaction_id: data.transaction_id || null,
      status: "pending",
      device_limit: 2,
      metadata: { source: "admin_manual" },
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Activate a purchase: issue (or attach) a licence key and mark the order done. */
export const adminActivateOrderCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        code: z.string(),
        order_id: z.string().uuid(),
        seats: z.number().int().min(1).max(25).default(2),
        expires_in_days: z.number().int().min(0).max(3650).default(0),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./admin-helpers.server");
    await assertAdmin(context);
    const sb = await db();
    const { activateOrder } = await import("./order-activation.server");
    const res = await activateOrder(sb as never, data.order_id, { seats: data.seats, days: data.expires_in_days });
    return { ok: true, license_key: res!.license_key, reused: res!.reused };
  });

/** Customer list built from licences + orders, for follow-up and outreach. */
export const adminUsersCode = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator(codeInput)
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./admin-helpers.server");
    await assertAdmin(context);
    const sb = await db();
    const [lic, ord] = await Promise.all([
      sb
        .from("licenses")
        .select("email, plan, status, created_at, last_seen_at, activation_count")
        .limit(2000),
      sb.from("orders").select("email, customer_name, amount, status, created_at").limit(2000),
    ]);

    type Row = {
      email: string;
      name: string | null;
      licenses: number;
      active: number;
      spent: number;
      devices: number;
      last_seen: string | null;
      first_seen: string | null;
    };
    const map = new Map<string, Row>();
    const touch = (email: string) => {
      const k = email.toLowerCase();
      if (!map.has(k))
        map.set(k, {
          email: k,
          name: null,
          licenses: 0,
          active: 0,
          spent: 0,
          devices: 0,
          last_seen: null,
          first_seen: null,
        });
      return map.get(k)!;
    };

    for (const l of lic.data ?? []) {
      if (!l.email) continue;
      const r = touch(l.email);
      r.licenses += 1;
      if (l.status === "active") r.active += 1;
      r.devices += Number(l.activation_count ?? 0);
      if (l.last_seen_at && (!r.last_seen || l.last_seen_at > r.last_seen)) r.last_seen = l.last_seen_at;
      if (!r.first_seen || (l.created_at as string) < r.first_seen) r.first_seen = l.created_at as string;
    }
    for (const o of ord.data ?? []) {
      if (!o.email) continue;
      const r = touch(o.email);
      if (o.customer_name && !r.name) r.name = o.customer_name;
      if (o.status === "paid" || o.status === "activated") r.spent += Number(o.amount ?? 0);
      if (!r.first_seen || (o.created_at as string) < r.first_seen) r.first_seen = o.created_at as string;
    }

    return {
      users: [...map.values()].sort((a, b) => b.spent - a.spent || b.licenses - a.licenses),
    };
  });

/** Security view: automatic blocks plus the raw suspicious signals. */
export const adminSecurityCode = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator(codeInput)
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./admin-helpers.server");
    await assertAdmin(context);
    const sb = await db();
    const [blocks, signals] = await Promise.all([
      sb
        .from("security_blocks")
        .select("*")
        .order("blocked_at", { ascending: false })
        .limit(100),
      sb
        .from("extension_logs")
        .select("id, event, status, license_key, device_fingerprint, ip_address, details, created_at")
        .in("event", ["license.tamper", "license.verify_failed", "license.activate_failed"])
        .order("created_at", { ascending: false })
        .limit(100),
    ]);
    return { blocks: blocks.data ?? [], signals: signals.data ?? [] };
  });

/** Lift an automatic block and re-activate the licence. */
export const adminUnblockCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ code: z.string(), id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./admin-helpers.server");
    await assertAdmin(context);
    const sb = await db();
    const { data: row } = await sb
      .from("security_blocks")
      .select("id, license_id")
      .eq("id", data.id)
      .maybeSingle();
    await sb.from("security_blocks").update({ unblocked_at: new Date().toISOString() }).eq("id", data.id);
    if (row?.license_id)
      await sb.from("licenses").update({ status: "active" }).eq("id", row.license_id);
    return { ok: true };
  });

/** Public page-view counter for the dashboard visitor chart. */
export const trackPageView = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ path: z.string().min(1).max(300) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    try {
      const sb = await db();
      await sb.rpc("ghost_bump_page_view", { p_path: data.path });
    } catch {
      /* never block a page render */
    }
    return { ok: true };
  });

/** Delete an order; optionally also delete its issued licence and devices. */
export const adminDeleteOrderCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ code: z.string(), order_id: z.string().uuid(), with_license: z.boolean().default(true) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./admin-helpers.server");
    await assertAdmin(context);
    const sb = await db();
    const { data: order, error: oErr } = await sb.from("orders").select("id, license_key").eq("id", data.order_id).maybeSingle();
    if (oErr) throw new Error(oErr.message);
    if (!order) throw new Error("অর্ডার পাওয়া যায়নি।");
    if (data.with_license && order.license_key) {
      const { data: lic } = await sb.from("licenses").select("id").eq("license_key", order.license_key).maybeSingle();
      if (lic) {
        await sb.from("license_activations").delete().eq("license_id", lic.id);
        await sb.from("extension_logs").update({ license_id: null }).eq("license_id", lic.id);
        await sb.from("security_blocks").update({ license_id: null }).eq("license_id", lic.id);
        const { error } = await sb.from("licenses").delete().eq("id", lic.id);
        if (error) throw new Error(error.message);
      }
    }
    const { error } = await sb.from("orders").delete().eq("id", data.order_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
