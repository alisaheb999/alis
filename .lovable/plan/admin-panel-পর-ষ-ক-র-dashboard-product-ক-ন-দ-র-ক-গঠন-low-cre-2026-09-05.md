# Admin Panel — পরিষ্কার Dashboard + Product-কেন্দ্রিক গঠন (low-credit)

## Low-credit strategy (আগে এটা পড়ুন)
- বড় UI ফাইল (Dashboard, Product detail) আমি নিজে লিখব না। প্রতিটার জন্য **precise spec + ready-to-paste prompt** দেব, আপনি অন্য AI দিয়ে বানিয়ে পেস্ট করবেন — আমি শুধু বসিয়ে/জোড়া লাগাব।
- আমি নিজে করব শুধু ছোট কাজ: nav গঠন বদলানো, অপ্রয়োজনীয় ট্যাব বাদ, ১টা migration, ছোট server function, auto-block নিয়ম।
- পুরোনো যেসব server function আছে (license, device, coupon, pricing, payment, control, patch) সব **reuse** — নতুন করে কিছু লেখা হবে না।

## নতুন গঠন (বাঁ পাশের মেনু)
1. **Dashboard** (নতুন) — আয়, নতুন লাইসেন্স, active device, দিন-ভিত্তিক chart (উন্নতি/অবনতি), page-wise visitor, top product.
2. **Products** — user যেভাবে দেখে সেভাবে product card। card-এ ক্লিক করলে ওই product-এর ভিতরে:
   - Active license (নাম, email, device, তারিখ)
   - Revoked/Deleted license
   - Active device তালিকা
   - **Pricing & Payment** (ওই product-এরই ভিতরে, বাইরে নয়)
   - Coupon/Voucher, Patch/Update notice — product-ভিত্তিক
3. **Orders** (নতুন) — user purchase করলে নাম/email/amount/ট্রানজেকশনসহ এখানে আসবে; এখান থেকেই **Activate** করলে license issue হবে।
4. **Users** (নতুন) — user data, contact, কে কী কিনেছে, follow-up/convince করার জন্য তালিকা + export।
5. **System Logs & Security** — log + auto-block নিয়ম।
6. **Diagnostics** — থাকবে (ছোট)।

**বাদ যাবে:** AI Brain, Feedback/Fixes, গ্লোবাল Patch Updates, গ্লোবাল Pricing & Payments tab, Diagnostics-এর অপ্রয়োজনীয় অংশ।

## Auto security block
- `security_events` নিয়ম: একই device/IP থেকে সন্দেহজনক signal (tamper report, বারবার signature fail, ভুয়া fingerprint, দ্রুত key try) → নির্দিষ্ট সীমা ছাড়ালে ওই license **automatic suspend** + log-এ কারণ।
- Admin panel-এ "Blocked" তালিকা + এক ক্লিকে **Unblock**।
- এটা বিদ্যমান `license.tamper` route ও `logEvent`-এর উপরেই বসবে।

## Database (১টা migration)
- `orders` (নাম, email, phone, product, amount, method, txn, status pending/activated, license_key, created_at)
- `page_views` (path, day, count) — হালকা counter, dashboard visitor chart-এর জন্য
- `security_blocks` (license_id, reason, signal_count, blocked_at, unblocked_at)
- সব public table-এ RLS + service_role GRANT; ব্রাউজার থেকে সরাসরি পড়া হবে না।

## নতুন ছোট server function (আমি লিখব)
- `adminDashboardCode` — এক কলে সব KPI + chart data
- `adminOrdersCode` / `adminActivateOrderCode`
- `adminUsersCode`
- `adminSecurityCode` / `adminUnblockCode`
- `trackPageView` — public route, dashboard visitor-এর জন্য

## আপনার জন্য যেগুলো prompt আকারে দেব
- `AdminDashboard.tsx` — KPI card, chart, visitor তালিকা (আপনার দেওয়া style/theme অনুযায়ী)
- `AdminProductDetail.tsx` — product-এর ভিতরের সব tab
- চাইলে পুরো admin shell-এর নতুন theme (গোছানো sidebar + header)

## ধাপ
1. Migration + ছোট server function (এই ধাপ আমি করব)
2. Nav গঠন বদল + অপ্রয়োজনীয় tab বাদ (আমি)
3. Dashboard ও Product detail UI — spec+prompt → আপনি এনে দিলে আমি integrate
4. Orders → Activate flow যুক্ত করা (আমি)
5. Auto-block নিয়ম চালু (আমি)

ভবিষ্যতের software connection-এর জন্য Orders/License API আগে থেকেই token-ভিত্তিক রাখা হবে, তাই পরে শুধু key দিলেই চলবে।
