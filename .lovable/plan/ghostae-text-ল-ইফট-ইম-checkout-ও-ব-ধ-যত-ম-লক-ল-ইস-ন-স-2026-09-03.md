# Ghostae Text: লাইফটাইম checkout ও বাধ্যতামূলক লাইসেন্স

## লক্ষ্য
বর্তমান Ghostae Text extension-এ key ছাড়া কোনো panel feature ব্যবহার করা যাবে না। বৈধ key server-এ activate/verify হলে তবেই panel খুলবে; revoke, suspend, delete, device revoke, expiry বা admin block হলে আবার lock হবে। পাশাপাশি Text checkout-এর বাকি ছোট UI কাজ শেষ হবে।

## কম-ক্রেডিট কৌশল
- নতুন license system বা বড় ফাইল লিখব না—বিদ্যমান `GhostCloud`, activation/verify API, database licenses, device activation এবং admin control-ই ঠিকভাবে enforce করব।
- বড় `toolkit.js`/`host.jsx` পুনর্লিখব না; শুধু ছোট gate/control file ও HTML script wiring সংশোধন করব।
- বারবার web testing নয়; শেষে একবার package-level license flow check ও ZIP integrity check করব।

## কাজ
1. **Checkout সম্পূর্ণ করা**
   - `text_lifetime` plan হলে মাসিক/বার্ষিক selector দু’জায়গাতেই লুকানো থাকবে।
   - Payment নম্বরের পাশে iconসহ Copy button থাকবে এবং কপি হলে toast দেখাবে।

2. **Key ছাড়া panel সম্পূর্ণ lock**
   - প্রথম launch-এ কোনো key/state না থাকলে activation overlay বাধ্যতামূলকভাবে সামনে থাকবে।
   - শুধু local storage-এ key থাকলেই আর panel unlock হবে না; server-এর valid response ছাড়া unlock নয়।
   - পুরোনো sibling-panel/shared activation নিজে থেকে Text panel খুলে দেবে না; Text-এর key/device verification বাধ্যতামূলক হবে।
   - network error-এ কখনও activate না হওয়া installation fail-closed থাকবে; কেবল আগে server-verified key সীমিত offline grace পাবে।

3. **Server control enforce করা**
   - activation ও recurring verify একই Text license/device-এর জন্য চলবে।
   - revoked, suspended, expired, deleted key, revoked device এবং `BLOCK:` admin নির্দেশ সঙ্গে সঙ্গে gate করবে।
   - `MSG:` admin বার্তা extension-এ দেখাবে।
   - recurring heartbeat server connection ধরে রাখবে; dead key-এর local state মুছে দেবে।
   - client-side code tamper-proof বলে মিথ্যা দাবি করা হবে না; authoritative সিদ্ধান্ত server-side থাকবে এবং premium actions-ও valid license guard দিয়ে আটকানো হবে।

4. **Installable ZIP**
   - বর্তমান `extension-src/ghostae-text` থেকেই clean নতুন ZIP বানাব; website preview adapter বা bypass থাকবে না।
   - ZIP-এর ভেতরের manifest, required scripts এবং gate load-order মিলিয়ে একবার যাচাই করে download file দেব।

## গ্রহণযোগ্য ফল
- fresh install → key prompt; key ছাড়া panel নয়।
- invalid/deleted/revoked/blocked key → panel নয়।
- valid key + allowed device → panel open।
- server সাময়িক offline হলে কেবল আগে verified key grace পাবে।
- Text purchase dialog শুধু Lifetime দেখাবে এবং payment number copy করা যাবে।
