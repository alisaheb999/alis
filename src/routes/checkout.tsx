import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { toast } from "sonner";
import { GhostShell } from "../components/ghost/Shell";
import { useLang } from "../lib/i18n";
import { CATALOG, formatTaka, isCycle, isPaidPlan, type Cycle, type PaidPlanId } from "../lib/pricing-catalog";
import { createManualOrder, getPublicOffer, previewCoupon } from "../lib/checkout.functions";
import { findProduct } from "../lib/products-catalog";

const PAY_NUMBER = "01949085128";
const WA_NUMBER = "8801345407572";
const METHODS = [
  { id: "bkash", label: "bKash" },
  { id: "nagad", label: "Nagad" },
  { id: "rocket", label: "Rocket" },
  { id: "upay", label: "Upay" },
] as const;
type Method = (typeof METHODS)[number]["id"];
import { ShieldCheck, Lock, Smartphone, ArrowRight, Info, Loader2, Mail } from "lucide-react";

const search = z.object({
  plan: z.string().catch("pro"),
  cycle: z.string().catch("monthly"),
  product: z.string().catch(""),
});

export const Route = createFileRoute("/checkout")({
  validateSearch: search,
  head: () => ({
    meta: [
      { title: "Secure Checkout — Ghostae Plans (bKash · Nagad · Card)" },
      {
        name: "description",
        content:
          "Pay for Ghostae Premium, Ultra or Team with bKash, Nagad, Rocket or card. Your activation key is generated automatically the moment payment is confirmed.",
      },
      { property: "og:title", content: "Ghostae Secure Checkout" },
      {
        property: "og:description",
        content: "Instant activation key after payment — bKash, Nagad, Rocket and card supported.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const { plan: planParam, cycle: cycleParam, product: productParam } = Route.useSearch();
  const product = productParam ? findProduct(productParam) : undefined;
  const planIds = ((product?.plans ?? []).filter(isPaidPlan) as PaidPlanId[]);
  const allowedPlans = planIds.length ? planIds : (Object.keys(CATALOG) as PaidPlanId[]);
  const { lang } = useLang();
  const en = lang === "en";
  const navigate = useNavigate();
  const start = useServerFn(createManualOrder);
  const checkCoupon = useServerFn(previewCoupon);
  const fetchPublicOffer = useServerFn(getPublicOffer);
  const [publicAmount, setPublicAmount] = useState<number | null>(null);

  const [plan, setPlan] = useState<PaidPlanId>(
    isPaidPlan(planParam) && (!planIds.length || planIds.includes(planParam)) ? planParam : (allowedPlans[0] as PaidPlanId),
  );
  const fixedCaptionTerm = product?.slug === "caption";
  const [cycle, setCycle] = useState<Cycle>(fixedCaptionTerm ? "monthly" : isCycle(cycleParam) ? cycleParam : "monthly");
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [method, setMethod] = useState<Method>("bkash");
  const [trxId, setTrxId] = useState("");
  const [busy, setBusy] = useState(false);
  const [coupon, setCoupon] = useState("");
  const [checking, setChecking] = useState(false);
  const [couponInfo, setCouponInfo] = useState<
    null | { ok: true; discount: number; amount: number } | { ok: false; reason: string }
  >(null);

  const item = CATALOG[plan];
  const listPrice = item.price[cycle];
  const amount = couponInfo?.ok ? Math.min(couponInfo.amount, publicAmount ?? listPrice) : publicAmount ?? listPrice;
  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    setPublicAmount(null);
    setCouponInfo(null);
    const refresh = () => void fetchPublicOffer({ data: { plan, cycle } }).then((offer) => {
      if (!active) return;
      setPublicAmount(offer.amount);
      if (offer.schedule) timer = setTimeout(() => { setCouponInfo(null); refresh(); }, Math.max(1000, offer.schedule.nextIncreaseAt - offer.schedule.serverNow));
    }).catch(() => { if (active) setPublicAmount(null); });
    refresh();
    return () => { active = false; clearTimeout(timer); };
  }, [plan, cycle, fetchPublicOffer]);

  const applyCoupon = async () => {
    setChecking(true);
    try {
      const res = await checkCoupon({ data: { plan, cycle, coupon } });
      setCouponInfo(
        res.ok
          ? { ok: true, discount: res.discount, amount: res.amount }
          : { ok: false, reason: res.reason },
      );
    } catch (err) {
      setCouponInfo({
        ok: false,
        reason: err instanceof Error ? err.message : en ? "Could not check the coupon." : "কুপন যাচাই করা যায়নি।",
      });
    } finally {
      setChecking(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await start({
        data: { plan, cycle, ...form, method, trxId, coupon: couponInfo?.ok ? coupon : "" },
      });
      const msg =
        `Ghostae order ${res.reference}\n` +
        `Plan: ${item.name.en} (${cycle})\n` +
        `Amount: ${formatTaka(res.amount)}\n` +
        `Method: ${method} · TrxID: ${trxId}\n` +
        `Name: ${form.name}\nEmail: ${form.email}`;
      window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`, "_blank");
      void navigate({ to: "/order-confirmation", search: { invoice_id: res.reference, invoiceId: res.reference } });
    } catch (err) {
      toast.error(en ? "Could not start payment" : "পেমেন্ট শুরু করা যায়নি", {
        description:
          err instanceof Error
            ? err.message
            : en
              ? "Please try again in a moment."
              : "একটু পরে আবার চেষ্টা করুন।",
      });
    } finally {
      setBusy(false);
    }
  };


  const field =
    "w-full rounded-xl border border-slate-200 dark:border-blue-900/40 bg-white dark:bg-blue-950/20 px-3 py-2.5 text-sm outline-none focus:border-blue-500";

  return (
    <GhostShell>
      <div className="mx-auto max-w-5xl px-3 py-6 sm:px-6 sm:py-12">
        <div className="mb-5 sm:mb-8">
          <h1 className="text-xl font-extrabold tracking-tight sm:text-3xl">
            {product
              ? `${product.name} — ${en ? "checkout" : "চেকআউট"}`
              : en
                ? "Secure checkout"
                : "নিরাপদ চেকআউট"}
          </h1>
          <p className="mt-1.5 text-xs text-slate-600 dark:text-blue-200/60 sm:text-sm">
            {product
              ? en
                ? `Send money via bKash, Nagad, Rocket or Upay, submit the transaction ID, and confirm on WhatsApp. Your key unlocks ${product.name} only.`
                : `bKash, Nagad, Rocket বা Upay দিয়ে টাকা পাঠান, ট্রানজেকশন আইডি জমা দিন, WhatsApp-এ নিশ্চিত করুন। কী শুধু ${product.name} আনলক করবে।`
              : en
                ? "Send money via bKash, Nagad, Rocket or Upay, submit the transaction ID, and confirm on WhatsApp."
                : "bKash, Nagad, Rocket বা Upay দিয়ে টাকা পাঠান, ট্রানজেকশন আইডি জমা দিন, WhatsApp-এ নিশ্চিত করুন।"}
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.15fr_1fr] sm:gap-6">
          {/* ---------------- form ---------------- */}
          <form
            onSubmit={submit}
            className="rounded-2xl border border-slate-200 dark:border-blue-900/30 bg-white/80 dark:bg-blue-950/10 p-4 sm:p-6"
          >
            <div className={`grid gap-2 ${allowedPlans.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
              {allowedPlans.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setPlan(id)}
                  className={`rounded-xl border px-2 py-2.5 text-[11px] font-bold uppercase tracking-wider transition ${
                    plan === id
                      ? "border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-300"
                      : "border-slate-200 dark:border-blue-900/40 text-slate-500 dark:text-blue-200/50"
                  }`}
                >
                  {en ? CATALOG[id].name.en : CATALOG[id].name.bn}
                </button>
              ))}
            </div>

            {!fixedCaptionTerm && <div className="mt-2.5 grid grid-cols-2 gap-2">
              {(["monthly", "yearly"] as Cycle[]).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCycle(c)}
                  className={`rounded-xl border px-2 py-2.5 text-[11px] font-bold uppercase tracking-wider transition ${
                    cycle === c
                      ? "border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-300"
                      : "border-slate-200 dark:border-blue-900/40 text-slate-500 dark:text-blue-200/50"
                  }`}
                >
                  {c === "monthly" ? (en ? "Monthly" : "মাসিক") : en ? "Yearly · save 20%" : "বার্ষিক · ২০% ছাড়"}
                </button>
              ))}
            </div>}

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {en ? "Full name" : "নাম"}
                </label>
                <input
                  required
                  maxLength={80}
                  className={field}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder={en ? "Your name" : "আপনার নাম"}
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {en ? "Email (key is sent here)" : "ইমেইল (কী এখানেই যাবে)"}
                </label>
                <input
                  required
                  type="email"
                  maxLength={200}
                  className={field}
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {en ? "Mobile (optional)" : "মোবাইল (ঐচ্ছিক)"}
                </label>
                <input
                  maxLength={30}
                  className={field}
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="01XXXXXXXXX"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {en ? "Coupon code (optional)" : "কুপন কোড (ঐচ্ছিক)"}
                </label>
                <div className="flex gap-2">
                  <input
                    maxLength={40}
                    className={field}
                    value={coupon}
                    onChange={(e) => {
                      setCoupon(e.target.value.toUpperCase());
                      setCouponInfo(null);
                    }}
                    placeholder="GHOST20"
                  />
                  <button
                    type="button"
                    disabled={!coupon.trim() || checking}
                    onClick={applyCoupon}
                    className="shrink-0 rounded-xl border border-blue-500/40 px-4 text-[11px] font-bold uppercase tracking-wider text-blue-600 disabled:opacity-50 dark:text-blue-300"
                  >
                    {checking ? "…" : en ? "Apply" : "প্রয়োগ"}
                  </button>
                </div>
                {couponInfo && (
                  <p
                    className={`mt-1.5 text-[11px] font-semibold ${
                      couponInfo.ok ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"
                    }`}
                  >
                    {couponInfo.ok
                      ? en
                        ? `Coupon applied — you save ${formatTaka(couponInfo.discount)}.`
                        : `কুপন প্রয়োগ হয়েছে — ${formatTaka(couponInfo.discount)} সঞ্চয়।`
                      : couponInfo.reason}
                  </p>
                )}
              </div>
            </div>


            <div className="mt-4 rounded-2xl border border-blue-500/25 bg-blue-500/[0.05] p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-300">
                {en ? "Step 1 — send money" : "ধাপ ১ — টাকা পাঠান"}
              </p>
              <p className="mt-1 text-[12px] leading-relaxed text-slate-700 dark:text-blue-100/80">
                {en ? "Send" : "পাঠান"} <b>{formatTaka(amount)}</b>{" "}
                {en ? "to" : "এই নম্বরে"} <b className="tabular-nums">{PAY_NUMBER}</b>{" "}
                {en ? "(Send Money / Personal)." : "(Send Money / Personal)।"}
              </p>
              <div className="mt-2.5 grid grid-cols-4 gap-2">
                {METHODS.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMethod(m.id)}
                    className={`rounded-xl border px-2 py-2 text-[11px] font-bold transition ${
                      method === m.id
                        ? "border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-300"
                        : "border-slate-200 dark:border-blue-900/40 text-slate-500 dark:text-blue-200/50"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
              <label className="mt-3 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {en ? "Step 2 — transaction ID" : "ধাপ ২ — ট্রানজেকশন আইডি"}
              </label>
              <input
                required
                maxLength={40}
                className={field}
                value={trxId}
                onChange={(e) => setTrxId(e.target.value.toUpperCase())}
                placeholder="8N7X2K9QAB"
              />
            </div>

            <button
              disabled={busy || publicAmount === null}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-blue-600 py-3 text-[11px] font-bold uppercase tracking-widest text-white transition hover:bg-blue-500 disabled:opacity-60"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-3.5 w-3.5" />}
              {publicAmount === null ? (en ? 'Checking price…' : 'দাম যাচাই হচ্ছে…') : en ? `Submit payment · ${formatTaka(amount)}` : `পেমেন্ট জমা দিন · ${formatTaka(amount)}`}
              <ArrowRight className="h-3.5 w-3.5" />
            </button>

            <p className="mt-3 flex items-start gap-2 text-[11px] leading-relaxed text-slate-500 dark:text-blue-200/50">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-500" />
              {en
                ? "After you submit, WhatsApp opens with your order details for verification. Ghostae never asks for your bKash/Nagad PIN or OTP."
                : "সাবমিট করার পর WhatsApp খুলবে অর্ডার ডিটেইলস নিয়ে — সেখানে ভেরিফিকেশন হবে। Ghostae কখনো আপনার bKash/Nagad PIN বা OTP চায় না।"}
            </p>
          </form>

          {/* ---------------- summary ---------------- */}
          <div className="space-y-3 sm:space-y-4">
            <div className="rounded-2xl border border-slate-200 dark:border-blue-900/30 bg-white/80 dark:bg-blue-950/10 p-4 sm:p-6">
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                {en ? "Order summary" : "অর্ডার সারসংক্ষেপ"}
              </h2>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-sm font-bold">
                  {product ? `${product.name} · ` : "Ghostae "}
                  {en ? item.name.en : item.name.bn}
                </span>
                <span className="text-right">
                  {couponInfo?.ok && (
                    <span className="mr-2 text-sm font-semibold text-slate-400 line-through">
                      {formatTaka(listPrice)}
                    </span>
                  )}
                  <span className="text-2xl font-extrabold tabular-nums">{formatTaka(amount)}</span>
                </span>
              </div>
              {couponInfo?.ok && (
                <p className="mt-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  {en ? "Coupon" : "কুপন"} {coupon} · −{formatTaka(couponInfo.discount)}
                </p>
              )}

              <ul className="mt-4 space-y-2 text-[11.5px] text-slate-600 dark:text-blue-200/60">
                <li>
                  {en ? "Validity" : "মেয়াদ"}: {item.validityDays === 90 ? (en ? "3 months" : "৩ মাস") : item.validityDays === 365 ? (en ? "1 year" : "১ বছর") : cycle === "monthly" ? (en ? "monthly" : "মাসিক") : en ? "yearly" : "বার্ষিক"}
                </li>
                <li>
                  {en ? "Activation devices" : "অ্যাক্টিভেশন ডিভাইস"}: {item.deviceLimit}
                </li>
                <li>
                  {en ? "AI tokens" : "AI টোকেন"}: {item.tokens.toLocaleString("en-US")}
                </li>
                <li>{en ? "Currency: BDT (৳)" : "মুদ্রা: টাকা (৳)"}</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-blue-500/20 bg-blue-500/[0.06] p-4 sm:p-5">
              <h3 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-300">
                <Info className="h-3.5 w-3.5" />
                {en ? "How delivery works" : "কীভাবে পাবেন"}
              </h3>
              <ol className="mt-2.5 space-y-1.5 text-[11.5px] leading-relaxed text-slate-600 dark:text-blue-200/60">
                <li>
                  1.{" "}
                  {en
                    ? `Send money to ${PAY_NUMBER} and submit the transaction ID.`
                    : `${PAY_NUMBER} নম্বরে টাকা পাঠিয়ে ট্রানজেকশন আইডি জমা দিন।`}
                </li>
                <li>
                  2.{" "}
                  {en
                    ? "We verify the transaction on WhatsApp (usually within minutes)."
                    : "WhatsApp-এ ট্রানজেকশন যাচাই করা হয় (সাধারণত কয়েক মিনিটে)।"}
                </li>
                <li>
                  3.{" "}
                  {en
                    ? `Once confirmed, your activation key appears on the confirmation page${product ? ` and unlocks ${product.name}` : ""}.`
                    : `নিশ্চিত হলে কনফার্মেশন পেজে অ্যাক্টিভেশন কী আসবে${product ? ` এবং ${product.name} আনলক হবে` : ""}।`}
                </li>
                <li>
                  4.{" "}
                  {en
                    ? "Sign in with the same email to see it any time in your dashboard."
                    : "একই ইমেইলে লগইন করলে ড্যাশবোর্ডে যেকোনো সময় দেখতে পাবেন।"}
                </li>
              </ol>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-blue-900/30 p-4 sm:p-5">
              <h3 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                <Smartphone className="h-3.5 w-3.5" />
                {en ? "Manual payment" : "ম্যানুয়াল পেমেন্ট"}
              </h3>
              <p className="mt-2 text-[11.5px] leading-relaxed text-slate-600 dark:text-blue-200/60">
                {en
                  ? "Prefer to send money directly? WhatsApp us at +880 1345 407572 with your plan and payment screenshot — we issue the key manually within a few hours."
                  : "সরাসরি টাকা পাঠাতে চান? WhatsApp +880 1345 407572 এ প্ল্যান ও পেমেন্ট স্ক্রিনশট পাঠান — কয়েক ঘণ্টার মধ্যে ম্যানুয়ালি কী দেওয়া হবে।"}
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
                <a
                  href="https://wa.me/8801345407572"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-slate-200 dark:border-blue-900/40 px-3 py-1.5 font-semibold"
                >
                  WhatsApp
                </a>
                <a
                  href="mailto:support@ghostae.com"
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 dark:border-blue-900/40 px-3 py-1.5 font-semibold"
                >
                  <Mail className="h-3 w-3" /> support@ghostae.com
                </a>
                <Link
                  to="/products"
                  className="rounded-full border border-slate-200 dark:border-blue-900/40 px-3 py-1.5 font-semibold"
                >
                  {en ? "All products" : "সব প্রোডাক্ট"}
                </Link>
              </div>
            </div>

            <p className="px-1 text-[10.5px] leading-relaxed text-slate-400 dark:text-blue-200/40">
              {en
                ? "Refunds: because activation keys unlock digital downloads immediately, payments are non-refundable once a key has been activated. Unactivated keys can be refunded within 7 days."
                : "রিফান্ড: অ্যাক্টিভেশন কী সাথে সাথেই ডিজিটাল ডাউনলোড আনলক করে, তাই কী অ্যাক্টিভ হয়ে গেলে পেমেন্ট ফেরতযোগ্য নয়। অ্যাক্টিভ না করা কী ৭ দিনের মধ্যে রিফান্ডযোগ্য।"}
            </p>
          </div>
        </div>
      </div>
    </GhostShell>
  );
}
