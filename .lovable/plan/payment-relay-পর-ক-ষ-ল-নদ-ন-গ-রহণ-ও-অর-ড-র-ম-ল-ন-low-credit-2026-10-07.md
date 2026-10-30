# Payment Relay পরীক্ষা — লেনদেন গ্রহণ ও অর্ডার মিলানো (low-credit plan)

## যা তৈরি করব
1. ফোনের heartbeat: ফোন নির্দিষ্ট সময় পর পর জানাবে সে চালু আছে; Admin-এ "Last seen" আপডেট হবে।
2. ফোন থেকে লেনদেন গ্রহণ: amount, প্রেরকের নম্বর, TrxID, provider (bKash/Nagad/Rocket/Upay), সময়। একই TrxID দুবার এলে একবারই রাখা হবে।
3. অর্ডার মিলানো (শুধু পরীক্ষা মোড): TrxID + amount + provider মিললে অর্ডারের পাশে "Relay matched" চিহ্ন দেখাবে। লাইসেন্স নিজে থেকে চালু হবে না — Admin আগের মতো approve করবেন।
4. Admin Payment Relay অংশে "প্রাপ্ত লেনদেন" তালিকা: matched / unmatched / amount mismatch।
5. Antigravity-র জন্য ছোট API নির্দেশিকা (request/response) — ফাইল আকারে।

## সীমা
- Automatic licence activation বন্ধ থাকবে (পরীক্ষামূলক)।
- ফোনের token ছাড়া কেউ লেনদেন পাঠাতে পারবে না; disabled/revoked ফোন প্রত্যাখ্যাত।
- ghostae.com-এ চালাতে নতুন সংস্করণ publish লাগবে।

## Technical details
- Endpoints: `/api/public/relay/v1/heartbeat`, `/api/public/relay/v1/transactions` (Bearer device token, hashed compare, rate limit, no-store).
- New table `relay_transactions` (unique provider+trx_id, device_id, amount, sender, raw text capped, matched_order_id, match_status); admin-only RLS; service-role writes.
- TrxID normalization uppercase/trim; match against `orders` status pending.
- Admin list via existing `relay.functions.ts` with assertAdmin.
