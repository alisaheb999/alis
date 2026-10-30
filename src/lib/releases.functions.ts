/** Extension Release Hub — admin-only server functions. */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const BUCKET = "extension-releases";
const admin = async (context: unknown) => {
  const { assertAdmin } = await import("./admin-helpers.server");
  return assertAdmin(context as never);
};

export const releasesList = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = await admin(context);
    const { data } = await db
      .from("extension_releases")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    const { data: app } = await db
      .from("extension_settings")
      .select("value, enabled")
      .eq("module", "desktop")
      .eq("key", "app")
      .maybeSingle();
    return { releases: data ?? [], app: (app?.value as any) ?? null, appEnabled: app ? app.enabled !== false : false };
  });

export const releaseUploadUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ product_key: z.string().regex(/^[a-z0-9-]{2,40}$/), version: z.string().regex(/^[0-9A-Za-z.\-]{1,20}$/) }).parse(i),
  )
  .handler(async ({ data, context }) => {
    const db = await admin(context);
    const path = `${data.product_key}/${data.version}-${crypto.randomUUID().slice(0, 8)}.zip`;
    const { data: s, error } = await db.storage.from(BUCKET).createSignedUploadUrl(path);
    if (error || !s) throw new Error("Upload link failed.");
    return { path, token: s.token };
  });

const Publish = z.object({
  product_key: z.string().regex(/^[a-z0-9-]{2,40}$/),
  name: z.string().min(1).max(100),
  host_app: z.enum(["after-effects", "premiere-pro"]),
  version: z.string().regex(/^[0-9A-Za-z.\-]{1,20}$/),
  cep_folder: z.string().regex(/^[A-Za-z0-9._ \-]{2,80}$/),
  changelog: z.string().max(4000).optional(),
  thumbnail_url: z.string().url().max(500).optional().or(z.literal("")),
  is_free: z.boolean(),
  storage_path: z.string().min(3).max(1000),
});

export const releasePublish = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => Publish.parse(i))
  .handler(async ({ data, context }) => {
    const db = await admin(context);
    if (/^https:\/\//i.test(data.storage_path)) {
      const { error: ex } = await db.from("extension_releases").insert({
        ...data,
        thumbnail_url: data.thumbnail_url || null,
        changelog: data.changelog || null,
        sha256: null,
        size_bytes: null,
        published: true,
      });
      if (ex) throw new Error("Save failed.");
      return { ok: true, sha256: null };
    }
    const { data: file, error } = await db.storage.from(BUCKET).download(data.storage_path);
    if (error || !file) throw new Error("Uploaded ZIP not found.");
    const buf = await file.arrayBuffer();
    const hash = await crypto.subtle.digest("SHA-256", buf);
    const sha256 = Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
    const { error: e2 } = await db.from("extension_releases").insert({
      ...data,
      thumbnail_url: data.thumbnail_url || null,
      changelog: data.changelog || null,
      sha256,
      size_bytes: buf.byteLength,
      published: true,
    });
    if (e2) throw new Error("Save failed.");
    return { ok: true, sha256 };
  });

export const releaseSetPublished = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid(), published: z.boolean() }).parse(i))
  .handler(async ({ data, context }) => {
    const db = await admin(context);
    await db.from("extension_releases").update({ published: data.published }).eq("id", data.id);
    return { ok: true };
  });

/** "Make latest" = bump created_at so it sorts first. */
export const releaseMakeLatest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const db = await admin(context);
    await db.from("extension_releases").update({ created_at: new Date().toISOString(), published: true }).eq("id", data.id);
    return { ok: true };
  });

const Build = z.object({ url: z.string().url().max(500).or(z.literal("")), sha256: z.string().max(80).optional() });
export const releaseSaveApp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      version: z.string().regex(/^[0-9.]{1,20}$/),
      notes: z.string().max(4000).optional(),
      mandatory: z.boolean(),
      win: Build,
      mac: Build,
    }).parse(i),
  )
  .handler(async ({ data, context }) => {
    const db = await admin(context);
    const value = {
      ...data,
      win: data.win.url ? data.win : null,
      mac: data.mac.url ? data.mac : null,
    };
    const { data: row } = await db
      .from("extension_settings")
      .select("id")
      .eq("module", "desktop")
      .eq("key", "app")
      .maybeSingle();
    if (row) await db.from("extension_settings").update({ value }).eq("id", row.id);
    else
      await db.from("extension_settings").insert({ module: "desktop", key: "app", value, enabled: true, is_public: false, description: "Desktop app update" });
    return { ok: true };
  });

/** Edit version / link of an existing release. */
export const releaseUpdate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      id: z.string().uuid(),
      host_app: z.enum(["after-effects", "premiere-pro"]),
      version: z.string().regex(/^[0-9A-Za-z.\-]{1,20}$/),
      storage_path: z.string().regex(/^https:\/\/\S+$/i).max(1000),
    }).parse(i),
  )
  .handler(async ({ data, context }) => {
    const db = await admin(context);
    const { id, ...rest } = data;
    const { error } = await db.from("extension_releases").update({ ...rest, sha256: null, size_bytes: null }).eq("id", id);
    if (error) throw new Error("Update ব্যর্থ");
    return { ok: true };
  });

/** Permanently delete a release row + its ZIP. */
export const releaseDelete = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const db = await admin(context);
    const { data: r } = await db.from("extension_releases").select("storage_path").eq("id", data.id).maybeSingle();
    if (!r) throw new Error("Release পাওয়া যায়নি");
    if (!/^https?:\/\//i.test(r.storage_path)) await db.storage.from(BUCKET).remove([r.storage_path]);
    const { error } = await db.from("extension_releases").delete().eq("id", data.id);
    if (error) throw new Error("Delete ব্যর্থ");
    return { ok: true };
  });

/** Turn desktop app update on/off (check-update returns nothing when off). */
export const releaseAppToggle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ enabled: z.boolean() }).parse(i))
  .handler(async ({ data, context }) => {
    const db = await admin(context);
    const { error } = await db.from("extension_settings").update({ enabled: data.enabled }).eq("module", "desktop").eq("key", "app");
    if (error) throw new Error("ব্যর্থ");
    return { ok: true };
  });

/** Desktop software usage stats from desktop.* event logs. */
export const desktopUsageStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = await admin(context);
    const since30 = new Date(Date.now() - 30 * 864e5).toISOString();
    const { data } = await db
      .from("extension_logs")
      .select("device_fingerprint, license_id, created_at, user_agent")
      .like("event", "desktop.%")
      .gte("created_at", since30)
      .order("created_at", { ascending: false })
      .limit(5000);
    const rows = data ?? [];
    const day = Date.now() - 864e5;
    const devices = new Map<string, { last: string; ua: string | null }>();
    const licences = new Set<string>();
    const active24 = new Set<string>();
    for (const r of rows as any[]) {
      const k = r.device_fingerprint || r.license_id || "unknown";
      if (!devices.has(k)) devices.set(k, { last: r.created_at, ua: r.user_agent });
      if (r.license_id) licences.add(r.license_id);
      if (new Date(r.created_at).getTime() > day) active24.add(k);
    }
    let win = 0, mac = 0;
    devices.forEach((d) => (/mac/i.test(d.ua ?? "") ? mac++ : win++));
    return {
      devices: devices.size,
      users: licences.size,
      active24: active24.size,
      win,
      mac,
      recent: [...devices.entries()].slice(0, 20).map(([id, d]) => ({ id: id.slice(0, 10), last: d.last, os: /mac/i.test(d.ua ?? "") ? "Mac" : "Windows" })),
    };
  });

/* ---------- Desktop store media (screenshots + tutorials), per product ---------- */
const Shot = z.object({ url: z.string().url().startsWith("https://").max(500), title: z.string().max(120).optional() });
const Tut = z.object({
  title: z.string().min(1).max(160),
  url: z.string().url().startsWith("https://").max(500),
  duration: z.string().max(20).optional(),
  thumbnail: z.string().url().startsWith("https://").max(500).optional().or(z.literal("")),
});

export const productMediaGet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ product_key: z.string().regex(/^[a-z0-9-]{2,40}$/) }).parse(i))
  .handler(async ({ data, context }) => {
    const db = await admin(context);
    const { data: row } = await db.from("extension_settings").select("value").eq("module", "desktop_media").eq("key", data.product_key).maybeSingle();
    const v = (row?.value as any) ?? {};
    return { screenshots: (v.screenshots ?? []) as { url: string; title?: string }[], tutorials: (v.tutorials ?? []) as { title: string; url: string; duration?: string; thumbnail?: string }[] };
  });

export const productMediaSave = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ product_key: z.string().regex(/^[a-z0-9-]{2,40}$/), screenshots: z.array(Shot).max(12), tutorials: z.array(Tut).max(12) }).parse(i),
  )
  .handler(async ({ data, context }) => {
    const db = await admin(context);
    const value = { screenshots: data.screenshots, tutorials: data.tutorials };
    const { data: row } = await db.from("extension_settings").select("id").eq("module", "desktop_media").eq("key", data.product_key).maybeSingle();
    const { error } = row
      ? await db.from("extension_settings").update({ value }).eq("id", row.id)
      : await db.from("extension_settings").insert({ module: "desktop_media", key: data.product_key, value, enabled: true, is_public: false, description: "Desktop store screenshots & tutorials" });
    if (error) throw new Error("Save ব্যর্থ");
    return { ok: true };
  });

/* ---------- Per-product price + desktop visibility (single source for desktop catalog) ---------- */
export const productSettingsList = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = await admin(context);
    const { data } = await db.from("extension_settings").select("key, value, enabled").eq("module", "desktop_product");
    return Object.fromEntries((data ?? []).map((r) => [r.key, { ...((r.value as any) ?? {}), desktop_enabled: r.enabled !== false }])) as Record<string, { price?: number; original_price?: number; desktop_enabled: boolean }>;
  });

export const productSettingsSave = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      product_key: z.string().regex(/^[a-z0-9-]{2,40}$/),
      price: z.number().int().min(0).max(1000000),
      original_price: z.number().int().min(0).max(1000000),
      desktop_enabled: z.boolean(),
    }).parse(i),
  )
  .handler(async ({ data, context }) => {
    const db = await admin(context);
    const value = { price: data.price, original_price: data.original_price };
    const { data: row } = await db.from("extension_settings").select("id").eq("module", "desktop_product").eq("key", data.product_key).maybeSingle();
    const { error } = row
      ? await db.from("extension_settings").update({ value, enabled: data.desktop_enabled }).eq("id", row.id)
      : await db.from("extension_settings").insert({ module: "desktop_product", key: data.product_key, value, enabled: data.desktop_enabled, is_public: false, description: "Desktop price & visibility" });
    if (error) throw new Error("Save ব্যর্থ");
    return { ok: true };
  });
