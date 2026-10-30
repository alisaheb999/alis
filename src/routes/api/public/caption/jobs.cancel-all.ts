import { createFileRoute } from "@tanstack/react-router";
import { COMPAT_CORS, compatJson } from "@/lib/caption-compat.server";

/** The panel's "stop everything" button — scoped to this device only. */
export const Route = createFileRoute("/api/public/caption/jobs/cancel-all")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: COMPAT_CORS }),
      POST: async ({ request }) => {
        const { admin } = await import("@/lib/caption-queue.server");
        const db = await admin();

        let body: Record<string, unknown> = {};
        try {
          body = (await request.json()) as Record<string, unknown>;
        } catch {
          body = {};
        }
        const device =
          request.headers.get("x-ghost-device") ||
          String(body["device"] ?? body["userId"] ?? "").trim();

        if (!device) return compatJson({ ok: true, cancelled: 0 });

        const { data } = await db
          .from("caption_jobs")
          .update({ status: "cancelled", stage: "cancelled", progress: 0 })
          .eq("device_id", device)
          .in("status", ["queued", "processing"])
          .select("id");

        return compatJson({ ok: true, cancelled: data?.length ?? 0 });
      },
    },
  },
});
