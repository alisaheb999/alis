import { createFileRoute } from "@tanstack/react-router";
import { COMPAT_CORS, compatJson } from "@/lib/caption-compat.server";

export const Route = createFileRoute("/api/public/caption/jobs/$jobId/cancel")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: COMPAT_CORS }),
      POST: async ({ params }) => {
        const jobId = String(params.jobId || "");
        if (!/^[0-9a-f-]{36}$/i.test(jobId)) {
          return compatJson({ ok: false, error: "Invalid job id." }, 400);
        }
        const { admin } = await import("@/lib/caption-queue.server");
        const db = await admin();
        await db
          .from("caption_jobs")
          .update({ status: "cancelled", stage: "cancelled", progress: 0 })
          .eq("id", jobId)
          .in("status", ["queued", "processing"]);
        return compatJson({ ok: true, job: { id: jobId, status: "cancelled", progress: 0 } });
      },
    },
  },
});
