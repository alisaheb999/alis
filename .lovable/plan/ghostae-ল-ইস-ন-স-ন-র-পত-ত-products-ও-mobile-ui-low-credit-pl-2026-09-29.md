# Ghostae লাইসেন্স নিরাপত্তা, Products ও Mobile UI — Low-credit plan

## লক্ষ্য
প্রত্যেক ইউজারকে শুধু তার নিজের লাইসেন্স দেখানো, একই ইউজার/প্রোডাক্ট ও একই device activation-এর duplicate বন্ধ করা, এবং Products/Free Resources/Header/Footer-কে mobile-firstভাবে পরিষ্কার করা।

## ১. লাইসেন্স isolation ও duplicate prevention — সর্বোচ্চ অগ্রাধিকার
- User dashboard-এর লাইসেন্স ও order query-তে authenticated user ID-এর explicit owner filter যোগ করব। এতে admin permission থাকা account-ও নিজের user dashboard-এ অন্যদের লাইসেন্স দেখবে না।
- Verified email দিয়ে পুরোনো purchase claim করার সময় শুধু matching, unowned rows link হবে; অন্য কারও row কখনো আসবে না।
- প্রতি user প্রতি product-এ সর্বোচ্চ একটি licence enforce করব: Ghostae Text-এর একটি, Ghostae Caption-এর একটি—plan variant বদলালেও নতুন key না বানিয়ে আগের product key reuse/update হবে।
- Email-ভিত্তিক pre-account purchase-এর ক্ষেত্রেও একই product-এর existing key reuse হবে; order approval, manual issue এবং অন্যান্য issuance path একই shared rule ব্যবহার করবে।
- একই device-এর একই licence activation ইতিমধ্যে থাকা row-ই reuse করবে; duplicate activation insert হবে না এবং seat count ভুলভাবে বাড়বে না।
- Database-level unique protection যোগ করব, যাতে UI/API bug হলেও duplicate user-product licence তৈরি না হয়। বর্তমান owner-বিহীন পুরোনো key অন্ধভাবে delete করব না।
- Dashboard-এ defensive deduplication থাকবে, যাতে legacy duplicate থাকলেও user একই product/license বারবার না দেখে।

## ২. Products section mobile redesign
- “Choose your products” বদলে সংক্ষিপ্ত trust-focused heading দেব: **Official Ghostae Extensions — Built for High-Demand Creative Workflows**; Bangla mode-এ স্বাভাবিক বাংলা copy থাকবে।
- Mobile-এ product cards প্রতি row-তে ২টি; tablet/desktop-এ সমান, স্থিতিশীল grid।
- ছোট screen-এর জন্য image ratio, title, badge, description ও action compact করব—text overflow বা button collision থাকবে না।

## ৩. Free Extensions & Resources redesign
- Section-টি নতুন visual hierarchy, পরিষ্কার thumbnail, compact description এবং স্পষ্ট Download/Tutorial actions দিয়ে redesign করব।
- Mobile-এ প্রতি row-তে ২টি resource; বড় screen-এ balanced multi-column grid।
- প্রতিটি resource-এ admin-controlled unique slug থাকবে এবং existing `/products/$slug` page-কে প্রসারিত করে shareable URL দেব; নতুন route file তৈরি করব না।
- Slug page-এ resource title, description, image, Download ও Tutorial থাকবে এবং নিজস্ব SEO/share metadata থাকবে।

## ৪. Admin image upload ও automatic optimization
- Free Resource admin form-এর image URL box-এর পরিবর্তে image upload control দেব, সঙ্গে thumbnail preview/replace state।
- Browser-এ image resize করে WebP বানাব এবং quality/dimension ধাপে কমিয়ে **সর্বোচ্চ 80 KB** নিশ্চিত করব; তারপর managed media storage-এ upload হবে।
- শুধু verified admin upload/save/delete করতে পারবে; public visitor শুধু published resource image দেখতে পারবে।
- Slug auto-generate হবে, তবে admin edit করতে পারবে; duplicate slug save হতে পারবে না।

## ৫. WhatsApp community prompt
- Free resource-এর Download click-এ একবার community invitation modal দেখাব।
- **প্রতি browser-এ একবার** দেখানোর state থাকবে; Join করলে বা Close করলে পরেরবার আর বাধা দেবে না।
- Close/Continue-এর পর original download স্বাভাবিকভাবে চলবে; WhatsApp CTA বর্তমান official group link ব্যবহার করবে।

## ৬. Header ও Footer polish
- Sticky top navigation-এ হালকা translucent background, blur, border ও shadow দেব—scroll-এর সময় নিচের লেখা navigation-এর সঙ্গে মিশবে না।
- Mobile menu position, safe spacing ও open state ঠিক করব।
- Footer mobile ও desktop উভয়ের জন্য পুনর্গঠন করব: brand/community প্রথমে, links compact columns-এ, account/support ও copyright পরিষ্কারভাবে; overflow ও অতিরিক্ত ফাঁকা জায়গা বাদ যাবে।

## ৭. যাচাই
- দুইটি আলাদা user context দিয়ে নিশ্চিত করব যে একজন অন্যজনের licence/order দেখতে পারে না; admin account-এর user dashboard-ও শুধু নিজের data দেখায়।
- একই user/product পুনরায় issue এবং একই device পুনরায় activate করে নিশ্চিত করব key/activation reuse হয়।
- 400px mobile এবং 1280px desktop-এ Products, resource slug page, community prompt, sticky header ও footer visually পরীক্ষা করব।
- Uploaded image WebP এবং 80 KB বা কম কিনা পরীক্ষা করব; public load ও broken-image state যাচাই করব।
- Build, relevant tests এবং browser flow সফল না হওয়া পর্যন্ত Publish করব না।

## Technical details
- Existing RLS থাকবে; user-facing reads-এ explicit `user_id = authenticated user` filter যোগ হবে যাতে admin SELECT policy accidental broad result না দেয়।
- Licence rows-এ normalized `product_key` ব্যবহার করে partial uniqueness: linked users-এর জন্য `(user_id, product_key)` এবং pre-account rows-এর জন্য normalized email + product।
- Existing `(license_id, device_fingerprint)` uniqueness বজায় থাকবে; সব activation path conflict-safe reuse করবে।
- `free_resources`-এ unique `slug` যোগ হবে; current product detail route static product না পেলে published resource lookup করবে।
- নতুন public table হলে নয়; existing table migration-এ grants/RLS অক্ষুণ্ণ থাকবে। Media upload privileged server action দিয়ে হবে।
