# Products → Buy Now: এক জায়গায় ছোট্ট popup flow

লক্ষ্য: user ১০ সেকেন্ডে plan বুঝবে, কম click-এ কিনবে, page কোথাও change হবে না।

## ১. Product card (২টি action)

- বাম button: **Download** — উপরে ছোট্ট badge "Try free"।
- ডান button: **Buy now** (আগের "Pricing" লেখা বাদ)।
- Download আগের মতোই ছোট modal-এ কী পাচ্ছে + ZIP link দেখাবে।

## ২. Buy now → Step 1 popup: pricing table

একটাই ছোট popup, ৩ layer/row (text-স্টাইল, অতিরিক্ত কথা নেই):

```text
Free 🔷    দৈনিক ৫ মিনিট    মাসিক ১৫০ মিনিট     ৳০ / মাস        ৳০ / বছর        [Try free]
Light 🔹   দৈনিক ৩০ মিনিট    মাসিক ৯০০ মিনিট     ৳১৯৯ / মাস      ৳১,৯৯৯ / বছর    [কিনুন]
Pro ⭐     দৈনিক ১২০ মিনিট   মাসিক ৩,৬০০ মিনিট   ৳৩৯৯ / মাস      ৳৩,৯৯৯ / বছর    [কিনুন]
```

- উপরে একটি ছোট Monthly / Yearly toggle; দাম সেই অনুযায়ী দেখাবে।
- Free row-এর button সরাসরি download দেবে।
- Light/Pro-এর "কিনুন" → একই popup-এর Step 2 (navigation নেই)।

## ৩. Step 2 popup: order form (একই popup-এর ভেতর)

উপরে এক লাইনে: প্ল্যান নাম · cycle · টাকার পরিমাণ।

1. Email অথবা মোবাইল নম্বর (একটি field)
2. Coupon code (optional, Apply — বর্তমান coupon যাচাই logic ব্যবহার হবে)
3. Payment method select (bKash / Nagad / Rocket / Upay)
4. Select করার পর: "এই নম্বরে ৳X send money করুন — 01949085128"
5. Transaction ID field
6. **Confirm** button

## ৪. Step 3 popup: verifying + WhatsApp

- "Verifying… Admin-কে পাঠানো হয়েছে" — সফল হলে সবুজ tick সহ ছোট confirmation।
- বড় **WhatsApp**-এ confirm করুন button → +880 1345 407572-এ order details সহ prefilled message।
- নিচে ছোট লাইন: license key যাচাইয়ের পর email/WhatsApp-এ পাঠানো হবে।

## ৫. পুরনো checkout

- `/checkout` page থেকে আর কোনো link/CTA থাকবে না (আপাতত hide, ফাইল থাকবে fallback হিসেবে)।
- Product page-এর Buy now-ও এখন এই popup খুলবে, `/checkout`-এ যাবে না।

## Technical notes

- নতুন component: `src/components/ghostae/BuyDialog.tsx` — ৩ ধাপ এক dialog-এ (`step` state), বর্তমান design tokens ও Radix dialog reuse।
- Server logic নতুন কিছু নয়: বিদ্যমান `checkCoupon` + order-submit server function গুলোই ব্যবহার হবে (`src/routes/checkout.tsx` থেকে যা কল হয়, একই)।
- Quota text `src/lib/products-catalog.ts`-এ product-এর `plans` মেটাডেটায় যাবে, যাতে ভবিষ্যতে নতুন product-এর নিজের chart দেওয়া যায়।
- `src/routes/products/index.tsx` — Pricing button → Buy now; Download-এ "Try free" badge।
- `src/routes/products/$slug.tsx` — একই BuyDialog ব্যবহার, page-এর duplicate plan block বাদ।
- Credit কম রাখতে: শুধু এই ৪টি ফাইল স্পর্শ করা হবে, কোনো backend/route নতুন তৈরি হবে না।
