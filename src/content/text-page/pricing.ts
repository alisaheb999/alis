export const css = `
    body {
      font-family: 'Hind Siliguri', sans-serif;
    }
  `;

export const html = `
  <div class="max-w-4xl w-full mx-auto">

    <!-- হেডার -->
    <div class="text-center mb-14">
      <h2 class="text-3xl sm:text-4xl font-extrabold text-black tracking-tight">
        প্রাইসিং
      </h2>
      <p class="mt-2 text-sm sm:text-base text-slate-500 max-w-sm mx-auto">
        একবার পেমেন্ট · লাইফটাইম
      </p>
    </div>

    <!-- প্রাইসিং কার্ড গ্রিড -->
    <div class="grid grid-cols-1 gap-8 items-stretch max-w-xl mx-auto">

      <!-- কার্ড ২: Lifetime -->
      <div class="tx-price-card bg-white border-2 border-blue-600 shadow-lg shadow-blue-600/5 flex flex-col justify-between relative">

        <div class="absolute -top-3.5 right-8 bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
          সবচেয়ে জনপ্রিয়
        </div>

        <div>
          <div class="tx-price-header pb-6 border-b border-blue-50">
            <h3 class="text-xl sm:text-2xl font-bold text-black">লাইফটাইম</h3>
           <div class="text-right shrink-0">
              <span data-list-price class="text-sm font-semibold text-slate-400 line-through">৳৪৯৯</span>
              <span data-offer-price class="text-3xl font-extrabold text-blue-600">৳৩৪৯</span>
               <div id="text-pricing-countdown" class="mt-1"></div>
            </div>
          </div>
          <p class="mt-4 text-xs text-slate-500 font-semibold">একবার পেমেন্ট · লাইফটাইম</p>

          <ul class="space-y-4 py-8 text-sm text-slate-700">
            <li class="flex items-center gap-3 font-semibold text-black">
              <span class="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0"></span>
              <span>আনলিমিটেড অ্যাপ্লাই</span>
            </li>
            <li class="flex items-center gap-3">
              <span class="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0"></span>
              <span>সব প্রিমিয়াম অ্যানিমেশন</span>
            </li>
            <li class="flex items-center gap-3">
              <span class="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0"></span>
              <span>ভবিষ্যতের আপডেট ফ্রি</span>
            </li>
            <li class="flex items-center gap-3">
              <span class="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0"></span>
              <span>মাসিক বা বার্ষিক ফি নেই</span>
            </li>
          </ul>
        </div>

        <a href="#buy" class="w-full py-3.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-all text-center block shadow-md shadow-blue-600/20">
          লাইফটাইম কিনুন
        </a>
      </div>

    </div>
    <p class="mt-5 text-center text-xs text-muted-foreground" aria-disabled="true">ফ্রি সংস্করণ — মেইনটেন্যান্স চলছে</p>

  </div>
`;
