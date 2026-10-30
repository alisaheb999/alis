import frameAiImage from "@/assets/frame-ai-card.jpg";
import chatgptExtensionImage from '@/assets/chatgpt-extension-ghost.jpg';
/**
 * Simple, scalable GhostAE product catalog.
 * Add a new object here and it appears on /products with its own /products/$slug page.
 */
export type ProductStatus = "available" | "coming-soon" | "maintenance";

export type GhostProduct = {
  slug: string;
  name: string;
  status: ProductStatus;
  /** Card image (ES6 imported asset URL). */
  image?: string;
  /** Public-facing version label, independent of installer build versions. */
  version?: string;
  tagline: { en: string; bn: string };
  description: { en: string; bn: string };
  highlights: { en: string; bn: string }[];
  /** Optional download entry point for released products. */
  downloadHref?: string;
  /** Simple price line shown on the product page. */
  price?: { amount: string; note: { en: string; bn: string } };
  /** Checkout plan id used by the existing purchase flow. */
  checkoutPlan?: string;
  /** Paid plan ids this product sells (drives its own checkout). */
  plans?: string[];
  /** Simple pricing table rows shown in the Buy now popup. */
  planTable?: PlanRow[];
};

export type PlanRow = {
  /** "free" or a paid plan id from pricing-catalog. */
  id: string;
  label: string;
  details: { en: string; bn: string }[];
  price: string;
};



import captionImage from "../assets/product-caption-ghost.jpg";
import textImage from "../assets/ghostae-text-v2-sm.webp.asset.json";
import cacheImage from "../assets/ghostae-cache-v1-sm.webp.asset.json";
import captionWin from "../assets/Ghostae-Caption-Windows.zip.asset.json";

export const PRODUCTS: GhostProduct[] = [
  { slug: 'chatgpt-plus-renew', name: 'ChatGPT Extension by Ghostae', status: 'available', image: chatgptExtensionImage, tagline: { en: 'Shared Plus browser extension', bn: 'Shared Plus browser extension' }, description: { en: 'Shared access with usage and privacy limits.', bn: 'Shared access with usage and privacy limits.' }, highlights: [] },
  {
    slug: "caption",
    name: "Ghostae Caption",
    status: "maintenance",
    image: captionImage,

    tagline: {
      en: "Audio to animated captions, inside After Effects.",
      bn: "অডিও থেকে অ্যানিমেটেড ক্যাপশন, After Effects-এর ভেতরেই।",
    },
    description: {
      en: "Drop an audio file, get a clean transcript and ready-to-edit caption layers built directly in your composition. Ships with the After Effects panel.",
      bn: "অডিও ফাইল দিন, পরিষ্কার ট্রান্সক্রিপ্ট আর এডিট-রেডি ক্যাপশন লেয়ার সরাসরি আপনার কম্পোজিশনে তৈরি হবে। সাথে থাকছে After Effects প্যানেল।",
    },
    highlights: [
      { en: "Audio → transcript → caption layers", bn: "অডিও → ট্রান্সক্রিপ্ট → ক্যাপশন লেয়ার" },
      { en: "SRT import and export", bn: "SRT ইমপোর্ট ও এক্সপোর্ট" },
      { en: "Caption presets and manual editing", bn: "ক্যাপশন প্রিসেট ও ম্যানুয়াল এডিট" },
      { en: "Bangla + English support", bn: "বাংলা ও ইংরেজি সাপোর্ট" },
      { en: "Windows and macOS installer", bn: "উইন্ডোজ ও macOS ইনস্টলার" },
    ],
    downloadHref: captionWin.url,
    checkoutPlan: "pro",
    plans: ["light", "pro"],
    planTable: [
      {
        id: "free",
        label: "Free",
        details: [{ en: "2 Minutes Every Day", bn: "2 Minutes Every Day" }],
        price: "৳0",
      },
      {
        id: "light",
        label: "Light",
        details: [
          { en: "300 Minutes", bn: "300 Minutes" },
          { en: "No Limit — Any Time", bn: "No Limit — Any Time" },
          { en: "All Standard Features", bn: "All Standard Features" },
        ],
        price: "৳199 / 3 Months",
      },
      {
        id: "pro",
        label: "Pro",
        details: [
          { en: "1,500 Minutes", bn: "1,500 Minutes" },
          { en: "No Limit — Any Time", bn: "No Limit — Any Time" },
          { en: "All Features Unlocked", bn: "All Features Unlocked" },
        ],
        price: "৳699 / 1 Year",
      },
    ],

  },
  {
    slug: "text",
    name: "Ghostae Text",
    status: "available",
    image: textImage.url,
    version: "V2",
    tagline: {
      en: "Text animation, FFX presets, styles, emoji and expressions inside After Effects.",
      bn: "After Effects-এর ভেতরেই টেক্সট অ্যানিমেশন, FFX প্রিসেট, স্টাইল, ইমোজি ও এক্সপ্রেশন।",
    },
    description: {
      en: "A complete text solution with 170+ animation FFX presets, 33 text styles, 300+ emoji, 200+ expressions and an advanced builder. Select a layer and apply in one click.",
      bn: "সম্পূর্ণ টেক্সট সলিউশন—১৭০+ অ্যানিমেশন FFX প্রিসেট, ৩৩টি টেক্সট স্টাইল, ৩০০+ ইমোজি, ২০০+ এক্সপ্রেশন ও অ্যাডভান্সড বিল্ডার। লেয়ার সিলেক্ট করে এক ক্লিকেই অ্যাপ্লাই করুন।",
    },
    highlights: [
      { en: "170+ animation FFX presets", bn: "১৭০+ অ্যানিমেশন FFX প্রিসেট" },
      { en: "33 text styles + 300+ emoji library", bn: "৩৩টি টেক্সট স্টাইল ও ৩০০+ ইমোজি" },
      { en: "200+ expression toolkit", bn: "২০০+ এক্সপ্রেশন টুলকিট" },
      { en: "Advanced custom animation builder", bn: "অ্যাডভান্সড কাস্টম অ্যানিমেশন বিল্ডার" },
      { en: "Windows and macOS installer", bn: "উইন্ডোজ ও macOS ইনস্টলার" },
    ],
    checkoutPlan: "text_lifetime",
    plans: ["text_lifetime"],
    planTable: [
      {
        id: "text_lifetime",
        label: "Lifetime",
        details: [{ en: "Unlimited · All features", bn: "আনলিমিটেড · সব ফিচার" }],
        price: "৳349 one-time",
      },
    ],
  },
  {
    slug: "cache",
    name: "Ghostae Cache Light",
    status: "coming-soon",
    image: cacheImage.url,
    version: "V1",
    tagline: {
      en: "Curated offline assets inside After Effects and Premiere Pro.",
      bn: "After Effects ও Premiere Pro-এর ভেতরেই কিউরেটেড অফলাইন অ্যাসেট।",
    },
    description: {
      en: "Textures, overlays, SFX, 3D models and PSD templates with instant previews. Under development.",
      bn: "টেক্সচার, ওভারলে, SFX, 3D মডেল ও PSD টেমপ্লেট—ইনস্ট্যান্ট প্রিভিউসহ। ডেভেলপমেন্ট চলছে।",
    },
    highlights: [],
  },
  {
    slug: "frame-ai",
    name: "Frame AI",
    image: frameAiImage,
    status: "available",
    tagline: {
      en: "Desktop AI motion video app for motion designers, powered by Claude.",
      bn: "Desktop AI motion video app for motion designers, powered by Claude.",
    },
    description: {
      en: "A standalone desktop app that generates motion videos with Claude, ready to import as layers in After Effects.",
      bn: "A standalone desktop app that generates motion videos with Claude, ready to import as layers in After Effects.",
    },
    highlights: [],
  },
];

export const findProduct = (slug: string) => PRODUCTS.find((p) => p.slug === slug);
