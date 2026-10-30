# Ghost AI Text — নতুন প্রোডাক্ট + লাইসেন্স সিস্টেম (low-credit plan)

## লক্ষ্য
Storage-এর `text` bucket-এ আপলোড করা `Ghostae-Text-v20-perf-ffx-v3.zip` (com.ghost.text v3.40.10) — এটাই চূড়ান্ত ভার্সন। পুরনো সব Text/Toolkit বিল্ড মুছে ফেলা হবে, লাইসেন্স গেট বসানো হবে, এবং ওয়েবসাইটে Caption-এর হুবহু স্টাইলে নতুন প্রোডাক্ট পেজ যুক্ত হবে।

## প্ল্যান (৪ ধাপ)

### ১. এক্সটেনশন রিপ্লেস (কম ক্রেডিট, শুধু কমান্ড)
- `extension-src/ghostae-text/` সম্পূর্ণ মুছে নতুন zip থেকে extract করা হবে।
- পুরনো টেক্সট-প্যানেল বিল্ড আর্টিফ্যাক্ট (`public/downloads/` ও `public/` এর পুরনো Text/Installer zip, `scripts/build-text-panel.py` জাতীয় স্ক্রিপ্ট) মুছে ফেলা হবে।
- নতুন রিলিজ প্যাকেজ: `public/downloads/Ghostae-Text.zip` + `.sha256` (build script দিয়ে, ইনস্টলার সহ)।

### ২. লাইসেন্স সিস্টেম (চুরি বন্ধ)
প্যাকেজে ইতিমধ্যে `js/ghost-cloud.js` + `js/ghost-gate.js` আছে যা `https://ghostae.com` এ ভেরিফাই করে। যা যোগ হবে:
- **Free tier**: লাইসেন্স ছাড়া শুধু **১০টি text animation** ব্যবহার করা যাবে। কাউন্টার machine-wide ফাইলে (`Documents/Ghostae/License/text-usage.json`) রাখা হবে, লিমিট শেষ হলে fail-closed গেট ওভারলে ওপেন হবে।
- **Lifetime**: বৈধ কী থাকলে সব প্যানেল (Animations, Advanced, Style, Emoji, Expressions) আনলক, কোনো লিমিট নেই।
- সার্ভারে `text_lifetime` প্ল্যান যুক্ত হবে, লাইসেন্স expiry = lifetime (৩৬৫০০ দিন), device limit ১।
- বড় ফাইল হাতে লিখা হবে না — শুধু ছোট `ghost-text-limit.js` প্যাচ ফাইল + `ghost-gate.js`-এ কয়েক লাইন হুক।

### ৩. ওয়েবসাইট প্রোডাক্ট (Caption-এর হুবহু স্টাইল)
- `products-catalog.ts`-এ নতুন প্রোডাক্ট `text` → নাম **Ghostae Text (Ghost AI Text)**, Details বাটন → `/products/text`।
- নতুন রুট `src/routes/products/text.tsx` — `caption.tsx` এর হুবহু কপি (একই ইন্টার‌্যাকশন, একই `caption-landing.css`)।
- ল্যান্ডিং কনটেন্ট `src/content/text-landing.html` — caption ল্যান্ডিং থেকে স্ক্রিপ্ট-ট্রান্সফর্ম করে তৈরি (টোকেন খরচ কম), এরপর শুধু কপি/ফিচার/FAQ/প্রাইসিং অংশ Text প্যানেলের জন্য বদলানো হবে। ডিজাইন, সেকশন অর্ডার, বাটন — একই।
- প্রাইসিং টেবিল: **Free — ১০টি animation, ৳0** এবং **Lifetime — সব কিছু, ৳199 (এককালীন)**।
- Buy/Licence popup: বিদ্যমান `BuyDialog` + `LicenceKeyDialog` পুনঃব্যবহার (manual payment + WhatsApp কনফার্ম, আগের মতোই)।

### ৪. প্রাইসিং/চেকআউট আপডেট
- `pricing-catalog.ts`-এ `text_lifetime` (৳199, one-time) — `cycle` "monthly"/"yearly" দুটোতেই ১৯৯, `lifetime: true` ফ্ল্যাগ।
- `fulfillment.server.ts`-এ lifetime হলে expiry ~১০০ বছর।
- Admin Night-Mode অটো লাইসেন্স ফ্লো অপরিবর্তিত থাকবে, নতুন প্ল্যান সাপোর্ট করবে।

## টেকনিক্যাল নোট
- এক্সটেনশন bundle id `com.ghost.text`, AE 2019–2025 (`[16.0,99.9]`), Win + Mac ইনস্টলার।
- লাইসেন্স ভেরিফিকেশন fail-closed: সার্ভার/কী না মিললে প্যানেল লক।
- কোনো ভারী ফাইল হাতে জেনারেট করা হবে না; ল্যান্ডিং HTML স্ক্রিপ্ট-ট্রান্সফর্ম + টার্গেটেড এডিট।

## ক্রেডিট আন্দাজ
মোটামুটি মাঝারি: ধাপ ১ ও ৪ সস্তা, ধাপ ২ ছোট প্যাচ, ধাপ ৩-ই মূল খরচ (ল্যান্ডিং কপি এডিট)।
