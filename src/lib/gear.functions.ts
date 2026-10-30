import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { isPubliclyVisible, orderTotals, type GearPublicProduct } from "./gear-rules";

const BUCKET = "gear-images";
const PUBLIC_COLS = "id,slug,name,short_description,description,features,specs,compatibility,box_contents,delivery_info,warranty_info,return_info,image_paths,related_slugs,sale_price_bdt,compare_price_bdt,procurement_cost_bdt,stock_status,status,sort_order,created_at,gear_categories(slug,name)";

type Admin = Awaited<typeof import("@/integrations/supabase/client.server")>["supabaseAdmin"];

async function signPaths(admin: Admin, paths: string[]) {
  if (!paths.length) return [] as string[];
  const { data } = await admin.storage.from(BUCKET).createSignedUrls(paths, 3600);
  return (data ?? []).map((d) => d.signedUrl).filter((u): u is string => !!u);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function toPublic(admin: Admin, r: any): Promise<GearPublicProduct> {
  return {
    id: r.id, slug: r.slug, name: r.name, category: r.gear_categories ?? null,
    short_description: r.short_description, description: r.description,
    features: Array.isArray(r.features) ? r.features : [], specs: Array.isArray(r.specs) ? r.specs : [],
    compatibility: r.compatibility, box_contents: Array.isArray(r.box_contents) ? r.box_contents : [],
    delivery_info: r.delivery_info, warranty_info: r.warranty_info, return_info: r.return_info,
    images: await signPaths(admin, r.image_paths ?? []), related_slugs: r.related_slugs ?? [],
    sale_price_bdt: r.sale_price_bdt, compare_price_bdt: r.compare_price_bdt,
    stock_status: r.stock_status, sort_order: r.sort_order, created_at: r.created_at,
  };
}

export const getGearProducts = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.from("gear_products").select(PUBLIC_COLS).eq("status", "published").order("sort_order");
  if (error) throw new Error("স্টোর লোড করা যায়নি।");
  const rows = (data ?? []).filter((r) => isPubliclyVisible(r as never));
  return Promise.all(rows.map((r) => toPublic(supabaseAdmin, r)));
});

export const getGearProduct = createServerFn({ method: "GET" })
  .inputValidator((i: unknown) => z.object({ slug: z.string().min(1).max(160) }).parse(i))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin.from("gear_products").select(PUBLIC_COLS).eq("slug", data.slug).maybeSingle();
    if (!row || !isPubliclyVisible(row as never)) return null;
    return toPublic(supabaseAdmin, row);
  });

// ---------- admin ----------
async function admin(context: { supabase: unknown; userId: string }) {
  const { assertAdmin } = await import("./admin-helpers.server");
  await assertAdmin(context as never);
  return (await import("@/integrations/supabase/client.server")).supabaseAdmin;
}

export const adminListGear = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = await admin(context);
    const [p, c] = await Promise.all([
      db.from("gear_products").select("*").order("sort_order"),
      db.from("gear_categories").select("id,slug,name").order("sort_order"),
    ]);
    if (p.error) throw new Error(p.error.message);
    const products = await Promise.all((p.data ?? []).map(async (r) => ({ ...r, preview_urls: await signPaths(db, r.image_paths ?? []) })));
    return { products, categories: c.data ?? [] };
  });

const int = z.number().int().min(0).max(10_000_000).nullable();
const gearInput = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().trim().min(1).max(160).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: z.string().trim().min(1).max(160),
  category_id: z.string().uuid().nullable(),
  short_description: z.string().max(300),
  description: z.string().max(5000),
  features: z.array(z.string().max(300)).max(40),
  specs: z.array(z.object({ label: z.string().max(80), value: z.string().max(300) })).max(40),
  compatibility: z.string().max(1000),
  box_contents: z.array(z.string().max(200)).max(30),
  delivery_info: z.string().max(1000),
  warranty_info: z.string().max(1000),
  return_info: z.string().max(1000),
  image_paths: z.array(z.string().max(300)).max(12),
  related_slugs: z.array(z.string().max(160)).max(12),
  source_url: z.string().url().max(1000).nullable(),
  source_price_bdt: int, procurement_cost_bdt: int, extra_cost_bdt: int, sale_price_bdt: int, compare_price_bdt: int,
  stock_status: z.enum(["in_stock", "low_stock", "out_of_stock", "preorder"]),
  status: z.enum(["draft", "published", "unpublished"]),
  sort_order: z.number().int().min(0).max(10000),
  brand: z.string().max(80).default(""),
  stock_qty: z.number().int().min(0).max(100000).default(0),
  variants: z.array(z.string().max(80)).max(20).default([]),
  mark_verified: z.boolean().optional(),
});

export const adminSaveGear = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => gearInput.parse(i))
  .handler(async ({ data, context }) => {
    const db = await admin(context);
    if (data.status === "published" && !isPubliclyVisible(data)) throw new Error("Publish করতে বিক্রয়মূল্য ও ক্রয়মূল্য দিন।");
    const { id, mark_verified, ...rest } = data;
    const payload = { ...rest, ...(mark_verified ? { last_verified_at: new Date().toISOString() } : {}) };
    const q = id ? db.from("gear_products").update(payload).eq("id", id) : db.from("gear_products").insert(payload);
    const { error } = await q;
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeleteGear = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const db = await admin(context);
    const { error } = await db.from("gear_products").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminSaveGearCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ slug: z.string().regex(/^[a-z0-9-]+$/).max(80), name: z.string().trim().min(1).max(80) }).parse(i))
  .handler(async ({ data, context }) => {
    const db = await admin(context);
    const { error } = await db.from("gear_categories").upsert(data, { onConflict: "slug" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminUploadGearImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ bytes: z.string().min(1), slug: z.string().regex(/^[a-z0-9-]+$/).max(160) }).parse(i))
  .handler(async ({ data, context }) => {
    const db = await admin(context);
    const buf = Uint8Array.from(atob(data.bytes), (c) => c.charCodeAt(0));
    if (buf.byteLength > 600 * 1024) throw new Error("ছবিটি 600 KB-এর বেশি।");
    const webp = buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46;
    const jpg = buf[0] === 0xff && buf[1] === 0xd8;
    const png = buf[0] === 0x89 && buf[1] === 0x50;
    if (!webp && !jpg && !png) throw new Error("শুধু WebP, JPG বা PNG ছবি।");
    const ext = webp ? "webp" : jpg ? "jpg" : "png";
    const path = `${data.slug}/${crypto.randomUUID()}.${ext}`;
    const { error } = await db.storage.from(BUCKET).upload(path, buf, { contentType: `image/${ext === "jpg" ? "jpeg" : ext}` });
    if (error) throw new Error(error.message);
    return { path };
  });

// ---------- admin orders ----------
export const adminListGearOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = await admin(context);
    const { data, error } = await db.from("gear_orders").select("*").order("created_at", { ascending: false }).limit(500);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

const orderInput = z.object({
  id: z.string().uuid().optional(),
  customer_name: z.string().trim().min(1).max(120),
  customer_phone: z.string().trim().regex(/^(\+?88)?01[3-9]\d{8}$/, "সঠিক মোবাইল নম্বর দিন"),
  district: z.string().max(80), thana: z.string().max(80), address: z.string().max(500),
  items: z.array(z.object({ product_id: z.string().uuid(), variant: z.string().max(80).default(""), qty: z.number().int().min(1).max(100) })).min(1).max(20),
  delivery_zone: z.enum(["inside_dhaka", "outside_dhaka"]),
  discount_bdt: z.number().int().min(0).max(1_000_000),
  payment_method: z.enum(["cod", "bkash", "nagad", "rocket"]),
  payment_status: z.enum(["unpaid", "paid", "refunded"]),
  trx_id: z.string().max(80).nullable(), courier: z.string().max(40).nullable(), tracking_code: z.string().max(80).nullable(),
  status: z.enum(["pending", "confirmed", "processing", "shipped", "delivered", "returned", "cancelled"]),
  note: z.string().max(1000).nullable(),
});

export const adminSaveGearOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => orderInput.parse(i))
  .handler(async ({ data, context }) => {
    const db = await admin(context);
    const ids = [...new Set(data.items.map((i) => i.product_id))];
    const { data: prods, error: pe } = await db.from("gear_products").select("id,name,sale_price_bdt,procurement_cost_bdt,extra_cost_bdt").in("id", ids);
    if (pe) throw new Error(pe.message);
    const items = data.items.map((i) => {
      const p = prods?.find((x) => x.id === i.product_id);
      if (!p || !p.sale_price_bdt) throw new Error("প্রোডাক্টের বিক্রয়মূল্য নেই।");
      return { ...i, name: p.name, price_bdt: p.sale_price_bdt, cost_bdt: (p.procurement_cost_bdt ?? 0) + (p.extra_cost_bdt ?? 0) };
    });
    const t = orderTotals(items, data.delivery_zone, data.discount_bdt);
    const { id, ...rest } = data;
    const payload = { ...rest, items, subtotal_bdt: t.subtotal, delivery_charge_bdt: t.delivery, total_bdt: t.total, cost_bdt: t.cost };
    const q = id ? db.from("gear_orders").update(payload).eq("id", id) : db.from("gear_orders").insert(payload);
    const { error } = await q;
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeleteGearOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const db = await admin(context);
    const { error } = await db.from("gear_orders").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const publicOrderInput = z.object({
  customer_name: z.string().trim().min(2, "নাম লিখুন").max(120),
  customer_phone: z.string().trim().regex(/^(\+?88)?01[3-9]\d{8}$/, "সঠিক মোবাইল নম্বর দিন"),
  district: z.string().trim().min(2, "জেলা লিখুন").max(80),
  thana: z.string().trim().min(2, "থানা লিখুন").max(80),
  address: z.string().trim().min(5, "পূর্ণ ঠিকানা লিখুন").max(500),
  product_id: z.string().uuid(),
  qty: z.number().int().min(1).max(10),
  delivery_zone: z.enum(["inside_dhaka", "outside_dhaka"]),
  payment_method: z.enum(["cod", "bkash", "nagad"]),
  trx_id: z.string().trim().max(80).optional().default(""),
  note: z.string().trim().max(500).optional().default(""),
}).refine((d) => d.payment_method === "cod" || d.trx_id.length >= 6, { message: "Transaction ID দিন", path: ["trx_id"] });

/** Public direct checkout: price, cost and totals are always recomputed server-side. */
export const createPublicGearOrder = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => publicOrderInput.parse(i))
  .handler(async ({ data }) => {
    const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
    const { data: p, error: pe } = await db.from("gear_products").select("id,name,status,stock_status,sale_price_bdt,procurement_cost_bdt,extra_cost_bdt").eq("id", data.product_id).maybeSingle();
    if (pe || !p || !isPubliclyVisible(p as never)) throw new Error("পণ্যটি এখন অর্ডার করা যাচ্ছে না।");
    if (p.stock_status === "out_of_stock") throw new Error("পণ্যটির স্টক শেষ।");
    const since = new Date(Date.now() - 3600_000).toISOString();
    const { count } = await db.from("gear_orders").select("id", { count: "exact", head: true }).eq("customer_phone", data.customer_phone).gte("created_at", since);
    if ((count ?? 0) >= 5) throw new Error("অনেকগুলো অর্ডার হয়েছে, কিছুক্ষণ পরে চেষ্টা করুন।");
    const items = [{ product_id: p.id, variant: "", qty: data.qty, name: p.name, price_bdt: p.sale_price_bdt!, cost_bdt: (p.procurement_cost_bdt ?? 0) + (p.extra_cost_bdt ?? 0) }];
    const t = orderTotals(items, data.delivery_zone, 0);
    const { data: row, error } = await db.from("gear_orders").insert({
      customer_name: data.customer_name, customer_phone: data.customer_phone, district: data.district, thana: data.thana, address: data.address,
      items, delivery_zone: data.delivery_zone, discount_bdt: 0, payment_method: data.payment_method, payment_status: "unpaid",
      trx_id: data.trx_id ? data.trx_id.toUpperCase() : null, courier: null, tracking_code: null, status: "pending", note: data.note ? `ওয়েবসাইট অর্ডার: ${data.note}` : "ওয়েবসাইট অর্ডার",
      subtotal_bdt: t.subtotal, delivery_charge_bdt: t.delivery, total_bdt: t.total, cost_bdt: t.cost,
    }).select("id").single();
    if (error || !row) throw new Error("অর্ডার নেওয়া যায়নি, আবার চেষ্টা করুন।");
    if (data.payment_method !== "cod" && data.trx_id) {
      try {
        const { relayMatchLateOrder } = await import("./relay-match.server");
        await relayMatchLateOrder(db, "gear", row.id, data.payment_method, data.trx_id.toUpperCase(), t.total);
      } catch { /* stays unpaid for manual review */ }
    }
    return { orderNo: `GR-${row.id.slice(0, 8).toUpperCase()}`, total: t.total, delivery: t.delivery, subtotal: t.subtotal };
  });
