# Caption Light ও Pro প্ল্যান আপডেট — low-credit plan

## যা বদলাবে
- Caption pricing card ও purchase popup-এ শুধু এই তথ্য থাকবে:
  - **Free:** ৳0, **2 Minutes Every Day**; মাসিক সীমার কোনো লেখা থাকবে না।
  - **Light:** **৳199 / 3 Months**, **300 Minutes**, **No Limit — Any Time**, **All Standard Features**।
  - **Pro:** **৳699 / 1 Year**, **1,500 Minutes**, **No Limit — Any Time**, **All Features Unlocked**।
- বর্তমান Community Support, Standard Support এবং পুরোনো template/timecode/emoji/support কথাগুলো Caption price card থেকে সরানো হবে।
- পুরোনো 40% discount, কাটা দাম এবং monthly/yearly wording সরানো হবে।

## সার্ভারে কার্যকর নিয়ম
- Free-তে প্রতি UTC দিনে সর্বোচ্চ 2 caption minutes থাকবে; monthly cap থাকবে না। Extension যতদিন ব্যবহার হবে, প্রতিদিন নতুন 2 মিনিট পাওয়া যাবে।
- Light লাইসেন্স 3 মাস চলবে এবং পুরো মেয়াদে মোট 300 caption minutes ব্যবহার করা যাবে; দৈনিক/মাসিক সীমা থাকবে না।
- Pro লাইসেন্স 1 বছর চলবে এবং পুরো মেয়াদে মোট 1,500 caption minutes ব্যবহার করা যাবে; দৈনিক/মাসিক সীমা থাকবে না।
- বর্তমান Caption extension code/ZIP বদলানো হবে না; একই server endpoint-এর উত্তর বদলেই বর্তমান extension নতুন নিয়মে চলবে।
- Checkout-এ Light ৳199 এবং Pro ৳699 নেওয়া হবে; admin activation/automatic fulfilment-এ যথাক্রমে 3 মাস ও 1 বছরের expiry হবে।

## সামঞ্জস্য ও নিরাপত্তা
- Caption-এর `Light` → server-এর `basic` mapping অপরিবর্তিত থাকবে।
- পুরোনো monthly counter-কে paid plans-এর total allowance হিসেবে স্থির period-এ গণনা করা হবে, যাতে calendar month বদলালে minutes reset না হয়; Free daily counter স্বাভাবিকভাবেই প্রতিদিন reset হবে।
- Website, purchase popup, order amount, licence duration এবং server quota একই মান থেকে মিলিয়ে আপডেট করা হবে; Text ও অন্য product বদলাবে না।

## কম-credit যাচাই
- নতুন বড় file বা dependency নয়; শুধু বর্তমান ছোট configuration/copy replace।
- Type check, Caption page response, এবং plan endpoint-এর Free/Light/Pro limit shape যাচাই করা হবে।
