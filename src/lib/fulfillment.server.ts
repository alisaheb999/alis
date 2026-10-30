/**
 * Order fulfilment — server only.
 *
 * The single place that turns a *gateway-verified* payment into an activation
 * key. Never called from the browser directly: the webhook route and the
 * confirmation-page verifier both re-verify the invoice with ZiniPay before
 * calling in here, and every step is idempotent.
 */
import { CATALOG, cycleDays, type Cycle, type PaidPlanId } from "./pricing-catalog";
import { verifyInvoice } from "./zinipay.server";

type OrderRow = {
  id: string;
  user_id: string | null;
  email: string | null;
  customer_name: string | null;
  plan: string;
  cycle: string;
  amount: number;
  status: string;
  license_key: string | null;
  invoice_id: string | null;
  device_limit: number;
  transaction_id: string | null;
  payment_method: string | null;
  paid_at: string | null;
  created_at: string;
};

async function db() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

function makeKey() {
  const raw = crypto.randomUUID().replace(/-/g, "").toUpperCase();
  return `GHOST-${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}-${raw.slice(12, 16)}`;
}

export type FulfilResult = {
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

/**
 * Verify an invoice with ZiniPay and, when it is COMPLETED, issue the licence.
 * Safe to call repeatedly (webhook + redirect + manual retry).
 */
export async function fulfilInvoice(invoiceId: string): Promise<FulfilResult> {
  const supabase = await db();

  const { data: found } = await supabase
    .from("orders")
    .select("*")
    .eq("invoice_id", invoiceId)
    .maybeSingle();
  const order = found as OrderRow | null;
  if (!order) return { status: "not_found" };

  // Already fulfilled — hand back the stored key without touching the gateway.
  if (order.status === "paid" && order.license_key) return shape(order, await expiry(order));

  const verdict = await verifyInvoice(invoiceId);

  if (verdict.status !== "COMPLETED") {
    const next = verdict.status === "FAILED" ? "failed" : "pending";
    if (order.status !== next) {
      await supabase.from("orders").update({ status: next }).eq("id", order.id);
    }
    return shape({ ...order, status: next }, null);
  }

  // Guard against amount tampering: the gateway amount must match our catalogue.
  if (verdict.amount != null && Math.round(verdict.amount) !== order.amount) {
    await supabase
      .from("orders")
      .update({ status: "review", metadata: { amount_mismatch: verdict.amount } as never })
      .eq("id", order.id);
    return shape({ ...order, status: "pending" }, null);
  }

  const plan = order.plan as PaidPlanId;
  const cycle = (order.cycle === "yearly" ? "yearly" : "monthly") as Cycle;
  const seats = order.device_limit || CATALOG[plan]?.deviceLimit || 2;
  const expiresAt = new Date(Date.now() + cycleDays(cycle, plan) * 86_400_000).toISOString();
  const email = order.email ?? verdict.email;

  const productKey = ["lifetime", "text_lifetime", "text"].includes(plan.toLowerCase()) || plan.toLowerCase().includes("text") ? "text" : "caption";
  const { data: existingLicense } = await supabase.from("licenses").select("license_key")
    .or(order.user_id ? `user_id.eq.${order.user_id}` : `email.ilike.${email ?? ""}`)
    .eq("product_key", productKey).order("created_at", { ascending: false }).limit(1).maybeSingle();
  const key = order.license_key ?? existingLicense?.license_key ?? makeKey();

  if (!order.license_key && !existingLicense) {
    const { error } = await supabase.from("licenses").insert({
      license_key: key,
      user_id: order.user_id,
      email,
      plan,
      status: "active",
      max_activations: seats,
      expires_at: expiresAt,
      notes: `Auto-issued for ${plan}/${cycle} · invoice ${invoiceId}`,
    });
    if (error) throw new Error("Could not issue the licence key.");
  }

  await supabase
    .from("orders")
    .update({
      status: "paid",
      license_key: key,
      transaction_id: verdict.transactionId,
      payment_method: verdict.paymentMethod,
      email,
      customer_name: order.customer_name ?? verdict.name,
      paid_at: order.paid_at ?? new Date().toISOString(),
    })
    .eq("id", order.id);

  // Mirror into the manual payments ledger the admin billing panel reads.
  await supabase.from("payments").insert({
    email,
    customer_name: order.customer_name ?? verdict.name,
    plan,
    amount: order.amount,
    currency: "BDT",
    method: verdict.paymentMethod ?? "zinipay",
    provider_ref: verdict.transactionId ?? invoiceId,
    status: "paid",
    license_key: key,
    notes: `ZiniPay ${cycle} · invoice ${invoiceId}`,
    paid_at: new Date().toISOString(),
  });

  return shape({ ...order, status: "paid", license_key: key, payment_method: verdict.paymentMethod, transaction_id: verdict.transactionId, email }, expiresAt);
}

async function expiry(order: OrderRow) {
  if (!order.license_key) return null;
  const supabase = await db();
  const { data } = await supabase
    .from("licenses")
    .select("expires_at")
    .eq("license_key", order.license_key)
    .maybeSingle();
  return (data?.expires_at as string | null) ?? null;
}

function shape(order: OrderRow, expiresAt: string | null): FulfilResult {
  return {
    status: order.status === "paid" ? "paid" : order.status === "failed" ? "failed" : "pending",
    order: {
      id: order.id,
      plan: order.plan,
      cycle: order.cycle,
      amount: order.amount,
      email: order.email,
      name: order.customer_name,
      licenseKey: order.status === "paid" ? order.license_key : null,
      deviceLimit: order.device_limit,
      expiresAt,
      paymentMethod: order.payment_method,
      transactionId: order.transaction_id,
      createdAt: order.created_at,
    },
  };
}
