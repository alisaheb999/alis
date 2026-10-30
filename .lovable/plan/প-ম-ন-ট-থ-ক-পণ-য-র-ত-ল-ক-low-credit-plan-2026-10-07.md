# পেমেন্ট থেকে পণ্যের তালিকা — low-credit plan

## পরিবর্তন
1. ট্রান্সজেকশন জমা দেওয়ার পরে বড় ইংরেজি **Waiting for confirmation** ও paragraph বাদ। লগইন করা থাকলে সরাসরি নিজের dashboard-এ যাবেন। পুরোনো confirmation link-এ pending থাকলেও একই পথে যাবে।
2. Dashboard-এ যাচাই বাকি থাকা অর্ডার পণ্যের নাম/ছবিসহ দেখাবে। লাইসেন্স কী-এর জায়গায় ছোট চলমান সংকেত ও **যাচাই চলছে…** থাকবে; নিচে ছোট **ম্যানুয়াল অ্যাক্টিভেশন সহায়তা**। ব্যর্থ/বাতিল অর্ডারে ভুল করে যাচাই চলছে দেখাবে না।
3. যাচাই বাকি থাকলে বিরতি দিয়ে পণ্যের তালিকা আপডেট হবে; অনুমোদনের পরে সত্যিকারের লাইসেন্স কী দেখাবে। পেমেন্ট অনুমোদনের নিয়ম বদলাবে না।
4. Lifetime/কিনুন চাপার সঙ্গে সঙ্গে ছোট loading overlay দেখা যাবে; popup খুললে সরে যাবে। নতুন বেশি ওজনের animation library লাগবে না।
5. পেমেন্ট মাধ্যমের logo-র নিচে নাম বাদ; ক্রম **বিকাশ → নগদ → Rocket → উপায়**। বোতামগুলোর পাঠযোগ্য নাম ও সাহায্যের ইঙ্গিত থাকবে।
6. আলাদা শেয়ারযোগ্য **/payment?product=text** পেজ; একই পেমেন্ট ব্যবস্থা খুলবে, পণ্যের অন্য পেজ স্ক্রল করার প্রয়োজন হবে না। পেমেন্ট লিংক কপি করার ছোট অপশন থাকবে।

## অ্যাকাউন্ট নিরাপত্তা
- লগইন না থাকলে নিজের dashboard দেখানোর আগে Login/Create a password প্রয়োজন; শুধু দেওয়া ইমেইল দিয়ে কাউকে লগইন করানো যাবে না। কেনার ইমেইল আগে থেকে বসিয়ে দিয়ে লগইনের পরে নিজের পণ্যের তালিকায় পাঠানো হবে।
- শুধু নম্বরে কেনা হলে মালিকানা যাচাইয়ের বর্তমান support ব্যবস্থা থাকবে। অন্যের অর্ডার/লাইসেন্স দেখানো হবে না।

## Technical details
- Reuse BuyDialog, existing owner-scoped getMyAccount and authenticated dashboard; no new payment gateway, pricing changes or migrations.
- Add a lightweight reusable Suspense purchase fallback and a public TanStack /payment leaf with unique metadata and validated product selection.
- Pending cards derive only from authenticated owner orders; refresh while awaiting actual approval and respect reduced-motion.
- Keep existing paid-confirmation password setup, invoices, coupon validation and support links.
- Verify public shared checkout, provider ordering, loading state, signed-out handoff and authenticated product states; do not submit fabricated payment transactions to the live database.