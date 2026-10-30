# Product, Free Resources, Payment ও Dashboard — Low-credit plan

## কী বদলাবে
- Products পেজের বড় intro বাদ দিয়ে ছোট **Choose your products** শিরোনাম রাখা হবে; `Available` badge সরানো হবে।
- Caption কার্ডে নামের `AI` uppercase করা হবে না এবং কার্ডে বড় **Under maintenance** অবস্থা দেখিয়ে প্রবেশ/কেনা বন্ধ রাখা হবে।
- নিচে ছোট **Free Extensions & Resources** সেকশন যোগ হবে; প্রতিটি item-এ ছবি, ছোট description, Download ও Tutorial থাকবে।
- Admin-এর Products অংশে Free Resources নিয়ন্ত্রণ যোগ হবে—ছবি URL, description, download URL, tutorial URL, visibility, order, edit/delete। Tutorial ও download-এ Google Drive, YouTube, PDF বা যেকোনো valid web link গ্রহণ করবে।

## Payment screen
- Payment খোলা থাকলে body scroll সম্পূর্ণ lock থাকবে; wheel করলেও site header/footer দেখা যাবে না।
- popup ছোট ও viewport-এর মধ্যে compact হবে; support-এর তিন icon button ছোট ও কার্যকর থাকবে।
- বাইরে click করলে বন্ধ হবে না—শুধু close button বন্ধ করবে।
- `নোটঃ` label বাদ যাবে; instruction-এর সাধারণ লেখা সাদা এবং গুরুত্বপূর্ণ অংশ yellow থাকবে।
- amount সব জায়গায় coupon-পরবর্তী payable amount দেখাবে। Verify চলাকালে **Mid-level verification চলছে…** দেখাবে; সফল হলে pending admin verification স্পষ্ট হবে।

## User dashboard
- প্রতিটি কেনা product আলাদা করে নামসহ দেখাবে।
- তার license key, plan, status, device limit, validity পরিষ্কার থাকবে।
- প্রতিটি লাইসেন্সের পাশে **Download** ও **Tutorial** button থাকবে।
- Payment approval-এর পর dashboard-এ order status ও license একসাথে বোঝা যাবে।

## Technical details
- Free Resources-এর জন্য RLS ও প্রয়োজনীয় grants-সহ একটি public read/admin write table যোগ হবে; public page safe columns-ই পড়বে।
- Admin কাজ authenticated server function দিয়ে role-check করে হবে।
- Existing WhatsApp confirmation, coupon, order creation ও license activation flow অক্ষুণ্ণ থাকবে।
- Desktop/mobile-এ payment flow, close behavior, products/resources এবং dashboard যাচাই করা হবে; current build error logও পরিষ্কার রাখা হবে।
