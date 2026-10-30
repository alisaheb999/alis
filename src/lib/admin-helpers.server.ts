/**
 * Server-only helpers for the admin server functions.
 *
 * These live outside `admin.functions.ts` on purpose: TanStack's server-function
 * splitter strips module-scope runtime siblings from a `createServerFn` file,
 * which turns helper calls into `ReferenceError` at runtime even though the
 * typecheck passes.
 */

export const PATCH_CHANNEL = "stable";

export type PublishedPatch = {
  patchId: string;
  version: string;
  fromVersion: string | null;
  title: string | null;
  notes: string | null;
  url: string;
  sha256: string;
  sizeBytes: number | null;
  mandatory: boolean;
  requiresRestart: boolean;
  publishedAt: string;
};

type AdminContext = {
  // The generated Supabase client types RPC names narrowly; keep this loose so
  // every admin server function can pass its middleware context through.
  supabase: any;
  userId: string;
};

/** Verify the caller holds the `admin` role, then hand back the privileged client. */
export async function assertAdmin(context: AdminContext) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error) throw new Error("Role check failed.");
  if (data !== true) throw new Error("Forbidden: admin role required.");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export function makeKey() {
  const raw = crypto.randomUUID().replace(/-/g, "").toUpperCase();
  return `GHOST-${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}-${raw.slice(12, 16)}`;
}
