# Homepage Panel ও Device Optimization — Mobile-first Cleanup Plan

## Low-credit strategy
- শুধু homepage-এর **The Ghostae panels** ও **Pro Device Optimization / System Check** অংশ বদলাব।
- নতুন ভারী animation, library, image বা backend কাজ যোগ হবে না। বিদ্যমান Text/Caption image ও System Check logic ব্যবহার হবে।
- একবারে প্রয়োজনীয় ছোট React/CSS পরিবর্তন করে desktop ও 393px mobile-এ যাচাই করব।

## ১. The Ghostae panels
- বর্তমান Ghostae light visual style বজায় রেখে heading, spacing, image frame ও card hierarchy পরিষ্কার করা হবে।
- Mobile-এ স্থির **দুইটি card প্রতি row** থাকবে; card width, image ratio, title/status এবং CTA ছোট screen-এ fit করবে।
- “Ghostae” heading আর ভাঙবে বা এক screen-এর বাইরে যাবে না।
- Live product-এ বাস্তব Text/Caption image থাকবে; unreleased product-এ শুধু পরিষ্কার brand placeholder থাকবে।
- অতিরিক্ত বর্ণনা কমিয়ে card height consistent রাখা হবে; desktop-এ ৪-column layout থাকবে।

## ২. Pro Device Optimization
- ছয়টি একই রকম generic card বাদ দিয়ে একটি সংগঠিত compatibility/readiness layout করা হবে।
- Windows, macOS, After Effects, Premiere, Installer ও License তথ্য একই থাকবে—কোনো নতুন দাবি যোগ হবে না।
- System Check-কে একই section-এর purposeful status area হিসেবে সাজানো হবে, যাতে এটি আলাদা generated card মনে না হয়।
- Mobile-এ দুই-column compatibility grid এবং readable full-width System Check থাকবে; কোনো text clipping/overflow হবে না।

## ৩. Cleanup
- এই দুই section-এর অপ্রয়োজনীয় wrapper, obsolete classes/comments এবং ব্যবহার না হওয়া data attribute থাকলে সরানো হবে।
- কার্যকর `data-surface` বা System Check detection logic অকারণে সরানো হবে না।
- অন্য homepage section, navigation, Ask Ghostae AI, pricing, download ও backend অপরিবর্তিত থাকবে।

## যাচাই
- Desktop ও 393px mobile screenshot দিয়ে card grid, heading fit, overflow এবং section spacing দেখা হবে।
- Homepage load, product links এবং System Check rendering যাচাই করা হবে।
