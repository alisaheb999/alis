import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { GhostShell } from "../components/ghost/Shell";
import { useLang } from "../lib/i18n";
import { confirmOrder } from "../lib/checkout.functions";
import { formatTaka } from "../lib/pricing-catalog";
import { Button } from "@/components/ui/button";
import { SUPPORT_URL } from "@/lib/site-contact";
import { CheckCircle2, Copy, Loader2, RefreshCw, AlertTriangle, Key, Download, MessageCircle, LockKeyhole } from "lucide-react";

const search = z.object({
  invoice_id: z.string().catch(""),
  invoiceId: z.string().catch(""),
});

export const Route = createFileRoute("/order-confirmation")({
  validateSearch: search,
  head: () => ({
    meta: [
      { title: "Order Confirmation — Your Ghostae Activation Key" },
      {
        name: "description",
        content:
          "Payment confirmed. Copy your Ghostae activation key, see your plan, device limit and expiry, then activate the extension inside After Effects.",
      },
      { property: "og:title", content: "Ghostae Order Confirmation" },
      { property: "og:description", content: "Your activation key and plan details." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ConfirmationPage,
});

type Result = Awaited<ReturnType<typeof confirmOrder>>;

function ConfirmationPage() {
  const params = Route.useSearch();
  const invoiceId = params.invoice_id || params.invoiceId || "";
  const { lang } = useLang();
  const en = lang === "en";
  const check = useServerFn(confirmOrder);
  const navigate = useNavigate();

  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(Boolean(invoiceId));
  const [copied, setCopied] = useState(false);

  const run = useCallback(async () => {
    if (!invoiceId) return;
    setLoading(true);
    try {
      setResult(await check({ data: { invoice_id: invoiceId } }));
    } catch {
      setResult({ status: "pending" } as Result);
    } finally {
      setLoading(false);
    }
  }, [check, invoiceId]);

  useEffect(() => {
    void run();
  }, [run]);

  // Gateways sometimes redirect before the webhook lands — poll a few times.
  useEffect(() => {
    if (!invoiceId || result?.status !== "pending") return;
    const t = setTimeout(() => void run(), 5000);
    return () => clearTimeout(t);
  }, [invoiceId, result?.status, run]);

  const order = result?.order;
  const paid = result?.status === "paid" && order?.licenseKey;
  useEffect(() => {
    if (result?.status !== 'pending') return;
    if (order?.email && !order.email.endsWith('@wa.ghostae.app')) sessionStorage.setItem('ghostae-purchase-email', order.email);
    void navigate({ to: '/dashboard', replace: true });
  }, [result?.status, order?.email, navigate]);

  const copy = async () => {
    if (!order?.licenseKey) return;
    await navigator.clipboard.writeText(order.licenseKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <GhostShell>
      <div className="mx-auto max-w-2xl px-3 py-8 sm:px-6 sm:py-14">
        {!invoiceId ? (
          <Box
            icon={<AlertTriangle className="h-6 w-6 text-amber-500" />}
            title={en ? "No order reference" : "কোনো অর্ডার রেফারেন্স নেই"}
            body={
              en
                ? "Open this page from the payment redirect, or check your dashboard for purchased keys."
                : "পেমেন্ট রিডাইরেক্ট থেকে এই পেজে আসুন, অথবা ড্যাশবোর্ডে কেনা কী দেখুন।"
            }
          />
        ) : loading && !result ? (
          <Box
            icon={<Loader2 className="h-6 w-6 animate-spin text-blue-500" />}
            title={en ? "Verifying your payment…" : "পেমেন্ট যাচাই করা হচ্ছে…"}
            body={en ? "This usually takes a few seconds." : "সাধারণত কয়েক সেকেন্ড লাগে।"}
          />
        ) : paid ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.07] p-4 text-center sm:p-8">
              <CheckCircle2 className="mx-auto h-9 w-9 text-emerald-500" />
              <h1 className="mt-3 text-lg font-extrabold sm:text-2xl">
                {en ? "Payment confirmed" : "পেমেন্ট নিশ্চিত হয়েছে"}
              </h1>
              <p className="mt-1.5 text-xs text-slate-600 dark:text-blue-200/60 sm:text-sm">
                {en
                  ? "Your activation key is ready. Save it somewhere safe."
                  : "আপনার অ্যাক্টিভেশন কী প্রস্তুত। নিরাপদে সংরক্ষণ করুন।"}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-blue-900/30 bg-white/80 dark:bg-blue-950/10 p-4 sm:p-6">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                <Key className="h-3.5 w-3.5" /> {en ? "Activation key" : "অ্যাক্টিভেশন কী"}
              </div>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                <code className="flex-1 break-all rounded-xl border border-slate-200 dark:border-blue-900/40 bg-slate-50 dark:bg-blue-950/30 px-3 py-2.5 font-mono text-xs sm:text-sm">
                  {order?.licenseKey}
                </code>
                <button
                  onClick={() => void copy()}
                  className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-[11px] font-bold uppercase tracking-widest text-white hover:bg-blue-500"
                >
                  <Copy className="h-3.5 w-3.5" /> {copied ? (en ? "Copied" : "কপি হয়েছে") : en ? "Copy" : "কপি"}
                </button>
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-3 text-[11.5px] sm:grid-cols-4">
                <Meta label={en ? "Plan" : "প্ল্যান"} value={order?.plan.toUpperCase() ?? "—"} />
                <Meta label={en ? "Paid" : "পরিশোধ"} value={formatTaka(order?.amount ?? 0)} />
                <Meta label={en ? "Devices" : "ডিভাইস"} value={String(order?.deviceLimit)} />
                <Meta
                  label={en ? "Valid till" : "মেয়াদ"}
                  value={order?.expiresAt ? new Date(order?.expiresAt ?? "").toLocaleDateString() : "—"}
                />
                <Meta label={en ? "Method" : "মাধ্যম"} value={order?.paymentMethod ?? "—"} />
                <Meta label={en ? "Transaction" : "ট্রানজেকশন"} value={order?.transactionId ?? "—"} />
                <Meta label={en ? "Email" : "ইমেইল"} value={order?.email ?? "—"} />
                <Meta label={en ? "Cycle" : "সাইকেল"} value={order?.cycle ?? "—"} />
              </dl>
            </div>

            <div className="account-typography grid gap-3 sm:grid-cols-2">
              <Button asChild className="h-12 font-normal"><Link to="/auth" search={{ mode: 'create' }} onClick={() => { if (order?.email && !order.email.endsWith('@wa.ghostae.app')) sessionStorage.setItem('ghostae-purchase-email', order.email); }}><LockKeyhole className="size-4" />Create a password</Link></Button>
              <Button asChild variant="outline" className="h-12 font-normal"><a href={SUPPORT_URL} target="_blank" rel="noreferrer"><MessageCircle className="size-4" />আরও সহায়তা নিন</a></Button>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Link
                to="/dashboard"
                className="flex-1 rounded-full bg-blue-600 py-3 text-center text-[11px] font-bold uppercase tracking-widest text-white hover:bg-blue-500"
              >
                {en ? "Open my dashboard" : "আমার ড্যাশবোর্ড"}
              </Link>
              <Link
                to="/products"
                className="flex flex-1 items-center justify-center gap-2 rounded-full border border-slate-200 dark:border-blue-900/40 py-3 text-[11px] font-bold uppercase tracking-widest"
              >
                <Download className="h-3.5 w-3.5" /> {en ? "Download extension" : "এক্সটেনশন ডাউনলোড"}
              </Link>
            </div>

            <p className="text-center text-[10.5px] text-slate-400 dark:text-blue-200/40">
              {en
                ? "Sign in with the same email to see this key any time — we also keep it in your account."
                : "একই ইমেইলে লগইন করলে যেকোনো সময় এই কী দেখতে পাবেন — আপনার অ্যাকাউন্টেও সংরক্ষিত থাকে।"}
            </p>
          </div>
        ) : result?.status === "failed" ? (
          <Box
            icon={<AlertTriangle className="h-6 w-6 text-red-500" />}
            title={en ? "Payment failed" : "পেমেন্ট ব্যর্থ হয়েছে"}
            body={
              en
                ? "No money was captured. You can safely try again from the pricing page."
                : "কোনো টাকা কাটা হয়নি। প্রাইসিং পেজ থেকে আবার চেষ্টা করতে পারেন।"
            }
            action={
              <Link
                to="/products"
                className="rounded-full bg-blue-600 px-5 py-2.5 text-[11px] font-bold uppercase tracking-widest text-white"
              >
                {en ? "Back to pricing" : "প্রাইসিং-এ ফিরুন"}
              </Link>
            }
          />
        ) : result?.status === 'pending' ? (
          <div role="status" className="account-typography flex items-center justify-center gap-2 py-8 text-sm text-muted-fg"><Loader2 className="size-4 animate-spin motion-reduce:animate-none"/>আপনার পণ্যের তালিকা খুলছে…</div>
        ) : <div className="account-typography py-8 text-center text-sm text-muted-fg">অর্ডার খুঁজে পাওয়া যায়নি। <Button asChild variant="link"><Link to="/dashboard">আপনার পণ্য দেখুন</Link></Button></div>}
      </div>
    </GhostShell>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400">{label}</dt>
      <dd className="mt-0.5 break-all font-semibold">{value}</dd>
    </div>
  );
}

function Box({
  icon,
  title,
  body,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-blue-900/30 bg-white/80 dark:bg-blue-950/10 p-5 text-center sm:p-8">
      <div className="flex justify-center">{icon}</div>
      <h1 className="mt-3 text-base font-extrabold sm:text-xl">{title}</h1>
      <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-slate-600 dark:text-blue-200/60 sm:text-sm">
        {body}
      </p>
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}
