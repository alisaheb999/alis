import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";



export const adminVerifyCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ code: z.string() }).parse(input))
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./admin-helpers.server");
    await assertAdmin(context);
    return { success: true };
  });

export const adminGetFullOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ code: z.string() }).parse(input))
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./admin-helpers.server");
    await assertAdmin(context);
    
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    const [licenses, activations, logs, settings] = await Promise.all([
      supabaseAdmin
        .from("licenses")
        .select("id, license_key, email, plan, status, max_activations, activation_count, expires_at, last_seen_at, notes, created_at")
        .order("created_at", { ascending: false })
        .limit(200),
      supabaseAdmin
        .from("license_activations")
        .select("id, license_id, device_fingerprint, hostname, platform, app_version, revoked, last_seen_at")
        .order("last_seen_at", { ascending: false })
        .limit(300),
      supabaseAdmin
        .from("extension_logs")
        .select("id, event, status, license_key, device_fingerprint, app_version, details, created_at")
        .order("created_at", { ascending: false })
        .limit(100),
      supabaseAdmin
        .from("extension_settings")
        .select("module, key, value, enabled, updated_at")
        .eq("module", "patch")
        .eq("key", "stable")
        .maybeSingle()
    ]);

    const rows = licenses.data ?? [];
    return {
      licenses: rows,
      activations: activations.data ?? [],
      logs: logs.data ?? [],
      patch: {
        enabled: settings.data?.enabled ?? false,
        data: settings.data?.value ?? null,
        updated_at: settings.data?.updated_at ?? null
      },
      stats: {
        total: rows.length,
        active: rows.filter((r) => r.status === "active").length,
        revoked: rows.filter((r) => r.status === "revoked").length,
        devices: (activations.data ?? []).filter((a) => !a.revoked).length,
      },
    };
  });

export const adminIssueLicenseCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      code: z.string(),
      email: z.string().max(255).optional().or(z.literal("")),
      plan: z.string().min(1).max(40).default("pro"),
      max_activations: z.number().int().min(1).max(25).default(2),
      expires_in_days: z.number().int().min(0).max(3650).default(0),
      notes: z.string().max(1000).optional().or(z.literal("")),
      quantity: z.number().int().min(1).max(50).default(1),
      // Admin may type an exact key (any key already handed to a customer)
      // instead of letting the server generate a random one.
      custom_key: z.string().max(64).optional().or(z.literal("")),
    }).parse(input)
  )
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./admin-helpers.server");
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { makeKey } = await import("./admin-helpers.server");

    const expires = data.expires_in_days > 0
      ? new Date(Date.now() + data.expires_in_days * 86400_000).toISOString()
      : null;

    const custom = (data.custom_key ?? "").trim().toUpperCase().replace(/\s+/g, "");
    if (custom && !/^[A-Z0-9-]{8,40}$/.test(custom)) throw new Error("Invalid custom key format.");
    const productKey = ["lifetime", "text_lifetime", "text"].includes(data.plan.toLowerCase()) || data.plan.toLowerCase().includes("text") ? "text" : "caption";
    if (data.email) {
      const { data: existing } = await supabaseAdmin.from("licenses")
        .select("license_key, plan, status, expires_at, max_activations")
        .ilike("email", data.email).eq("product_key", productKey)
        .order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (existing) return { created: [existing], reused: true };
    }
    const count = data.email || custom ? 1 : data.quantity;

    const payload = Array.from({ length: count }, () => ({
      license_key: custom || makeKey(),
      email: data.email || null,
      plan: data.plan,
      status: "active" as const,
      max_activations: data.max_activations,
      expires_at: expires,
      notes: data.notes || null,
    }));


    const { data: created, error } = await supabaseAdmin
      .from("licenses")
      .insert(payload)
      .select("license_key, plan, status, expires_at, max_activations");

    if (error) throw new Error(error.message);
    return { created: created ?? [] };
  });

export const adminSetLicenseStatusCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      code: z.string(),
      license_id: z.string().uuid(),
      status: z.enum(["inactive", "active", "suspended", "revoked", "expired"]),
    }).parse(input)
  )
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./admin-helpers.server");
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { error } = await supabaseAdmin
      .from("licenses")
      .update({ status: data.status })
      .eq("id", data.license_id);
    if (error) throw new Error(error.message);

    if (data.status === "revoked" || data.status === "suspended") {
      await supabaseAdmin
        .from("license_activations")
        .update({ revoked: true })
        .eq("license_id", data.license_id);
    }

    return { ok: true };
  });

export const adminUpdateLicenseCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      code: z.string(),
      license_id: z.string().uuid(),
      max_activations: z.number().int().min(1).max(25).optional(),
      expires_in_days: z.number().int().min(0).max(3650).optional(),
      notes: z.string().max(1000).optional(),
      email: z.string().max(255).optional().or(z.literal("")),
    }).parse(input)
  )
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./admin-helpers.server");
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const patch: Record<string, any> = {};
    if (data.max_activations !== undefined) patch.max_activations = data.max_activations;
    if (data.notes !== undefined) patch.notes = data.notes || null;
    if (data.email !== undefined) patch.email = data.email || null;
    if (data.expires_in_days !== undefined)
      patch.expires_at = data.expires_in_days > 0
        ? new Date(Date.now() + data.expires_in_days * 86400_000).toISOString()
        : null;

    const { error } = await supabaseAdmin.from("licenses").update(patch as any).eq("id", data.license_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminSetDeviceRevokedCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ code: z.string(), activation_id: z.string().uuid(), revoked: z.boolean() }).parse(input)
  )
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./admin-helpers.server");
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { error } = await supabaseAdmin
      .from("license_activations")
      .update({ revoked: data.revoked })
      .eq("id", data.activation_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminPublishPatchCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      code: z.string(),
      version: z.string().regex(/^\d+\.\d+\.\d+$/, "Use a version like 3.7.4"),
      url: z.string().min(1).max(500),
      sha256: z.string().regex(/^[a-fA-F0-9]{64}$/, "Paste the 64-character SHA-256"),
      mandatory: z.boolean().default(true),
      enabled: z.boolean().default(true),
    }).parse(input)
  )
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./admin-helpers.server");
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const value = {
      patchId: `ghost-${data.version}`,
      version: data.version,
      title: `GHOST ${data.version}`,
      url: data.url,
      sha256: data.sha256.toLowerCase(),
      mandatory: data.mandatory,
      requiresRestart: true,
      publishedAt: new Date().toISOString(),
    };

    const { error } = await supabaseAdmin
      .from("extension_settings")
      .upsert(
        { module: "patch", key: "stable", value, enabled: data.enabled } as any,
        { onConflict: "module,key" }
      );

    if (error) throw new Error("Could not publish the patch.");
    return { ok: true };
  });

export const adminSetPatchEnabledCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ code: z.string(), enabled: z.boolean() }).parse(input))
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./admin-helpers.server");
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { error } = await supabaseAdmin
      .from("extension_settings")
      .update({ enabled: data.enabled } as any)
      .eq("module", "patch")
      .eq("key", "stable");
    if (error) throw new Error("Could not change the patch state.");
    return { ok: true };
  });



/* ------------------------------------------------------------------ *
 * Ghost AI OS — Layer 1 identity + Layer 2 prompt rules
 * ------------------------------------------------------------------ */
export const adminAiBrainCode = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ code: z.string() }).parse(input))
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./admin-helpers.server");
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [identity, templates, runs] = await Promise.all([
      supabaseAdmin
        .from("ai_identity_sections")
        .select("id, slug, title, body, ordinal, layer, enabled, notes, revision, updated_at")
        .order("ordinal", { ascending: true }),
      supabaseAdmin
        .from("prompt_templates")
        .select("id, category, kind, title, body, weight, enabled, version, updated_at")
        .order("category", { ascending: true })
        .order("weight", { ascending: false }),
      supabaseAdmin
        .from("prompt_runs")
        .select("id, category, detected_category, provider, model, raw_length, expanded_length, ok, latency_ms, created_at")
        .order("created_at", { ascending: false })
        .limit(60),
    ]);

    const sections = identity.data ?? [];
    return {
      identity: sections,
      templates: templates.data ?? [],
      runs: runs.data ?? [],
      revision: sections.reduce((max: number, s: any) => Math.max(max, Number(s.revision || 1)), 1),
    };
  });

export const adminSaveIdentitySectionCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      code: z.string(),
      id: z.string().uuid().optional(),
      slug: z.string().min(2).max(80),
      title: z.string().min(2).max(160),
      body: z.string().min(10).max(20000),
      ordinal: z.number().int().min(0).max(10000).default(100),
      layer: z.number().int().min(1).max(9).default(1),
      enabled: z.boolean().default(true),
      notes: z.string().max(2000).optional().or(z.literal("")),
    }).parse(input)
  )
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./admin-helpers.server");
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { invalidateIdentityCache } = await import("./ghost-identity.server");

    const row = {
      slug: data.slug.trim().toLowerCase(),
      title: data.title.trim(),
      body: data.body.trim(),
      ordinal: data.ordinal,
      layer: data.layer,
      enabled: data.enabled,
      notes: data.notes || null,
    };

    if (data.id) {
      const { data: prev } = await supabaseAdmin
        .from("ai_identity_sections")
        .select("revision")
        .eq("id", data.id)
        .maybeSingle();
      const { error } = await supabaseAdmin
        .from("ai_identity_sections")
        .update({ ...row, revision: Number(prev?.revision || 1) + 1 } as never)
        .eq("id", data.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin
        .from("ai_identity_sections")
        .insert(row as never);
      if (error) throw new Error(error.message);
    }

    invalidateIdentityCache();
    return { ok: true };
  });

export const adminSetIdentityEnabledCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ code: z.string(), id: z.string().uuid(), enabled: z.boolean() }).parse(input)
  )
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./admin-helpers.server");
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { invalidateIdentityCache } = await import("./ghost-identity.server");
    const { error } = await supabaseAdmin
      .from("ai_identity_sections")
      .update({ enabled: data.enabled } as never)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    invalidateIdentityCache();
    return { ok: true };
  });

export const adminSavePromptTemplateCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      code: z.string(),
      id: z.string().uuid().optional(),
      category: z.string().min(2).max(64),
      kind: z.enum(["system", "rule"]).default("rule"),
      title: z.string().max(160).optional().or(z.literal("")),
      body: z.string().min(5).max(20000),
      weight: z.number().int().min(0).max(1000).default(100),
      enabled: z.boolean().default(true),
    }).parse(input)
  )
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./admin-helpers.server");
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const row = {
      category: data.category.trim().toLowerCase(),
      kind: data.kind,
      title: data.title || "",
      body: data.body.trim(),
      weight: data.weight,
      enabled: data.enabled,
    };
    if (data.id) {
      const { error } = await supabaseAdmin.from("prompt_templates").update(row as never).eq("id", data.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin.from("prompt_templates").insert(row as never);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const adminSetPromptTemplateEnabledCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ code: z.string(), id: z.string().uuid(), enabled: z.boolean() }).parse(input)
  )
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./admin-helpers.server");
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("prompt_templates")
      .update({ enabled: data.enabled } as never)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ------------------------------------------------------------------ *
 * Bulk paste import — write the constitution with any external AI,
 * then paste the whole document here. The parser understands markdown
 * headings (##/###), "slug: ..." front lines and `---` separators, so
 * ChatGPT / Claude / Gemini output can be pasted as-is.
 * ------------------------------------------------------------------ */

type ParsedBlock = { slug: string; title: string; body: string; ordinal: number };

function slugify(input: string, fallback: string) {
  const s = input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 70);
  return s || fallback;
}

export function parseBrainDocument(raw: string, startOrdinal = 1000): ParsedBlock[] {
  const text = raw.replace(/\r\n/g, "\n").trim();
  if (!text) return [];

  // Split on markdown headings, or on horizontal rules when no headings exist.
  const hasHeadings = /^#{1,4}\s+\S/m.test(text);
  const chunks: string[] = hasHeadings
    ? text.split(/\n(?=#{1,4}\s+\S)/g)
    : text.split(/\n\s*(?:---+|\*\*\*+|===+)\s*\n/g);

  const blocks: ParsedBlock[] = [];
  let i = 0;
  for (const chunk of chunks) {
    const lines = chunk.split("\n");
    let title = "";
    let slug = "";
    while (lines.length) {
      const first = (lines[0] ?? "").trim();
      const heading = first.match(/^#{1,4}\s+(.+?)\s*#*$/);
      const slugLine = first.match(/^slug\s*[:=]\s*(.+)$/i);
      const titleLine = first.match(/^title\s*[:=]\s*(.+)$/i);
      if (heading) {
        title = title || heading[1]!.trim();
        lines.shift();
        continue;
      }
      if (slugLine) {
        slug = slugify(slugLine[1]!, "");
        lines.shift();
        continue;
      }
      if (titleLine) {
        title = titleLine[1]!.trim();
        lines.shift();
        continue;
      }
      break;
    }
    const body = lines.join("\n").trim();
    if (body.length < 8) continue;
    if (!title) title = body.split("\n")[0]!.replace(/^[-*\d.\s]+/, "").slice(0, 90);
    i += 1;
    blocks.push({
      slug: slug || slugify(title, `imported-${i}`),
      title: title.slice(0, 160),
      body: body.slice(0, 20000),
      ordinal: startOrdinal + i * 10,
    });
  }
  return blocks;
}

export const adminImportBrainCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      code: z.string(),
      target: z.enum(["identity", "rules"]).default("identity"),
      text: z.string().min(10).max(200000),
      category: z.string().max(64).optional().or(z.literal("")),
      kind: z.enum(["system", "rule"]).default("rule"),
      weight: z.number().int().min(0).max(1000).default(100),
      replaceExisting: z.boolean().default(false),
      dryRun: z.boolean().default(false),
    }).parse(input)
  )
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./admin-helpers.server");
    await assertAdmin(context);
    const blocks = parseBrainDocument(data.text);
    if (!blocks.length) throw new Error("কোনো block পাওয়া যায়নি — heading (## Title) বা --- separator ব্যবহার করুন।");
    if (data.dryRun) {
      return { ok: true, imported: 0, blocks: blocks.map((b) => ({ slug: b.slug, title: b.title, chars: b.body.length })) };
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (data.target === "identity") {
      const { invalidateIdentityCache } = await import("./ghost-identity.server");
      if (data.replaceExisting) {
        const { error: delErr } = await supabaseAdmin
          .from("ai_identity_sections")
          .update({ enabled: false } as never)
          .eq("enabled", true);
        if (delErr) throw new Error(delErr.message);
      }
      for (const b of blocks) {
        const { data: prev } = await supabaseAdmin
          .from("ai_identity_sections")
          .select("id, revision")
          .eq("slug", b.slug)
          .maybeSingle();
        if (prev?.id) {
          const { error } = await supabaseAdmin
            .from("ai_identity_sections")
            .update({
              title: b.title,
              body: b.body,
              enabled: true,
              revision: Number(prev.revision || 1) + 1,
            } as never)
            .eq("id", prev.id);
          if (error) throw new Error(error.message);
        } else {
          const { error } = await supabaseAdmin.from("ai_identity_sections").insert({
            slug: b.slug,
            title: b.title,
            body: b.body,
            ordinal: b.ordinal,
            layer: 1,
            enabled: true,
            notes: "Imported via admin paste",
          } as never);
          if (error) throw new Error(error.message);
        }
      }
      invalidateIdentityCache();
      return { ok: true, imported: blocks.length, blocks: [] };
    }

    const category = (data.category || "general").trim().toLowerCase();
    if (data.replaceExisting) {
      const { error } = await supabaseAdmin
        .from("prompt_templates")
        .update({ enabled: false } as never)
        .eq("category", category);
      if (error) throw new Error(error.message);
    }
    for (const b of blocks) {
      const { error } = await supabaseAdmin.from("prompt_templates").insert({
        category,
        kind: data.kind,
        title: b.title,
        body: b.body,
        weight: data.weight,
        enabled: true,
      } as never);
      if (error) throw new Error(error.message);
    }
    return { ok: true, imported: blocks.length, blocks: [] };
  });

/* ------------------------------------------------------------------ *
 * Pricing plans + payment management (admin console)
 * ------------------------------------------------------------------ */

export const adminBillingCode = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ code: z.string() }).parse(input))
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./admin-helpers.server");
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [plans, payments, coupons, orders, publicOffers] = await Promise.all([
      supabaseAdmin
        .from("pricing_plans")
        .select("id, plan_key, name_en, name_bn, price_monthly, price_yearly, currency, tokens_monthly, device_limit, badge, description_en, sort_order, visible, updated_at")
        .order("sort_order", { ascending: true }),
      supabaseAdmin
        .from("payments")
        .select("id, email, customer_name, plan, amount, currency, method, provider_ref, status, license_key, notes, paid_at, created_at")
        .order("created_at", { ascending: false })
        .limit(200),
      supabaseAdmin
        .from("coupons")
        .select("id, code, description, percent_off, flat_off, plans, max_redemptions, redeemed_count, active, is_public, starts_at, expires_at, created_at")
        .order("created_at", { ascending: false })
        .limit(200),
      supabaseAdmin
        .from("orders")
        .select("id, email, customer_name, plan, cycle, amount, currency, payment_method, provider, transaction_id, invoice_id, status, license_key, paid_at, created_at")
        .order("created_at", { ascending: false })
        .limit(200),
      supabaseAdmin
        .from("public_offers")
        .select("id, plan, discount, active, updated_at"),
    ]);

    // Website purchases land in `orders`; surface them in the same list so
    // every customer submission shows up in the admin console automatically.
    const orderRows = ((orders.data ?? []) as any[]).map((o) => ({
      id: o.id,
      email: o.email,
      customer_name: o.customer_name,
      plan: o.plan,
      amount: o.amount,
      currency: o.currency,
      method: o.payment_method || o.provider || "manual",
      provider_ref: o.transaction_id || o.invoice_id,
      status: o.status === "activated" ? "paid" : o.status,
      license_key: o.license_key,
      notes: `Order ${o.invoice_id ?? ""} · ${o.cycle ?? ""}`.trim(),
      paid_at: o.paid_at,
      created_at: o.created_at,
      source: "order" as const,
    }));

    const rows = [
      ...((payments.data ?? []) as any[]).map((p) => ({ ...p, source: "payment" as const })),
      ...orderRows,
    ].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    ) as any[];
    const paid = rows.filter((r) => r.status === "paid");
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    return {
      plans: (plans.data ?? []) as any[],
      payments: rows,
      coupons: (coupons.data ?? []) as any[],
      publicOffers: (publicOffers.data ?? []) as any[],
      stats: {
        revenueTotal: paid.reduce((s, r) => s + Number(r.amount || 0), 0),
        revenueMonth: paid
          .filter((r) => new Date(r.paid_at || r.created_at).getTime() >= monthStart)
          .reduce((s, r) => s + Number(r.amount || 0), 0),
        paidCount: paid.length,
        pendingCount: rows.filter((r) => r.status === "pending").length,
        refundedCount: rows.filter((r) => r.status === "refunded").length,
      },
    };
  });

export const adminSavePricingPlanCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      code: z.string(),
      id: z.string().uuid().optional(),
      plan_key: z.string().min(2).max(40),
      name_en: z.string().min(1).max(80),
      name_bn: z.string().max(80).optional().or(z.literal("")),
      price_monthly: z.number().int().min(0).max(1000000),
      price_yearly: z.number().int().min(0).max(10000000),
      tokens_monthly: z.number().int().min(0).max(1000000),
      device_limit: z.number().int().min(1).max(50),
      badge: z.string().max(40).optional().or(z.literal("")),
      description_en: z.string().max(500).optional().or(z.literal("")),
      sort_order: z.number().int().min(0).max(1000).default(100),
      visible: z.boolean().default(true),
    }).parse(input)
  )
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./admin-helpers.server");
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const row = {
      plan_key: data.plan_key.trim().toLowerCase(),
      name_en: data.name_en.trim(),
      name_bn: data.name_bn || "",
      price_monthly: data.price_monthly,
      price_yearly: data.price_yearly,
      tokens_monthly: data.tokens_monthly,
      device_limit: data.device_limit,
      badge: data.badge || null,
      description_en: data.description_en || "",
      sort_order: data.sort_order,
      visible: data.visible,
    };

    if (data.id) {
      const { error } = await supabaseAdmin.from("pricing_plans").update(row as never).eq("id", data.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin
        .from("pricing_plans")
        .upsert(row as never, { onConflict: "plan_key" });
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const adminSavePaymentCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      code: z.string(),
      id: z.string().uuid().optional(),
      email: z.string().max(255).optional().or(z.literal("")),
      customer_name: z.string().max(160).optional().or(z.literal("")),
      plan: z.string().min(1).max(40).default("pro"),
      amount: z.number().int().min(0).max(10000000),
      method: z.string().min(1).max(40).default("bkash"),
      provider_ref: z.string().max(120).optional().or(z.literal("")),
      status: z.enum(["pending", "paid", "failed", "refunded"]).default("pending"),
      license_key: z.string().max(80).optional().or(z.literal("")),
      notes: z.string().max(1000).optional().or(z.literal("")),
    }).parse(input)
  )
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./admin-helpers.server");
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const row = {
      email: data.email || null,
      customer_name: data.customer_name || null,
      plan: data.plan,
      amount: data.amount,
      method: data.method,
      provider_ref: data.provider_ref || null,
      status: data.status,
      license_key: data.license_key || null,
      notes: data.notes || null,
      paid_at: data.status === "paid" ? new Date().toISOString() : null,
    };

    if (data.id) {
      const { error } = await supabaseAdmin.from("payments").update(row as never).eq("id", data.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin.from("payments").insert(row as never);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const adminSetPaymentStatusCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      code: z.string(),
      id: z.string().uuid(),
      status: z.enum(["pending", "paid", "failed", "refunded"]),
    }).parse(input)
  )
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./admin-helpers.server");
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("payments")
      .update({ status: data.status, paid_at: data.status === "paid" ? new Date().toISOString() : null } as never)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeletePaymentCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ code: z.string(), id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./admin-helpers.server");
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("payments").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ------------------------------------------------------------------ *
 * License & device housekeeping
 * ------------------------------------------------------------------ */
export const adminDeleteLicenseCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ code: z.string(), license_id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./admin-helpers.server");
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    await supabaseAdmin.from("license_activations").delete().eq("license_id", data.license_id);
    const { error } = await supabaseAdmin.from("licenses").delete().eq("id", data.license_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeleteDeviceCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ code: z.string(), activation_id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./admin-helpers.server");
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("license_activations")
      .delete()
      .eq("id", data.activation_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ------------------------------------------------------------------ *
 * Coupon codes
 * ------------------------------------------------------------------ */
const couponSchema = z.object({
  code: z.string(),
  id: z.string().uuid().optional(),
  coupon_code: z
    .string()
    .trim()
    .min(3)
    .max(40)
    .regex(/^[A-Za-z0-9_-]+$/, "Letters, numbers, - and _ only."),
  description: z.string().max(200).optional().or(z.literal("")),
  percent_off: z.number().int().min(0).max(100).default(0),
  flat_off: z.number().int().min(0).max(100000).default(0),
  plans: z.array(z.string().max(40)).max(10).default([]),
  max_redemptions: z.number().int().min(0).max(100000).default(0),
  active: z.boolean().default(true),
  expires_in_days: z.number().int().min(0).max(3650).default(0),
});

export const adminSaveCouponCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => couponSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./admin-helpers.server");
    await assertAdmin(context);
    if (data.percent_off === 0 && data.flat_off === 0)
      throw new Error("Set a percentage or a flat discount.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const payload = {
      code: data.coupon_code.toUpperCase(),
      description: data.description || null,
      percent_off: data.percent_off,
      flat_off: data.flat_off,
      plans: data.plans,
      max_redemptions: data.max_redemptions,
      active: data.active,
      expires_at:
        data.expires_in_days > 0
          ? new Date(Date.now() + data.expires_in_days * 86400_000).toISOString()
          : null,
    };

    if (data.id) {
      const { error } = await supabaseAdmin.from("coupons").update(payload).eq("id", data.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin.from("coupons").insert(payload);
      if (error)
        throw new Error(
          error.code === "23505" ? "That coupon code already exists." : error.message,
        );
    }
    return { ok: true };
  });

export const adminSetCouponActiveCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ code: z.string(), id: z.string().uuid(), active: z.boolean() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./admin-helpers.server");
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("coupons")
      .update({ active: data.active })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeleteCouponCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ code: z.string(), id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./admin-helpers.server");
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("coupons").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminSetCouponPublicCode = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid(), is_public: z.boolean() }).parse(input))
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import('./admin-helpers.server');
    await assertAdmin(context);
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { error } = await supabaseAdmin.from('coupons').update({ is_public: data.is_public }).eq('id', data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ------------------------------------------------------------------ *
 * Store offers — admin-set public discount shown before any coupon
 * ------------------------------------------------------------------ */
export const adminSetPublicOfferCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        code: z.string(),
        plan: z.string().min(1).max(40),
        discount: z.number().int().min(1).max(100000),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./admin-helpers.server");
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("public_offers")
      .upsert({ plan: data.plan, discount: data.discount, active: true } as never, { onConflict: "plan" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeletePublicOfferCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ code: z.string(), plan: z.string().min(1).max(40) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./admin-helpers.server");
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("public_offers").delete().eq("plan", data.plan);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ------------------------------------------------------------------ *
 * Feedback, preset votes and the repair queue (code-gated)
 * ------------------------------------------------------------------ */
export const adminFeedbackCode = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ code: z.string() }).parse(input))
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./admin-helpers.server");
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [votes, reports, queue] = await Promise.all([
      supabaseAdmin
        .from("preset_votes")
        .select("preset_name, preset_kind, panel, vote, created_at")
        .order("created_at", { ascending: false })
        .limit(5000),
      supabaseAdmin
        .from("panel_reports")
        .select(
          "id, panel, message, contact, severity, status, admin_note, device_fingerprint, license_key, app_version, created_at",
        )
        .order("created_at", { ascending: false })
        .limit(300),
      supabaseAdmin
        .from("preset_fix_queue")
        .select(
          "id, preset_name, preset_kind, panel, status, down_votes, up_votes, admin_note, agent_note, fixed_in_version, created_at, updated_at",
        )
        .order("created_at", { ascending: false })
        .limit(500),
    ]);

    const map = new Map<
      string,
      { preset_name: string; preset_kind: string; panel: string; up: number; down: number }
    >();
    for (const row of votes.data ?? []) {
      const id = `${row.preset_kind}::${row.preset_name}`;
      const entry =
        map.get(id) ??
        { preset_name: row.preset_name, preset_kind: row.preset_kind, panel: row.panel, up: 0, down: 0 };
      if (row.vote === "up") entry.up += 1;
      else entry.down += 1;
      map.set(id, entry);
    }

    const fixRows = queue.data ?? [];
    const queued = new Map(fixRows.map((r) => [`${r.preset_kind}::${r.preset_name}`, r.status]));
    const presets = [...map.values()]
      .map((p) => ({ ...p, fix_status: queued.get(`${p.preset_kind}::${p.preset_name}`) ?? null }))
      .sort((a, b) => b.down - a.down || b.up - a.up);

    return {
      presets,
      reports: reports.data ?? [],
      fixQueue: fixRows,
      stats: {
        voted_presets: presets.length,
        total_up: presets.reduce((n, p) => n + p.up, 0),
        total_down: presets.reduce((n, p) => n + p.down, 0),
        open_reports: (reports.data ?? []).filter((r) => r.status === "open").length,
        open_fixes: fixRows.filter((r) => r.status === "pending" || r.status === "investigating").length,
      },
    };
  });

export const adminUpdateReportCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        code: z.string(),
        report_id: z.string().uuid(),
        status: z.enum(["open", "reviewing", "fixed", "wontfix"]).optional(),
        admin_note: z.string().max(2000).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./admin-helpers.server");
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const patch: Record<string, unknown> = {};
    if (data.status) patch.status = data.status;
    if (data.admin_note !== undefined) patch.admin_note = data.admin_note || null;
    const { error } = await supabaseAdmin
      .from("panel_reports")
      .update(patch as never)
      .eq("id", data.report_id);
    if (error) throw new Error("Could not update the report.");
    return { ok: true };
  });

export const adminQueueFixCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        code: z.string(),
        preset_name: z.string().min(1).max(200),
        preset_kind: z.string().min(1).max(60),
        panel: z.string().min(1).max(60).default("ghost-toolkit"),
        up_votes: z.number().int().min(0).max(100000).default(0),
        down_votes: z.number().int().min(0).max(100000).default(0),
        admin_note: z.string().max(2000).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./admin-helpers.server");
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("preset_fix_queue").upsert(
      {
        preset_name: data.preset_name,
        preset_kind: data.preset_kind,
        panel: data.panel,
        status: "pending",
        up_votes: data.up_votes,
        down_votes: data.down_votes,
        admin_note: data.admin_note || null,
      } as never,
      { onConflict: "preset_kind,preset_name" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminUpdateFixCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        code: z.string(),
        fix_id: z.string().uuid(),
        status: z.enum(["pending", "investigating", "fixed", "wontfix"]).optional(),
        admin_note: z.string().max(2000).optional(),
        fixed_in_version: z.string().max(40).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./admin-helpers.server");
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const patch: Record<string, unknown> = {};
    if (data.status) patch.status = data.status;
    if (data.admin_note !== undefined) patch.admin_note = data.admin_note || null;
    if (data.fixed_in_version !== undefined) patch.fixed_in_version = data.fixed_in_version || null;
    const { error } = await supabaseAdmin
      .from("preset_fix_queue")
      .update(patch as never)
      .eq("id", data.fix_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeleteFixCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ code: z.string(), fix_id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./admin-helpers.server");
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("preset_fix_queue").delete().eq("id", data.fix_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ------------------------------------------------------------------ *
 * AI Brain test chat — runs a prompt through the live Layer 1 + Layer 2 brain
 * ------------------------------------------------------------------ */
/**
 * Cost model for the admin brain test chat.
 * Prices are Lovable-AI credit estimates per 1M tokens (in / out) so the admin
 * can see roughly what each kind of request costs before shipping it to users.
 */
/* 1 Lovable credit ≈ US$0.01 ≈ ৳1.22 (USD→BDT ≈ 122) */
const BDT_PER_CREDIT = 1.22;

const BRAIN_MODELS = {
  "google/gemini-3.6-flash": { label: "Gemini 3.6 Flash (fast, cheap)", in: 0.3, out: 2.5 },
  "google/gemini-2.5-flash": { label: "Gemini 2.5 Flash (balanced)", in: 0.3, out: 2.5 },
  "google/gemini-3.1-pro-preview": { label: "Gemini 3.1 Pro (best design reasoning)", in: 1.25, out: 10 },
  "openai/gpt-5.4-mini": { label: "GPT-5.4 Mini (cheap reasoning)", in: 0.25, out: 2 },
  "openai/gpt-5.5": { label: "GPT-5.5 (premium quality)", in: 1.25, out: 10 },
} as const;

export const adminBrainModelsCode = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth]).handler(async ({ context }) => {
    const { assertAdmin } = await import("./admin-helpers.server");
    await assertAdmin(context);
    return Object.entries(BRAIN_MODELS).map(([id, m]) => ({ id, label: m.label, in: m.in, out: m.out }));
  });

export const adminBrainChatCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        code: z.string(),
        category: z.string().max(60).default("general"),
        model: z.string().max(80).default("google/gemini-3.6-flash"),
        useIdentity: z.boolean().default(true),
        useRules: z.boolean().default(true),
        messages: z
          .array(
            z.object({
              role: z.enum(["user", "assistant"]),
              content: z.string().min(1).max(8000),
            }),
          )
          .min(1)
          .max(24),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./admin-helpers.server");
    await assertAdmin(context);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let identity = "";
    if (data.useIdentity) {
      const { identitySystemPrompt } = await import("./ghost-identity.server");
      identity = await identitySystemPrompt();
    }

    let rules = "";
    if (data.useRules) {
      const category = data.category.trim().toLowerCase() || "general";
      const { data: rows } = await supabaseAdmin
        .from("prompt_templates")
        .select("body")
        .eq("enabled", true)
        .in("category", [category, "general"])
        .order("weight", { ascending: false })
        .limit(12);
      rules = (rows ?? []).map((r) => String(r.body || "")).filter(Boolean).join("\n");
    }

    const system = [identity, rules].filter(Boolean).join("\n\n").trim();
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("AI is not configured on this server.");

    const modelId = (data.model in BRAIN_MODELS ? data.model : "google/gemini-3.6-flash") as keyof typeof BRAIN_MODELS;
    const price = BRAIN_MODELS[modelId];

    const started = Date.now();
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: modelId,
        messages: [...(system ? [{ role: "system", content: system }] : []), ...data.messages],
        ...(modelId.startsWith("openai/gpt-5.6") ? { reasoning_effort: "none" } : {}),
      }),
    });

    if (!res.ok) {
      if (res.status === 429) throw new Error("Rate limit reached. Try again in a moment.");
      if (res.status === 402) throw new Error("AI credits exhausted for this workspace.");
      throw new Error("The AI gateway rejected the request.");
    }

    const json = (await res.json()) as any;
    const promptTokens = Number(json.usage?.prompt_tokens ?? 0);
    const completionTokens = Number(json.usage?.completion_tokens ?? 0);
    const credits =
      (promptTokens / 1_000_000) * price.in + (completionTokens / 1_000_000) * price.out;

    return {
      text: String(json.choices?.[0]?.message?.content ?? "").trim(),
      identityChars: identity.length,
      ruleChars: rules.length,
      category: data.category,
      model: modelId,
      modelLabel: price.label,
      promptTokens,
      completionTokens,
      credits: Number(credits.toFixed(5)),
      bdt: Number((credits * BDT_PER_CREDIT).toFixed(4)),
      ms: Date.now() - started,
    };
  });


/* ------------------------------------------------------------------ *
 * Remote controller — kill switch state + mandatory update gate
 * ------------------------------------------------------------------ */
export const adminGetControlCode = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ code: z.string() }).parse(input))
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./admin-helpers.server");
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("extension_settings")
      .select("value, enabled, updated_at")
      .eq("module", "control")
      .eq("key", "update_gate")
      .maybeSingle();
    return {
      enabled: row?.enabled ?? false,
      updated_at: row?.updated_at ?? null,
      gate: (row?.value ?? { blocked: true, version: "", url: "", message: "" }) as {
        blocked?: boolean;
        version?: string;
        url?: string;
        message?: string;
      },
    };
  });

export const adminSetControlCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        code: z.string(),
        enabled: z.boolean(),
        version: z.string().max(20).default(""),
        url: z.string().max(500).default(""),
        message: z.string().max(400).default(""),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./admin-helpers.server");
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("extension_settings").upsert(
      {
        module: "control",
        key: "update_gate",
        is_public: true,
        enabled: data.enabled,
        description: "Mandatory update gate — blocks panel UI and shows a download link.",
        value: {
          blocked: data.enabled,
          version: data.version,
          url: data.url,
          message: data.message,
        },
      } as never,
      { onConflict: "module,key" },
    );
    if (error) throw new Error("Could not save the update gate.");
    return { ok: true };
  });

/* ------------------------------------------------------------------ *
 * Auto license issue (night mode) — when enabled, buyers get a Free
 * key instantly from the website instead of messaging WhatsApp.
 * ------------------------------------------------------------------ */
export const adminAutoLicenseGetCode = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ code: z.string() }).parse(input))
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./admin-helpers.server");
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("extension_settings")
      .select("value, enabled, updated_at")
      .eq("module", "license")
      .eq("key", "auto_issue")
      .maybeSingle();
    const value = (row?.value ?? {}) as Record<string, unknown>;
    const since = new Date(Date.now() - 86400_000).toISOString();
    const { count } = await supabaseAdmin
      .from("licenses")
      .select("id", { count: "exact", head: true })
      .eq("notes", "auto-issued")
      .gte("created_at", since);
    return {
      enabled: row?.enabled ?? false,
      updated_at: row?.updated_at ?? null,
      plan: (value.plan as string) ?? "free",
      trial_days: (value.trial_days as number) ?? 7,
      daily_limit: (value.daily_limit as number) ?? 50,
      issued_today: count ?? 0,
    };
  });

export const adminAutoLicenseSetCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        code: z.string(),
        enabled: z.boolean(),
        plan: z.string().max(40).default("free"),
        trial_days: z.number().int().min(0).max(365).default(7),
        daily_limit: z.number().int().min(1).max(500).default(50),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./admin-helpers.server");
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("extension_settings")
      .upsert(
        {
          module: "license",
          key: "auto_issue",
          value: { plan: data.plan, trial_days: data.trial_days, daily_limit: data.daily_limit },
          enabled: data.enabled,
        } as never,
        { onConflict: "module,key" },
      );
    if (error) throw new Error("Could not save the auto-license setting.");
    return { ok: true };
  });

/* ------------------------------------------------------------------ *
 * Products → Ghost AE Text : remote update gate (forced update)
 * Stored in extension_settings (module: "control", key: "update_gate")
 * and read by /api/public/v1/control on every panel poll.
 * ------------------------------------------------------------------ */
export const adminUpdateGateGetCode = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ code: z.string() }).parse(input))
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./admin-helpers.server");
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("extension_settings")
      .select("value, enabled, updated_at")
      .eq("module", "control")
      .eq("key", "update_gate")
      .maybeSingle();
    const value = (row?.value ?? {}) as { blocked?: boolean; version?: string; url?: string; message?: string };
    return {
      enabled: row?.enabled ?? false,
      updated_at: (row as any)?.updated_at ?? null,
      blocked: value.blocked !== false,
      version: value.version ?? "",
      url: value.url ?? "",
      message: value.message ?? "",
    };
  });

export const adminUpdateGateSetCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      code: z.string(),
      enabled: z.boolean(),
      blocked: z.boolean().default(true),
      version: z.string().max(40).optional().or(z.literal("")),
      url: z.string().max(500).optional().or(z.literal("")),
      message: z.string().max(1000).optional().or(z.literal("")),
    }).parse(input)
  )
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./admin-helpers.server");
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const value = {
      blocked: data.blocked,
      version: data.version || "",
      url: data.url || "",
      message: data.message || "",
      publishedAt: new Date().toISOString(),
    };
    const { error } = await supabaseAdmin
      .from("extension_settings")
      .upsert({ module: "control", key: "update_gate", value, enabled: data.enabled } as any, {
        onConflict: "module,key",
      });
    if (error) throw new Error("Could not save the update notice.");
    return { ok: true, value };
  });
