/**
 * ZiniPay gateway client — server only.
 *
 * Docs: https://zinipay.com/docs
 *   POST https://api.zinipay.com/v1/payment/create  -> { status, payment_url }
 *   POST https://api.zinipay.com/v1/payment/verify  -> { status: PENDING|COMPLETED|FAILED, ... }
 *
 * Auth header: `zini-api-key: <brand api key>`
 * The key lives only in the server env (ZINIPAY_API_KEY) and is never sent to
 * the browser, logged, or embedded in a response.
 */

const BASE_URL = process.env.ZINIPAY_BASE_URL || "https://api.zinipay.com";
const TIMEOUT_MS = 15_000;

export type ZiniStatus = "PENDING" | "COMPLETED" | "FAILED" | "UNKNOWN";

export function gatewayConfig() {
  const key = process.env.ZINIPAY_API_KEY ?? "";
  return {
    configured: key.length > 8,
    /** sandbox keys are prefixed `sandbox_` by ZiniPay */
    mode: key.startsWith("sandbox") ? ("sandbox" as const) : ("live" as const),
    baseUrl: BASE_URL,
  };
}

function apiKey() {
  const key = process.env.ZINIPAY_API_KEY;
  if (!key) throw new Error("payment_gateway_not_configured");
  return key;
}

async function call<T>(path: string, body: unknown): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "zini-api-key": apiKey(),
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const text = await res.text();
    let json: unknown = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      /* non-JSON gateway reply */
    }
    if (!res.ok) {
      const message =
        (json as { message?: string } | null)?.message ?? `Gateway responded ${res.status}`;
      throw new Error(message);
    }
    return json as T;
  } finally {
    clearTimeout(timer);
  }
}

export type CreateInvoiceInput = {
  amount: number;
  cusName?: string | null;
  cusEmail?: string | null;
  redirectUrl: string;
  cancelUrl: string;
  webhookUrl: string;
  metadata: Record<string, string | number>;
};

export async function createInvoice(input: CreateInvoiceInput) {
  const data = await call<{ status?: boolean; message?: string; payment_url?: string }>(
    "/v1/payment/create",
    {
      cus_name: input.cusName || "Ghostae customer",
      cus_email: input.cusEmail || undefined,
      amount: input.amount,
      metadata: input.metadata,
      redirect_url: input.redirectUrl,
      cancel_url: input.cancelUrl,
      webhook_url: input.webhookUrl,
    },
  );
  if (!data?.payment_url) throw new Error(data?.message || "Gateway did not return a payment URL.");
  return { paymentUrl: data.payment_url, invoiceId: invoiceIdFromUrl(data.payment_url) };
}

/** ZiniPay returns `https://secure.zinipay.com/payment/<INVOICE_ID>`. */
export function invoiceIdFromUrl(url: string) {
  const clean = url.split("?")[0]?.replace(/\/+$/, "") ?? "";
  const last = clean.split("/").pop() ?? "";
  return /^[A-Za-z0-9_-]{6,80}$/.test(last) ? last : null;
}

export type VerifyResult = {
  status: ZiniStatus;
  amount: number | null;
  invoiceId: string | null;
  transactionId: string | null;
  paymentMethod: string | null;
  email: string | null;
  name: string | null;
};

export async function verifyInvoice(invoiceId: string): Promise<VerifyResult> {
  const data = await call<Record<string, unknown>>("/v1/payment/verify", { invoice_id: invoiceId });
  const raw = String(data?.["status"] ?? "").toUpperCase();
  const status: ZiniStatus =
    raw === "COMPLETED" || raw === "SUCCESS" || raw === "TRUE"
      ? "COMPLETED"
      : raw === "FAILED" || raw === "CANCELLED"
        ? "FAILED"
        : raw === "PENDING"
          ? "PENDING"
          : "UNKNOWN";
  const num = Number(data?.["amount"]);
  return {
    status,
    amount: Number.isFinite(num) ? num : null,
    invoiceId: (data?.["invoice_id"] as string) ?? invoiceId,
    transactionId: (data?.["transaction_id"] as string) ?? null,
    paymentMethod: (data?.["payment_method"] as string) ?? null,
    email: (data?.["cus_email"] as string) ?? null,
    name: (data?.["cus_name"] as string) ?? null,
  };
}
