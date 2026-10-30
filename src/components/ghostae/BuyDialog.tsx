import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "@tanstack/react-router";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ArrowLeft, Check, Copy, Loader2, MessageCircle, X, Pencil, Mail, UserRound, LockKeyhole, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { useLang } from "../../lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { CATALOG, formatTaka, type Cycle, type PaidPlanId } from "../../lib/pricing-catalog";
import { createManualOrder, getPublicOffer, previewCoupon, updatePurchaseEmail } from "../../lib/checkout.functions";
import type { GhostProduct, PlanRow } from "../../lib/products-catalog";
import { purchaseContactSchema } from "../../lib/purchase-contact";
import { waLicenceLink } from "./LicenceKeyDialog";
import brandMark from "../../assets/ghostae-mark.png.asset.json";
import bkashLogo from "../../assets/pay/bkash.png.asset.json";
import nagadLogo from "../../assets/pay/nagad.png.asset.json";
import rocketLogo from "../../assets/pay/rocket.png.asset.json";
import upayLogo from "../../assets/pay/upay.png.asset.json";

const PAY_NUMBER = "01949085128";
const WA_NUMBER = "8801345407572";

const METHODS = [
  { id: "bkash", label: "bKash", name: "বিকাশ", logo: bkashLogo.url, ussd: "*247#" },
  { id: "nagad", label: "Nagad", name: "নগদ", logo: nagadLogo.url, ussd: "*167#" },
  { id: "rocket", label: "Rocket", name: "রকেট", logo: rocketLogo.url, ussd: "*322#" },
  { id: "upay", label: "Upay", name: "উপায়", logo: upayLogo.url, ussd: "*268#" },
] as const;
type Method = (typeof METHODS)[number]["id"];

export function BuyDialog({
  product,
  onClose,
  initialPlan,
  direct = Boolean(initialPlan),
  standalone = false,
}: {
  product: GhostProduct;
  onClose: () => void;
  initialPlan?: PaidPlanId;
  /** Skip the plan list and go straight to payment for `initialPlan`. */
  direct?: boolean;
  standalone?: boolean;
}) {
  useLang();
  const navigate = useNavigate();
  const dialogRef = useRef<HTMLDivElement>(null);
  const contactRef = useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (standalone) return;
    const previousOverflow = document.body.style.overflow;
    const previousPosition = document.body.style.position;
    const previousWidth = document.body.style.width;
    const scrollY = window.scrollY;
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.width = "100%";
    document.body.style.top = `-${scrollY}px`;
    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.position = previousPosition;
      document.body.style.width = previousWidth;
      document.body.style.top = "";
      window.scrollTo(0, scrollY);
    };
  }, [standalone]);
  // Checkout copy stays in Bengali for every visitor — only numbers are latin.
  const rows: PlanRow[] = product.planTable ?? [];

  const [cycle] = useState<Cycle>("monthly");
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(direct ? 2 : 1);
  const [plan, setPlan] = useState<PaidPlanId>(initialPlan ?? "light");
  const [contact, setContact] = useState("");
  const [contactError, setContactError] = useState(false);
  const [coupon, setCoupon] = useState("");
  const [checking, setChecking] = useState(false);
  const [couponInfo, setCouponInfo] = useState<
    null | { ok: true; discount: number; amount: number } | { ok: false; reason: string }
  >(null);
  const [method, setMethod] = useState<Method>("bkash");
  const [trxId, setTrxId] = useState("");
  const [accName, setAccName] = useState("");
  const [accPass, setAccPass] = useState("");
  const [accNotice, setAccNotice] = useState("");
  const [orderId, setOrderId] = useState('');
  const [editingEmail, setEditingEmail] = useState(false);
  const [emailDraft, setEmailDraft] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [reference, setReference] = useState("");
  const [freeMode, setFreeMode] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [publicOffer, setPublicOffer] = useState<null | { discount: number; amount: number }>(null);
  const [tablePrices, setTablePrices] = useState<Record<string, number>>({});

  useEffect(() => { dialogRef.current?.scrollTo({ top: 0 }); }, [step]);
  useEffect(() => {
    if (!contactError) return;
    contactRef.current?.focus({ preventScroll: true });
    dialogRef.current?.querySelector('#payment-contact-error')?.scrollIntoView({ block: 'center' });
  }, [contactError]);

  const start = useServerFn(createManualOrder);
  const editPurchaseEmail = useServerFn(updatePurchaseEmail);
  const checkCoupon = useServerFn(previewCoupon);
  const fetchPublicOffer = useServerFn(getPublicOffer);

  const item = CATALOG[plan];
  const listPrice = item.price[cycle];
  const amount = freeMode
    ? 0
    : couponInfo?.ok
      ? Math.min(couponInfo.amount, publicOffer?.amount ?? listPrice)
      : publicOffer?.amount ?? listPrice;
  const active = METHODS.find((m) => m.id === method) ?? METHODS[0];

  useEffect(() => {
    if (step !== 1) return;
    let active = true;
    void Promise.all(rows.filter(row => row.id in CATALOG).map(async row => {
      const price = await fetchPublicOffer({ data: { plan: row.id, cycle } });
      return [row.id, price.amount] as const;
    })).then(prices => { if (active) setTablePrices(Object.fromEntries(prices)); }).catch(() => {});
    return () => { active = false; };
  }, [step, product, cycle, fetchPublicOffer]);

  useEffect(() => {
    const previousFocus = document.activeElement;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (showInvoice) setShowInvoice(false);
        else onClose();
      }
      if (event.key !== "Tab") return;
      const elements = dialogRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled)');
      if (!elements?.length) return;
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    dialogRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      if (previousFocus instanceof HTMLElement) previousFocus.focus({ preventScroll: true });
    };
  }, [onClose, showInvoice, mounted]);

  useEffect(() => {
    let activeRequest = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    setPublicOffer(null);
    const refresh = () => void fetchPublicOffer({ data: { plan, cycle } })
      .then((offer) => {
        if (!activeRequest) return;
        setPublicOffer({ discount: offer.discount, amount: offer.amount });
        if (offer.schedule) timer = setTimeout(() => { setCouponInfo(null); refresh(); }, Math.max(1000, offer.schedule.nextIncreaseAt - offer.schedule.serverNow));
      })
      .catch(() => {
        if (activeRequest) setPublicOffer(null);
      });
    refresh();
    return () => {
      activeRequest = false;
      clearTimeout(timer);
    };
  }, [cycle, fetchPublicOffer, plan]);

  const applyCoupon = async () => {
    setChecking(true);
    try {
      const res = await checkCoupon({ data: { plan, cycle, coupon } });
      setCouponInfo(res.ok ? { ok: true, discount: res.discount, amount: res.amount } : { ok: false, reason: res.reason });
    } catch (err) {
      setCouponInfo({ ok: false, reason: err instanceof Error ? err.message : "কুপন যাচাই হয়নি।" });
    } finally {
      setChecking(false);
    }
  };

  const waMessage = (ref: string) =>
    `Ghostae order ${ref}\n` +
    `Product: ${product.name}\n` +
    `Plan: ${item.name.en} (${cycle})\n` +
    `Amount: ${formatTaka(amount)}\n` +
    `Method: ${method} · TrxID: ${trxId}\n` +
    `Contact: ${contact}`;

  const copyText = async (value: string, okMsg: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(okMsg);
    } catch {
      toast.error("কপি করা যায়নি");
    }
  };

  const contactValid = () => {
    if (!purchaseContactSchema.safeParse(contact).success) {
      setContactError(true);
      contactRef.current?.focus({ preventScroll: true });
      dialogRef.current?.querySelector('#payment-contact-error')?.scrollIntoView({ block: 'center' });
      return false;
    }
    setContactError(false);
    return true;
  };

  const goPay = () => {
    if (!contactValid()) return;
    if (freeMode) {
      setReference(`FREE-${Date.now().toString(36).toUpperCase()}`);
      setStep(3);
      return;
    }
    setStep(4);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trxId.trim()) {
      toast.error("ট্রান্সজেকশন আইডি দিন");
      return;
    }
    const isEmail = contact.includes("@");
    const digits = contact.replace(/\D/g, "");
    setBusy(true);
    try {
      const result = await start({
        data: {
          plan,
          cycle,
          name: isEmail ? contact.split("@")[0].slice(0, 80) || "Ghostae user" : `Ghostae ${digits.slice(-4)}`,
          email: isEmail ? contact.trim() : `${digits}@wa.ghostae.app`,
          phone: isEmail ? "" : contact.trim(),
          method,
          trxId,
          coupon: couponInfo?.ok ? coupon : "",
        },
      });
      setOrderId(result.orderId);
      if (isEmail) {
        sessionStorage.setItem('ghostae-purchase-email', contact.trim().toLowerCase());
        localStorage.setItem('ghostae-purchase-guide', JSON.stringify({ orderId: result.orderId, email: contact.trim().toLowerCase(), product: product.slug }));
        setAccName(contact.split("@")[0].slice(0, 80)); setStep(5); return;
      }
      await navigate({ to: '/dashboard' });
    } catch (err) {
      toast.error("অর্ডার পাঠানো যায়নি", {
        description: err instanceof Error ? err.message : "আবার চেষ্টা করুন।",
      });
    } finally {
      setBusy(false);
    }
  };

  const createAccount = async (e: React.FormEvent) => {
    e.preventDefault(); setAccNotice("");
    if (accName.trim().length < 2) { toast.error("আপনার নাম দিন"); return; }
    if (accPass.length < 8) { toast.error("অন্তত ৮ অক্ষরের পাসওয়ার্ড দিন"); return; }
    const email = contact.trim().toLowerCase();
    setBusy(true);
    try {
      const signedOut = await supabase.auth.signOut({ scope: 'local' });
      if (signedOut.error) throw signedOut.error;
      const { data, error } = await supabase.auth.signUp({ email, password: accPass, options: { emailRedirectTo: `${window.location.origin}/auth`, data: { display_name: accName.trim().slice(0, 80) } } });
      if (!error && data.session) {
        const identity = await supabase.auth.getUser();
        if (identity.data.user?.email?.toLowerCase() === email) { sessionStorage.removeItem('ghostae-purchase-email'); await navigate({ to: '/dashboard' }); return; }
      }
      if (error || !data.session) {
        const signIn = await supabase.auth.signInWithPassword({ email, password: accPass });
        if (!signIn.error) {
          const identity = await supabase.auth.getUser();
          if (identity.data.user?.email?.toLowerCase() === email) { sessionStorage.removeItem('ghostae-purchase-email'); await navigate({ to: '/dashboard' }); return; }
        }
      }
      setAccNotice(error ? "এই ইমেইলে আগে অ্যাকাউন্ট থাকতে পারে। Login করে আপনার পণ্য দেখুন।" : "ইমেইলে পাঠানো যাচাই লিংক খুলুন, তারপর Login করলেই পণ্য দেখবেন।");
    } catch { setAccNotice('অ্যাকাউন্টে প্রবেশ করা যায়নি। আবার চেষ্টা করুন অথবা সহায়তা নিন।'); }
    finally { setBusy(false); }
  };

  const saveEmail = async () => {
    setBusy(true); setAccNotice('');
    try {
      const result = await editPurchaseEmail({ data: { orderId, email: emailDraft } });
      setContact(result.email); setEditingEmail(false);
      sessionStorage.setItem('ghostae-purchase-email', result.email);
      localStorage.setItem('ghostae-purchase-guide', JSON.stringify({ orderId, email: result.email, product: product.slug }));
    } catch (error) { setAccNotice(error instanceof Error ? error.message : 'ইমেইল বদলানো যায়নি।'); }
    finally { setBusy(false); }
  };

  if (!mounted) return null;

  const content = (
    <div className={standalone ? "mx-auto flex w-full max-w-xl justify-center" : "payment-overlay fixed inset-0 z-[2147483600] flex items-center justify-center overflow-hidden overscroll-contain p-3 sm:p-6"} onWheel={(event) => { if (!standalone) event.stopPropagation(); }}>
      <div ref={dialogRef} role={standalone ? "region" : "dialog"} aria-modal={standalone ? undefined : true} aria-labelledby="payment-title" tabIndex={-1} className={`payment-dialog relative w-full max-w-xl rounded-lg border border-border bg-surface px-4 pb-5 pt-4 text-foreground outline-none sm:px-7 sm:pb-7 ${standalone ? "" : "max-h-[calc(100dvh-1.5rem)] overflow-y-auto overscroll-contain sm:max-h-[calc(100dvh-3rem)]"}`}>
        <div className="flex items-center justify-between gap-3">
          <Button type="button" variant="ghost" size="icon" aria-label="পিছনে" className="text-muted-fg" onClick={() => {
            if (step === 4) setStep(2);
            else if (step === 2 && !direct) setStep(1);
            else onClose();
          }}><ArrowLeft /></Button>
          <span className="text-sm text-muted-fg">{step === 1 ? "প্ল্যান নির্বাচন" : step === 2 ? "পেমেন্ট মাধ্যম" : step === 4 ? "টাকা পাঠান" : step === 5 ? "অ্যাকাউন্ট তৈরি" : "অর্ডার জমা হয়েছে"}</span>
          <Button type="button" variant="ghost" size="icon" aria-label="বন্ধ করুন" onClick={onClose} className="text-muted-fg"><X /></Button>
        </div>

        <div className="flex items-center gap-3 border-b border-border py-5">
          <img src={brandMark.url} alt="Ghostae" width={48} height={48} className="payment-logo size-12 rounded-lg object-contain p-1" />
          <div className="min-w-0 flex-1">
            <h2 id="payment-title" className="text-xl font-medium leading-8">Ghostae</h2>
            <p className="text-xs text-muted-fg">{product.name} · {freeMode ? "Free" : item.name.en}</p>
          </div>
          {step === 2 && <Button type="button" variant="outline" className="h-11 border-border bg-surface px-3 font-light text-foreground" onClick={() => setShowInvoice(true)}>বিস্তারিত দেখুন</Button>}
        </div>

        {step === 1 && <div className="divide-y divide-border">
          {rows.map((row) => <div key={row.id} className="flex flex-wrap items-center justify-between gap-4 py-5">
            <div><h3 className="font-medium">{row.label}</h3><div className="mt-1 text-sm text-muted-fg">{row.details.map((detail) => <p key={detail.en}>{detail.bn}</p>)}</div></div>
            <div className="flex items-center gap-3"><span className="text-sm">{row.id === 'free' ? row.price : tablePrices[row.id] !== undefined ? formatTaka(tablePrices[row.id]) : '…'}</span>
              <Button type="button" className="bg-primary-hover text-media-foreground" onClick={() => {
                setFreeMode(row.id === "free");
                if (row.id !== "free") setPlan(row.id as PaidPlanId);
                setCouponInfo(null); setStep(2);
              }}>{row.id === "free" ? "ফ্রি কী নিন" : "কিনুন"}</Button>
            </div>
          </div>)}
        </div>}

        {step === 2 && <div className="pt-5">
          <h3 className="mb-5 flex h-14 items-center justify-center rounded-md bg-primary-hover text-lg font-light text-media-foreground">মোবাইল ব্যাংকিং</h3>
          {contactError && <p id="payment-contact-error" role="alert" className="mb-3 rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm leading-6 text-danger">সঠিক ইমেইল বা মোবাইল নম্বর দিন</p>}
          <div className={`grid gap-3 ${freeMode ? "grid-cols-1" : "grid-cols-2"}`}>
            <div className="min-w-0">
              <label htmlFor="payment-contact" className="mb-2 block text-sm text-muted-fg">ইমেইল / মোবাইল</label>
              <input ref={contactRef} id="payment-contact" autoComplete="email" maxLength={200} aria-invalid={contactError} aria-describedby={contactError ? "payment-contact-error" : undefined} className={`payment-input h-12 w-full min-w-0 rounded-md border bg-background px-3 text-base outline-none ${contactError ? "border-danger focus:border-danger focus:ring-2 focus:ring-danger/15" : "border-border focus:border-primary"}`} value={contact} onChange={(e) => { setContact(e.target.value); if (contactError && purchaseContactSchema.safeParse(e.target.value).success) setContactError(false); }} placeholder="ইমেইল বা মোবাইল" />
            </div>
            {!freeMode && <div className="min-w-0">
              <label htmlFor="payment-coupon" className="mb-2 block text-sm text-muted-fg">কুপন</label>
              <div className="flex min-w-0 flex-col gap-2 sm:flex-row">
                <input id="payment-coupon" className="payment-input h-12 w-full min-w-0 rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary" value={coupon} onChange={(e) => { setCoupon(e.target.value.toUpperCase()); setCouponInfo(null); }} placeholder="কুপন" />
                <Button type="button" variant="outline" className="h-12 shrink-0 border-border bg-surface px-3 font-normal text-foreground" onClick={applyCoupon} disabled={!coupon.trim() || checking}>{checking ? <Loader2 className="animate-spin" /> : "প্রয়োগ"}</Button>
              </div>
            </div>}
          </div>
          {couponInfo && <p role="status" className={`mt-3 text-sm ${couponInfo.ok ? "text-success" : "text-danger"}`}>{couponInfo.ok ? `কুপন প্রয়োগ হয়েছে · সাশ্রয় ${formatTaka(couponInfo.discount)}` : couponInfo.reason}</p>}

          {!freeMode && <TooltipProvider delayDuration={900} skipDelayDuration={0}>
            <div className="mt-6 grid grid-cols-2 gap-3" role="group" aria-label="পেমেন্ট মাধ্যম নির্বাচন">
              {METHODS.map((m) => <Tooltip key={m.id}>
                <TooltipTrigger asChild>
                  <Button type="button" variant="outline" aria-label={m.name} aria-pressed={method === m.id} onClick={() => setMethod(m.id)} className={`payment-method relative flex h-28 w-full flex-col gap-1 rounded-lg border-2 p-3 sm:h-32 ${method === m.id ? "border-primary ring-2 ring-primary/15" : "border-border"}`}>
                    <img alt={m.label} src={m.logo} width={120} height={56} className="h-14 w-full object-contain" />
                    {method === m.id && <Check className="payment-method-check absolute right-2 top-2" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="payment-tooltip z-[2147483647] bg-media-surface text-media-foreground" side="top">{m.name} অ্যাপ / {m.ussd} · Send Money</TooltipContent>
              </Tooltip>)}
            </div>
          </TooltipProvider>}
          <Button type="button" onClick={goPay} disabled={!freeMode && !publicOffer} className="mt-6 h-14 w-full bg-primary-hover px-2 text-base font-normal text-media-foreground hover:bg-primary">{freeMode ? "চালিয়ে যান · ৳০" : publicOffer ? `পেমেন্ট সম্পূর্ণ করুন · ${formatTaka(amount)}` : 'দাম যাচাই হচ্ছে…'}</Button>
        </div>}

        {step === 4 && <form onSubmit={submit} className="pt-5">
          <div className="grid grid-cols-[56px_minmax(0,1fr)_auto] items-center gap-2 border-b border-border pb-5 sm:grid-cols-[80px_minmax(0,1fr)_auto] sm:gap-4">
            <img alt={active.label} src={active.logo} width={80} height={48} className="payment-logo h-12 w-full rounded-md object-contain p-1" />
            <div className="min-w-0 text-center"><p className="text-xs text-muted-fg">প্রাপক নম্বর</p>
              <Button type="button" variant="ghost" onClick={() => copyText(PAY_NUMBER, "নম্বর কপি হয়েছে")} aria-label="প্রাপক নম্বর কপি করুন" className="h-9 gap-1 px-0 font-sans text-base font-semibold text-foreground sm:text-xl">{PAY_NUMBER}<Copy className="size-3.5" /></Button>
            </div>
            <div className="text-right"><p className="text-xs text-muted-fg">পরিমাণ</p><p className="whitespace-nowrap text-lg font-medium leading-9 sm:text-xl">{formatTaka(amount)}</p></div>
          </div>

          <div className="payment-instructions mt-5 rounded-lg px-3 py-4 sm:px-5">
            <h3 className="mb-2 text-base font-normal">পেমেন্টের নির্দেশনা</h3>
            <ol className="divide-y divide-media-foreground/15">
              {[`${active.name} অ্যাপ খুলুন / ${active.ussd}`, "Send Money বেছে নিন", `${PAY_NUMBER} নম্বরে টাকা পাঠান`, `পরিমাণ দিন: ${formatTaka(amount)}`, "ট্রান্সজেকশন আইডি কপি করুন"].map((text, index) => <li key={index} className="flex min-h-11 items-center gap-3 py-2">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-media-foreground/30 text-xs">{index + 1}</span>
                <span className="whitespace-nowrap text-sm font-normal leading-6">{text}</span>
              </li>)}
            </ol>
          </div>

          <div className="mt-6">
            <label htmlFor="payment-trx" className="mb-2 block text-base font-normal">ট্রান্সজেকশন আইডি দিন</label>
            <input id="payment-trx" type="text" autoComplete="off" required minLength={4} maxLength={40} pattern="[A-Za-z0-9._\-]+" value={trxId} onChange={(e) => setTrxId(e.target.value.toUpperCase())} placeholder="ট্রান্সজেকশন আইডি" className="payment-input h-14 w-full rounded-md border border-border bg-background px-4 text-base outline-none focus:border-primary" />
          </div>
          <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto] gap-2">
            <Button type="submit" disabled={busy} className="h-12 bg-primary-hover px-2 text-sm font-normal text-media-foreground hover:bg-primary">{busy ? <Loader2 className="animate-spin" /> : <Check />}{busy ? "অর্ডার পাঠানো হচ্ছে…" : "ট্রান্সজেকশন যাচাই করুন"}</Button>
            <Button asChild variant="outline" className="h-12 border-border bg-surface px-3 font-normal text-foreground"><a href={`https://wa.me/${WA_NUMBER}`} target="_blank" rel="noreferrer" aria-label="পেমেন্ট সহায়তা"><MessageCircle /><span className="text-sm">সহায়তা</span></a></Button>
          </div>
          <div className="mt-4 flex justify-center gap-5 text-xs text-muted-fg">
            <Link to="/terms" className="underline underline-offset-4">পেমেন্টের শর্ত</Link>
            <Link to="/refund" className="underline underline-offset-4">রিফান্ড নীতি</Link>
          </div>
        </form>}

        {step === 5 && <form onSubmit={createAccount} className="space-y-6 pt-6">
          <div className="flex min-h-16 items-center gap-3 border-b border-border pb-5">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><Mail className="size-5" /></span>
            <div className="min-w-0 flex-1"><p className="mb-1 text-xs text-muted-fg">আপনার অ্যাকাউন্টের ইমেইল</p>{editingEmail ? <input aria-label="নতুন ইমেইল" type="email" maxLength={200} value={emailDraft} onChange={event => setEmailDraft(event.target.value)} className="payment-input h-12 w-full rounded-md border border-border bg-background px-3 text-base outline-none focus:border-primary" /> : <p className="break-all text-base font-medium">{contact.trim()}</p>}</div>
            <Button type="button" variant="ghost" size="icon" disabled={busy} aria-label={editingEmail ? 'ইমেইল সেভ করুন' : 'ইমেইল সম্পাদনা করুন'} title={editingEmail ? 'ইমেইল সেভ করুন' : 'ইমেইল সম্পাদনা করুন'} onClick={() => { if (editingEmail) void saveEmail(); else { setEmailDraft(contact.trim()); setEditingEmail(true); } }}>{editingEmail ? <Check /> : <Pencil className="size-4" />}</Button>
            {editingEmail && <Button type="button" variant="ghost" size="icon" aria-label="ইমেইল সম্পাদনা বাতিল" disabled={busy} onClick={() => setEditingEmail(false)}><X className="size-4" /></Button>}
          </div>
          <div><div className="mb-3 flex items-center gap-2 text-sm text-success"><ShieldCheck className="size-5" />অর্ডার জমা হয়েছে</div><h3 className="text-2xl font-medium leading-9">আপনার অ্যাকাউন্ট তৈরি করুন</h3></div>
          <label className="block text-base" htmlFor="acc-name">আপনার নাম<div className="relative mt-3"><UserRound className="pointer-events-none absolute left-4 top-5 size-5 text-primary" /><input id="acc-name" required maxLength={80} autoComplete="name" value={accName} onChange={(e) => setAccName(e.target.value)} placeholder="আপনার পুরো নাম" className="payment-input h-16 w-full rounded-lg border border-border bg-background pl-12 pr-4 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" /></div></label>
          <label className="block text-base" htmlFor="acc-pass">পাসওয়ার্ড তৈরি করুন<div className="relative mt-3"><LockKeyhole className="pointer-events-none absolute left-4 top-5 size-5 text-primary" /><input id="acc-pass" type={showPassword ? 'text' : 'password'} required minLength={8} maxLength={200} autoComplete="new-password" value={accPass} onChange={(e) => setAccPass(e.target.value)} placeholder="অন্তত ৮ অক্ষরের পাসওয়ার্ড তৈরি করুন" className="payment-input h-16 w-full rounded-lg border border-border bg-background pl-12 pr-12 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 sm:text-base" /><Button type="button" variant="ghost" size="icon" className="absolute right-2 top-3" aria-label={showPassword ? 'পাসওয়ার্ড লুকান' : 'পাসওয়ার্ড দেখুন'} onClick={() => setShowPassword(value => !value)}>{showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</Button></div></label>
          {accNotice && <p role="status" className="rounded-md border border-primary/20 bg-primary/5 p-3 text-sm leading-7">{accNotice} <Link to="/auth" className="text-primary underline">Login</Link></p>}
          <Button type="submit" disabled={busy || editingEmail} className="min-h-16 w-full whitespace-normal bg-primary-hover px-4 py-3 text-base font-normal leading-7 text-media-foreground hover:bg-primary">{busy ? <Loader2 className="shrink-0 animate-spin" /> : <ShieldCheck className="shrink-0" />}{busy ? 'অ্যাকাউন্ট যাচাই হচ্ছে…' : 'অ্যাকাউন্ট তৈরি করুন ও লাইসেন্স দেখুন'}</Button>
        </form>}

        {step === 3 && <div className="pb-2 pt-6 text-center">
          <Check className="mx-auto size-10 text-success" />
          <h3 className="mt-3 text-lg font-medium">অর্ডার জমা হয়েছে</h3>
          <p className="mt-2 text-sm leading-7 text-muted-fg">অর্ডার নম্বর {reference}<br />পেমেন্ট যাচাইয়ের পর লাইসেন্স প্রস্তুত হবে।</p>
          {freeMode && product.downloadHref && <Button asChild className="mt-4 h-12 w-full bg-primary-hover text-media-foreground"><a href={product.downloadHref}>ডাউনলোড</a></Button>}
          <Button asChild className="mt-4 h-12 w-full bg-primary-hover text-media-foreground"><a href={freeMode ? waLicenceLink(product.name, "free", contact, reference) : `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(waMessage(reference))}`} target="_blank" rel="noreferrer"><MessageCircle />Support-এ যোগাযোগ করুন</a></Button>
          {!freeMode && <Button asChild variant="outline" className="mt-3 h-12 w-full border-border bg-surface text-foreground"><a href={`/order-confirmation?invoice_id=${encodeURIComponent(reference)}`}>অর্ডারের অবস্থা দেখুন</a></Button>}
          <p className="mt-4 text-xs leading-6 text-muted-fg">পেমেন্ট যাচাই হলে লাইসেন্স কী ইমেইল/WhatsApp-এ পাঠানো হবে।</p>
        </div>}

        {showInvoice && <div className="payment-overlay absolute inset-0 z-10 flex items-center justify-center rounded-lg p-4" onClick={() => setShowInvoice(false)}>
          <div className="w-full rounded-lg border border-border bg-surface p-5" onClick={(e) => e.stopPropagation()} role="region" aria-label="অর্ডারের বিবরণ">
            <div className="mb-4 flex items-center justify-between"><h3 className="text-lg font-normal">অর্ডারের বিবরণ</h3><Button type="button" variant="ghost" size="icon" aria-label="বিবরণ বন্ধ করুন" onClick={() => setShowInvoice(false)}><X /></Button></div>
            <dl className="divide-y divide-border text-sm">
              {[["পণ্য", product.name], ["প্ল্যান", freeMode ? "Free" : item.name.en], ["পরিমাণ", formatTaka(amount)], ["যোগাযোগ", contact || "—"]].map(([label, value]) => <div key={label} className="flex justify-between gap-4 py-3"><dt className="shrink-0 text-muted-fg">{label}</dt><dd className="min-w-0 break-words text-right">{value}</dd></div>)}
            </dl>
          </div>
        </div>}
      </div>
    </div>
  );
  return standalone ? content : createPortal(content, document.body);
}
