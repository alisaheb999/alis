# Ghostae Text 3.42 — নতুন release বসানো + package/license server connect

## যা বুঝলাম (zip audit)
আপলোড করা zip-এ দুটো আছে:
- **production.zip** → `panel/com.ghost.text` (Ghostae Text panel, manifest 3.42.0, build `3.42.0+20260823.prod`), সাথে `INTEGRATION.md`, `PANEL-PATCH.md` এবং দুটো prompt spec (100 color preset, expression UI)।
- **admin-backend.zip** → কোনো server নয়, শুধু একটা read-only CLI (`stats.mjs`) যা `GET /api/admin/v1/stats` কল করে `X-Ghost-Admin-Token` হেডার দিয়ে।

Panel-এর ডিফল্ট cloud base ইতিমধ্যেই `https://ghostae.com` — অর্থাৎ আলাদা "package server" বানানোর দরকার নেই, **এই server-ই** package server হবে। License generate ব্যবস্থা এখানেই আছে (`/api/public/v1/license/issue` + admin dashboard), তাই key generation নতুন করে বানাতে হবে না — শুধু নতুন panel/stats-এর সাথে যুক্ত করতে হবে।

Panel যেসব endpoint চায়, এই server-এ এখন যা আছে:

| Endpoint | অবস্থা |
| --- | --- |
| `/api/public/v1/license/verify` | ✅ আছে |
| `/api/public/v1/text-styles` | ✅ আছে |
| `/api/public/v1/packages/manifest` | ❌ বানাতে হবে |
| `/api/public/v1/presets` | ❌ বানাতে হবে |
| `/api/public/v1/presets/{name}/download` | ❌ বানাতে হবে |
| `/api/public/v1/color-presets` | ❌ বানাতে হবে |
| `/api/admin/v1/stats` | ❌ বানাতে হবে |

## কাজের ধাপ (low-credit, কোনো বড় code লিখতে হবে না)

**১) পুরনো extension source বদল**
- `extension-src/ghostae-text/com.ghost.text/` মুছে নতুন 3.42 panel বসানো (installer `.bat`/`INSTALL.md` অপরিবর্তিত থাকবে)।
- সাথে আসা `INTEGRATION.md`, `PANEL-PATCH.md`, দুটো PROMPT spec + `COLOR-PRESET-SPEC.md` `extension-src/ghostae-text/docs/`-এ রাখা হবে (ভবিষ্যতের রেফারেন্স)।

**২) Package data এই project-এ**
- `presets/animations/index.json` (500 preset index) আর `presets/color-presets.json` (100 color) থেকে server-side data module — নতুন JSON লেখা লাগবে না, panel-এর ফাইলই source।

**৩) নতুন public endpoints (ছোট route ফাইল, ETag + CORS + fail-open)**
- `packages/manifest` → version + count (panel update poll করবে)
- `presets` → index হুবহু schema
- `presets/$name/download` → document না থাকলে `404 preset_document_not_published` (contract অনুযায়ী, panel local copy-তে fallback করে)
- `color-presets` → `{ version, count, presets[] }`
- প্রতিটিতে `X-Ghost-License` থাকলে existing license verify logic দিয়ে tier বসবে (fail-open → free), raw key কখনো store হবে না — শুধু salted SHA-256 fingerprint।

**৪) Download stats + admin**
- migration: `download_events` টেবিল (RLS on, শুধু service_role) + `download_totals`/`download_daily` view।
- `GET /api/admin/v1/stats` — `X-Ghost-Admin-Token` (existing admin token secret) দিয়ে; আপলোড করা `stats.mjs` CLI সরাসরি কাজ করবে।

**৫) Panel side wiring (৩টি ছোট edit, PANEL-PATCH.md অনুযায়ী)**
- `ghost-config.js`-এ `packagesApi()` যোগ (default = main base, তাই ghostae.com-ই যাবে)
- `ghost-preset-store.js` → `packagesApi` ব্যবহার
- `toolkit.js` color preset loader → server-first, local JSON fallback

**৬) Verify (implement-এর আগেই নিশ্চিত)**
- localhost-এ চারটি নতুন endpoint curl করে দেখা: status, count 500/100, ETag 304, license header দিয়ে tier।
- `stats.mjs`-এর প্রত্যাশিত JSON shape মিলিয়ে দেখা।

## এখন যা করব না (পরে)
License key panel-এ bind করা / seat UI / expression UI redesign / নতুন 100 color preset generate — এগুলো আপনার নির্দেশে পরের ধাপে।

## Technical notes
- সব endpoint `src/routes/api/public/v1/...` (published site-এ auth bypass), admin route আলাদা token-gated।
- Preset JSON বড় (index 500) — route-এ static import করে ETag দিয়ে serve, তাই bundle একবারেই লোড হবে; ছবি/preview কখনো server থেকে যাবে না (panel zip-এ থাকে)।
