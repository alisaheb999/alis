/**
 * Checkout server functions (public surface).
 *
 * Payments are manual mobile-banking transfers (bKash / Nagad / Rocket / Upay).
 * The customer submits a transaction id, we store a pending order, and the admin
 * confirms it in the billing panel — which issues the activation key.
 *
 * Security rules enforced here:
 *  - the amount always comes from the server-side catalogue, never the client;
 *  - orders are written with the service-role client only;
 *  - the confirmation lookup only reads what the admin already confirmed.
 */
import { createServerFn } from "@tanstack/react-start";
import { getRequest, getCookie, setCookie } from "@tanstack/react-start/server";
import { z } from "zod";
import { CATALOG, isCycle, isPaidPlan } from "./pricing-catalog";
import { textPriceSchedule } from "./text-price-schedule";

const checkoutSchema = z.object({
  plan: z.string().refine(isPaidPlan, "Unknown plan."),
  cycle: z.string().refine(isCycle, "Unknown billing cycle."),
  name: z.string().trim().min(2, "Please enter your name.").max(80),
  email: z.string().trim().email("Please enter a valid email.").max(200),
  phone: z.string().trim().max(30).optional().default(""),
  coupon: z.string().trim().max(40).optional().default(""),
  method: z.enum(["bkash", "nagad", "rocket", "upay"]),
  trxId: z
    .string()
    .trim()
    .min(4, "Please enter the transaction ID.")
    .max(40)
    .regex(/^[A-Za-z0-9._-]+$/, "Invalid transaction ID."),
});

const couponPreviewSchema = z.object({
  plan: z.string().refine(isPaidPlan, "Unknown plan."),
  cycle: z.string().refine(isCycle, "Unknown billing cycle."),
  coupon: z.string().trim().min(1).max(40),
});

const publicOfferSchema = z.object({
  plan: z.string().refine(isPaidPlan, "Unknown plan."),
  cycle: z.string().refine(isCycle, "Unknown billing cycle."),
});

const invoiceSchema = z.object({
  invoice_id: z
    .string()
    .trim()
    .min(6)
    .max(80)
    .regex(/^[A-Za-z0-9_-]+$/, "Invalid invoice reference."),
});



/** Public, read-only coupon check used by the checkout form. */
export const previewCoupon = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => couponPreviewSchema.parse(data))
  .handler(async ({ data }) => {
    const g = await import("./ghost-api.server");
    const meta = g.clientMeta(getRequest());
    if (!g.rateLimit(`coupon:${meta.ip ?? "anon"}`, 20, 60_000).allowed)
      throw new Error("Too many attempts. Please wait a minute.");

    const plan = CATALOG[data.plan as keyof typeof CATALOG];
    if (!plan) throw new Error("Unknown plan.");
    const { readPlanPrice } = await import('./pricing.server');
    const amount = await readPlanPrice(plan.id, data.cycle as 'monthly' | 'yearly');
    const { evaluateCoupon } = await import("./coupon.server");
    const verdict = await evaluateCoupon(data.coupon, plan.id, amount);
    return verdict.ok
      ? { ok: true as const, code: verdict.code, discount: verdict.discount, amount: verdict.amount + (textPriceSchedule(plan.id)?.increase ?? 0) }
      : { ok: false as const, reason: verdict.reason };
  });

/** Owner-managed public offer; never returns a coupon code. */
export const getPublicOffer = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => publicOfferSchema.parse(data))
  .handler(async ({ data }) => {
    const g = await import("./ghost-api.server");
    const meta = g.clientMeta(getRequest());
    if (!g.rateLimit(`public-offer:${meta.ip ?? "anon"}`, 60, 60_000).allowed)
      throw new Error("Too many attempts. Please wait a minute.");

    const plan = CATALOG[data.plan as keyof typeof CATALOG];
    if (!plan) throw new Error("Unknown plan.");
    const { readPlanPrice } = await import('./pricing.server');
    const listPrice = await readPlanPrice(plan.id, data.cycle as 'monthly' | 'yearly');
    const { getBestPublicOffer } = await import("./coupon.server");
    const offer = await getBestPublicOffer(plan.id, listPrice);
    const schedule = textPriceSchedule(plan.id);
    const increase = schedule?.increase ?? 0;
    return offer
      ? { active: true as const, listPrice: listPrice + increase, discount: offer.discount, amount: offer.amount + increase, schedule }
      : { active: increase > 0, listPrice: listPrice + increase, discount: 0, amount: listPrice + increase, schedule };
  });


/**
 * Record a manual mobile-banking payment. Creates a pending order the admin
 * confirms in the billing panel, and returns the reference + WhatsApp template.
 */
export const createManualOrder = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => checkoutSchema.parse(data))
  .handler(async ({ data }) => {
    const g = await import("./ghost-api.server");
    const request = getRequest();
    const meta = g.clientMeta(request);

    if (!g.rateLimit(`checkout:${meta.ip ?? "anon"}`, 10, 60_000).allowed)
      throw new Error("Too many attempts. Please wait a minute and try again.");

    const plan = CATALOG[data.plan as keyof typeof CATALOG];
    if (!plan) throw new Error("Unknown plan.");
    const cycle = data.cycle as "monthly" | "yearly";
    const { readPlanPrice } = await import('./pricing.server');
    const listPrice = await readPlanPrice(plan.id, cycle);
    if (!listPrice || listPrice <= 0) throw new Error("This plan cannot be purchased online.");

    // Discount is recomputed server-side; a client-sent price is never trusted.
    let amount = listPrice;
    let couponId: string | null = null;
    let couponCode: string | null = null;
    let discount = 0;
    const { getBestPublicOffer } = await import("./coupon.server");
    const publicOffer = await getBestPublicOffer(plan.id, listPrice);
    if (data.coupon) {
      const { evaluateCoupon } = await import("./coupon.server");
      const verdict = await evaluateCoupon(data.coupon, plan.id, listPrice);
      if (!verdict.ok) throw new Error(verdict.reason);
      if (!publicOffer || verdict.discount > publicOffer.discount) {
        amount = verdict.amount;
        discount = verdict.discount;
        couponId = verdict.id;
        couponCode = verdict.code;
      } else {
        amount = publicOffer.amount;
        discount = publicOffer.discount;
      }
    } else {
      if (publicOffer) {
        amount = publicOffer.amount;
        discount = publicOffer.discount;
      }
    }

    const scheduledIncrease = textPriceSchedule(plan.id)?.increase ?? 0;
    amount += scheduledIncrease;
    const db = await g.admin();
    const userId = await resolveUserId(request, data.email);
    const editToken = crypto.randomUUID();
    const editHash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(editToken))), byte => byte.toString(16).padStart(2, '0')).join('');
    const reference = `GH${Date.now().toString(36).toUpperCase()}`;

    const { data: order, error } = await db
      .from("orders")
      .insert({
        user_id: userId,
        email: data.email.toLowerCase(),
        customer_name: data.name,
        plan: plan.id,
        cycle,
        amount,
        currency: "BDT",
        provider: "manual",
        status: "pending",
        invoice_id: reference,
        transaction_id: data.trxId.toUpperCase(),
        payment_method: data.method,
        device_limit: plan.deviceLimit,
        metadata: {
          checkout_edit_hash: editHash,
          checkout_edit_expires: Date.now() + 3600_000,
          phone: data.phone ?? "",
          ip: meta.ip ?? null,
          coupon: couponCode,
          public_offer: !couponCode && discount > 0,
          discount,
          list_price: listPrice + scheduledIncrease,
          scheduled_increase: scheduledIncrease,
        } as never,
      })
      .select("id")
      .single();
    if (error || !order) throw new Error("Could not submit the order. Please try again.");
    setCookie('ghostae-checkout-edit', editToken, { httpOnly: true, secure: new URL(request.url).protocol === 'https:', sameSite: 'strict', path: '/', maxAge: 3600 });

    if (couponId) {
      const { markCouponRedeemed } = await import("./coupon.server");
      await markCouponRedeemed(couponId);
    }

    await g.logEvent({
      event: "payment.manual_submitted",
      ip_address: meta.ip,
      details: {
        order_id: order.id,
        reference,
        plan: plan.id,
        cycle,
        amount,
        method: data.method,
        trx: data.trxId,
      },
    });

    try {
      const { relayMatchNewOrder } = await import("./order-activation.server");
      await relayMatchNewOrder(db as never, order.id as string, data.trxId.toUpperCase(), data.method, amount);
    } catch { /* stays pending for manual review */ }

    return { orderId: order.id as string, reference, amount };
  });

/** Only the originating checkout may correct an unclaimed, unactivated order. */
export const updatePurchaseEmail = createServerFn({ method: 'POST' })
  .inputValidator((input: unknown) => z.object({ orderId: z.string().uuid(), email: z.string().trim().email().max(200) }).parse(input))
  .handler(async ({ data }) => {
    const token = getCookie('ghostae-checkout-edit');
    if (!token) throw new Error('ইমেইল সম্পাদনার সময় শেষ হয়েছে। সহায়তা নিন।');
    const g = await import('./ghost-api.server');
    const meta = g.clientMeta(getRequest());
    if (!g.rateLimit(`checkout-edit:${meta.ip ?? 'anon'}`, 10, 60_000).allowed) throw new Error('একটু পরে আবার চেষ্টা করুন।');
    const db = await g.admin();
    const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token))), byte => byte.toString(16).padStart(2, '0')).join('');
    const { data: order } = await db.from('orders').select('metadata').eq('id', data.orderId).maybeSingle();
    const metadata = order?.metadata as Record<string, unknown> | undefined;
    if (metadata?.checkout_edit_hash !== hash || typeof metadata.checkout_edit_expires !== 'number' || metadata.checkout_edit_expires < Date.now()) throw new Error('ইমেইল সম্পাদনা অনুমোদিত নয়।');
    const { data: updated, error } = await db.from('orders').update({ email: data.email.toLowerCase() }).eq('id', data.orderId).eq('status', 'pending').is('user_id', null).is('license_key', null).select('id');
    if (error || !updated?.length) throw new Error('অর্ডারটি যুক্ত বা যাচাই হয়ে গেছে। ইমেইল বদলাতে সহায়তা নিন।');
    return { email: data.email.toLowerCase() };
  });

/** Confirmation-page lookup: reads the order the admin confirms. */
export const confirmOrder = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => invoiceSchema.parse(data))
  .handler(async ({ data }) => {
    const g = await import("./ghost-api.server");
    const request = getRequest();
    const meta = g.clientMeta(request);
    if (!g.rateLimit(`confirm:${meta.ip ?? "anon"}`, 30, 60_000).allowed)
      throw new Error("Too many checks. Please wait a moment.");

    const { lookupOrder } = await import("./manual-order.server");
    try {
      return await lookupOrder(data.invoice_id);
    } catch {
      return { status: "pending" as const };
    }
  });

/* ------------------------------------------------------------------ */


function siteOrigin(request: Request) {
  const configured = process.env.GHOST_SITE_URL;
  if (configured) return configured.replace(/\/+$/, "");
  try {
    return new URL(request.url).origin;
  } catch {
    return "https://ghostae.com";
  }
}

/** Best-effort: attach the order to the signed-in account when a token is sent. */
async function resolveUserId(request: Request, purchaseEmail: string): Promise<string | null> {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) return null;
    const client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data } = await client.auth.getUser(header.slice(7));
    return data.user?.email_confirmed_at && data.user.email?.toLowerCase() === purchaseEmail.trim().toLowerCase() ? data.user.id : null;
  } catch {
    return null;
  }
}
