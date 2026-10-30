# Ghostae Caption 1.2.3 — License Gate + Plan Control (Low-credit plan)

## লক্ষ্য
License key ছাড়া extension একেবারেই না চলে (free/lite/pro সব ক্ষেত্রেই), plan অনুযায়ী limit কাজ করে, এবং admin panel থেকে key generate + payment request দেখা যায়। অন্য কোনো server/feature ছোঁয়া হবে না — শুধু উপরের স্তরের (gate + usage counter) connection।

## ১) Extension (raw file অপরিবর্তিত রেখে শুধু যোগ)
নতুন uploaded `Ghostae Caption 1.2.3` ফোল্ডারে **existing js ফাইল (panel.js, host.jsx, animations.js) কোনো পরিবর্তন হবে না**। যোগ হবে:
- `js/ghost-gate.js` (নতুন) — panel খোলার সময় full-screen activation overlay: license key input → `POST /api/public/v1/license/verify` (ghostae.com)। Valid না হলে UI unlock হবে না। Key localStorage-এ machine-scoped ভাবে থাকবে, প্রতি ঘণ্টায় re-verify; admin key off করলে panel আবার lock। এই ফাইলটি `/api/public/v1/control` থেকে remote kill-switch ও পড়বে (caption off করা / mandatory update)।
- `js/plan.js` — replace (ছোট ফাইল): এখন সত্যিকারের plan + usage দেখাবে `GET /api/public/v1/caption/plan?key=...` থেকে — plan tag (FREE/LITE/PRO), আজকের ব্যবহৃত মিনিট / daily limit, monthly মিনিট, generate count, সর্বোচ্চ upload size।
- `index.html` — শুধু ২ লাইন: gate script tag + একটি hidden overlay container (বাকি UI অপরিবর্তিত)।
- Caption generate করার আগে gate একটি `ghostGuard()` hook দিয়ে quota check করবে (`POST /api/public/v1/quota/check`) — limit শেষ হলে বাংলা message, generate বন্ধ।

## ২) Website / Backend (নতুন কিছু কম, বিদ্যমান পুনর্ব্যবহার)
- বিদ্যমান `license/verify`, `license/issue`, `quota/check`, `control` route-ই ব্যবহার হবে।
- নতুন একটি ছোট route: `src/routes/api/public/v1/caption/plan.ts` — key থেকে plan resolve করে usage summary (daily/monthly minutes, generate count, upload cap) return করবে; একই route-এ `POST` দিয়ে ব্যবহার report হবে (minutes/clicks)।
- Quota config-এ caption metric যোগ: `caption.minutes.daily` → free 2, lite 30, pro 120; monthly free 60, lite 900, pro 3600; upload size cap free 15MB / lite 60MB / pro 200MB।
- Free plan-ও key ছাড়া চলবে না — Free key admin panel থেকেই generate হবে (চুরি বন্ধ)।

## ৩) Admin panel (/admin)
- Keys tab-এ একটি **Product/Plan selector** (Ghostae Caption → Free / Lite / Pro) যোগ, যাতে এক ক্লিকে সঠিক plan-এর key generate হয় এবং list-এ product+plan দেখা যায়।
- Payment request data ইতিমধ্যে Billing tab-এ আসে — সেখানে প্রতিটি order-এর পাশে "Issue Caption key (Lite/Pro)" button যোগ হবে, যাতে verify করে সাথে সাথে key তৈরি হয়।

## ৪) Pricing text
- Products catalog-এ Free daily **৫ মিনিট → ২ মিনিট**। অন্য কোনো plan/price/option অপরিবর্তিত।

## ৫) পুরনো caption ফাইল মুছে storage খালি
মুছে ফেলা হবে: `extension-src/caption-worker/`, `extension-src/ghostae-bridge/chrome-worker` (caption bridge duplicate), পুরনো `public/downloads/Ghost-Caption-Worker.zip(+sha)`, পুরনো `public/downloads/Ghostae-Caption.zip` (নতুনটি দিয়ে replace), এবং `scripts/build-caption-bundle.cjs`-এর পুরনো source ফোল্ডার। নতুন `public/downloads/Ghostae-Caption.zip` = uploaded 1.2.3 + license gate ফাইল, sha256 সহ।

## Credit estimate
মোট **≈8–10 credit** (gate script + plan route + admin tweak + repack + cleanup)। বড় ফাইল বাহির থেকে আনার দরকার নেই — gate/plan script ছোট (~150 লাইন)।
