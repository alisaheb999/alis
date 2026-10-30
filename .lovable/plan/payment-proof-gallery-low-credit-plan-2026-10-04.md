# Payment Proof Gallery — Low-credit plan

## কী বদলাবে
- “ইউজারদের রিভিউ” নামটি বদলে **পেমেন্ট প্রুফ** করা হবে।
- কালো 3D carousel ও দুই পাশের কালো অংশ সম্পূর্ণ বাদ যাবে।
- প্রথমে অল্প কিছু screenshot পরিষ্কার gallery আকারে দেখা যাবে।
- **সব দেখুন** চাপলে সব payment screenshot একটি বড় gallery-তে খুলবে।
- প্রতিটি ছবির নিজস্ব width/height ratio অনুযায়ী card স্বয়ংক্রিয়ভাবে আকার নেবে; fixed/manual image size থাকবে না।
- Home ও Ghostae Text—দুই জায়গাতেই একই reusable gallery থাকবে।

## UI আচরণ
- Mobile-first masonry-style columns, desktop-এ বেশি columns।
- ছবিতে crop হবে না; সম্পূর্ণ screenshot দেখা যাবে।
- বড় gallery keyboard/close button দিয়ে বন্ধ করা যাবে এবং ছোট screen-এ স্বাভাবিকভাবে scroll করবে।

## যাচাই
- Home ও Text page-এ preview gallery, “সব দেখুন”, full gallery এবং close flow পরীক্ষা করা হবে।
- Mobile ও desktop width-এ image ratio, overflow এবং build status যাচাই করা হবে।
