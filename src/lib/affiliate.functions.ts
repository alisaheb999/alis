import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { AFFILIATE_MIN_WITHDRAW_BDT, withdrawalErrorBn } from "./affiliate-rules";

/** Signed-in team member's own referral summary. Always filtered by user_id. */
export const getMyAffiliate = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = context.supabase;
    const { data: aff } = await db
      .from("affiliates")
      .select("id, name, commission_percent, balance_bdt, total_earned_bdt, status")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (!aff) return { affiliate: null, codes: [], commissions: [], withdrawals: [] };
    const [codes, coms, wds] = await Promise.all([
      db.from("coupons").select("code, percent_off, flat_off, active").eq("affiliate_id", aff.id),
      db.from("referral_commissions")
        .select("id, coupon_code, plan, order_amount_bdt, commission_bdt, status, created_at")
        .eq("affiliate_id", aff.id).order("created_at", { ascending: false }).limit(200),
      db.from("affiliate_withdrawals")
        .select("id, amount_bdt, payment_method, account_number, status, trx_id, created_at")
        .eq("affiliate_id", aff.id).order("created_at", { ascending: false }).limit(100),
    ]);
    return { affiliate: aff, codes: codes.data ?? [], commissions: coms.data ?? [], withdrawals: wds.data ?? [] };
  });

export const requestWithdrawal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      amount: z.number().int().min(AFFILIATE_MIN_WITHDRAW_BDT).max(1_000_000),
      method: z.enum(["bkash", "nagad", "rocket"]),
      account: z.string().trim().regex(/^01[3-9]\d{8}$/),
    }).parse(i),
  )
  .handler(async ({ data, context }) => {
    const { error } = await (context.supabase as any).rpc("affiliate_request_withdrawal", {
      p_amount: data.amount, p_method: data.method, p_account: data.account,
    });
    if (error) throw new Error(withdrawalErrorBn(error.message));
    return { ok: true };
  });

/* ---------------- Admin ---------------- */
export const adminListAffiliates = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertAdmin } = await import("./admin-helpers.server");
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [a, c, w] = await Promise.all([
      supabaseAdmin.from("affiliates").select("*").order("created_at", { ascending: false }),
      supabaseAdmin.from("coupons").select("code, affiliate_id, percent_off, flat_off, active, redeemed_count").not("affiliate_id", "is", null),
      supabaseAdmin.from("affiliate_withdrawals").select("*").order("created_at", { ascending: false }).limit(200),
    ]);
    return { affiliates: a.data ?? [], codes: c.data ?? [], withdrawals: w.data ?? [] };
  });

export const adminCreateAffiliate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      email: z.string().trim().email(),
      name: z.string().trim().min(1).max(80),
      phone: z.string().trim().max(20).optional().default(""),
      code: z.string().trim().toUpperCase().regex(/^[A-Z0-9_-]{3,30}$/),
      buyerPercentOff: z.number().int().min(0).max(90),
      commissionPercent: z.number().int().min(0).max(90).default(10),
    }).parse(i),
  )
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./admin-helpers.server");
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: prof } = await supabaseAdmin.from("profiles").select("id").ilike("email", data.email).maybeSingle();
    if (!prof) throw new Error("এই ইমেইলে কোনো অ্যাকাউন্ট নেই। আগে টিম মেম্বারকে সাইটে অ্যাকাউন্ট খুলতে বলুন।");
    const { data: existing } = await supabaseAdmin.from("coupons").select("id").eq("code", data.code).maybeSingle();
    if (existing) throw new Error("এই কুপন কোড আগে থেকেই আছে।");
    const { data: aff, error } = await supabaseAdmin.from("affiliates").insert({
      user_id: prof.id, email: data.email.toLowerCase(), name: data.name, phone: data.phone || null,
      commission_percent: data.commissionPercent,
    }).select("id").single();
    if (error) throw new Error(error.code === "23505" ? "এই ইউজার আগে থেকেই টিম মেম্বার।" : error.message);
    const { error: cErr } = await supabaseAdmin.from("coupons").insert({
      code: data.code, percent_off: data.buyerPercentOff, flat_off: 0, affiliate_id: aff.id,
      active: true, description: `Referral: ${data.name}`,
    } as never);
    if (cErr) { await supabaseAdmin.from("affiliates").delete().eq("id", aff.id); throw new Error(cErr.message); }
    return { ok: true };
  });

export const adminSetAffiliateStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid(), status: z.enum(["active", "suspended"]) }).parse(i))
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./admin-helpers.server");
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("affiliates").update({ status: data.status }).eq("id", data.id);
    await supabaseAdmin.from("coupons").update({ active: data.status === "active" }).eq("affiliate_id", data.id);
    return { ok: true };
  });

export const adminSettleWithdrawal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ id: z.string().uuid(), status: z.enum(["paid", "rejected"]), trx: z.string().trim().max(60).default(""), note: z.string().max(300).default("") }).parse(i),
  )
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./admin-helpers.server");
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await (supabaseAdmin as any).rpc("affiliate_settle_withdrawal", {
      p_id: data.id, p_status: data.status, p_trx: data.trx, p_note: data.note,
    });
    if (error) throw new Error(error.message.includes("trx_required") ? "TrxID দিন।" : "উইথড্র আপডেট করা যায়নি।");
    return { ok: true };
  });
