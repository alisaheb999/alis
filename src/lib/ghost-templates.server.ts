/**
 * Ghostae Presets (template) library — server-only helpers.
 * `.aep` project files live in the private `ghost-templates` storage bucket,
 * one folder per category. The panel reads the catalogue and then follows a
 * short-lived signed URL to download a single file.
 */
const BUCKET = "ghost-templates";
const SIGN_TTL = 30 * 60;

export type TemplateEntry = {
  slug: string;
  title: string;
  file: string;
  category: string;
  sizeBytes: number;
  updatedAt: number;
};

function slugify(name: string) {
  return name
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9.-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function prettify(name: string) {
  return name
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

async function db() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

/** Full catalogue: every `.aep` in the bucket, grouped by its folder. */
export async function listTemplates(): Promise<TemplateEntry[]> {
  const client = await db();
  const storage = client.storage.from(BUCKET);
  const { data: roots } = await storage.list("", { limit: 200 });
  const out: TemplateEntry[] = [];

  const folders = (roots ?? []).filter((e) => !e.id).map((e) => e.name);
  const loose = (roots ?? []).filter((e) => e.id);

  const push = (category: string, entry: { name: string; updated_at?: string | null; metadata?: Record<string, unknown> | null }) => {
    if (!/\.aep$/i.test(entry.name)) return;
    const slug = slugify(entry.name);
    if (!slug) return;
    out.push({
      slug,
      title: prettify(entry.name),
      file: entry.name,
      category: category || "misc",
      sizeBytes: Number((entry.metadata as { size?: number } | null)?.size ?? 0),
      updatedAt: entry.updated_at ? Date.parse(entry.updated_at) : 0,
    });
  };

  loose.forEach((e) => push("misc", e as never));

  for (const folder of folders) {
    const { data } = await storage.list(folder, { limit: 1000 });
    (data ?? []).forEach((e) => push(slugify(folder), e as never));
  }

  return out.sort((a, b) => a.slug.localeCompare(b.slug));
}

/** Signed download URL for one slug, or null when the slug is unknown. */
export async function signTemplate(slug: string) {
  const all = await listTemplates();
  const hit = all.find((t) => t.slug === slug);
  if (!hit) return null;
  const client = await db();
  const path = hit.category === "misc" ? hit.file : `${hit.category}/${hit.file}`;
  const { data } = await client.storage.from(BUCKET).createSignedUrl(path, SIGN_TTL, {
    download: hit.file,
  });
  return data?.signedUrl ? { url: data.signedUrl, entry: hit } : null;
}
