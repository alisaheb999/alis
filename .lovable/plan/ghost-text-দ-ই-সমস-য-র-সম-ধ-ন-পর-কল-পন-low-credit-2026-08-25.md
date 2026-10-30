# Ghost Text — দুই সমস্যার সমাধান পরিকল্পনা (low credit)

## সমস্যা ১: "Unknown animation: …"

### আসল কারণ
- Panel-এর card list (`js/toolkit.js`) এ **৮৭৮টি** animation নাম আছে (Cipher Glitch 049, Deep Kinetic Glide 015 …)।
- কিন্তু AE-side engine (`js/host.jsx` → `tkApplySingleAnimation`) হচ্ছে একটা বড় `switch`, যেখানে শুধু হাতে-লেখা নামগুলোর `case` আছে। নম্বরযুক্ত generated নামগুলো কোনো `case`-এ পড়ে না → `default:` → `"Unknown animation: " + name`।
- আগের fix গুলো ছিল per-name hardcode (`Bold Kinetic Lift 027` ইত্যাদি) — এটা ৮৭৮টা নামের জন্য কখনোই কাজ করবে না।

### সমাধান (একবারেই সব নাম ঠিক)
`default:` case-এ fail করার বদলে **procedural fallback engine** বসানো:

1. নাম থেকে family word বের করা: `glitch / kinetic / glide / lift / fade / blur / scale / slide / spin / wave / typewriter / comet / cipher …`
2. নামের শেষের নম্বরটা (049, 015) কে **seed** ধরে deterministic variation তৈরি: direction, distance, blur amount, stagger, rotation, ease।
3. Family অনুযায়ী base rig (আগের কাজ করা case গুলোর ভেতরকার একই helper: `tkTextAnimator`, `tkRangeSelector`, `tkKey`, blur/glitch effect) দিয়ে animation build।
4. কোনো family না মিললে → safe generic "fade + rise + stagger" (কখনো error না)।
5. তারপর existing validation (keyframe count check) চালানো, তাই silent-fail-ও ধরা পড়বে।

ফল: প্রতিটা card apply হবে, একই নাম সবসময় একই animation দেবে (seeded), আর "Unknown animation" toast আর আসবে না।

## সমস্যা ২: Style preview ≠ AE result

### আসল কারণ
- Card preview হচ্ছে **CSS** (`-webkit-text-stroke`, `text-shadow`, `background-clip:text`, `filter: drop-shadow`)।
- AE-side applier (`tkApplyExtrude`, `tkApplyMultiColor`, `tkApplyGradient`) আলাদা কোড, আলাদা সংখ্যা দিয়ে approximate করে → glow হারায়, gradient flat হয়, stroke মোটা/সরু হয়, shadow offset সরে যায় (screenshot-এ ঠিক এটাই: card-এ soft golden, AE-তে flat grey + hard shadow)।
- Comp scale মেলানো হয় না — preview px ≠ comp px।

### সমাধান
1. **এক spec, দুই renderer**: প্রতিটা style এর জন্য একটাই object — `{fill, stroke:{w,color}, shadow:[{x,y,color}], glow:{radius,intensity}, gradient:[stops], tracking, caps}`।
   - CSS preview ওই spec থেকেই generate হবে।
   - AE applier ওই একই সংখ্যাগুলো থেকে layer/effect বানাবে (Stroke, Drop Shadow ×N, Glow, Gradient Ramp)।
   - কোনো আলাদা "approximation" কোড থাকবে না।
2. **Scale normalization**: spec-এর px value গুলো preview font-size ধরে ratio করে comp font-size অনুযায়ী গুণ করা — তাই stroke/shadow অনুপাত মিলবে।
3. **Colour**: hex → AE value দেওয়ার সময় project linearized হলে sRGB→linear convert (এখন raw /255 দেওয়া হয়, তাই রঙ ফ্যাকাশে/অন্যরকম লাগে)।
4. **সৎ label**: যে style গুলো AE-তে ১০০% match সম্ভব না (multi-layer glow blend), সেগুলোর card-এ ছোট "≈" badge — user আর confused হবে না।
5. (পরের ধাপ, optional) hero style গুলোর জন্য আসল `.ffx` + render করা PNG preview → mismatch একেবারে অসম্ভব। এর জন্য AE থেকে export করা `.ffx` ফাইল দরকার।

## Credit-সাশ্রয়ী execution plan

| ধাপ | কাজ | কে করবে |
|---|---|---|
| 1 | `host.jsx`-এ procedural fallback engine (~150 line) | **আপনি বাইরের AI দিয়ে generate করবেন** — আমি exact spec + ready-to-paste prompt দেব |
| 2 | ওই block আমি `host.jsx`-এ integrate + wire করব | আমি (ছোট edit) |
| 3 | Style spec table + CSS generator + AE applier (~200 line) | আবার external prompt, আমি integrate |
| 4 | `≈` badge + scale/colour fix | আমি (ছোট edit) |
| 5 | ecosystem ZIP rebuild + URL verify | আমি |

ধাপ ১+২ আগে করলেই সবচেয়ে বড় অভিযোগ (Unknown animation) দূর হবে। Approve করলে আমি প্রথমে **ধাপ ১-এর prompt** দিচ্ছি।
