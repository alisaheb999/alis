# Ghostae Text launch pop-up — low-credit plan

## কী হবে
- `/products/text` খুললে একবার একটি সংক্ষিপ্ত launch pop-up দেখাবে।
- আপলোড করা ২.৮ সেকেন্ডের ভিডিও muted autoplay ও loop-এ চলবে; চাইলে ব্যবহারকারী sound চালাতে পারবেন।
- ভিডিওর black background pop-up-এর গভীর কালো surface-এর সঙ্গে মিশবে, আর border/glow-তে নিয়ন্ত্রিত blue gradient থাকবে।
- অল্প copy থাকবে: `Ghostae Text` এবং `Coming soon`—অতিরিক্ত লেখা বা CTA থাকবে না।
- স্পষ্ট close icon, backdrop click এবং Escape key দিয়ে pop-up বন্ধ করা যাবে।
- mobile ও desktop দুটোতেই ভিডিওর 16:9 অনুপাত ও লেখা ঠিক থাকবে।

## বাস্তবায়ন
- ভিডিওটি Ghostae-এর CDN asset হিসেবে সংরক্ষণ করে pointer import করব, repository ভারী করব না।
- pop-up-টি Text product page-এর ভেতর ছোট আলাদা component হিসেবে রাখব।
- semantic color tokens দিয়ে blue-black styling করব এবং reduced-motion preference মানাব।
- desktop ও mobile viewport-এ খুলে autoplay/close/layout যাচাই করব।

## সীমা
- অন্য product page, checkout, pricing বা extension-এর আচরণ বদলাব না।
- প্রথম সংস্করণে pop-up প্রতিবার নতুন page visit-এ আসবে; একই page session-এ বন্ধ করলে আবার উঠবে না।
