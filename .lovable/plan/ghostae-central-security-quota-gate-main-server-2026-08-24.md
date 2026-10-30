# Ghostae — Central Security & Quota Gate (main server)

বুঝেছি: asset ফাইল (Presets `.aep`, Text preset/JSON) আলাদা sub-server-এ আছে (Apps Script / Drive)। Main server = license + quota + security brain। Sub-server ফাইল দেওয়ার আগে main server-কে জিজ্ঞেস করবে "allow?"।

## Low-credit strategy
- বড় কোনো panel UI code লিখব না। শুধু server-side ছোট module + endpoint।
- Quota সংখ্যা আগেই pricing (`ghost-plans.ts` COMPARE_ROWS) থেকে নেওয়া হবে — নতুন করে কিছু ঠিক করতে হবে না।
- Sub-server-এ বসানোর জন্য ~40 লাইনের একটা drop-in snippet + doc দিব (তুমি paste করবে)।

## 1. Metric registry
নতুন `src/lib/ghost-quotas.ts` — প্রতি panel-এর metric key → plan অনুযায়ী মাসিক limit:
`cache.download`, `cache.removebg`, `cache.ai.image`, `text.animation`, `text.color`, `text.emoji`, `text.expression`, `presets.standard`, `presets.premium`, `presets.save`, `tools.autocut.min`, `tools.removebg`, `tools.ai`, `bridge.*`, `idea.*`, `one.*`, `command.*` (free/pro/ultra/team + basic mapping)।

## 2. Database (1 migration)
- `usage_counters(license_id, scope_key, metric, period 'YYYY-MM', used, updated_at)` — unique(scope_key, metric, period), RLS on, শুধু `service_role` grant।
- SQL function `ghost_consume_quota(scope, license, metric, period, amount, limit)` — atomic upsert, limit ছাড়ালে increment করবে না, ফিরিয়ে দেবে `{allowed, used, limit}`।

## 3. Server helper
`src/lib/ghost-quota.server.ts`:
- license verify + device seat check (existing `licenses` / `license_activations` reuse)
- `consume(metric, amount, dryRun)` → allowed / used / limit / remaining / reset_at
- `usageSnapshot()` → সব metric-এর remaining (panel-এ দেখানোর জন্য)
- unlicensed/free fallback: license না থাকলে device fingerprint scope-এ free limit চলবে

## 4. Endpoints (main server)
- `POST /api/public/v1/quota/check` — panel: HMAC signed, dry-run supported
- `POST /api/public/v1/quota/usage` — panel: সব metric-এর used/limit
- `POST /api/public/v1/service/authorize` — **sub-server → main server**: header `x-ghost-service-token` (নতুন secret `GHOST_SERVICE_TOKEN`) + body `{license_key, device_fingerprint, metric, asset}` → `{allowed, plan, remaining, grant}` (grant = 5 মিনিটের HMAC token, sub-server চাইলে offline verify করতে পারবে)। Deny হলে 402/429 + কারণ।
- Rate limit + event log সব কটাতেই (existing `rateLimit` / `logEvent` reuse)।

## 5. নিজের route-গুলোতেও enforce
`presets.$name.download`, `templates.$slug`, `image/remove-bg`, `ai/chat` — call করার আগে quota consume; ছাড়িয়ে গেলে 429 with `reason: quota_exceeded`।

## 6. Sub-server guard (তোমার জন্য paste-ready)
`extension-src/SUBSERVER-GUARD.md` — Apps Script `doPost` এর শুরুতে বসানোর ছোট `ghostAuthorize()` snippet: license key + device + metric নিয়ে main server-এ UrlFetch → allow হলে file/Drive link দেবে, নাহলে `{error:"quota_exceeded"}`।

## 7. Admin visibility
`/api/admin/v1/stats` — plan/metric অনুযায়ী চলতি মাসের usage rollup + top license list।

## Technical notes
- সব secret handler-এর ভিতরে `process.env[...]` দিয়ে পড়া হবে।
- নতুন secret: `GHOST_SERVICE_TOKEN` (generate করা হবে, কোথাও দেখানো হবে না) — এটা sub-server-এ Script Property হিসেবে বসাতে হবে।
- Period = calendar month (UTC), প্রতি মাসে auto reset।
