# Caption landing video ও copy cleanup — low-credit plan

## কী বদলাবে
- আগের ডান পাশের panel-এর জায়গায় compact দুই-কলামের hero ফিরবে: বামে ছোট, left-aligned লেখা ও buttons; ডানে 16:9 thumbnail।
- `finel_1.mp4` এবং তার একটি optimized WebP thumbnail asset হিসেবে রাখা হবে। Page খোলার সময় video download হবে না; thumbnail-এ Play চাপলেই video source যুক্ত হয়ে play হবে।
- Version 2 Released badge হবে solid blue background ও white text।
- Hero copy ছোট হবে; auto emoji bullet বাদ যাবে।
- “সহজভাবে শুরু করুন” label ও ব্যাখ্যার paragraph বাদ যাবে।
- পুরো Installation section বাদ যাবে, কারণ video-তেই installation দেখানো হবে।
- Pricing heading শুধু “মূল্য” থাকবে; eyebrow ও অতিরিক্ত description বাদ যাবে।
- FAQ section-এ শুধু “FAQ” heading থাকবে; “সাধারণ জিজ্ঞাসা” ও subtitle বাদ যাবে।
- Bottom download section-এর “দ্রুত, সহজ এবং সম্পূর্ণ ফ্রি” line বাদ যাবে।

## Low-credit strategy
- নতুন library, backend, animation বা video processing service নয়।
- Existing HTML/CSS/React click handler-এ ছোট targeted replacement হবে।
- Video autoplay/preload হবে না (`preload="none"`), তাই initial page speed thumbnail-এর মতোই থাকবে।

## যাচাই
- Desktop 1280px ও mobile 393px-এ hero alignment, thumbnail, Play interaction এবং overflow দেখা হবে।
- Network-এ click-এর আগে MP4 request না হওয়া এবং click-এর পরে load/play হওয়া নিশ্চিত করা হবে।
- Caption download ও license popup আগের মতো রাখা হবে।
