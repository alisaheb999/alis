/**
 * Signed-in account data: licences + purchase history.
 *
 * Reads run through `requireSupabaseAuth`, so RLS scopes every row to the
 * caller. The service-role client is used only to *link* rows the user
 * provably owns (same verified email) to their account id.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getMyAccount = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId, claims } = context as {
      supabase: any;
      userId: string;
      claims: Record<string, unknown>;
    };
    const { data: identity, error: identityError } = await supabase.auth.getUser();
    if (identityError || !identity.user || identity.user.id !== userId) throw new Error('Unauthorized');
    const email = identity.user.email ?? null;

    // Attach at most one legacy key per product bought before this account existed.
    if (email && identity.user.email_confirmed_at) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin
        .from("orders")
        .update({ user_id: userId })
        .is("user_id", null)
        .ilike("email", email);
      const { data: legacy } = await supabaseAdmin
        .from("licenses")
        .select("id, product_key, created_at")
        .is("user_id", null)
        .ilike("email", email)
        .order("created_at", { ascending: false });
      const claimed = new Set<string>();
      for (const row of legacy ?? []) {
        const product = row.product_key ?? "caption";
        if (claimed.has(product)) continue;
        const { data: owned } = await supabaseAdmin
          .from("licenses")
          .select("id")
          .eq("user_id", userId)
          .eq("product_key", product)
          .maybeSingle();
        if (!owned) await supabaseAdmin.from("licenses").update({ user_id: userId }).eq("id", row.id).is('user_id', null).ilike('email', email);
        claimed.add(product);
      }
    }

    const [licenses, orders] = await Promise.all([
      supabase
        .from("licenses")
        .select("license_key, plan, status, expires_at, max_activations, activation_count, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
      supabase
        .from("orders")
        .select(
          "id, invoice_id, plan, cycle, amount, currency, status, payment_method, transaction_id, license_key, paid_at, created_at",
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

    if (licenses.error || orders.error) throw new Error('Could not load your products.');
    const uniqueProducts = new Set<string>();
    const ownedLicenses = (licenses.data ?? []).filter((row: { plan: string }) => {
      const p = row.plan.toLowerCase();
      const product = p.includes("text") || p === "lifetime" ? "text" : "caption";
      if (uniqueProducts.has(product)) return false;
      uniqueProducts.add(product);
      return true;
    });
    return {
      email,
      licenses: ownedLicenses as Array<{
        license_key: string;
        plan: string;
        status: string;
        expires_at: string | null;
        max_activations: number;
        activation_count: number;
        created_at: string;
      }>,
      orders: (orders.data ?? []).map((order: { status: string }) => ({ ...order, status: order.status === 'activated' ? 'paid' : order.status })) as Array<{
        id: string;
        invoice_id: string | null;
        plan: string;
        cycle: string;
        amount: number;
        currency: string;
        status: string;
        payment_method: string | null;
        transaction_id: string | null;
        license_key: string | null;
        paid_at: string | null;
        created_at: string;
      }>,
    };
  });

/** Owner switches their own licence on/off (active <-> suspended only). */
export const setMyLicenseEnabled = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const v = input as { license_key?: unknown; enabled?: unknown };
    if (typeof v?.license_key !== "string" || typeof v?.enabled !== "boolean") throw new Error("Invalid input");
    return { license_key: v.license_key, enabled: v.enabled };
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as { supabase: any; userId: string };
    const { data: own } = await supabase
      .from("licenses")
      .select("id, status")
      .eq("license_key", data.license_key)
      .eq("user_id", userId)
      .maybeSingle();
    if (!own) throw new Error("License not found.");
    if (own.status !== "active" && own.status !== "suspended") throw new Error("This licence cannot be changed.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const status = data.enabled ? "active" : "suspended";
    const { error } = await supabaseAdmin.from("licenses").update({ status }).eq("id", own.id);
    if (error) throw new Error(error.message);
    return { ok: true, status };
  });
