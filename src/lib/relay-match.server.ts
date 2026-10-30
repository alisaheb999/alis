/** Payment Relay matching for Digital and Gear orders. Exact provider + TrxID + amount on an unpaid order only. */
type Admin = Awaited<typeof import("@/integrations/supabase/client.server")>["supabaseAdmin"];

export type OtherMatch = { kind: "digital" | "gear"; id: string; status: "matched" | "amount_mismatch" } | null;

/** Find an unpaid Digital/Gear order for an incoming SMS. Atomically marks it paid when the amount matches. */
export async function matchOtherOrders(sb: Admin, provider: string, trxId: string, amount: number): Promise<OtherMatch> {
  const { data: d } = await sb.from("digital_orders").select("id,amount_bdt")
    .eq("trx_id", trxId).eq("payment_method", provider).eq("status", "pending").limit(1).maybeSingle();
  if (d) {
    if (d.amount_bdt !== amount) return { kind: "digital", id: d.id, status: "amount_mismatch" };
    const { data: ok } = await sb.from("digital_orders").update({ status: "paid", payment_verified_at: new Date().toISOString(), payment_verification_source: 'relay' }).eq("id", d.id).eq("status", "pending").select("id");
    if (!ok?.length) return null;
    await autoDeliver(sb, d.id);
    return { kind: "digital", id: d.id, status: "matched" };
  }
  const { data: g } = await sb.from("gear_orders").select("id,total_bdt")
    .eq("trx_id", trxId).eq("payment_method", provider).eq("payment_status", "unpaid").limit(1).maybeSingle();
  if (g) {
    if (g.total_bdt !== amount) return { kind: "gear", id: g.id, status: "amount_mismatch" };
    const { data: ok } = await sb.from("gear_orders").update({ payment_status: "paid" }).eq("id", g.id).eq("payment_status", "unpaid").select("id");
    return ok?.length ? { kind: "gear", id: g.id, status: "matched" } : null;
  }
  return null;
}

/** After a Digital/Gear order is submitted: if the phone already reported this payment, mark it paid. */
export async function relayMatchLateOrder(sb: Admin, kind: "digital" | "gear", orderId: string, provider: string, trxId: string, amount: number) {
  const { data: tx } = await sb.from("relay_transactions").select("id,amount")
    .eq("provider", provider).eq("trx_id", trxId).is("matched_order_id", null).maybeSingle();
  if (!tx) return false;
  const status = tx.amount === amount ? "matched" : "amount_mismatch";
  const { data: claimed } = await sb.from("relay_transactions").update({ matched_order_id: orderId, match_status: status })
    .eq("id", tx.id).is("matched_order_id", null).select("id");
  if (!claimed?.length || status !== "matched") return false;
  if (kind === "digital") {
    const { data } = await sb.from("digital_orders").update({ status: "paid", payment_verified_at: new Date().toISOString(), payment_verification_source: 'relay' }).eq("id", orderId).eq("status", "pending").select("id");
    if (data?.length) await autoDeliver(sb, orderId);
    return Boolean(data?.length);
  }
  const { data } = await sb.from("gear_orders").update({ payment_status: "paid" }).eq("id", orderId).eq("payment_status", "unpaid").select("id");
  return Boolean(data?.length);
}

/** Supplier delivery never blocks payment matching; failures stay visible in admin for retry. */
async function autoDeliver(sb: Admin, orderId: string) {
  try { const { deliverDigitalOrder } = await import("./shopbot.server"); await deliverDigitalOrder(sb, orderId); } catch (e) { console.error("auto delivery failed", e); }
}
