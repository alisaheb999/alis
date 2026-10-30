import { createFileRoute } from "@tanstack/react-router";
import { COMPAT_CORS, compatCharge, compatIdentity, compatJson, minutesFor } from "@/lib/caption-compat.server";

/**
 * Step 1 of the shipped panel's flow: reserve a job (JSON, no media yet).
 * The quota is dry-run checked here so the user is told early, and charged
 * for real on upload.
 */
export const Route = createFileRoute("/api/public/caption/jobs")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: COMPAT_CORS }),
      POST: async ({ request }) => {
        const g = await import("@/lib/ghost-api.server");
        const { admin } = await import("@/lib/caption-queue.server");
        const meta = g.clientMeta(request);

        let body: Record<string, unknown> = {};
        try {
          body = (await request.json()) as Record<string, unknown>;
        } catch {
          body = {};
        }

        const userId = String(body["userId"] ?? "").trim() || null;
        const device = String(body["device"] ?? "").trim() || null;
        const size = Math.max(0, Number(body["size"]) || 0);
        const name = String(body["filename"] ?? "media").slice(0, 120);
        const mime = String(body["mimeType"] ?? "application/octet-stream").slice(0, 80);
        const idempotencyKey =
          (request.headers.get("idempotency-key") || String(body["requestId"] ?? "")).trim() || null;

        if (!g.rateLimit(`caption-compat:${userId || device || meta.ip || "anon"}`, 10, 60_000).allowed) {
          return compatJson({ ok: false, error: "অনেক বেশি অনুরোধ — এক মিনিট পরে আবার চেষ্টা করুন।" }, 429);
        }

        const identity = await compatIdentity(request, { userId, device });
        const check = await compatCharge(identity, minutesFor(size), true);
        if (!check.allowed) {
          return compatJson(
            { ok: false, error: "আপনার প্ল্যানের ক্যাপশন সীমা শেষ হয়েছে। ghostae.com থেকে প্ল্যান আপগ্রেড করুন।" },
            429,
          );
        }

        const db = await admin();

        if (idempotencyKey) {
          const { data: existing } = await db
            .from("caption_jobs")
            .select("id, status, progress")
            .eq("idempotency_key", idempotencyKey)
            .maybeSingle();
          if (existing) {
            return compatJson({
              ok: true,
              job: { id: existing.id, status: "queued", progress: Number(existing.progress) || 3 },
            });
          }
        }

        const { data, error } = await db
          .from("caption_jobs")
          .insert({
            media_object_key: "pending",
            media_name: name,
            media_mime: mime,
            media_size: size,
            stage: "awaiting_upload",
            progress: 3,
            language: String(body["language"] ?? "").trim() || null,
            device_id: device || userId,
            client_key: identity.licenseKey,
            idempotency_key: idempotencyKey,
          })
          .select("id, progress")
          .single();

        if (error || !data) {
          console.error("[ghost:caption-compat] reserve failed", error);
          return compatJson({ ok: false, error: "ক্যাপশন প্রক্রিয়া শুরু করা যায়নি।" }, 500);
        }

        return compatJson({ ok: true, job: { id: data.id, status: "queued", progress: 3 } });
      },
    },
  },
});
