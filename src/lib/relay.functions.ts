import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const relayOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertAdmin } = await import("./admin-helpers.server");
    const admin = await assertAdmin(context);
    const { data, error } = await admin.from("relay_devices")
      .select("id,device_uuid,device_name,status,last_seen_at,app_version,android_version,created_at")
      .order("created_at", { ascending: false }).limit(100);
    if (error) throw new Error("Could not load relay devices.");
    return data ?? [];
  });

export const createRelayCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertAdmin } = await import("./admin-helpers.server");
    const admin = await assertAdmin(context);
    const { hashRelay, pairingCode } = await import("./relay.server");
    const { data: allowed, error: limitError } = await admin.rpc("relay_allow_pair_attempt", {
      p_scope_hash: await hashRelay(`relay-admin:${context.userId}`),
    });
    if (limitError || !allowed) throw new Error("Please wait a minute before creating another code.");
    const code = pairingCode();
    const expires_at = new Date(Date.now() + 600_000).toISOString();
    const { error } = await admin.from("relay_pairing_codes").insert({
      code_hash: await hashRelay(code), expires_at, created_by: context.userId,
    });
    if (error) throw new Error("Could not create pairing code.");
    return { code, expires_at };
  });

export const setRelayStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid(), status: z.enum(["ACTIVE", "DISABLED", "REVOKED"]) }).parse(input))
  .handler(async ({ context, data }) => {
    const { assertAdmin } = await import("./admin-helpers.server");
    const admin = await assertAdmin(context);
    const { data: existing, error: readError } = await admin.from("relay_devices").select("status").eq("id", data.id).single();
    if (readError || !existing) throw new Error("Device not found.");
    if (existing.status === "REVOKED") throw new Error("Revoked devices cannot be enabled again.");
    const { data: updated, error } = await admin.from("relay_devices").update({ status: data.status }).eq("id", data.id).neq("status", "REVOKED").select("id");
    if (error || !updated?.length) throw new Error("Could not change device status.");
    return { ok: true };
  });
export const relayTransactions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertAdmin } = await import("./admin-helpers.server");
    const admin = await assertAdmin(context);
    const { data, error } = await admin.from("relay_transactions")
      .select("id,provider,trx_id,amount,sender,match_status,matched_order_id,created_at")
      .order("created_at", { ascending: false }).limit(50);
    if (error) throw new Error("Could not load relay transactions.");
    return data ?? [];
  });
