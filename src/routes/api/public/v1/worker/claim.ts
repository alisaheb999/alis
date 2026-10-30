import { createFileRoute } from "@tanstack/react-router";
import { jsonResponse, preflight } from "@/lib/ghost-api";
import {
  CAPTION_LEASE_SECONDS,
  admin,
  signedMediaUrl,
  workerAuthorized,
} from "@/lib/caption-queue.server";

/** Lease exactly one queued job and hand back a short-lived signed media URL. */
export const Route = createFileRoute("/api/public/v1/worker/claim")({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      POST: async ({ request }) => {
        const auth = workerAuthorized(request);
        if (!auth.ok) return jsonResponse({ ok: false, error: auth.reason }, 401);

        let body: Record<string, unknown> = {};
        try {
          body = (await request.json()) as Record<string, unknown>;
        } catch {
          body = {};
        }
        const workerId = String(body.workerId || "");
        if (!/^[0-9a-f-]{36}$/i.test(workerId)) {
          return jsonResponse({ ok: false, error: "Send a workerId from /worker/heartbeat first." }, 400);
        }

        const db = await admin();

        // Reject stale worker ids (e.g. after a worker row was removed) so the
        // extension re-registers instead of polling forever with a dead id.
        const { data: worker } = await db
          .from("caption_workers")
          .select("id")
          .eq("id", workerId)
          .maybeSingle();
        if (!worker) {
          return jsonResponse({ ok: false, error: "unknown_worker", reregister: true }, 409);
        }
        await db
          .from("caption_workers")
          .update({ last_seen_at: new Date().toISOString() })
          .eq("id", workerId);

        const { data, error } = await db.rpc("claim_caption_job", {
          _worker_id: workerId,
          _lease_seconds: CAPTION_LEASE_SECONDS,
        });
        if (error) {
          console.error("[ghost:caption] claim failed", error);
          return jsonResponse({ ok: false, error: "Could not claim a job." }, 500);
        }

        const job = Array.isArray(data) ? data[0] : data;
        if (!job?.id) return jsonResponse({ ok: true, job: null });

        let mediaUrl: string;
        try {
          mediaUrl = await signedMediaUrl(job.media_object_key);
        } catch (err) {
          console.error("[ghost:caption] signing media failed", err);
          await db
            .from("caption_jobs")
            .update({
              status: "failed",
              stage: "failed",
              error_code: "media_missing",
              error_message: "Media file could not be read.",
            })
            .eq("id", job.id);
          return jsonResponse({ ok: true, job: null });
        }

        return jsonResponse({
          ok: true,
          job: {
            id: job.id,
            mediaUrl,
            mediaName: job.media_name,
            mediaMime: job.media_mime,
            language: job.language,
            durationHint: job.duration_hint,
            leaseSeconds: CAPTION_LEASE_SECONDS,
          },
        });
      },
    },
  },
});
