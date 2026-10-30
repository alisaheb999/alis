import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type FreeResource = {
  id: string;
  slug: string;
  title: string;
  description: string;
  image_url: string | null;
  download_url: string;
  tutorial_url: string | null;
  is_published: boolean;
  sort_order: number;
  image_preview_url?: string | null;
};

async function withSignedImages(rows: FreeResource[]) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return Promise.all(rows.map(async (row) => {
    if (!row.image_url || !row.image_url.startsWith("free-resource-images/")) return row;
    const path = row.image_url.slice("free-resource-images/".length);
    const { data } = await supabaseAdmin.storage.from("free-resource-images").createSignedUrl(path, 3600);
    return { ...row, image_url: data?.signedUrl ?? null };
  }));
}

export const getFreeResources = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("free_resources")
    .select("id,slug,title,description,image_url,download_url,tutorial_url,is_published,sort_order")
    .eq("is_published", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) return [] as FreeResource[];
  return withSignedImages((data ?? []) as FreeResource[]);
});

export const getFreeResourceBySlug = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ slug: z.string().min(1).max(160) }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const result = await supabaseAdmin.from("free_resources")
      .select("id,slug,title,description,image_url,download_url,tutorial_url,is_published,sort_order")
      .eq("slug", data.slug).eq("is_published", true).maybeSingle();
    if (!result.data) return null;
    return (await withSignedImages([result.data as FreeResource]))[0] ?? null;
  });

export const adminGetFreeResources = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertAdmin } = await import("./admin-helpers.server");
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("free_resources")
      .select("id,slug,title,description,image_url,download_url,tutorial_url,is_published,sort_order")
      .order("sort_order", { ascending: true });
    if (error) throw new Error(error.message);
    const rows = (data ?? []) as FreeResource[];
    return Promise.all(rows.map(async (row) => {
      if (!row.image_url?.startsWith("free-resource-images/")) return { ...row, image_preview_url: row.image_url?.startsWith("https://") ? row.image_url : null };
      const path = row.image_url.slice("free-resource-images/".length);
      const signed = await supabaseAdmin.storage.from("free-resource-images").createSignedUrl(path, 3600);
      return { ...row, image_preview_url: signed.data?.signedUrl ?? null };
    }));
  });

const resourceInput = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(1).max(120),
  slug: z.string().trim().min(1).max(160).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().trim().max(500).default(""),
  image_url: z.string().trim().url().max(1000).optional().or(z.literal("")),
  download_url: z.string().trim().url().max(1000),
  tutorial_url: z.string().trim().url().max(1000).optional().or(z.literal("")),
  is_published: z.boolean().default(true),
  sort_order: z.number().int().min(0).max(10000).default(100),
});

export const adminSaveFreeResource = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => resourceInput.parse(input))
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./admin-helpers.server");
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const payload = {
      title: data.title,
      slug: data.slug,
      description: data.description,
      image_url: data.image_url || null,
      download_url: data.download_url,
      tutorial_url: data.tutorial_url || null,
      is_published: data.is_published,
      sort_order: data.sort_order,
    };
    const query = data.id
      ? supabaseAdmin.from("free_resources").update(payload).eq("id", data.id)
      : supabaseAdmin.from("free_resources").insert(payload);
    const { error } = await query;
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminUploadFreeResourceImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({
    bytes: z.string().min(1),
    slug: z.string().regex(/^[a-z0-9-]+$/).max(160),
  }).parse(input))
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./admin-helpers.server");
    await assertAdmin(context);
    const buffer = Uint8Array.from(atob(data.bytes), (c) => c.charCodeAt(0));
    if (buffer.byteLength > 150 * 1024) throw new Error("ছবিটি 150 KB-এর বেশি।");
    const isWebp = buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46;
    const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8;
    if (!isWebp && !isJpeg) throw new Error("শুধু WebP বা JPG ছবি নেওয়া যায়।");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const ext = isWebp ? "webp" : "jpg";
    const path = `${data.slug}-${crypto.randomUUID()}.${ext}`;
    const { error } = await supabaseAdmin.storage.from("free-resource-images").upload(path, buffer, { contentType: isWebp ? "image/webp" : "image/jpeg", upsert: false });
    if (error) throw new Error(error.message);
    return { image_url: `free-resource-images/${path}` };
  });

export const adminDeleteFreeResource = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./admin-helpers.server");
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("free_resources").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });