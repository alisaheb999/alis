# Ghostae AI Ecosystem — Production Release Plan (v1)

কোনো নতুন বড় code লেখা হবে না। কাজ মূলত: file moving, একটা installer, license key দিয়ে উপর-স্তরে control, verification, আর দুটো ছোট fix (Text panel like/dislike + old-device optimization)।

## 1. Release scope

এবারের launch: **Ghostae Cache, Ghostae Text, Ghostae Presets, Ghostae Bridge** (Bridge আপনি দিলে বসানো হবে)।
বাকি ৪টি (Command, Idea, One, Tools) যেভাবে আছে থাকবে — শুধু user panel থেকে download link সরিয়ে admin panel-এ যাবে।

Download নাম একটাই: **Ghost AI Ecosystem** (একটি installer, একটি ZIP)।

## 2. Source archive in admin (edit করার জন্য)

- প্রতিটি panel-এর সর্বশেষ version-এর source `extension-src/` থেকে admin-only storage-এ রাখা হবে (private bucket, নাম `ghost-sources`)।
- Admin panel-এ একটা ছোট তালিকা: panel নাম + version + download (source) + upload নতুন version।
- User-facing কোথাও source দেখাবে না।

## 3. এক installer, সব panel

```text
Ghost-AI-Ecosystem.zip
├── panels/
│   ├── com.ghost.cache/
│   ├── com.ghost.text/
│   ├── com.ghost.presets/
│   └── com.ghost.bridge/        (Bridge পেলে)
├── Install-Ghost-AI-Ecosystem.cmd      (Windows)
├── Install-Ghost-AI-Ecosystem.command  (macOS)
├── Uninstall-Ghost-AI-Ecosystem.cmd
└── README.txt
```

- Installer একবারে চারটি panel CEP folder-এ copy করবে, পুরনো folder backup নেবে, CEP debug mode on করবে।
- বিদ্যমান per-panel installer script গুলোই merge করা হবে — নতুন logic লেখা হবে না।
- Build একটি script দিয়ে (`scripts/build-ecosystem.cjs`) — এটাই একমাত্র নতুন ছোট file।

## 4. License key — উপর-স্তরের control

- একটি license key যেকোনো এক panel-এ দিলে machine-wide activation cache-এ লেখা হবে (`Documents/Ghostae/License/activation.json`) — বাকি সব panel automatic unlock।
- Device বণ্টন pricing অনুযায়ী (Free 1, Premium/Ultra/Team = pricing section-এ যা আছে)।
- Panel-এর প্রতিটি action আগেই বানানো `/api/public/v1/quota/check` এ hit করবে; limit শেষ → বন্ধ, নাহলে চলবে। গভীর enforcement নেই — v1-এ উপর-উপরই।
- Payment manual confirm → admin panel থেকে key issue (এই flow ইতিমধ্যে আছে, শুধু verify হবে)।

## 5. Ghostae Text — like/dislike admin sync

- Panel-এর feedback button থেকে server-এ পৌঁছাচ্ছে কিনা এবং admin feedback panel-এ দেখাচ্ছে কিনা — end-to-end test।
- না গেলে শুধু endpoint/field mapping ঠিক করা হবে (ছোট edit)।

## 6. Old device optimization

- `ghost-low-device-profile.js` এর lite profile চারটি panel-এ একইভাবে থাকা নিশ্চিত করা।
- Preview animation limit: lite device-এ কম, modern device-এ ৪০০ (এখন যা আছে)।
- ভারী blur/shadow lite mode-এ off।

## 7. Verification checklist (release-এর আগে)

1. Installer Windows-এ চারটি panel বসায়, AE-তে চারটি menu দেখা যায়।
2. এক key → চার panel unlock।
3. Cache: remove-bg + stock search কাজ করে।
4. Text: animation/style চলে, like/dislike admin-এ আসে।
5. Presets: preset download + quota count বাড়ে।
6. Bridge: basic connect (Bridge পাওয়ার পর)।
7. User site-এ শুধু একটি download; বাকি ৪টির link নেই।

## 8. কম credit-এ করার ধারা (execution order)

| ধাপ | কাজ | credit |
| --- | --- | --- |
| A | download link consolidation (user panel → এক link, admin-এ বাকিগুলো) | খুব কম |
| B | source archive + admin তালিকা | কম |
| C | build-ecosystem script + merged installer | কম-মাঝারি |
| D | like/dislike sync test + fix | কম |
| E | old-device profile সমতা | কম |
| F | Bridge বসানো + final verification | Bridge পেলে |

নিয়ম: বড় কোনো file দরকার হলে আমি আপনাকে exact spec + ready-to-paste prompt দেব, আপনি অন্য AI দিয়ে generate করে দিলে আমি শুধু বসাব। প্রতিটি ধাপ আলাদা message-এ, একবারে সব নয় — যাতে credit নিয়ন্ত্রণে থাকে।

Bridge এখনো নেই, তাই A–E এখনই করা যায়; F আপনার file পেলে।
