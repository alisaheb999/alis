/** Shared licence activation for an order — used by admin approval and Payment Relay auto-verification. */
type Admin = Awaited<typeof import("@/integrations/supabase/client.server")>["supabaseAdmin"];

export async function activateOrder(sb: Admin, orderId: string, opts: { seats?: number; days?: number; claimPending?: boolean; note?: string } = {}) {
  if (opts.claimPending) {
    // Atomic claim: only one caller may move a pending order forward.
    const { data: claimed } = await sb.from("orders").update({ status: "processing" })
      .eq("id", orderId).eq("status", "pending").select("id");
    if (!claimed?.length) return null;
  }
  const { data: order, error } = await sb.from("orders")
    .select("id, user_id, email, customer_name, plan, license_key, device_limit").eq("id", orderId).maybeSingle();
  if (error) throw new Error(error.message);
  if (!order) throw new Error("Order not found.");
  if (order.license_key) {
    await sb.from("orders").update({ status: "activated" }).eq("id", order.id);
    return { license_key: order.license_key, reused: true };
  }
  const { generateLicenseKey } = await import("@/lib/ghost-api.server");
  const plan = String(order.plan ?? "lifetime").toLowerCase();
  const productKey = ["lifetime", "text_lifetime", "text"].includes(plan) || plan.includes("text") ? "text" : "caption";
  let existingQuery = sb.from("licenses").select("license_key").eq("product_key", productKey);
  existingQuery = order.user_id ? existingQuery.eq('user_id', order.user_id) : existingQuery.is('user_id', null).eq('email', order.email ?? '');
  const { data: existing } = await existingQuery.order("created_at", { ascending: false }).limit(1).maybeSingle();
  const key = existing?.license_key ?? generateLicenseKey();
  const defaultDays = plan === "light" || plan === "lite" || plan === "basic" ? 90 : plan === "pro" ? 365 : 0;
  const days = opts.days && opts.days > 0 ? opts.days : defaultDays;
  if (!existing) {
    const { error: insErr } = await sb.from("licenses").insert({
      license_key: key, user_id: order.user_id, email: order.email, plan: order.plan ?? "lifetime", status: "active",
      max_activations: opts.seats ?? (order.device_limit || 2),
      expires_at: days > 0 ? new Date(Date.now() + days * 86400_000).toISOString() : null,
      notes: `Order ${order.id}${order.customer_name ? ` · ${order.customer_name}` : ""}${opts.note ? ` · ${opts.note}` : ""}`,
    });
    if (insErr) {
      if (opts.claimPending) await sb.from("orders").update({ status: "pending" }).eq("id", order.id);
      throw new Error(insErr.message);
    }
  }
  await sb.from("orders").update({ status: "activated", license_key: key, paid_at: new Date().toISOString() }).eq("id", order.id);
  return { license_key: key, reused: Boolean(existing) };
}

/** Called after a customer submits an order: if the phone already reported this exact payment, activate now. */
export async function relayMatchNewOrder(sb: Admin, orderId: string, trxId: string, method: string, amount: number) {
  const { data: tx } = await sb.from("relay_transactions").select("id, amount")
    .eq("provider", method).eq("trx_id", trxId).is("matched_order_id", null).maybeSingle();
  if (!tx) return false;
  const status = tx.amount === amount ? "matched" : "amount_mismatch";
  const { data: claimed } = await sb.from("relay_transactions").update({ matched_order_id: orderId, match_status: status })
    .eq("id", tx.id).is("matched_order_id", null).select("id");
  if (!claimed?.length || status !== "matched") return false;
  return Boolean(await activateOrder(sb, orderId, { claimPending: true, note: "Auto-verified by Payment Relay" }));
}
