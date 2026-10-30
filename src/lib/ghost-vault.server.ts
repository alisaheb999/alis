/**
 * GHOST Vault — server-side bridge to the external asset library.
 *
 * The external library exposes only:
 *   GET /api/public/v1/search?q&kind&category&limit&offset   (12 rows per page)
 *   GET /api/public/v1/download/<id>                          (302 to a signed URL)
 *
 * Its free plan allows ~100 searches per day, so crawling on demand is not an
 * option. Instead the catalogue is mirrored into `vault_assets`, a few pages per
 * sync call with a daily budget, and every panel read is served from that
 * mirror. The vault API key never leaves the server.
 */

export type VaultItem = {
  id: string;
  title: string;
  description?: string | null;
  category: string;
  kind: string;
  tags?: string[] | null;
  file_name: string;
  mime_type?: string | null;
  size_bytes?: number | null;
  created_at?: string | null;
  preview_url?: string | null;
};

export type VaultRow = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  kind: string;
  tags: string[];
  file_name: string;
  mime_type: string | null;
  size_bytes: number;
  preview_url: string | null;
  source_created_at: string | null;
};

const PAGE = 12;
const DAILY_BUDGET = 80; // keep headroom under the upstream 100/day cap
const REFRESH_MS = 12 * 60 * 60 * 1000;

function config() {
  const base = String(process.env["GHOST_VAULT_URL"] ?? "").replace(/\/+$/, "");
  const key = String(process.env["GHOST_VAULT_KEY"] ?? "");
  return { base, key, ready: Boolean(base && key) };
}

export function vaultConfigured() {
  return config().ready;
}

export function titleCase(value: string) {
  return String(value || "")
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function categoryId(value: string) {
  return (
    String(value || "general")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "general"
  );
}

async function admin() {
  const mod = await import("@/integrations/supabase/client.server");
  return mod.supabaseAdmin;
}

async function fetchPage(offset: number, attempt = 0): Promise<{ items: VaultItem[]; total: number; limited: boolean }> {
  const { base, key } = config();
  const res = await fetch(`${base}/api/public/v1/search?limit=${PAGE}&offset=${offset}`, {
    headers: { "x-api-key": key, Accept: "application/json" },
  });
  if (res.status === 429) return { items: [], total: 0, limited: true };
  if (!res.ok) {
    if (attempt < 2) {
      await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
      return fetchPage(offset, attempt + 1);
    }
    throw new Error(`vault upstream ${res.status}`);
  }
  const body = (await res.json()) as { items?: VaultItem[]; total?: number };
  return {
    items: Array.isArray(body.items) ? body.items : [],
    total: Number(body.total || 0) || 0,
    limited: false,
  };
}

type State = {
  cursor_offset: number;
  expected_total: number;
  budget_day: string;
  budget_used: number;
  completed_at: string | null;
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

export type SyncResult = {
  synced: number;
  cursor: number;
  expected: number;
  cached: number;
  complete: boolean;
  limited: boolean;
  budgetLeft: number;
};

/**
 * Walk a slice of the upstream catalogue into the mirror.
 * Safe to call repeatedly: it resumes from the stored cursor and stops as soon
 * as the daily upstream budget or the page allowance is used up.
 */
export async function vaultSync({ pages = 6, force = false } = {}): Promise<SyncResult> {
  const db = await admin();
  const { data: stateRow } = await db.from("vault_sync_state").select("*").eq("id", 1).maybeSingle();
  const state: State = {
    cursor_offset: stateRow?.cursor_offset ?? 0,
    expected_total: stateRow?.expected_total ?? 0,
    budget_day: stateRow?.budget_day ?? today(),
    budget_used: stateRow?.budget_used ?? 0,
    completed_at: stateRow?.completed_at ?? null,
  };
  if (state.budget_day !== today()) {
    state.budget_day = today();
    state.budget_used = 0;
  }

  const { count: cachedBefore } = await db.from("vault_assets").select("id", { count: "exact", head: true });
  const complete = state.expected_total > 0 && (cachedBefore ?? 0) >= state.expected_total;
  const fresh = complete && state.completed_at && Date.now() - Date.parse(state.completed_at) < REFRESH_MS;

  if (!config().ready || (fresh && !force)) {
    return {
      synced: 0,
      cursor: state.cursor_offset,
      expected: state.expected_total,
      cached: cachedBefore ?? 0,
      complete: Boolean(complete),
      limited: false,
      budgetLeft: Math.max(DAILY_BUDGET - state.budget_used, 0),
    };
  }

  let synced = 0;
  let limited = false;
  let finished = false;

  for (let i = 0; i < pages; i += 1) {
    if (state.budget_used >= DAILY_BUDGET) {
      limited = true;
      break;
    }
    let res: Awaited<ReturnType<typeof fetchPage>>;
    try {
      res = await fetchPage(state.cursor_offset);
    } catch {
      break;
    }
    state.budget_used += 1;
    if (res.limited) {
      limited = true;
      break;
    }
    if (res.total) state.expected_total = res.total;
    if (!res.items.length) {
      state.cursor_offset = 0;
      finished = true;
      break;
    }

    const rows = res.items.map((item) => ({
      id: String(item.id),
      title: item.title || item.file_name || "Untitled",
      description: item.description ?? null,
      category: categoryId(item.category),
      kind: String(item.kind || "other").toLowerCase(),
      tags: Array.isArray(item.tags) ? item.tags : [],
      file_name: item.file_name || "",
      mime_type: item.mime_type ?? null,
      size_bytes: Number(item.size_bytes || 0) || 0,
      preview_url: item.preview_url ?? null,
      source_created_at: item.created_at ?? null,
      synced_at: new Date().toISOString(),
    }));
    await db.from("vault_assets").upsert(rows, { onConflict: "id" });
    synced += rows.length;
    state.cursor_offset += res.items.length;
    if (state.expected_total && state.cursor_offset >= state.expected_total) {
      state.cursor_offset = 0;
      finished = true;
      break;
    }
    await new Promise((r) => setTimeout(r, 120));
  }

  const { count: cachedAfter } = await db.from("vault_assets").select("id", { count: "exact", head: true });

  await db.from("vault_sync_state").upsert(
    {
      id: 1,
      cursor_offset: state.cursor_offset,
      expected_total: state.expected_total,
      budget_day: state.budget_day,
      budget_used: state.budget_used,
      completed_at: finished ? new Date().toISOString() : state.completed_at,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );

  return {
    synced,
    cursor: state.cursor_offset,
    expected: state.expected_total || (cachedAfter ?? 0),
    cached: cachedAfter ?? 0,
    complete: finished || (state.expected_total > 0 && (cachedAfter ?? 0) >= state.expected_total),
    limited,
    budgetLeft: Math.max(DAILY_BUDGET - state.budget_used, 0),
  };
}

/** Full mirrored catalogue (paged internally to avoid row caps). */
export async function vaultCatalogue(): Promise<VaultRow[]> {
  const db = await admin();
  const rows: VaultRow[] = [];
  const step = 1000;
  for (let from = 0; from < 20000; from += step) {
    const { data, error } = await db
      .from("vault_assets")
      .select("id,title,description,category,kind,tags,file_name,mime_type,size_bytes,preview_url,source_created_at")
      .order("title", { ascending: true })
      .range(from, from + step - 1);
    if (error || !data?.length) break;
    rows.push(...(data as VaultRow[]));
    if (data.length < step) break;
  }
  return rows;
}

export async function vaultState() {
  const db = await admin();
  const { data } = await db.from("vault_sync_state").select("*").eq("id", 1).maybeSingle();
  return data ?? null;
}

/** Resolve the real (signed) file URL for one vault item. */
export async function vaultFileUrl(id: string): Promise<string | null> {
  const { base, key, ready } = config();
  if (!ready) return null;
  const res = await fetch(`${base}/api/public/v1/download/${encodeURIComponent(id)}`, {
    headers: { "x-api-key": key },
    redirect: "manual",
  });
  const location = res.headers.get("location");
  if (location) return location;
  if (res.ok) {
    const text = await res.text().catch(() => "");
    try {
      const parsed = JSON.parse(text) as { url?: string; download_url?: string };
      return parsed.url ?? parsed.download_url ?? null;
    } catch {
      return null;
    }
  }
  return null;
}
