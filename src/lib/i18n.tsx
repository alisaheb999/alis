import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type Lang =
  | "en"
  | "hi"
  | "es"
  | "pt"
  | "id"
  | "ru"
  | "ar"
  | "fr"
  | "de"
  | "ja"
  | "bn";

/**
 * Locale catalogue ordered by the markets where After Effects / motion-design
 * work is most concentrated — this order drives the language switcher and the
 * regions we plan paid campaigns for. English stays the default.
 */
export const LOCALES: {
  code: Lang;
  label: string;
  english: string;
  region: string;
  dir?: "rtl";
}[] = [
  { code: "en", label: "English", english: "English", region: "US · UK · CA · AU" },
  { code: "hi", label: "हिन्दी", english: "Hindi", region: "India" },
  { code: "es", label: "Español", english: "Spanish", region: "Mexico · Spain · LATAM" },
  { code: "pt", label: "Português", english: "Portuguese", region: "Brazil · Portugal" },
  { code: "id", label: "Bahasa Indonesia", english: "Indonesian", region: "Indonesia" },
  { code: "ru", label: "Русский", english: "Russian", region: "Russia · CIS" },
  { code: "ar", label: "العربية", english: "Arabic", region: "UAE · Saudi Arabia · Egypt", dir: "rtl" },
  { code: "fr", label: "Français", english: "French", region: "France · Canada" },
  { code: "de", label: "Deutsch", english: "German", region: "Germany · Austria" },
  { code: "ja", label: "日本語", english: "Japanese", region: "Japan" },
  { code: "bn", label: "বাংলা", english: "Bengali", region: "Bangladesh" },
];
type Dict = Record<string, { en: string; bn: string; [key: string]: string }>;

export const STRINGS = {
  // Header / nav
  nav_home: { en: "Home", bn: "হোম" },
  nav_products: { en: "Products", bn: "প্রোডাক্ট" },

  nav_changelog: { en: "Changelog", bn: "চেঞ্জলগ" },
  nav_download: { en: "Download", bn: "ডাউনলোড" },
  nav_docs: { en: "Docs", bn: "ডকুমেন্টেশন" },

  
  nav_showcase: { en: "Showcase", bn: "শোকেস" },
  nav_security: { en: "Security", bn: "সিকিউরিটি" },
  nav_pricing: { en: "Pricing", bn: "প্রাইসিং" },
  brand_sub: { en: "CREATIVE SYSTEM", bn: "ক্রিয়েটিভ সিস্টেম" },
  nav_dashboard: { en: "Dashboard", bn: "ড্যাশবোর্ড" },
  nav_auth: { en: "Login", bn: "লগইন" },

  // Hero
  badge_platform: {
    en: "WINDOWS + MACOS",
    bn: "উইন্ডোজ + ম্যাকওএস",
  },
  hero_title_a: { en: "The Creative", bn: "ক্রিয়েটিভ" },
  hero_title_b: { en: "Ecosystem", bn: "ইকোসিস্টেম" },
  hero_title_dot: { en: ".", bn: "।" },
  hero_desc: {
    en: "Professional AI asset library and command assistant, docked directly inside After Effects. Designed for stability, performance, and low-end device compatibility.",
    bn: "প্রফেশনাল AI অ্যাসেট লাইব্রেরি এবং কমান্ড অ্যাসিস্ট্যান্ট, সরাসরি আফটার ইফেক্টস-এর ভেতরে ডক করা। স্থিতিশীলতা, পারফরম্যান্স এবং লো-এন্ড ডিভাইস কম্প্যাটিবিলিটির জন্য ডিজাইন করা।",
  },
  btn_install: { en: "Install Ghostae", bn: "ইনস্টল করুন Ghostae" },
  btn_preparing: { en: "Preparing installer…", bn: "ইনস্টলার প্রস্তুত হচ্ছে…" },
  btn_downloaded: { en: "Downloaded — run installer", bn: "ডাউনলোড হয়েছে — ইনস্টলার চালান" },
  btn_watch_demo: { en: "Watch 90-second demo", bn: "৯০ সেকেন্ডের ডেমো দেখুন" },
  btn_view_pricing: { en: "View Pricing", bn: "প্রাইসিং দেখুন" },
  hero_meta: {
    en: "Windows · macOS · Adobe After Effects",
    bn: "উইন্ডোজ · ম্যাকওএস · অ্যাডোবি আফটার ইফেক্টস",
  },
  err_download: { en: "Couldn't download:", bn: "ডাউনলোড করা গেল না:" },
  live_demo_pill: { en: "LIVE DEMO · 1:30", bn: "লাইভ ডেমো · ১:৩০" },

  // Ecosystem
  eco_title: { en: "The Creative Ecosystem", bn: "ক্রিয়েটিভ ইকোসিস্টেম" },
  eco_sub: { en: "Everything you need to automate your motion design workflow.", bn: "আপনার মোশন ডিজাইন ওয়ার্কফ্লো স্বয়ংক্রিয় করতে আপনার যা কিছু প্রয়োজন।" },
  feat_template_title: { en: "Ghostae Presets", bn: "Ghostae Presets" },
  feat_template_desc: {
    en: "Professional project templates and motion presets. One-click setup.",
    bn: "প্রফেশনাল প্রজেক্ট টেমপ্লেট এবং মোশন প্রিসেট। ওয়ান-ক্লিক সেটআপ।",
  },
  feat_cache_title: { en: "Ghostae Cache", bn: "Ghostae Cache" },
  feat_cache_desc: {
    en: "AI-ready asset library. Indexes images, video, audio, fonts, LUTs, 3D. 7 density levels, drag & drop.",
    bn: "AI-রেডি অ্যাসেট লাইব্রেরি। ছবি, ভিডিও, অডিও, ফন্ট, LUT, 3D ইনডেক্স করে। ৭টি ডেনসিটি লেভেল, ড্র্যাগ ও ড্রপ।",
  },
  feat_cmd_title: { en: "Ghostae Command", bn: "Ghostae Command" },
  feat_cmd_desc: {
    en: "AI assistant with streaming responses, multi-model support, voice input, AE context awareness.",
    bn: "স্ট্রিমিং রেসপন্স সহ AI অ্যাসিস্ট্যান্ট, মাল্টি-মডেল সাপোর্ট, ভয়েস ইনপুট, AE কনটেক্সট অ্যাওয়ারনেস।",
  },
  feat_tools_title: { en: "Ghostae Tools", bn: "Ghostae Tools" },
  feat_tools_desc: {
    en: "Workspace changer, project note, SRT importer, layer hider and custom editing board.",
    bn: "ওয়ার্কস্পেস চেঞ্জার, প্রজেক্ট নোট, SRT ইমপোর্টার, লেয়ার হাইডার এবং কাস্টম এডিটিং বোর্ড।",
  },
  feat_extension_title: { en: "Ghostae Bridge", bn: "Ghostae Bridge" },
  feat_extension_desc: {
    en: "Connect your browser directly to After Effects. Send assets from any website.",
    bn: "আপনার ব্রাউজারকে সরাসরি আফটার ইফেক্টস-এর সাথে কানেক্ট করুন। যেকোনো ওয়েবসাইট থেকে অ্যাসেট পাঠান।",
  },
  feat_one_title: { en: "Ghostae One", bn: "Ghostae One" },
  feat_one_desc: {
    en: "Unified control center for all Ghostae tools and licenses.",
    bn: "সব Ghostae টুলস এবং লাইসেন্সের জন্য ইউনিফাইড কন্ট্রোল সেন্টার।",
  },

  // Stats
  stats_colour: { en: "Colour Plates", bn: "কালার প্লেটস" },
  stats_anim: { en: "Text Animations", bn: "টেক্সট অ্যানিমেশনস" },
  stats_lag: { en: "Lag Workflow", bn: "ল্যাগ ওয়ার্কফ্লো" },
  stats_zero: { en: "Zero", bn: "জিরো" },

  // Preview
  preview_eyebrow: { en: "LIVE PREVIEW", bn: "লাইভ প্রিভিউ" },
  preview_title: { en: "Live Panel Preview", bn: "লাইভ প্যানেল প্রিভিউ" },
  preview_sub: { en: "Minimal UI. Powerful functionality. Zero lag.", bn: "মিনিমাল UI। শক্তিশালী কার্যকারিতা। জিরো ল্যাগ।" },
  preview_note: { en: "Preview mirrors the live extension — updates ship here first.", bn: "প্রিভিউ লাইভ এক্সটেনশনের সাথে সিঙ্ক — নতুন আপডেট প্রথমে এখানেই আসে।" },
  tab_cache: { en: "Ghostae Cache", bn: "Ghostae Cache" },
  tab_command: { en: "Ghostae Command", bn: "Ghostae Command" },
  tab_tools: { en: "Ghostae Tools", bn: "Ghostae Tools" },

  // Stability
  stable_title: { en: "Stable & Lightweight", bn: "স্থিতিশীল এবং হালকা" },
  stable_desc: {
    en: "We've optimized Ghostae for performance. Direct autoplay is disabled by default to save system resources. Built-in performance profiles ensure smooth operation even on low-end hardware.",
    bn: "আমরা পারফরম্যান্সের জন্য Ghostae-কে অপ্টিমাইজ করেছি। সিস্টেম রিসোর্স বাঁচাতে ডিফল্টভাবে ডাইরেক্ট অটো-প্লে বন্ধ রাখা হয়েছে। বিল্ট-ইন পারফরম্যান্স প্রোফাইল এমনকি লো-এন্ড হার্ডওয়্যারেও মসৃণ অপারেশন নিশ্চিত করে।",
  },
  stable_list_1: { en: "Low-device performance mode", bn: "লো-ডিভাইস পারফরম্যান্স মোড" },
  stable_list_2: { en: "Optimized ExtendScript bridge", bn: "অপ্টিমাইজড ExtendScript ব্রিজ" },
  stable_list_3: { en: "Zero-lag category switching", bn: "জিরো-ল্যাগ ক্যাটাগরি সুইচিং" },
  stable_list_4: { en: "Background asset processing", bn: "ব্যাকগ্রাউন্ড অ্যাসেট প্রসেসিং" },

  // Social
  social_title: { en: "Loved by Professionals", bn: "প্রফেশনালদের পছন্দের" },

  // System Check
  sys_eyebrow: { en: "SYSTEM CHECK", bn: "সিস্টেম চেক" },
  sys_ready: { en: "Your machine is ready", bn: "আপনার ডিভাইসটি প্রস্তুত" },
  sys_mostly_ready: { en: "Your machine is mostly ready", bn: "আপনার ডিভাইসটি মোটামুটি প্রস্তুত" },
  sys_label_os: { en: "Operating system", bn: "অপারেটিং সিস্টেম" },
  sys_os_win: { en: "Windows 10 / 11 · fully supported", bn: "উইন্ডোজ ১০ / ১১ · সম্পূর্ণ সাপোর্টেড" },
  sys_os_mac: { en: "macOS · supported", bn: "ম্যাকওএস · সাপোর্টেড" },
  sys_os_other: { en: "Adobe After Effects is not distributed for this OS", bn: "এই ওএস-এর জন্য আফটার ইফেক্টস নেই" },
  sys_label_dl: { en: "Browser download support", bn: "ব্রাউজার ডাউনলোড সাপোর্ট" },
  sys_dl_detail: { en: "Direct ZIP download ready", bn: "সরাসরি ZIP ডাউনলোড প্রস্তুত" },
  sys_label_ae: { en: "After Effects installed", bn: "আফটার ইফেক্টস ইনস্টল্ড" },
  sys_ae_detail: { en: "Can't detect from browser — After Effects required", bn: "ব্রাউজার থেকে ডিটেক্ট করা সম্ভব নয় — আফটার ইফেক্টস প্রয়োজন" },
  sys_label_speech: { en: "Web Speech (voice input)", bn: "ওয়েব স্পিচ (ভয়েস ইনপুট)" },
  sys_speech_ok: { en: "Voice input works in this browser", bn: "ভয়েস ইনপুট এই ব্রাউজারে কাজ করে" },
  sys_speech_warn: { en: "Voice input needs Chrome/Edge — panel still works fine", bn: "ভয়েস ইনপুটের জন্য Chrome/Edge প্রয়োজন — প্যানেল ঠিকঠাক কাজ করবে" },

  // CTA
  cta_title: { en: "Ready to automate?", bn: "অটোমেট করতে প্রস্তুত?" },
  cta_desc: {
    en: "Install Ghostae and transform your After Effects workflow today.",
    bn: "Ghostae ইনস্টল করুন এবং আজই আপনার আফটার ইফেক্টস ওয়ার্কফ্লো পরিবর্তন করুন।",
  },
  cta_btn: { en: "Download Now", bn: "এখনই ডাউনলোড করুন" },

  // Steps
  step_1_t: { en: "Click Install", bn: "ইনস্টল ক্লিক" },
  step_1_d: { en: "Downloads the ZIP package.", bn: "ZIP প্যাকেজ ডাউনলোড হয়।" },
  step_2_t: { en: "Extract", bn: "এক্সট্র্যাক্ট" },
  step_2_d: { en: "Right-click → Extract All (or double-click on macOS).", bn: "রাইট-ক্লিক → Extract All (ম্যাকে ডাবল-ক্লিক)।" },
  step_3_t: { en: "Run the installer", bn: "ইনস্টলার চালান" },
  step_3_d: { en: "Windows: Install_GHOST.cmd · macOS: Install_GHOST.command", bn: "উইন্ডোজ: Install_GHOST.cmd · ম্যাক: Install_GHOST.command" },
  step_4_t: { en: "Restart AE", bn: "AE রিস্টার্ট" },
  step_4_d: { en: "Open the two Ghostae panels — you're live.", bn: "দুটো Ghostae প্যানেল খুলুন — চালু হয়ে গেছে।" },
  step: { en: "STEP", bn: "ধাপ" },

  // Footer
  footer_desc: {
    en: "Professional AI asset library and command assistant, docked directly inside After Effects.",
    bn: "প্রফেশনাল AI অ্যাসেট লাইব্রেরি এবং কমান্ড অ্যাসিস্ট্যান্ট, সরাসরি আফটার ইফেক্টস-এর ভেতরে ডক করা।",
  },
  footer_product: { en: "Product", bn: "প্রোডাক্ট" },
  footer_resources: { en: "Resources", bn: "রিসোর্স" },
  footer_company: { en: "Company", bn: "কোম্পানি" },
  footer_features: { en: "Features", bn: "ফিচারসমূহ" },
  footer_api: { en: "API", bn: "এপিআই" },
  footer_blog: { en: "Blog", bn: "ব্লগ" },
  footer_tutorials: { en: "Tutorials", bn: "টিউটোরিয়াল" },
  footer_support: { en: "Support", bn: "সাপোর্ট" },
  footer_about: { en: "About", bn: "আমাদের সম্পর্কে" },
  footer_careers: { en: "Careers", bn: "ক্যারিয়ার" },
  footer_contact: { en: "Contact", bn: "যোগাযোগ" },
  footer_privacy: { en: "Privacy Policy", bn: "প্রাইভেসি পলিসি" },
  footer_terms: { en: "Terms", bn: "শর্তাবলী" },
  footer_rights: { en: "All rights reserved.", bn: "সর্বস্বত্ব সংরক্ষিত।" },
  footer_operational: { en: "All systems operational", bn: "সব সিস্টেম সচল" },
} satisfies Dict;

export type StringKey = keyof typeof STRINGS;

const LangContext = createContext<{
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (k: StringKey) => string;
}>({ lang: "en", setLang: () => {}, t: (k) => STRINGS[k].en });

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("ghost-lang") as Lang | null;
      if (saved) setLangState(saved);
    } catch {}
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.lang = lang;
    const locale = LOCALES.find((l) => l.code === lang);
    document.documentElement.dir = locale?.dir === "rtl" ? "rtl" : "ltr";
    document.documentElement.classList.toggle("lang-bn", lang === "bn");

    // Bengali needs a webfont — load it lazily so English visitors never pay
    // for a blocking Google Fonts request.
    if (lang === "bn" && !document.getElementById("ghost-bn-font")) {
      const link = document.createElement("link");
      link.id = "ghost-bn-font";
      link.rel = "stylesheet";
      link.href =
        "https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@300;400;600&display=swap";
      document.head.appendChild(link);
    }
  }, [lang]);

  const setLang = (l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem("ghost-lang", l);
    } catch {}
  };

  const t = (k: StringKey) => {
    const val = STRINGS[k] as any;
    if (!val) return k;
    return val[lang] || val["en"] || "";
  };

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export function useT() {
  return useContext(LangContext).t;
}
export function useLang() {
  const { lang, setLang } = useContext(LangContext);
  return { lang, setLang };
}