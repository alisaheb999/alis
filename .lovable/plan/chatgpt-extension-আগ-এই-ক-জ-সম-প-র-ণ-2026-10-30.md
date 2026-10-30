# ChatGPT Extension: আগে এই কাজ সম্পূর্ণ

## পেজ ও ছবি
- বর্তমান `/digital/live/chatgpt-plus-renew` ঠিকানা, **ChatGPT Extension by Ghostae**, **১৯৯ টাকা / এক মাস** এবং **৩০ দিনের ওয়ারেন্টি** অপরিবর্তিত থাকবে।
- আপনার দেওয়া showcase ছবি ব্যবহার করব; নতুন ছবি তৈরি করে খরচ বাড়াব না। ছবির দৃশ্যকে বাস্তবে পরীক্ষিত screenshot বা unlimited সুবিধার প্রমাণ বলব না।
- Ghostae Text-এর মতো বাম-সারিবদ্ধ নাম, ছোট version, বড় preview, সংক্ষিপ্ত বাংলা লেখা এবং নিচে মূল্যসহ purchase control থাকবে। আলাদা পাশের price column থাকবে না।
- ইনস্টল নির্দেশনা খুলে দেখা যাবে; পরে আপনার দেওয়া প্রকৃত screenshot যুক্ত করা যাবে। ছবি/নাম-ভিত্তিক ছোট catalogue cards অক্ষুণ্ণ থাকবে।

## ডাউনলোড ও ইনস্টল
- দেওয়া ZIP-এর Manifest V3, popup, licence verification, network behavior ও permissions আগে পরীক্ষা করব; ভেতরের script চালিয়ে পরীক্ষা শুরু করব না।
- ZIP-এ সব HTTP/HTTPS সাইটের অনুমতি আছে। কার্যকারণের সঙ্গে মিলিয়ে অপ্রয়োজনীয় অনুমতি কমাব; activation-এর জন্য দরকারি সংযোগ ভাঙব না। ব্যক্তিগত token বা account session থাকলে ওই ZIP প্রকাশ করব না।
- পরীক্ষায় hardcoded account token পাওয়া যায়নি; তবে extension একটি আলাদা Ghostae activation service থেকে ChatGPT session cookies নেয়। Website-এর inventory-তে কি থাকা মানেই ওই service-এ কি কার্যকর—এমন ধরে নেব না। ওই service-এর মালিকানা/সক্রিয়তা এবং কি-র সামঞ্জস্য যাচাই না হওয়া পর্যন্ত বিতরণ আটকে থাকবে।
- Popup-এ expiry দেখানোর সঙ্গে activation response-এর অসামঞ্জস্য আছে; বাস্তব response থেকে মেয়াদ দেখাব, বানানো countdown নয়। Revocation/deactivation বর্তমান ChatGPT login-ও সরাতে পারে; আলাদা browser profile ব্যবহারের সতর্কতা থাকবে।
- Heartbeat-এ licence query string এবং chat-ID সংগ্রহের privacy ঝুঁকি আছে। বাইরের service না বদলে request contract হঠাৎ বদলাব না; নিরাপদ পরিবর্তনের জন্য service access লাগলে সেটি নির্দিষ্ট blocker হিসেবে জানাব।
- ডাউনলোড কেবল অনুমতিপ্রাপ্ত ক্রেতাকে ব্যক্তিগত সংরক্ষণ থেকে স্বল্পমেয়াদি link দিয়ে হবে; paid ZIP-এর public CDN link নয়।
- নির্দেশনা: ZIP unzip → `chrome://extensions` → Developer mode → Load unpacked → `manifest.json` থাকা folder নির্বাচন → Ghostae pin → licence code লিখে Activate Access → Open ChatGPT। Edge-এর ঠিকানাও থাকবে।
- এটি Chrome Web Store-এর এক-click installation নয়; সাধারণ desktop Chrome/Edge প্রক্রিয়া। ফোনের Chrome-এ এই installation চলবে বলে দাবি করব না।
- সরবরাহকৃত README-এর unlimited model, নির্দিষ্ট reset-time ও সম্পূর্ণ chat isolation দাবি যাচাই ছাড়া ওয়েবসাইটে ব্যবহার করব না। Deactivate/device-change আচরণ কোডের সঙ্গে মিলিয়ে সতর্কতা দেব।

## পেমেন্টের পর লাইসেন্স
- বিদ্যমান automatic payment verification ও ব্যক্তিগত ৫০-কির inventory ব্যবহার করব; Canboso/Shopbot-এর ওপর এই পণ্যের কাজ নির্ভর করবে না।
- যাচাইকৃত provider + transaction ID + সঠিক amount মিললেই একটি অর্ডারে একটি licence; শুধু transaction জমা দেওয়া মানেই payment approved নয়।
- পেমেন্ট অপেক্ষমান থাকলে সঠিক অবস্থা; সফল হলে licence, copy action, নিরাপদে সংরক্ষণের সতর্কতা, download এবং activation নির্দেশনা একই জায়গায় থাকবে। WhatsApp শুধু সমস্যা হলে সহায়তা।
- page/dialog বন্ধ করে আবার এলে একই অনুমতিপ্রাপ্ত browser থেকে order পুনরায় দেখা যাবে; শুধু order ID দিয়ে licence বা ZIP পাওয়া যাবে না।
- popup যে code format গ্রহণ করে ও বাইরের activation service যে licence স্বীকার করে, তার সঙ্গে দেওয়া inventory মিলিয়ে দেখব। Website delivery এবং extension activation দুটি আলাদা ধাপ—দ্বিতীয়টি যাচাই না হলে সম্পূর্ণ হয়েছে বলব না।

## কম খরচের প্রযুক্তিগত পদ্ধতি
- বর্তমান checkout, relay, private delivery ও shared design tokens পুনর্ব্যবহার; দ্বিতীয় checkout বা নতুন supplier সংযোগ নয়।
- browser-safe guide/download controls আলাদা ছোট module-এ; file delivery server-side permission যাচাই করবে। প্রয়োজন ছাড়া নতুন table নয়।
- দিয়েছেন যে ছবিটি, সেটি asset pointer দিয়ে সংরক্ষণ; ZIP private storage-এ। Page metadata বাস্তবে দেখানো ছবির উপযুক্ত URL থাকলে ব্যবহার করবে।
- প্রথমে extension contract/security, তারপর page/download, তারপর payment delivery ও পরীক্ষা। অন্য roadmap-এর কাজ এই পর্যায়ে করা হবে না।

## যাচাই ও সম্ভাব্য বাধা
- নির্দিষ্ট price/warranty, last-key race, একই payment পুনর্ব্যবহার, duplicate callback, SMS আগে/পরে আসা, অন্য browser থেকে licence/download চাওয়া পরীক্ষা।
- desktop ও mobile-এ preview → purchase → pending → authorized licence → download/guideline flow পরীক্ষা; fixture-ভিত্তিক পরীক্ষা আর প্রকৃত payment স্পষ্ট আলাদা করব।
- বাস্তব payment বা licence activation করলে account/কি খরচ হতে পারে। অনুমতি ছাড়া আসল payment বা inventory licence ব্যবহার করে activation করব না; বাহ্যিক service অনুপলব্ধ হলে নির্দিষ্ট বাধা জানাব।
- শেষ প্রতিবেদনে সম্পন্ন, পরীক্ষিত ও অযাচাইকৃত অংশ আলাদা থাকবে; অন্য পণ্যের কাজ পরে।