# Ghostae Text preview, section loading ও coupon offer fix

## লক্ষ্য
- Version 2 preview আর গোল crop হবে না; সম্পূর্ণ ভিডিও পরিষ্কার দেখা যাবে।
- Features ও Screenshot অংশ আগের মতো স্বাভাবিকভাবে এবং নির্ভরযোগ্যভাবে দেখা যাবে।
- Active coupon থাকলে code গোপন রেখে সাধারণ ক্রেতাকে coupon discount-এর ঠিক অর্ধেক automatic offer দেওয়া হবে; coupon ব্যবহারকারী পুরো discount পাবেন।

## পরিবর্তন
1. **Version 2 popup**
   - গোল video frame বাদ দিয়ে wide 16:9 preview রাখা হবে।
   - `object-contain` ব্যবহার করে পুরো video দেখানো হবে; কোনো zoom/crop থাকবে না।
   - popup-এর delay থাকবে, কিন্তু video popup খোলার আগে download/run হবে না।

2. **Features ও Screenshot**
   - এই দুই অংশ deferred import/IntersectionObserver-এর অপেক্ষা থেকে বের করে মূল page-এর সঙ্গে render করা হবে।
   - section reveal animation-এর hidden state বাদ দেওয়া হবে, যাতে observer ব্যর্থ হলেও content অদৃশ্য না থাকে।
   - screenshot imageগুলো section-এর কাছাকাছি আসলেই load হবে; প্রথম screenshot একটু আগে fetch হবে এবং বাকিগুলো normal lazy থাকবে।

3. **Public half-discount offer**
   - server active, started, unexpired ও available couponগুলোর মধ্যে সংশ্লিষ্ট plan-এর সেরা discount হিসাব করবে।
   - coupon code browser-এ পাঠানো বা দেখানো হবে না; শুধু public discount amount ও final price যাবে।
   - code না দিলে checkout/order-এ coupon discount-এর ঠিক অর্ধেক automaticভাবে প্রয়োগ হবে।
   - valid coupon দিলে automatic offer-এর বদলে coupon-এর পুরো discount প্রয়োগ হবে।
   - “Lifetime কিনুন” ও checkout-এর price area-তে original price কাটা, offer price এবং “Coupon দিলে আরও ছাড়” দেখানো হবে। Active offer না থাকলে বর্তমান price অপরিবর্তিত থাকবে।

4. **যাচাই**
   - desktop ও 400px mobile-এ popup, Features, Screenshot এবং buy flow দেখা হবে।
   - active offer থাকলে displayed amount ও submitted order amount একই কিনা যাচাই হবে।
   - build/runtime error পরীক্ষা করা হবে।

## Technical details
- Existing coupon validation ও order flow-ই রাখা হবে; নতুন public response coupon code প্রকাশ করবে না।
- Public half-discount server-side recompute হবে, তাই browser থেকে price বদলে কম payment submit করা যাবে না।
- কোনো database schema বা existing coupon row পরিবর্তন হবে না।
