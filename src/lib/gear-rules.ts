export type GearPublicProduct = {
  id: string;
  slug: string;
  name: string;
  category: { slug: string; name: string } | null;
  short_description: string;
  description: string;
  features: string[];
  specs: { label: string; value: string }[];
  compatibility: string;
  box_contents: string[];
  delivery_info: string;
  warranty_info: string;
  return_info: string;
  images: string[];
  related_slugs: string[];
  sale_price_bdt: number;
  compare_price_bdt: number | null;
  stock_status: string;
  sort_order: number;
  created_at: string;
};

export function grossProfit(p: { sale_price_bdt: number | null; procurement_cost_bdt: number | null; extra_cost_bdt: number | null }) {
  if (p.sale_price_bdt == null || p.procurement_cost_bdt == null) return null;
  return p.sale_price_bdt - p.procurement_cost_bdt - (p.extra_cost_bdt ?? 0);
}

/** A product may be shown publicly only when published with an approved price and cost. */
export function isPubliclyVisible(p: { status: string; sale_price_bdt: number | null; procurement_cost_bdt: number | null }) {
  return p.status === "published" && (p.sale_price_bdt ?? 0) > 0 && p.procurement_cost_bdt != null;
}

export function suggestGear<T extends { slug: string; category: { slug: string } | null }>(all: T[], current: T & { related_slugs: string[] }, limit = 4): T[] {
  const others = all.filter((p) => p.slug !== current.slug);
  const picked = current.related_slugs.map((s) => others.find((p) => p.slug === s)).filter((p): p is T => !!p);
  const same = others.filter((p) => p.category?.slug && p.category.slug === current.category?.slug);
  const out: T[] = [];
  for (const p of [...picked, ...same, ...others]) if (!out.includes(p)) out.push(p);
  return out.slice(0, limit);
}

export type GearSort = "featured" | "newest" | "price-asc" | "price-desc";
export function sortGear<T extends { sale_price_bdt: number; created_at: string; sort_order: number }>(rows: T[], sort: GearSort) {
  const r = [...rows];
  if (sort === "price-asc") r.sort((a, b) => a.sale_price_bdt - b.sale_price_bdt);
  else if (sort === "price-desc") r.sort((a, b) => b.sale_price_bdt - a.sale_price_bdt);
  else if (sort === "newest") r.sort((a, b) => b.created_at.localeCompare(a.created_at));
  else r.sort((a, b) => a.sort_order - b.sort_order);
  return r;
}

export const GEAR_STOCK_LABEL: Record<string, string> = {
  in_stock: "স্টকে আছে", low_stock: "সীমিত স্টক", out_of_stock: "স্টক শেষ", preorder: "প্রি-অর্ডার",
};

export const DELIVERY_CHARGE_BDT = { inside_dhaka: 60, outside_dhaka: 130 } as const;
export type DeliveryZone = keyof typeof DELIVERY_CHARGE_BDT;
export const LOW_STOCK_QTY = 5;

/** Order totals: subtotal from items, plus zone delivery charge, minus discount (never below 0). */
export function orderTotals(items: { price_bdt: number; cost_bdt: number; qty: number }[], zone: DeliveryZone, discount = 0) {
  const subtotal = items.reduce((s, i) => s + i.price_bdt * i.qty, 0);
  const cost = items.reduce((s, i) => s + i.cost_bdt * i.qty, 0);
  const delivery = DELIVERY_CHARGE_BDT[zone];
  const total = Math.max(0, subtotal + delivery - Math.max(0, discount));
  return { subtotal, delivery, total, cost, profit: total - delivery - cost };
}

export const GEAR_ORDER_STATUS: Record<string, string> = {
  pending: "পেন্ডিং", confirmed: "কনফার্মড", processing: "প্যাকিং", shipped: "কুরিয়ারে", delivered: "ডেলিভার্ড", returned: "রিটার্ন", cancelled: "বাতিল",
};
