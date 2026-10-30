import { createFileRoute } from "@tanstack/react-router";
import { errorResponse, jsonResponse, preflight } from "@/lib/ghost-api";

/**
 * ZiniPay webhook.
 *
 * ZiniPay posts `{ invoice_id, status }` (or the same pair as query params).
 * The claimed status is never trusted: we always re-verify the invoice against
 * the ZiniPay API with our server-side key before issuing a licence.
 */
export const Route = createFileRoute("/api/public/v1/payments/zinipay")({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      GET: async ({ request }) => handle(request),
      POST: async ({ request }) => handle(request),
    },
  },
});

async function handle(request: Request) {
  const g = await import("@/lib/ghost-api.server");
  const meta = g.clientMeta(request);
  if (!g.rateLimit(`zini-hook:${meta.ip ?? "anon"}`, 120, 60_000).allowed)
    return errorResponse("rate_limited", "Too many requests.", 429);

  let invoiceId: string | null = null;
  try {
    const url = new URL(request.url);
    invoiceId = url.searchParams.get("invoice_id");
    if (!invoiceId && request.method === "POST") {
      const raw = await request.text();
      if (raw) {
        try {
          const body = JSON.parse(raw) as { invoice_id?: string };
          invoiceId = body.invoice_id ?? null;
        } catch {
          const form = new URLSearchParams(raw);
          invoiceId = form.get("invoice_id");
        }
      }
    }
  } catch {
    /* fall through */
  }

  if (!invoiceId || !/^[A-Za-z0-9_-]{6,80}$/.test(invoiceId))
    return errorResponse("bad_request", "invoice_id is required.", 400);

  try {
    const { fulfilInvoice } = await import("@/lib/fulfillment.server");
    const result = await fulfilInvoice(invoiceId);
    await g.logEvent({
      event: "payment.webhook",
      status: result.status,
      ip_address: meta.ip,
      details: { invoice_id: invoiceId },
    });
    // Always 200 so the gateway does not hot-retry a known invoice.
    return jsonResponse({ ok: true, status: result.status });
  } catch (err) {
    await g.logEvent({
      event: "payment.webhook",
      status: "error",
      ip_address: meta.ip,
      details: { invoice_id: invoiceId, message: err instanceof Error ? err.message : "unknown" },
    });
    return errorResponse("verify_failed", "Could not verify the invoice.", 502);
  }
}
