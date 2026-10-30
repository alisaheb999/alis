export const css = `
.tx-raw .tx-benefits-section { width: 100%; max-width: 1152px; margin: 0 auto; border: 1px solid var(--border); border-radius: 8px; padding: 24px 16px; }
.tx-raw .tx-benefits-title { margin: 0 0 20px; font-size: 26px; font-weight: 500; color: var(--foreground); }
.tx-raw .tx-benefit { display: block; }
.tx-raw .tx-benefit-heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 16px; }
.tx-raw .tx-benefit-heading h3 { margin: 0; font-size: 16px; font-weight: 400; color: var(--foreground); }
.tx-raw .tx-preview-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
.tx-raw .tx-preview-tile { aspect-ratio: 16 / 9; overflow: hidden; border-radius: 6px; background: var(--media-surface); border: 1px solid var(--border); }
.tx-raw .tx-proof-section h2 { font-family: 'Ghostae Payment Bangla', system-ui, sans-serif; font-size: 26px; font-weight: 400; }
@media (min-width: 640px) { .tx-raw .tx-preview-grid { gap: 14px; } }
`;

const AE_SHOTS = [
  { src: "/__l5e/assets-v1/6c1336a9-9389-4713-9de8-0ff75213e9b2/text-ae1.webp", alt: "After Effects প্যানেল ওভারভিউ" },
  { src: "/__l5e/assets-v1/b55a4390-3f0a-4855-bff5-cbbd248e7178/text-Screenshot-2.webp", alt: "অ্যানিমেশন প্রিসেট কন্ট্রোল" },
  { src: "/__l5e/assets-v1/155854fe-9b5a-4c30-8e0c-2e2cdd6b2cb5/text-Screenshot-3.webp", alt: "টেক্সট স্টাইল ও লেআউট" },
  { src: "/__l5e/assets-v1/7a77892d-0d1f-4ca1-9002-465d3868bfc1/text-Screenshot-4.webp", alt: "ইমোজি ও আইকন প্যানেল" },
  { src: "/__l5e/assets-v1/d805af6f-b5ff-47db-b24a-f0b1254c97e4/text-Screenshot-5.webp", alt: "এক্সপ্রেশন টুলকিট" },
  { src: "/__l5e/assets-v1/ffd645d4-9f12-45f6-973a-bc89fd92d12b/text-Screenshot-6.webp", alt: "কাস্টম প্রিভিউ মোড" },
  { src: "/__l5e/assets-v1/49b87d63-b9f8-4d6a-9c22-f6259b4ab09a/text-Screenshot-7.webp", alt: "স্মার্ট এক্সপোর্ট ও রেডি কম্প" },
];

const PR_SHOTS = [
  { src: "/__l5e/assets-v1/b5b4954b-0244-42d9-92a7-2006722e1b1a/text-b-Screenshot-1.webp", alt: "Premiere Pro প্যানেল ইন্টারফেস" },
  { src: "/__l5e/assets-v1/fd6eb75f-7f6a-47b0-8a6f-bdf84887ed05/text-b-Screenshot-2.webp", alt: "টাইমলাইন টেক্সট সিঙ্ক" },
  { src: "/__l5e/assets-v1/6e41b28a-21bf-4654-8726-99c8ef56a8e1/text-b-Screenshot-3.webp", alt: "দ্রুত মোশন প্রিসেট" },
  { src: "/__l5e/assets-v1/3d48d882-5a92-4f41-a53b-43578be3a7e4/text-b-Screenshot-4.webp", alt: "টাইটেল ও লোয়ার থার্ডস" },
  { src: "/__l5e/assets-v1/1ceab863-e41c-4639-9c07-077382fe2a07/text-b-Screenshot-5.webp", alt: "স্টাইলিশ ফন্ট ও কালার গ্রেডিং" },
  { src: "/__l5e/assets-v1/6fa59969-193b-4394-b2f5-b93e3605e8e3/text-b-Screenshot-6.webp", alt: "প্রিভিউ প্লেয়ার ও থাম্বনেইল" },
  { src: "/__l5e/assets-v1/b7aac9e4-3f12-4b94-865f-4fc9c48119b8/text-b-Screenshot-7.webp", alt: "ওয়ান-ক্লিক এপ্লাই ওয়ার্কফ্লো" },
];

function renderShots(shots: typeof AE_SHOTS) {
  return shots
    .map(
      (s, index) => `
        <figure class="group relative bg-surface border border-border rounded-lg overflow-hidden">
          <button type="button" data-zoom="${s.src}" aria-label="${s.alt} বড় করে দেখুন" class="relative block w-full overflow-hidden rounded-xl bg-slate-950 border border-slate-200/80 cursor-zoom-in">
            <div class="aspect-video bg-black flex items-center justify-center overflow-hidden">
              <img
                src="${s.src}"
                alt="${s.alt}"
                width="1280"
                height="720"
                class="w-full h-full object-contain transition-transform duration-300 group-hover:scale-[1.02]"
                loading="lazy" data-i="${index}"
                decoding="async"
              />
            </div>
            <span class="pointer-events-none absolute inset-0 flex items-end justify-end p-3 opacity-0 transition-opacity group-hover:opacity-100">
              <span class="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-lg">বড় করে দেখুন</span>
            </span>
          </button>
        </figure>`,
    )
    .join("\n");
}

export const html = `
  <section class="tx-benefits-section" aria-labelledby="text-benefits-title">
    <h2 id="text-benefits-title" class="tx-benefits-title">আপনি যা পাবেন</h2>
    ${[
      { key: 'presets', title: '১১০+ প্রিমিয়াম অ্যানিমেশন' },
      { key: 'templates', title: '১২০+ স্টাইলিশ অ্যানিমেশন' },
      { key: 'emojis', title: '২০০+ প্রিমিয়াম ইমোজি' },
    ].map(group => `
      <div class="tx-benefit">
        <div class="tx-benefit-heading"><h3>${group.title}</h3><span data-gallery-control="${group.key}"></span></div>
        <div class="tx-preview-grid">
          ${Array.from({ length: 6 }, (_, index) => `<div class="tx-preview-tile"><img data-gif-slot="${group.key}" data-idx="${index}" alt="${group.title} প্রিভিউ ${index + 1}" class="h-full w-full object-contain" loading="lazy" decoding="async" /></div>`).join('')}
        </div>
      </div>`).join('')}
  </section>

  <!-- ================= স্ক্রিনশট সেকশন ================= -->
  <section class="flex flex-col justify-center items-center px-0 pt-24 pb-0 sm:pt-32 mt-24 sm:mt-32 border-t border-slate-200 bg-slate-100">
    <div class="w-full max-w-[1440px] mx-auto">
      <div class="text-center mb-8">
        <h2 class="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">স্ক্রিনশট</h2>

        <!-- দুটি বাটন ট্যাব -->
        <div class="inline-flex p-1 mt-6 bg-slate-200/90 rounded-full border border-slate-300">
          <button
            type="button"
            id="tab-ae-btn"
            onclick="(function(){document.getElementById('ae-box').style.display='grid';document.getElementById('pr-box').style.display='none';document.getElementById('tab-ae-btn').className='px-4 sm:px-6 py-2 rounded-full text-xs sm:text-sm font-bold bg-blue-600 text-white shadow-md transition-all cursor-pointer';document.getElementById('tab-pr-btn').className='px-4 sm:px-6 py-2 rounded-full text-xs sm:text-sm font-bold text-slate-600 hover:text-slate-900 transition-all cursor-pointer';})()"
            class="px-4 sm:px-6 py-2 rounded-full text-xs sm:text-sm font-bold bg-blue-600 text-white shadow-md transition-all cursor-pointer"
          >
            After Effects 
          </button>
          <button
            type="button"
            id="tab-pr-btn"
            onclick="(function(){document.getElementById('ae-box').style.display='none';document.getElementById('pr-box').style.display='grid';document.getElementById('tab-pr-btn').className='px-4 sm:px-6 py-2 rounded-full text-xs sm:text-sm font-bold bg-purple-600 text-white shadow-md transition-all cursor-pointer';document.getElementById('tab-ae-btn').className='px-4 sm:px-6 py-2 rounded-full text-xs sm:text-sm font-bold text-slate-600 hover:text-slate-900 transition-all cursor-pointer';})()"
            class="px-4 sm:px-6 py-2 rounded-full text-xs sm:text-sm font-bold text-slate-600 hover:text-slate-900 transition-all cursor-pointer"
          >
            Premiere Pro 
          </button>
        </div>
      </div>

      <!-- After Effects গ্রিড -->
      <div id="ae-box" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5" style="display: grid;">
        ${renderShots(AE_SHOTS)}
      </div>

      <!-- Premiere Pro গ্রিড -->
      <div id="pr-box" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5" style="display: none;">
        ${renderShots(PR_SHOTS)}
      </div>
    </div>
  </section>
`;
