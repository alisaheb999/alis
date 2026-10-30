# Ghostae Trust — কম কথায় বাস্তব বিশ্বাস

## কী তৈরি হবে
- মূল navigation-এ **Security**-এর পাশে **Trust** যোগ হবে; desktop ও mobile—দুই menu থেকেই `/trust` খোলা যাবে।
- নতুন Trust page-এর শুরুতে মাত্র ২–৩ লাইনের বাংলা বক্তব্য থাকবে: বাস্তব payment, product delivery এবং direct support-এর সংক্ষিপ্ত আশ্বাস।
- তার পরেই existing real payment-proof gallery থাকবে—নতুন ভারী media বা আলাদা duplicate data যোগ হবে না।
- পেজের একদম শেষে WhatsApp community block থাকবে, যেখানে **প্রায় ৫০০ video editor** এবং সরাসরি community-তে যোগ দেওয়ার button দেখা যাবে।

## কম লোডের ব্যবস্থা
- প্রথমে সীমিত কয়েকটি proof দেখাবে; বাকি proof কেবল **সব দেখুন** খুললে load হবে।
- screenshot crop হবে না, নিজস্ব অনুপাত বজায় থাকবে এবং actual load/error state অনুসরণ করবে।
- homepage-এর বর্তমান proof gallery/data reuse হবে, তাই একই ছবি দ্বিতীয়বার project-এ রাখা হবে না।

## বিশ্বাসের ভাষা ও নকশা
- বড় marketing paragraph, ভুয়া review, fabricated sales count বা অতিরঞ্জিত claim থাকবে না।
- page flow হবে: **সংক্ষিপ্ত আশ্বাস → payment proof → community**।
- বর্তমান Ghostae light, premium, mobile-first visual style এবং Bengali typography বজায় থাকবে।
- homepage-এর পুরোনো “100+ video editors” copy-ও সত্যনিষ্ঠভাবে “প্রায় ৫০০” করা হবে, যাতে দুই জায়গায় তথ্য মেলে।

## Technical details
- নতুন TanStack route ও unique Trust metadata/canonical যোগ হবে।
- shared header এবং footer—দুই জায়গায় Trust link থাকবে।
- existing `ProofCarousel`-কে configurable preview count/copy দিয়ে reuse করা হবে; full gallery dialog বন্ধ থাকা অবস্থায় সব image render হবে না।

## যাচাই
- desktop ও mobile-এ Security → Trust navigation, limited initial gallery, “সব দেখুন”, close/keyboard flow এবং WhatsApp link পরীক্ষা করা হবে।
- প্রথম load-এ সীমিত image request হচ্ছে কি না, overflow/ভাঙা ছবি নেই কি না এবং বর্তমান build status যাচাই করা হবে।
