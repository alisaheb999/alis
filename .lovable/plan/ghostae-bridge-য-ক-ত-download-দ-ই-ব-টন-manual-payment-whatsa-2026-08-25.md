# Ghostae — Bridge যুক্ত + Download দুই বাটন + Manual Payment (WhatsApp verify)

কম ক্রেডিটে করার জন্য কাজ ৪ ভাগে, কোনো নতুন বড় কোড লেখা হবে না — শুধু ফাইল বসানো, বাটন/রুট পরিবর্তন আর ছোট wiring।

## ১. Ghost Bridge extension বসানো (file moving only)
`briges.rar`-এ ৪টা zip পাওয়া গেছে:
- `ghostae-ae-panel.zip` → AE CEP panel (manifest + client + jsx/host.jsx) → `extension-src/ghostae-bridge/com.ghost.bridge/`
- `ghostae-vps-extension.zip` → Chrome MV3 worker → `extension-src/ghostae-bridge/chrome-worker/`
- `ghostae-user-bundle.zip` → এই দুইটার একসাথের production bundle (রেফারেন্স)
- `ghostae-admin-production.zip` → শুধু admin/dev source, website-এ যাবে না (admin source pack হিসেবেই থাকবে)

এখন থেকে launch extension ৪টা: **Cache, Text, Presets, Bridge**।

## ২. Download page — ঠিক দুইটা বাটন
- ১০-ক্লিক "release hold" gate আর "Downloads are paused" notice বাদ।
- দুইটা বাটন: **Download for Windows** (`Ghostae-Ecosystem-Windows.zip`) ও **Download for macOS** (`Ghostae-Ecosystem-macOS.zip`)।
- কার্ডে ৪টা প্যানেলের নাম + version, একটাই ecosystem installer।
- `scripts/build-ecosystem.cjs` আপডেট: Bridge panel + Chrome worker staging, আর দুইটা আলাদা zip (Windows → `.cmd` installer, macOS → `.command` installer) `public/downloads/`-এ।

## ৩. Authentication + limitation (উপর-উপর, hard lock নয়)
- `ghost-quotas.ts`-এ Bridge metric (`bridge.send`, `bridge.caption`) যোগ, plan অনুযায়ী limit।
- Bridge panel-এর `cloud.js`/`panel.js`-এ একই তিনটা call বসানো যা Cache/Text/Presets-এ আছে:
  `POST /api/public/v1/license/verify` (activation + device seat), `POST /api/public/v1/quota/check` (limit), `POST /api/public/v1/track` (click/download count)।
- একটা license key যেকোনো প্যানেলে দিলে সব প্যানেল unlock — এটা আগের device-fingerprint verify দিয়েই কাজ করে, নতুন কিছু লাগবে না।

## ৪. Payment — ZiniPay/gateway বাদ, manual + WhatsApp verify
- `/checkout` থেকে gateway redirect (`createCheckout` → payment URL) বাদ।
- আপলোড করা `ghostae_store_payment_gateway.html`-এর ডিজাইন হুবহু React-এ: merchant header, Mobile Banking grid (bKash / Nagad / Rocket / Upay), method modal (Send Money = LIVE, বাকি Coming soon), bKash instruction card (নম্বর `01949085128` + copy), Transaction ID input, note box, VERIFY বাটন, toast, floating WhatsApp বাটন। "Store" শব্দ থাকবে না।
- VERIFY চাপলে: order pending হিসেবে DB-তে (`plan`, `cycle`, `amount`, `trx_id`, `name/phone`) সেভ → এরপর সাজানো WhatsApp template নিয়ে `wa.me/8801345407572`-এ redirect (plan, amount, trx id, নাম সহ)। আমরা manually confirm করলে admin panel থেকে license key যাবে (এই flow আগেই আছে)।
- ZiniPay webhook/verify রুট ও `zinipay.server.ts` নিষ্ক্রিয় করা হবে (secret আর ব্যবহার হবে না)।

## Verification
- Local-এ `/download` দুই বাটন + zip 200, `/checkout` full flow (modal → trx → WhatsApp link), quota endpoint-এ bridge metric টেস্ট।

## ক্রেডিট নোট
সব কাজ ফাইল-মুভ, ছোট edit আর existing endpoint reuse — নতুন বড় ফাইল শুধু একটাই: checkout-এর payment UI (আপনার দেওয়া HTML থেকে সরাসরি রূপান্তর, তাই নতুন ডিজাইন ভাবতে হবে না)।
