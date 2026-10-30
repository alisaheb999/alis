import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type GiveawayPrize = { label: string; weight: number; win: boolean };

const prizeSchema = z.object({
  label: z.string().trim().min(1).max(40),
  weight: z.number().min(0).max(100000),
  win: z.boolean(),
});

/** Public projection: slice labels only, never weights. */
export const getGiveaway = createServerFn({ method: "GET" }).handler(async () => {
  const { createClient } = await import('@supabase/supabase-js');
  const url = process.env['SUPABASE_URL'];
  const key = process.env['SUPABASE_PUBLISHABLE_KEY'];
  if (!url || !key) throw new Error('Giveaway unavailable');
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: (input, init) => {
    const headers = new Headers(init?.headers);
    if (key.startsWith('sb_') && headers.get('Authorization') === `Bearer ${key}`) headers.delete('Authorization');
    headers.set('apikey', key);
    return fetch(input, { ...init, headers });
  } } });
  const { data: rows, error } = await db.rpc('published_giveaway');
  if (error) throw new Error('Giveaway unavailable');
  const data = rows?.[0];
  if (!data) return null;
  return {
    id: data.id,
    title: data.title,
    spins: data.spins_per_user,
    rules: data.rules,
    slices: data.prize_labels as string[],
  };
});

export const myGiveawayState = createServerFn({ method: "POST" })
  .handler(async () => {
    const { giveawayVisitor } = await import('./giveaway-visitor.server');
    const visitor = giveawayVisitor(true);
    if (!visitor) throw new Error('Browser identity unavailable');
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: c } = await supabaseAdmin
      .from("giveaway_campaigns")
      .select("id,spins_per_user,win_message,claim_url")
      .eq("active", true)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!c) return null;
    const { data: spins } = await supabaseAdmin
      .from("giveaway_entries")
      .select("prize_label,is_win,claim_code")
      .eq("campaign_id", c.id)
      .eq("visitor_id", visitor);
    const list = spins ?? [];
    return {
      left: Math.max(0, c.spins_per_user - list.length),
      wins: list.filter((s) => s.is_win),
      winMessage: c.win_message,
      claimUrl: c.claim_url,
    };
  });

export const spinGiveaway = createServerFn({ method: "POST" })
  .handler(async () => {
    const { giveawayVisitor } = await import('./giveaway-visitor.server');
    const visitor = giveawayVisitor();
    if (!visitor) return { error: 'identity' };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.rpc("giveaway_enter", { p_visitor: visitor });
    if (error) throw new Error("অংশগ্রহণ সম্পন্ন হয়নি। আবার চেষ্টা করুন।");
    return data as { error?: string; index?: number; label?: string; win?: boolean; code?: string | null; left?: number };
  });

export const adminGetGiveaway = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertAdmin } = await import("./admin-helpers.server");
    await assertAdmin(context);
    const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
    const { data: c } = await db.from("giveaway_campaigns").select("*").order("updated_at", { ascending: false }).limit(1).maybeSingle();
    const { data: winners } = c
      ? await db.from("giveaway_spins").select("email,prize_label,claim_code,created_at").eq("campaign_id", c.id).eq("is_win", true).order("created_at", { ascending: false }).limit(100)
      : { data: [] };
    const { count } = c ? await db.from("giveaway_spins").select("id", { count: "exact", head: true }).eq("campaign_id", c.id) : { count: 0 };
    const { data: entries } = c ? await db.from('giveaway_entries').select('visitor_id,prize_label,claim_code,created_at').eq('campaign_id', c.id).eq('is_win', true).order('created_at', { ascending: false }).limit(100) : { data: [] };
    const { count: allEntries } = c ? await db.from('giveaway_entries').select('id', { count: 'exact', head: true }).eq('campaign_id', c.id) : { count: 0 };
    return { campaign: c, winners: [...(entries ?? []).map(e => ({ ...e, email: `ব্রাউজার · ${e.visitor_id.slice(0, 8)}` })), ...(winners ?? [])].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 100), totalSpins: (count ?? 0) + (allEntries ?? 0) };
  });

export const adminSaveGiveaway = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      id: z.string().uuid().nullable(),
      newCampaign: z.boolean(),
      title: z.string().trim().min(1).max(80),
      active: z.boolean(),
      spins_per_user: z.number().int().min(1).max(10),
      prizes: z.array(prizeSchema).min(2).max(10),
      rules: z.string().max(2000),
      win_message: z.string().max(500),
      claim_url: z.string().url().max(300).nullable(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./admin-helpers.server");
    await assertAdmin(context);
    const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
    const { id, newCampaign, ...row } = data;
    if (row.active) await db.from("giveaway_campaigns").update({ active: false }).neq("id", id ?? "00000000-0000-0000-0000-000000000000");
    const res = newCampaign || !id
      ? await db.from("giveaway_campaigns").insert(row).select("id").single()
      : await db.from("giveaway_campaigns").update(row).eq("id", id).select("id").single();
    if (res.error) throw new Error("সেভ হয়নি।");
    return { id: res.data.id };
  });
