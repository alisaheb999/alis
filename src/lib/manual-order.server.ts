/**
 * Manual payment orders — server only.
 *
 * Ghostae takes bKash / Nagad / Rocket / Upay transfers directly. The customer
 * sends money, submits the transaction id here, and the admin confirms it in the
 * billing panel (which issues the licence key). No third-party gateway is used.
 */
import { CATALOG, type PaidPlanId } from "./pricing-catalog";

export const PAYMENT_METHODS = ["bkash", "nagad", "rocket", "upay"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

/** Number every method receives money on (personal / send money). */
export const RECEIVE_NUMBER = "01949085128";
/** Verification WhatsApp line. */
export const SUPPORT_WHATSAPP = "8801345407572";

type OrderRow = {
  id: string;
  plan: string;
  cycle: string;
  amount: number;
  email: string | null;
  customer_name: string | null;
  status: string;
  license_key: string | null;
  device_limit: number;
  transaction_id: string | null;
  payment_method: string | null;
  created_at: string;
};

async function db() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export type OrderStatus = {
  status: "paid" | "pending" | "failed" | "not_found";
  order?: {
    id: string;
    plan: string;
    cycle: string;
    amount: number;
    email: string | null;
    name: string | null;
    licenseKey: string | null;
    deviceLimit: number;
    expiresAt: string | null;
    paymentMethod: string | null;
    transactionId: string | null;
    createdAt: string;
  };
};

/** Confirmation-page lookup: pure DB read, no gateway call. */
export async function lookupOrder(reference: string): Promise<OrderStatus> {
  const supabase = await db();
  const byId = /^[0-9a-f-]{36}$/i.test(reference);
  const query = supabase.from("orders").select("*").limit(1);
  const { data } = byId
    ? await query.eq("id", reference).maybeSingle()
    : await query.eq("invoice_id", reference).maybeSingle();

  const found = data as OrderRow | null;
  const order = found ? { ...found, status: found.status === 'activated' ? 'paid' : found.status } : null;
  if (!order) return { status: "not_found" };

  let expiresAt: string | null = null;
  if (order.license_key) {
    const { data: lic } = await supabase
      .from("licenses")
      .select("expires_at")
      .eq("license_key", order.license_key)
      .maybeSingle();
    expiresAt = (lic?.expires_at as string | null) ?? null;
  }

  return {
    status:
      order.status === "paid" ? "paid" : order.status === "failed" ? "failed" : "pending",
    order: {
      id: order.id,
      plan: order.plan,
      cycle: order.cycle,
      amount: order.amount,
      email: order.email,
      name: order.customer_name,
      licenseKey: order.status === "paid" ? order.license_key : null,
      deviceLimit: order.device_limit || CATALOG[order.plan as PaidPlanId]?.deviceLimit || 1,
      expiresAt,
      paymentMethod: order.payment_method,
      transactionId: order.transaction_id,
      createdAt: order.created_at,
    },
  };
}
