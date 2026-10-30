export const css = ``;

const steps = [
  ["০১", "ডাউনলোড করুন", "Windows-এর জন্য ডেস্কটপ ইনস্টলার; Mac-এর জন্য আপনার Adobe অ্যাপের ZIP নিন।"],
  ["০২", "ইনস্টল করুন", "Windows-এ ইনস্টলার চালান। Mac-এ ডাউনলোডের সঙ্গে দেওয়া সেটআপ নির্দেশনা অনুসরণ করুন।"],
  ["০৩", "প্যানেল খুলুন", "Adobe অ্যাপ চালু করে Ghostae Text খুলুন। প্রিমিয়াম ব্যবহার করতে লাইসেন্স কী দিন।"],
];

export const html = `
  <section class="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-sm">
    <div class="mb-8 sm:mb-10 text-center">
      <h2 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">ইনস্টলেশন প্রক্রিয়া</h2>
    </div>
    <div class="relative mx-auto mb-10 max-w-3xl overflow-hidden rounded-2xl border border-slate-200/80 bg-black shadow-xl" style="aspect-ratio:16/9">
      <iframe
        title="Ghostae Text installation video"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowfullscreen
        class="absolute inset-0 hidden h-full w-full"
      ></iframe>
      <div
        class="group absolute inset-0 cursor-pointer"
        onclick="var f=this.parentElement.querySelector('iframe');f.src='https://www.youtube-nocookie.com/embed/XXHps_M6Sis?autoplay=1&amp;rel=0';f.style.display='block';this.style.display='none';"
      >
        <img
          src="https://i.ytimg.com/vi/XXHps_M6Sis/maxresdefault.jpg"
          onerror="this.onerror=null;this.src='https://i.ytimg.com/vi/XXHps_M6Sis/hqdefault.jpg';"
          alt="Ghostae Text installation video"
          class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          loading="lazy"
        />
        <div class="absolute inset-0 flex items-center justify-center bg-black/25 transition-colors group-hover:bg-black/10">
          <span class="flex h-14 w-20 items-center justify-center rounded-2xl bg-red-600 shadow-lg transition-transform duration-200 group-hover:scale-105">
            <svg viewBox="0 0 24 24" class="h-7 w-7 fill-white" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
          </span>
        </div>
      </div>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
      ${steps
        .map(
          ([n, t, d]) => `
      <div class="rounded-2xl p-6 border border-slate-200 bg-slate-50/60 hover:border-blue-400 hover:bg-white transition-all">
        <div class="w-11 h-11 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm mb-5">${n}</div>
        <h3 class="text-lg font-bold text-slate-900 mb-2">${t}</h3>
        <p class="text-sm text-slate-600 leading-relaxed">${d}</p>
      </div>`,
        )
        .join("")}
    </div>
  </section>
`;
