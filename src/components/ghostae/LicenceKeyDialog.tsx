import { useEffect, useState } from "react";
import { KeyRound, MessageCircle } from "lucide-react";

const WA_NUMBER = "8801345407572";
const WA_GROUP = "https://chat.whatsapp.com/BdoH5Xpn4iFEGEbn4j5WLf";

export type LicencePlan = "free" | "light" | "pro";

const PLAN_LABEL: Record<LicencePlan, string> = { free: "Free", light: "Light", pro: "Pro" };

export function waLicenceLink(product: string, plan: LicencePlan, contact = "", reference = "") {
  const text =
    `Ghostae — লাইসেন্স কী প্রয়োজন\n` +
    `Product: ${product}\n` +
    `Plan: ${PLAN_LABEL[plan]}\n` +
    (reference ? `Order: ${reference}\n` : "") +
    (contact ? `Contact: ${contact}\n` : "") +
    `আমি ${PLAN_LABEL[plan]} লাইসেন্স কী নিতে চাই।`;
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;
}

const CSS = `
.lk-card{font-family:'Hind Siliguri',system-ui,sans-serif}
.lk-wa-card{background:linear-gradient(135deg,#b8eed6 0%,#aae4d8 45%,#bde4fc 100%);border:1.5px solid rgba(16,185,129,.45);box-shadow:0 8px 20px -4px rgba(16,185,129,.18)}
.lk-wa-badge{background:linear-gradient(145deg,#10b981 0%,#059669 100%);box-shadow:0 10px 20px -3px rgba(16,185,129,.4),inset 0 1.5px 2px rgba(255,255,255,.45)}
.lk-wa-btn{background:#14532d;box-shadow:0 4px 14px -2px rgba(20,83,45,.35)}
.lk-wa-btn:hover{background:#0f3f22}
`;

/** Shown right after a download starts: hand over the activation key. */
export function LicenceKeyDialog({
  product,
  plan = "free",
  guideHref,
  onClose,
}: {
  product: string;
  plan?: LicencePlan;
  guideHref?: string;
  onClose: () => void;
}) {
  const [autoOn, setAutoOn] = useState(false);
  const [issuing, setIssuing] = useState(false);
  const [autoKey, setAutoKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [issued, setIssued] = useState(false);

  useEffect(() => {
    fetch("/api/public/v1/license/auto")
      .then((r) => r.json())
      .then((d) => setAutoOn(Boolean(d?.enabled)))
      .catch(() => setAutoOn(false));
  }, []);

  useEffect(() => {
    if (plan === "free") void issueKey();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan]);

  const issueKey = async () => {
    setIssuing(true);
    setIssued(true);
    try {
      const res = await fetch("/api/public/v1/license/auto", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ product, plan }),
      });
      const d = await res.json();
      if (d?.license?.license_key) setAutoKey(d.license.license_key as string);
      else setAutoOn(false);
    } catch {
      setAutoOn(false);
    }
    setIssuing(false);
  };

  const copy = () => {
    if (!autoKey) return;
    navigator.clipboard?.writeText(autoKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  return (
    <div
      className="tx-raw fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div
        className="lk-card relative w-full max-w-lg rounded-3xl bg-white p-6 text-slate-800 shadow-2xl sm:p-7"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="বন্ধ করুন"
          className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="space-y-1 pr-8">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">আপনার লাইসেন্স কী</h2>
          <p className="text-sm leading-normal text-slate-500">
            নিচের কোডটি কপি করে এক্সটেনশনে পেস্ট করুন।
          </p>
        </div>

        <div className="mt-5">
          {autoKey ? (
            <>
              <div
                onClick={copy}
                title="কপি করতে ক্লিক করুন"
                className="group relative flex cursor-pointer items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-2 pl-4 transition hover:border-slate-300 hover:bg-slate-100/90"
              >
                <input
                  type="text"
                  readOnly
                  value={autoKey}
                  className="w-full cursor-pointer select-all bg-transparent font-mono text-base font-bold tracking-wide text-slate-800 outline-none sm:text-lg"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    copy();
                  }}
                  className={`flex shrink-0 items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-medium !text-white shadow-sm transition ${copied ? "bg-emerald-600" : "bg-slate-900 hover:bg-black"}`}
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  <span>{copied ? "হয়েছে!" : "কপি"}</span>
                </button>
              </div>
              <div
                className={`mt-1.5 flex h-4 items-center px-1 text-xs font-semibold text-emerald-600 transition-opacity duration-150 ${copied ? "opacity-100" : "opacity-0"}`}
              >
                ✓ কোডটি ক্লিপবোর্ডে কপি হয়েছে
              </div>
            </>
          ) : (
            <button
              type="button"
              onClick={issueKey}
              disabled={issuing}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3.5 text-sm font-semibold !text-white transition hover:bg-black disabled:opacity-60"
            >
              <KeyRound className="h-4 w-4" />
              {issuing ? "কী তৈরি হচ্ছে…" : "লাইসেন্স কী জেনারেট করুন"}
            </button>
          )}
        </div>

        {!autoKey && !autoOn && issued && (
          <a
            href={waLicenceLink(product, plan)}
            target="_blank"
            rel="noreferrer"
            className="mt-2.5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3.5 text-sm font-semibold !text-white transition hover:bg-emerald-500"
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp-এ কী চান
          </a>
        )}

        {/* কমিউনিটি কার্ড */}
        <div className="lk-wa-card relative mt-5 overflow-hidden rounded-2xl p-4 transition-all duration-200 sm:p-5">
          <div className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 rounded-full bg-cyan-600/35 blur-[2.5px]" />
          <div className="relative flex items-center gap-4">
            <div className="lk-wa-badge flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl !text-white shadow-md sm:h-16 sm:w-16">
              <svg className="h-10 w-10 fill-current sm:h-11 sm:w-11" viewBox="0 0 24 24">
                <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.062-2.12-.524-1.742-.716-2.87-2.484-2.957-2.6-.087-.116-.708-.941-.708-1.792s.448-1.272.607-1.446c.159-.175.347-.218.462-.218.116 0 .232.001.332.006.106.005.249-.04.39.298.144.347.491 1.2.534 1.288.043.088.072.19.014.305-.058.116-.087.188-.173.289-.087.101-.183.226-.261.304-.087.087-.177.182-.076.355.101.174.449.741.964 1.2 1.018.907 1.488.948 1.701 1.037.213.088.337.073.463-.073.125-.145.534-.622.678-.839.144-.217.289-.174.491-.101.202.073 1.284.606 1.505.717.221.111.368.17.422.261.054.092.054.536-.09 1.341z" />
              </svg>
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <div>
                <h3 className="text-base font-bold leading-tight text-slate-800 sm:text-lg">
                  কমিউনিটিতে যোগ দিন
                </h3>
                <p className="mt-0.5 text-xs leading-snug text-slate-600 sm:text-sm">
                  নতুন আপডেট ও দ্রুত সাপোর্টের জন্য যুক্ত থাকুন।
                </p>
              </div>
              <a
                href={WA_GROUP}
                target="_blank"
                rel="noopener noreferrer"
                className="lk-wa-btn inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-normal !text-white transition-all duration-150 active:scale-95 sm:text-sm"
              >
                <span>গ্রুপে যুক্ত হন</span>
                <svg className="h-3.5 w-3.5 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        {guideHref && (
          <a
            href={guideHref}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex w-full items-center justify-center rounded-2xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-900"
          >
            ইনস্টলেশন গাইড দেখুন
          </a>
        )}
      </div>
    </div>
  );
}
