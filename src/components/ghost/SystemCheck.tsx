import { useEffect, useState } from "react";
import { useT } from "../../lib/i18n";

type Check = { label: string; status: "ok" | "warn" | "unknown"; detail: string };

export function SystemCheck() {
  const t = useT();
  const [checks, setChecks] = useState<Check[] | null>(null);

  useEffect(() => {
    const ua = navigator.userAgent;
    const platform =
      (navigator as unknown as { userAgentData?: { platform?: string } })
        .userAgentData?.platform || "";
    let os: "windows" | "mac" | "linux" | "other" = "other";
    if (/Win/i.test(platform) || /Windows/i.test(ua)) {
      os = "windows";
    } else if (/Mac/i.test(platform) || /Mac OS X/i.test(ua)) {
      os = "mac";
    } else if (/Linux/i.test(platform) || /Linux/i.test(ua)) {
      os = "linux";
    }

    const result: Check[] = [
      {
        label: t("sys_label_os"),
        status: os === "windows" || os === "mac" ? "ok" : "warn",
        detail:
          os === "windows"
            ? t("sys_os_win")
            : os === "mac"
              ? t("sys_os_mac")
              : t("sys_os_other"),
      },
      {
        label: t("sys_label_dl"),
        status: typeof window !== "undefined" && "URL" in window ? "ok" : "warn",
        detail: t("sys_dl_detail"),
      },
      {
        label: t("sys_label_ae"),
        status: "unknown",
        detail: t("sys_ae_detail"),
      },
      {
        label: t("sys_label_speech"),
        status:
          typeof window !== "undefined" &&
          ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)
            ? "ok"
            : "warn",
        detail:
          typeof window !== "undefined" &&
          ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)
            ? t("sys_speech_ok")
            : t("sys_speech_warn"),
      },
    ];
    setChecks(result);
  }, [t]);

  if (!checks) return null;

  return (
    <div className="flex h-full flex-col rounded-xl bg-slate-950 p-5 text-slate-100 sm:p-6">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 border-b border-slate-800 pb-4">
        <div className="min-w-0">
          <div className="text-[9px] font-bold uppercase tracking-[0.18em] text-blue-400 sm:text-[10px]">
            {t("sys_eyebrow")}
          </div>
          <div className="mt-1 text-[14px] font-semibold text-slate-100 sm:text-base">
            {allOk(checks) ? t("sys_ready") : t("sys_mostly_ready")}
          </div>
        </div>
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-blue-500/15 text-sm font-bold text-blue-300">
          {allOk(checks) ? "✓" : "!"}
        </span>
      </div>
      <ul className="mt-4 grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
        {checks.map((c) => (
          <li key={c.label} className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-2.5">
            <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${c.status === "unknown" ? "bg-slate-500" : "bg-blue-400"}`} />
            <div className="min-w-0">
              <div className="text-[11px] font-medium text-slate-100 sm:text-xs">{c.label}</div>
              <div className="mt-0.5 text-[9px] leading-snug text-slate-400 sm:text-[10px]">{c.detail}</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function allOk(checks: Check[]) {
  return checks.every((c) => c.status === "ok" || c.status === "unknown");
}
