import { createFileRoute } from "@tanstack/react-router";
import { CORS_HEADERS, preflight } from "@/lib/ghost-api";

function fail(error: string, status: number) {
  return new Response(JSON.stringify({ ok: false, error }), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...CORS_HEADERS },
  });
}

/** Redirects to a 30-minute signed URL for one `.aep` project file. */
export const Route = createFileRoute("/api/public/templates/$slug")({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      GET: async ({ params }) => {
        const slug = decodeURIComponent(params.slug ?? "").toLowerCase();
        if (!slug || !/^[a-z0-9.-]{1,120}$/.test(slug)) return fail("bad_slug", 400);

        const { signTemplate } = await import("@/lib/ghost-templates.server");
        let signed: Awaited<ReturnType<typeof signTemplate>> = null;
        try {
          signed = await signTemplate(slug);
        } catch {
          return fail("file_missing", 404);
        }
        if (!signed) return fail("not_found", 404);

        return new Response(null, {
          status: 302,
          headers: {
            Location: signed.url,
            "Cache-Control": "no-store",
            ...CORS_HEADERS,
          },
        });
      },
    },
  },
});
