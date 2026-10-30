// Detailed Bengali buyer guides per digital product, shown as three tabs.
export type DigitalGuide = { why: string[]; features: string[]; steps: string[]; terms: string[] };

export const DIGITAL_GUIDES: Record<string, DigitalGuide> = {
  'capcut-pro': {
    why: ['নিজের জন্য আলাদা Personal অ্যাকাউন্ট, শেয়ার করা নয়', 'ফোন ও পিসি—২টি ডিভাইসে একসাথে লগইন', 'পুরো ৩০ দিন ওয়ারেন্টি'],
    features: ['সব Pro ইফেক্ট, ফিল্টার ও ট্রানজিশন', 'অটো ক্যাপশন ও টেক্সট-টু-স্পিচ', 'ওয়াটারমার্ক ছাড়া 4K এক্সপোর্ট', 'ব্যাকগ্রাউন্ড রিমুভ ও AI টুলস', 'Pro টেমপ্লেট ও ক্লাউড স্টোরেজ'],
    steps: ['অর্ডার ও পেমেন্ট সম্পন্ন করুন', 'WhatsApp-এ email ও পাসওয়ার্ড পাবেন', 'CapCut অ্যাপে লগইন করুন', 'পাসওয়ার্ড বদলাবেন না—ওয়ারেন্টি বাতিল হতে পারে'],
    terms: ['৩০ দিন পূর্ণ ওয়ারেন্টি', 'সমস্যা হলে রিপ্লেসমেন্ট', '২টির বেশি ডিভাইসে লগইন করলে ওয়ারেন্টি থাকবে না'],
  },
  'gemini-ai-pro': {
    why: ['নিজের Personal Gmail-এ 18 মাসের Google AI Pro', '5TB Cloud Storage — Drive, Photos ও Gmail-এ', 'Family Sharing-এ আরও 5 জন যোগ করা যায়', 'কার্ড ছাড়াই Redeem Link দিয়ে চালু'],
    features: ['Gemini Advanced মডেল — স্ক্রিপ্ট, লেখা ও কোডিং', 'Deep Research — বিস্তারিত গবেষণা রিপোর্ট', 'Nano Banana — AI ছবি তৈরি ও এডিট', 'Veo ও Flow — টেক্সট/ছবি থেকে AI ভিডিও', 'Whisk ও Google Vids — ক্রিয়েটিভ ভিজ্যুয়াল', 'NotebookLM — PDF ও ডকুমেন্ট বিশ্লেষণ', 'Gmail, Docs, Sheets ও Slides-এ Gemini', 'Gemini Code Assist ও Gemini CLI'],
    steps: ['অর্ডার করে পেমেন্ট সম্পন্ন করুন', 'যাচাইয়ের পর WhatsApp-এ Redeem Link পাবেন', 'নিজের Gmail-এ লগইন করে লিংক খুলুন', 'Google One ও Gemini-তে Subscription যাচাই করুন'],
    terms: ['Redeem Link পাওয়ার 24 ঘণ্টার মধ্যে ব্যবহার করতে হবে', 'Activation সম্পন্নের পর কোনো ওয়ারেন্টি নেই', 'ভিডিও, ছবি ও Deep Research-এ Usage Limit প্রযোজ্য', 'Family সদস্যরা সব AI সুবিধা নাও পেতে পারেন', '18 মাস পর Google-এর নিয়মিত মূল্য প্রযোজ্য হতে পারে; Auto Renewal নিজে যাচাই করুন'],
  },
  elevenlabs: {
    why: ['অফিসিয়াল পার্টনার রিডিম কোড', '১৩১,০০০ ক্রেডিট—মেয়াদ শেষ হয় না', 'নিজের অ্যাকাউন্টে যোগ হয়'],
    features: ['প্রাকৃতিক AI ভয়েসওভার', 'বাংলাসহ বহু ভাষায় ডাবিং', 'ভয়েস ক্লোনিং', 'টেক্সট থেকে কথা ও সাউন্ড ইফেক্ট'],
    steps: ['অর্ডার ও পেমেন্ট সম্পন্ন করুন', 'WhatsApp-এ রিডিম কোড পাবেন', 'ElevenLabs অ্যাকাউন্টে লগইন করুন', 'রিডিম পেজে কোড বসালে ক্রেডিট যোগ হবে'],
    terms: ['ক্রেডিট খরচ না হওয়া পর্যন্ত থাকে', 'কোড একবারই ব্যবহার করা যায়', 'রিডিমের আগে সমস্যা হলে সাপোর্ট নিন'],
  },
  'canva-pro': {
    why: ['বাজারের ৫০–১০০ টাকার শেয়ার বা টিম ইনভাইট নয়', 'সম্পূর্ণ Owner অ্যাকাউন্ট—মালিকানা আপনার', 'কেউ আপনাকে টিম থেকে বের করতে পারবে না, ডিজাইন নিরাপদ', 'পুরো ১ বছর ওয়ারেন্টি'],
    features: ['১০ কোটির বেশি Pro টেমপ্লেট, ছবি ও এলিমেন্ট', 'এক ক্লিকে ব্যাকগ্রাউন্ড রিমুভ', 'Magic Resize ও Magic Studio AI', 'Brand Kit, প্রিমিয়াম ফন্ট', 'ভিডিও থাম্বনেইল, পোস্ট ও প্রেজেন্টেশন'],
    steps: ['অর্ডার ও পেমেন্ট সম্পন্ন করুন', 'WhatsApp-এ Owner অ্যাকাউন্টের লগইন পাবেন', 'লগইন করে পাসওয়ার্ড ও email নিজের মতো বদলান', 'নিজের ডিজাইন নিশ্চিন্তে রাখুন'],
    terms: ['পুরো ১ বছর ওয়ারেন্টি', 'Pro বন্ধ হলে রিপ্লেসমেন্ট', 'নিয়মবিরুদ্ধ ব্যবহারে ওয়ারেন্টি থাকবে না'],
  },
  'chatgpt-plus': {
    why: ['আসল ChatGPT Plus অ্যাক্সেস', 'পুরো ৩০ দিন মেয়াদ', 'দ্রুত ডেলিভারি'],
    features: ['সর্বশেষ GPT মডেল', 'ছবি তৈরি ও ছবি বিশ্লেষণ', 'ফাইল আপলোড ও ডেটা বিশ্লেষণ', 'স্ক্রিপ্ট, প্রম্পট ও কনটেন্ট পরিকল্পনা', 'Custom GPTs'],
    steps: ['অর্ডার ও পেমেন্ট সম্পন্ন করুন', 'WhatsApp-এ অ্যাক্সেস তথ্য পাবেন', 'নির্দেশনা মেনে লগইন করুন'],
    terms: ['২৪ ঘণ্টা ওয়ারেন্টি', 'সমস্যায় সাপোর্টে যোগাযোগ করুন', 'লগইন তথ্য অন্যকে দেবেন না'],
  },
  'kling-ai': {
    why: ['১ মাসে ৭২৫–৮৫০ ক্রেডিট', 'নিজে লগইন করে ব্যবহার', 'অব্যবহৃত ক্রেডিট অনুযায়ী রিফান্ড বা বদল'],
    features: ['টেক্সট থেকে AI ভিডিও', 'ছবি থেকে ভিডিও', 'হাই-কোয়ালিটি মোড', 'রিলস ও বিজ্ঞাপনের ভিডিও আইডিয়া'],
    steps: ['অর্ডার ও পেমেন্ট সম্পন্ন করুন', 'WhatsApp-এ email ও পাসওয়ার্ড পাবেন', 'Kling AI-তে লগইন করে ভিডিও তৈরি করুন'],
    terms: ['২৪ ঘণ্টা ওয়ারেন্টি', 'অ্যাকাউন্টে সমস্যায় অব্যবহৃত ক্রেডিট অনুযায়ী রিফান্ড বা রিপ্লেসমেন্ট', 'পাসওয়ার্ড বদলাবেন না'],
  },
  'freepik-magnific': {
    why: ['৯০ দিনের প্রিমিয়াম ওয়েব প্যানেল', 'দিনে ২০টি, মাসে ৬০০টি অরিজিনাল ফাইল', 'পুরো মেয়াদে ওয়ারেন্টি'],
    features: ['Freepik Premium ভেক্টর, PSD ও ছবি', 'Magnific AI আপস্কেলিং', 'প্রিমিয়াম আইকন ও মকআপ', 'কমার্শিয়াল প্রজেক্টে ব্যবহারযোগ্য ফাইল'],
    steps: ['অর্ডার ও পেমেন্ট সম্পন্ন করুন', 'WhatsApp-এ প্যানেলের লগইন পাবেন', 'Freepik/Magnific ফাইলের লিংক প্যানেলে পেস্ট করুন', 'অরিজিনাল ফাইল ডাউনলোড করুন'],
    terms: ['পুরো ৯০ দিন ওয়ারেন্টি', 'দৈনিক ও মাসিক সীমা প্রযোজ্য', 'প্যানেল লগইন অন্যকে দেবেন না'],
  },
};

// Headline benefit list shown in a highlighted card at the top of the page.
export const DIGITAL_HIGHLIGHTS: Record<string, { title: string; items: [string, string][] }> = {
  'gemini-ai-pro': {
    title: 'Jio Google AI Pro — 18 Months',
    items: [
      ['18 Months', 'Google AI Pro Subscription'],
      ['5TB Cloud Storage', 'Google Drive, Gmail ও Google Photos'],
      ['Google Flow', 'প্রতি মাসে 1,000 AI Credits'],
      ['Google Veo', 'AI Video Generation'],
      ['Gemini Advanced', 'Premium AI Models Access'],
      ['Nano Banana', 'AI Image Generation ও Editing'],
      ['Deep Research', 'Advanced Research ও Analysis'],
      ['NotebookLM Plus', 'PDF Analysis ও Audio Overviews'],
      ['Google Whisk', 'AI Image ও Video Creation'],
      ['Gmail, Docs ও Sheets', 'Gemini AI Productivity Tools'],
      ['Code Assist ও CLI', 'AI Coding Assistance'],
      ['Google Vids', 'AI Video Creation Tools'],
      ['Family Sharing', 'সর্বোচ্চ ৫ জন অতিরিক্ত সদস্য (যোগ্যতা সাপেক্ষে)'],
      ['Multi-Device', 'Mobile, PC ও Web'],
    ],
  },
};
