# Ghostae Text pop-up ও loading fix

## কী বদলাবে
- pop-up-এর পেছনের blur সরিয়ে স্থির, পরিষ্কার dark overlay দেব; ফলে পেছনের page আর ভাঙা বা ঝাপসা দেখাবে না।
- pop-up page খোলার সঙ্গে আসবে না; মূল লেখা দেখা দেওয়ার অন্তত ৫ সেকেন্ড পরে, browser ফাঁকা থাকলে দেখাবে।
- শিরোনাম স্পষ্ট হবে: **Ghostae Text Version 2 — Coming Soon** এবং এটি **update preview**—এ কথাও থাকবে।
- close করলে video pause হবে, source খুলে দেওয়া হবে এবং pop-up পুরোপুরি সরবে; একই visit-এ আবার নিজে থেকে খুলবে না।
- pop-up-এর component ও video URL আলাদা lazy file-এ নেব; pop-up দেখানোর সময়ের আগে browser এগুলো download করবে না।

## গতি বাড়ানো
- Text page-এর প্রথম অংশ ছাড়া নিচের features/process/pricing content আলাদা lazy chunks-এ ভাগ হবে।
- নিচের screenshots browser viewport-এর কাছে এলে তবেই load হবে; প্রথম text render-এর সঙ্গে media request যাবে না।
- বাইরের Google font request এই page থেকে সরিয়ে system font fallback ব্যবহার করা হবে, যাতে slow internet-এ অতিরিক্ত connection না লাগে।

## যাচাই
- desktop ও 400px mobile-এ delay, close, video stop/unload, scroll position ও background layout পরীক্ষা করব।
- slow-network simulation-এ প্রথম text আগে আসে এবং video request delay-এর আগে শুরু হয় না—এটি যাচাই করব।
- code/build errors এবং browser console errors পরীক্ষা করব।
