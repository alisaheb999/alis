# Low-credit critical fix plan

## Goal
Production ZIP/download এবং Ghost Cache panel-এর ৩টা জরুরি সমস্যা ঠিক করা:
1. Auto Caption-এর জন্য After Effects-side file/panel অংশ যেন ecosystem ZIP-এ থাকে।
2. Ghost Cache cloud/package section-এ শুধু installable package দেখা যাবে; normal cloud assets/items hidden থাকবে।
3. Sound asset hover করলে audio audible preview হবে; play হচ্ছে কিন্তু muted/volume zero হলে সেটা ঠিক হবে।

## Low-credit strategy
- Heavy rewrite বা নতুন বড় file তৈরি করা হবে না।
- Existing files-এ ছোট targeted patch করা হবে।
- Build script/installer package-এ শুধু missing caption/VPS files include করা হবে।
- শেষে ZIP rebuild করে basic verification: file exists + URL 200 + package contents check।

## Implementation steps

### 1) Caption + VPS extension download/package fix
- Existing `caption-worker` এবং Breeze/VPS bridge source locate করে ecosystem package-এ include status verify করব।
- যদি Caption-এর After Effects-side file missing থাকে, existing Ghost Text/Caption source থেকে package staging-এ include করব বা download page-এ separate required file link যোগ করব।
- Caption Worker link already আছে কিনা verify করে broken হলে fix করব।

### 2) Ghost Cache package-only rule
- Ghost Cache cloud/package rendering logic patch করব যাতে package/installable items ছাড়া অন্য cloud asset UI render না হয়।
- Filter rule: only items with package/install/installable/download-package flag/type/category will show in Ghost package area.
- Free installable package visible থাকবে।

### 3) Sound hover preview fix
- Existing hover preview audio handler patch করব।
- On hover: `muted=false`, safe volume set, `currentTime=0`, `play()` promise catch handle।
- On leave: pause/reset. Browser/CEF autoplay restrictions এলে only user-initiated fallback থাকবে, কিন্তু hover-after-click audible হবে।

### 4) Rebuild + verify
- Rebuild ecosystem ZIPs.
- Verify Windows/macOS ZIP and Caption Worker download URLs return 200.
- Verify package contains Caption Worker and panel files.
