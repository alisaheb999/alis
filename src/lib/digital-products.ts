export type DigitalProduct = {
  slug: string;
  name: string;
  category: 'editing' | 'writing' | 'voice' | 'design' | 'video';
  description: string;
  uses: string[];
  variant: string;
  delivery: string;
  priceBdt: number | null;
  termsVerified: boolean;
};

// Variants are candidates from the supplier shortlist, not verified entitlements.
export const DIGITAL_PRODUCTS: DigitalProduct[] = [
  { slug: 'capcut-pro', name: 'CapCut Pro', category: 'editing', description: 'রিলস, শর্টস ও সোশ্যাল ভিডিও এডিটিংয়ের জন্য।', uses: ['ছোট ভিডিও সম্পাদনা', 'ক্যাপশন ও ভিডিও ইফেক্ট'], variant: '৩০ দিনের Personal প্ল্যান', delivery: 'অ্যাকাউন্টের ধরন যাচাই চলছে', priceBdt: null, termsVerified: false },
  { slug: 'gemini-ai-pro', name: 'Gemini AI Pro', category: 'writing', description: 'ভিডিওর আইডিয়া, স্ক্রিপ্ট ও গবেষণার কাজে।', uses: ['স্ক্রিপ্টের খসড়া ও গবেষণা', 'কনটেন্ট আইডিয়া সাজানো'], variant: '১৮ মাসের প্ল্যান', delivery: 'রিডিম লিংকের শর্ত যাচাই চলছে', priceBdt: null, termsVerified: false },
  { slug: 'elevenlabs', name: 'ElevenLabs', category: 'voice', description: 'ভয়েসওভার, কথার অডিও ও ডাবিংয়ের কাজে।', uses: ['ভিডিওর ভয়েসওভার', 'অডিও ও ডাবিংয়ের কাজ'], variant: '১৩১K ক্রেডিটের রিডিম অফার', delivery: 'রিডিম পদ্ধতি যাচাই চলছে', priceBdt: null, termsVerified: false },
  { slug: 'canva-pro', name: 'Canva Pro', category: 'design', description: 'থাম্বনেইল, পোস্ট ও সৃজনশীল ডিজাইনের জন্য।', uses: ['ভিডিও থাম্বনেইল তৈরি', 'সোশ্যাল পোস্ট ও গ্রাফিক্স'], variant: '১ বছরের প্ল্যান', delivery: 'নিজস্ব Owner অ্যাকাউন্ট', priceBdt: null, termsVerified: false },
  { slug: 'chatgpt-plus', name: 'ChatGPT Plus', category: 'writing', description: 'স্ক্রিপ্ট, প্রম্পট ও কনটেন্ট পরিকল্পনার কাজে।', uses: ['স্ক্রিপ্ট ও প্রম্পট লেখা', 'কনটেন্ট পরিকল্পনা ও খসড়া'], variant: '৩০ দিনের প্ল্যান', delivery: 'অ্যাক্টিভেশন পদ্ধতি যাচাই চলছে', priceBdt: null, termsVerified: false },
  { slug: 'kling-ai', name: 'Kling AI', category: 'video', description: 'টেক্সট ও ছবি থেকে AI ভিডিও তৈরির কাজে।', uses: ['টেক্সট থেকে ভিডিও', 'ছবি থেকে ভিডিওর ধারণা তৈরি'], variant: 'ক্রেডিটভিত্তিক ভিডিও প্ল্যান', delivery: 'ক্রেডিট ও অ্যাক্সেস যাচাই চলছে', priceBdt: null, termsVerified: false },
  { slug: 'freepik-magnific', name: 'Freepik · Magnific', category: 'design', description: 'ডিজাইন অ্যাসেট ও ছবির AI উন্নয়নের কাজে।', uses: ['ডিজাইনের অ্যাসেট খোঁজা', 'ছবির AI আপস্কেলিং'], variant: 'Premium ওয়েব অ্যাক্সেস', delivery: 'অন্তর্ভুক্ত সেবা যাচাই চলছে', priceBdt: null, termsVerified: false },
];

// Owner-set retail prices that override the supplier formula.
export const FIXED_PRICES_BDT: Record<string, number> = { 'gemini-ai-pro': 250, 'chatgpt-plus': 2210, 'canva-pro': 460 };

// Owner-marked out of stock; hidden from grids until restocked.
export const OUT_OF_STOCK_SLUGS = new Set<string>(['gemini-ai-pro', 'chatgpt-plus']);

export function findDigitalProduct(slug: string) {
  return DIGITAL_PRODUCTS.find(product => product.slug === slug);
}

export const DIGITAL_SHOWCASE = DIGITAL_PRODUCTS;

// Package labels from supplier listings, not a guarantee of eligibility or warranty.
export const DIGITAL_PACKAGE_LABELS: Record<string, string> = {
  'capcut-pro': '৩০ দিন · পার্সোনাল',
  'gemini-ai-pro': '18 মাস · 5TB · Redeem Link',
  elevenlabs: '১৩১ হাজার ক্রেডিট',
  'canva-pro': '১ বছর · নিজস্ব Owner অ্যাকাউন্ট',
  'chatgpt-plus': '৩০ দিন',
  'kling-ai': '১ মাস · ৭২৫–৮৫০ ক্রেডিট',
  'freepik-magnific': '৯০ দিন · ওয়েব প্যানেল',
};

export function canPurchaseDigitalProduct(product: DigitalProduct) {
  return product.termsVerified && product.priceBdt !== null && Number.isFinite(product.priceBdt) && product.priceBdt > 0;
}

export type DigitalDetails = { plan: string; activation: string; uses: string; warranty: string };

// Summarised in Bengali from the supplier's product descriptions.
export const DIGITAL_DETAILS: Record<string, DigitalDetails> = {
  'capcut-pro': { plan: '৩০ দিনের Personal প্ল্যান', activation: 'অ্যাকাউন্ট দেওয়া হবে; ফোন ও পিসি—২ ডিভাইসে লগইন', uses: 'Pro ইফেক্ট, ক্যাপশন, ট্রানজিশন ও ওয়াটারমার্ক ছাড়া এক্সপোর্ট', warranty: 'পুরো মেয়াদে ওয়ারেন্টি' },
  'gemini-ai-pro': { plan: '18 মাস Google AI Pro · 5TB Cloud Storage', activation: 'Redeem Link দিয়ে নিজের Gmail-এ চালু; কার্ড লাগবে না', uses: 'Gemini, Deep Research, Veo ভিডিও, Nano Banana ছবি, NotebookLM', warranty: 'Activation-এর পর ওয়ারেন্টি নেই; লিংক 24 ঘণ্টার মধ্যে ব্যবহার করুন' },
  elevenlabs: { plan: '১৩১,০০০ ক্রেডিট', activation: 'অফিসিয়াল পার্টনার রিডিম কোড', uses: 'ভয়েসওভার, ডাবিং ও টেক্সট থেকে কথা', warranty: 'ক্রেডিটের মেয়াদ শেষ হয় না; খরচ না হওয়া পর্যন্ত থাকে' },
  'canva-pro': { plan: '১ বছরের সম্পূর্ণ Owner অ্যাকাউন্ট', activation: 'শেয়ার বা টিম ইনভাইট নয়—অ্যাকাউন্টের পুরো মালিকানা আপনার', uses: 'Pro টেমপ্লেট, থাম্বনেইল, ব্যাকগ্রাউন্ড রিমুভ', warranty: 'পুরো ১ বছর ওয়ারেন্টি' },
  'chatgpt-plus': { plan: '৩০ দিনের Plus প্ল্যান', activation: 'GGPay অ্যাকাউন্ট অ্যাক্সেস', uses: 'স্ক্রিপ্ট, প্রম্পট, ছবি ও কনটেন্ট পরিকল্পনা', warranty: '২৪ ঘণ্টা ওয়ারেন্টি' },
  'kling-ai': { plan: '১ মাস · ৭২৫–৮৫০ ক্রেডিট', activation: 'email ও পাসওয়ার্ড দিয়ে লগইন', uses: 'টেক্সট ও ছবি থেকে AI ভিডিও', warranty: '২৪ ঘণ্টা; সমস্যায় অব্যবহৃত ক্রেডিট অনুযায়ী রিফান্ড বা বদল' },
  'freepik-magnific': { plan: '৯০ দিনের ওয়েব প্যানেল', activation: 'প্যানেলে Freepik/Magnific লিংক পেস্ট করে ডাউনলোড', uses: 'দিনে ২০টি, মাসে ৬০০টি অরিজিনাল ফাইল', warranty: 'পুরো ৯০ দিন ওয়ারেন্টি' },
};


// Exact supplier listing names used to look up live wholesale USD prices.
export const SUPPLIER_NAMES: Record<string, string> = {
  "capcut-pro": "CAPCUT PRO PERSONAL 30D full warranty",
  "gemini-ai-pro": "🔥 GEMINI AI PRO LINK 18 Months Warranty 24H",
  "elevenlabs": "🔥ElevenLabs Redeem 131K Credit",
  "canva-pro": "SLOT CANVA PRO 1 YEAR (full warranty)",
  "chatgpt-plus": "ChatGPT Plus GGPay 30D warranty 24H",
  "kling-ai": "KlingAI 725-850 Credits 1 Month (24H Warranty)",
  "freepik-magnific": "Freepik - Magnific Premium API Web Panel 90D full warranty"
};

export const USD_TO_BDT = 125;
export const FLAT_MARGIN_BDT = 60;

/** Sale price: cost (USD × rate) + max(flat margin, 20%), rounded up to a clean …49 / …99 ending. */
export function retailPriceBdt(usd: number): number | null {
  if (!Number.isFinite(usd) || usd <= 0) return null;
  const cost = usd * USD_TO_BDT;
  const raw = cost + Math.max(FLAT_MARGIN_BDT, cost * 0.2);
  return Math.ceil((raw + 1) / 50) * 50 - 1;
}

export function formatBdt(n: number) {
  return `${n.toLocaleString("en-US")} টাকা`;
}
