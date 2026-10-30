# Payment Relay পরীক্ষামূলক pairing — low-credit plan

## বর্তমান সমস্যা
- ফোনে কোড লেখা যায়; ওয়েবসাইট থেকে কোড কোথায় পাবেন সেটিই সমস্যা।
- ওয়েবসাইটে এখনো Payment Relay pairing code তৈরি বা ফোন সংযোগের ব্যবস্থা নেই।
- Antigravity-এর দেওয়া ফাইলটি ৮০ লাইনে pairing request-এর মাঝখানে শেষ হয়েছে; সফল সংযোগের response ও পরবর্তী ফোনের অনুরোধগুলো নেই।

## যা তৈরি করব
1. বর্তমান Admin-এ **Payment Relay · Testing** অংশ: নতুন pairing code তৈরি, কপি, মেয়াদ ও সংযুক্ত ফোনের তালিকা।
2. একবার ব্যবহারযোগ্য ৮ অক্ষরের কোড; ১০ মিনিট পরে মেয়াদ শেষ। সংযুক্ত ফোন বন্ধ বা সংযোগ বাতিল করা যাবে।
3. ফোনের জন্য health check ও pairing সংযোগ। কোড যাচাইয়ের পরে ফোনকে নিজস্ব গোপন token দেওয়া হবে।
4. Admin অনুমতি, মেয়াদ, একই কোডের পুনঃব্যবহার ও ভুল কোড যাচাই করে পরীক্ষা।

## সীমা
- এটি শুধু পরীক্ষামূলক সংযোগ; বর্তমান payment approval বা licence activation বদলাবে না।
- এই ধাপে transaction matching/automatic payment verification চালু হবে না।
- ফোনের কোড লেখার পর সফল সংযোগ নিশ্চিত করতে Antigravity-এর পূর্ণ API request/response বিবরণ লাগবে; বর্তমান ফাইলটি অসম্পূর্ণ।
- ghostae.com-এ ব্যবহার করার আগে অনুমতি নিয়ে ওয়েবসাইটের নতুন সংস্করণ publish করতে হবে; এখন নিজে থেকে publish করব না।

## Technical details
- Existing admin tab and server-side admin-role verification; no new authentication system.
- Admin-only `relay_devices` and hashed `relay_pairing_codes`, explicit grants and RLS; do not store plain pairing codes or device tokens.
- Atomic code consumption/device registration through a service-role-only SQL function; bounded input and persistent abuse controls.
- Public routes: `/api/public/relay/v1/health` and `/api/public/relay/v1/pair`; no-store responses and no sensitive logging.
- Confirm Android response field names before finalizing the pairing contract. Use existing packages; avoid new dependencies and unrelated redesigns.