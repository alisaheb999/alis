/**
 * GHOST Admin Panel — authenticated server functions.
 * Every function verifies the caller holds the `admin` role server-side
 * before touching the service-role client. Client-side checks are cosmetic.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import {
  assertAdmin,
  makeKey,
  PATCH_CHANNEL,
  type PublishedPatch,
} from "@/lib/admin-helpers.server";



/* ------------------------------------------------------------------ */
export const adminWhoAmI = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    return { userId: context.userId, isAdmin: data === true };
  });

export const adminOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = await assertAdmin(context as never);

    const [licenses, activations, logs] = await Promise.all([
      db
        .from("licenses")
        .select(
          "id, license_key, email, plan, status, max_activations, activation_count, expires_at, activated_at, last_seen_at, notes, created_at",
        )
        .order("created_at", { ascending: false })
        .limit(200),
      db
        .from("license_activations")
        .select("id, license_id, device_fingerprint, hostname, platform, app_version, revoked, last_seen_at, created_at")
        .order("last_seen_at", { ascending: false })
        .limit(300),
      db
        .from("extension_logs")
        .select("id, event, status, license_key, device_fingerprint, app_version, created_at, details")
        .order("created_at", { ascending: false })
        .limit(100),
    ]);

    const rows = licenses.data ?? [];
    return {
      licenses: rows,
      activations: activations.data ?? [],
      logs: logs.data ?? [],
      stats: {
        total: rows.length,
        active: rows.filter((r) => r.status === "active").length,
        revoked: rows.filter((r) => r.status === "revoked").length,
        devices: (activations.data ?? []).filter((a) => !a.revoked).length,
      },
    };
  });

export const adminIssueLicense = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        email: z.string().email().max(255).optional().or(z.literal("")),
        plan: z.string().min(1).max(40).default("pro"),
        max_activations: z.number().int().min(1).max(25).default(2),
        expires_in_days: z.number().int().min(0).max(3650).default(0),
        notes: z.string().max(1000).optional().or(z.literal("")),
        quantity: z.number().int().min(1).max(50).default(1),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const db = await assertAdmin(context as never);
    const expires =
      data.expires_in_days > 0
        ? new Date(Date.now() + data.expires_in_days * 86400_000).toISOString()
        : null;

    const payload = Array.from({ length: data.quantity }, () => ({
      license_key: makeKey(),
      email: data.email || null,
      plan: data.plan,
      status: "active" as const,
      max_activations: data.max_activations,
      expires_at: expires,
      notes: data.notes || null,
    }));

    const { data: created, error } = await db
      .from("licenses")
      .insert(payload)
      .select("license_key, plan, status, expires_at, max_activations");
    if (error) throw new Error(error.message);

    await db.from("extension_logs").insert(
      (created ?? []).map((l) => ({
        event: "license.issue",
        status: "ok",
        license_key: l.license_key,
        details: { by: context.userId, source: "admin_panel" } as never,
      })),
    );

    return { created: created ?? [] };
  });

export const adminSetLicenseStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        license_id: z.string().uuid(),
        status: z.enum(["inactive", "active", "suspended", "revoked", "expired"]),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const db = await assertAdmin(context as never);
    const { error } = await db
      .from("licenses")
      .update({ status: data.status })
      .eq("id", data.license_id);
    if (error) throw new Error(error.message);

    if (data.status === "revoked" || data.status === "suspended") {
      await db
        .from("license_activations")
        .update({ revoked: true })
        .eq("license_id", data.license_id);
    }

    await db.from("extension_logs").insert({
      event: "license.status",
      status: data.status,
      license_id: data.license_id,
      details: { by: context.userId } as never,
    });
    return { ok: true };
  });

export const adminUpdateLicense = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        license_id: z.string().uuid(),
        max_activations: z.number().int().min(1).max(25).optional(),
        expires_in_days: z.number().int().min(0).max(3650).optional(),
        notes: z.string().max(1000).optional(),
        email: z.string().email().max(255).optional().or(z.literal("")),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const db = await assertAdmin(context as never);
    const patch: Record<string, any> = {};
    if (data.max_activations !== undefined) patch.max_activations = data.max_activations;
    if (data.notes !== undefined) patch.notes = data.notes || null;
    if (data.email !== undefined) patch.email = data.email || null;
    if (data.expires_in_days !== undefined)
      patch.expires_at =
        data.expires_in_days > 0
          ? new Date(Date.now() + data.expires_in_days * 86400_000).toISOString()
          : null;

    const { error } = await db.from("licenses").update(patch as never).eq("id", data.license_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminSetDeviceRevoked = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ activation_id: z.string().uuid(), revoked: z.boolean() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const db = await assertAdmin(context as never);
    const { error } = await db
      .from("license_activations")
      .update({ revoked: data.revoked })
      .eq("id", data.activation_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ------------------------------------------------------------------ */
/* Preset votes + panel reports (extension feedback)                   */
/* ------------------------------------------------------------------ */
export const adminFeedback = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = await assertAdmin(context as never);

    const [votes, reports, queue] = await Promise.all([
      db
        .from("preset_votes")
        .select("preset_name, preset_kind, panel, vote, created_at")
        .order("created_at", { ascending: false })
        .limit(5000),
      db
        .from("panel_reports")
        .select(
          "id, panel, message, contact, severity, status, admin_note, device_fingerprint, license_key, app_version, created_at",
        )
        .order("created_at", { ascending: false })
        .limit(300),
      db
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

/* Send a disliked preset to the repair queue ("Solve" button). */
export const adminQueueFix = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
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
    const db = await assertAdmin(context as never);
    const { error } = await db.from("preset_fix_queue").upsert(
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

export const adminUpdateFix = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        fix_id: z.string().uuid(),
        status: z.enum(["pending", "investigating", "fixed", "wontfix"]).optional(),
        admin_note: z.string().max(2000).optional(),
        agent_note: z.string().max(4000).optional(),
        fixed_in_version: z.string().max(40).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const db = await assertAdmin(context as never);
    const patch: Record<string, unknown> = {};
    if (data.status) patch.status = data.status;
    if (data.admin_note !== undefined) patch.admin_note = data.admin_note || null;
    if (data.agent_note !== undefined) patch.agent_note = data.agent_note || null;
    if (data.fixed_in_version !== undefined) patch.fixed_in_version = data.fixed_in_version || null;
    const { error } = await db.from("preset_fix_queue").update(patch as never).eq("id", data.fix_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeleteFix = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ fix_id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const db = await assertAdmin(context as never);
    const { error } = await db.from("preset_fix_queue").delete().eq("id", data.fix_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });


export const adminUpdateReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        report_id: z.string().uuid(),
        status: z.enum(["open", "reviewing", "fixed", "wontfix"]).optional(),
        admin_note: z.string().max(2000).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const db = await assertAdmin(context as never);
    const patch: Record<string, unknown> = {};
    if (data.status) patch.status = data.status;
    if (data.admin_note !== undefined) patch.admin_note = data.admin_note || null;
    const { error } = await db.from("panel_reports").update(patch as never).eq("id", data.report_id);
    if (error) throw new Error("Could not update the report.");
    return { ok: true };
  });

/* ------------------------------------------------------------------ */
/* Patch publishing (forced update feed)                               */
/* ------------------------------------------------------------------ */



export const adminPatchStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = await assertAdmin(context as never);
    const { data } = await db
      .from("extension_settings")
      .select("value, enabled, updated_at")
      .eq("module", "patch")
      .eq("key", PATCH_CHANNEL)
      .maybeSingle();
    return {
      channel: PATCH_CHANNEL,
      enabled: data?.enabled ?? false,
      updated_at: data?.updated_at ?? null,
      patch: (data?.value ?? null) as PublishedPatch | null,
    };
  });

export const adminPublishPatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        version: z.string().regex(/^\d+\.\d+\.\d+$/, "Use a version like 3.7.4"),
        fromVersion: z.string().regex(/^\d+\.\d+\.\d+$/).optional(),
        patchId: z.string().max(120).optional(),
        title: z.string().max(160).optional(),
        notes: z.string().max(4000).optional(),
        url: z.string().min(1).max(500),
        sha256: z.string().regex(/^[a-fA-F0-9]{64}$/, "Paste the 64-character SHA-256"),
        sizeBytes: z.number().int().nonnegative().optional(),
        mandatory: z.boolean().default(true),
        enabled: z.boolean().default(true),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const db = await assertAdmin(context as never);
    const value: PublishedPatch = {
      patchId: data.patchId ?? `ghost-${data.version}`,
      version: data.version,
      fromVersion: data.fromVersion ?? null,
      title: data.title ?? `GHOST ${data.version}`,
      notes: data.notes ?? null,
      url: data.url,
      sha256: data.sha256.toLowerCase(),
      sizeBytes: data.sizeBytes ?? null,
      mandatory: data.mandatory,
      requiresRestart: true,
      publishedAt: new Date().toISOString(),
    };
    const { error } = await db
      .from("extension_settings")
      .upsert(
        { module: "patch", key: PATCH_CHANNEL, value, enabled: data.enabled } as never,
        { onConflict: "module,key" },
      );
    if (error) throw new Error("Could not publish the patch.");
    return { ok: true, patch: value };
  });

export const adminSetPatchEnabled = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ enabled: z.boolean() }).parse(input))
  .handler(async ({ data, context }) => {
    const db = await assertAdmin(context as never);
    const { error } = await db
      .from("extension_settings")
      .update({ enabled: data.enabled } as never)
      .eq("module", "patch")
      .eq("key", PATCH_CHANNEL);
    if (error) throw new Error("Could not change the patch state.");
    return { ok: true };
  });
