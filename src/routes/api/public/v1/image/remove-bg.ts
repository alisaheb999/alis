import { createFileRoute } from "@tanstack/react-router";
import { CORS_HEADERS, errorResponse, jsonResponse, preflight } from "@/lib/ghost-api";

const MAX_BYTES = 20 * 1024 * 1024;

export const Route = createFileRoute("/api/public/v1/image/remove-bg")({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      /** Provider availability probe — used by the panel before it uploads. */
      GET: async () => {
        const { removeBgProviderStatus } = await import("@/lib/ghost-removebg.server");
        const providers = removeBgProviderStatus();
        const ready = Object.values(providers).some(Boolean);
        return jsonResponse({ ok: true, ready, providers });
      },
      POST: async ({ request }) => {
        let form: FormData;
        try {
          form = await request.formData();
        } catch {
          return errorResponse("bad_request", "Send the image as multipart/form-data.", 400);
        }
        const file = form.get("file") ?? form.get("image_file") ?? form.get("image");
        if (!(file instanceof File) || file.size === 0)
          return errorResponse("bad_request", "No image received.", 400);
        if (file.size > MAX_BYTES) return errorResponse("too_large", "Image is larger than 20 MB.", 413);

        const { removeBackground } = await import("@/lib/ghost-removebg.server");
        const result = await removeBackground(file, {
          format: String(form.get("format") || "png"),
          size: String(form.get("size") || "full"),
          bgColor: String(form.get("bg_color") || "") || undefined,
        });

        if (!result.ok) {
          console.error("[ghost:remove-bg] all providers failed", result.attempts);
          return errorResponse("upstream", result.message, result.status);
        }

        if (String(form.get("output") || "") === "base64") {
          return jsonResponse({
            ok: true,
            provider: result.provider,
            mime: result.mime,
            base64: Buffer.from(result.bytes).toString("base64"),
          });
        }

        return new Response(result.bytes, {
          headers: {
            "Content-Type": result.mime,
            "Cache-Control": "no-store",
            "X-Ghost-Provider": result.provider,
            ...CORS_HEADERS,
          },
        });
      },
    },
  },
});
