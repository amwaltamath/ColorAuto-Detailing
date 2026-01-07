import { e as createComponent, k as renderComponent, r as renderTemplate, m as maybeRenderHead, l as renderScript } from '../../chunks/astro/server_DoXgqcN7.mjs';
import 'piccolore';
import { $ as $$Layout } from '../../chunks/Layout_Cl2g-nRv.mjs';
import { Q as QuoteModal } from '../../chunks/QuoteModal_Cg7FdWh3.mjs';
export { renderers } from '../../renderers.mjs';

const $$AutoPaintCorrection = createComponent(($$result, $$props, $$slots) => {
  const title = "Auto Paint Correction | Remove Swirl Marks | Grand Junction";
  const description = "Professional paint correction removes swirl marks, scratches, and oxidation. Restore showroom shine to your vehicle. Expert paint detailing.";
  const keywords = ["paint correction", "swirl mark removal", "paint restoration", "Grand Junction"];
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": title, "description": description, "keywords": keywords, "noindex": true }, { "default": ($$result2) => renderTemplate`  ${maybeRenderHead()}<section class="relative text-white py-70 overflow-hidden"> <div class="absolute inset-0"> <img src="/images/paint correction.jpg" alt="Paint Correction" class="w-full h-full object-cover"> <div class="absolute inset-0 bg-black/60"></div> </div> <div class="relative max-w-4xl mx-auto px-4 text-center"> <h1 class="text-5xl font-bold mb-4 drop-shadow-lg">Auto Paint Correction</h1> <p class="text-2xl text-gray-200 drop-shadow-md mb-8">Restore Your Paint to Showroom Quality</p> <div class="flex flex-col sm:flex-row gap-4 justify-center"> <a href="tel:970-628-1505" class="bg-blue-600 text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-blue-700 transition shadow-lg inline-block">
Call Now: 970-628-1505
</a> <button class="bg-green-600 text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-green-700 transition shadow-lg" onclick="document.getElementById('quote-modal').classList.remove('hidden')">
Get Free Quote
</button> </div> </div> </section>  <section class="bg-gradient-to-b from-blue-600 to-blue-800 text-white py-16"> <div class="max-w-5xl mx-auto px-4"> <h2 class="text-4xl font-extrabold text-center mb-12">What We Fix</h2> <div class="grid grid-cols-1 md:grid-cols-3 gap-8"> <div class="group bg-white/10 backdrop-blur-md p-8 rounded-2xl border border-white/20 hover:bg-white/20 hover:border-white/40 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"> <div class="text-6xl mb-4">✨</div> <h3 class="font-extrabold text-2xl mb-3">Swirl Marks Gone</h3> <p class="text-blue-100 leading-relaxed">Remove fine scratches and buffer trails</p> </div> <div class="group bg-white/10 backdrop-blur-md p-8 rounded-2xl border border-white/20 hover:bg-white/20 hover:border-white/40 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"> <div class="text-6xl mb-4">🛡️</div> <h3 class="font-extrabold text-2xl mb-3">Oxidation Removed</h3> <p class="text-blue-100 leading-relaxed">Restore dull, faded paint</p> </div> <div class="group bg-white/10 backdrop-blur-md p-8 rounded-2xl border border-white/20 hover:bg-white/20 hover:border-white/40 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"> <div class="text-6xl mb-4">🎨</div> <h3 class="font-extrabold text-2xl mb-3">Showroom Finish</h3> <p class="text-blue-100 leading-relaxed">Mirror-like shine and clarity</p> </div> </div> </div> </section>  <section class="bg-gray-50 py-12"> <div class="max-w-4xl mx-auto px-4"> <h2 class="text-3xl font-bold text-center mb-8">Paint Problems We Solve</h2> <ul class="space-y-3"> <li class="flex items-start text-lg"> <span class="text-green-600 font-bold text-2xl mr-3">✓</span> <span>Swirl marks and spider webbing from car washes</span> </li> <li class="flex items-start text-lg"> <span class="text-green-600 font-bold text-2xl mr-3">✓</span> <span>Light to moderate surface scratches</span> </li> <li class="flex items-start text-lg"> <span class="text-green-600 font-bold text-2xl mr-3">✓</span> <span>Water spots and mineral etching</span> </li> <li class="flex items-start text-lg"> <span class="text-green-600 font-bold text-2xl mr-3">✓</span> <span>Oxidation and paint dullness</span> </li> <li class="flex items-start text-lg"> <span class="text-green-600 font-bold text-2xl mr-3">✓</span> <span>Buffer trails from improper polishing</span> </li> </ul> </div> </section>  <section class="bg-white border-t-4 border-blue-600 py-12"> <div class="max-w-4xl mx-auto px-4 text-center"> <h2 class="text-3xl font-bold mb-6">Transform Your Paint Today</h2> <p class="text-xl text-gray-600 mb-8">Professional paint correction by expert technicians</p> <div class="flex flex-col sm:flex-row gap-4 justify-center"> <a href="tel:970-628-1505" class="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700 transition">
☎️ Call: 970-628-1505
</a> <button class="bg-green-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-green-700 transition" onclick="document.getElementById('quote-modal').classList.remove('hidden')">
📧 Get Free Quote
</button> </div> <p class="text-sm text-gray-500 mt-6">📍 562 S. Westgate Drive, Grand Junction, CO</p> </div> </section>  <div id="quote-modal" class="hidden"> ${renderComponent($$result2, "QuoteModal", QuoteModal, { "service": "Auto Paint Correction", "client:load": true, "client:component-hydration": "load", "client:component-path": "C:/colorautodetailing/src/components/features/QuoteModal.tsx", "client:component-export": "default" })} </div> ${renderScript($$result2, "C:/colorautodetailing/src/pages/ads/auto-paint-correction.astro?astro&type=script&index=0&lang.ts")} ` })}`;
}, "C:/colorautodetailing/src/pages/ads/auto-paint-correction.astro", void 0);

const $$file = "C:/colorautodetailing/src/pages/ads/auto-paint-correction.astro";
const $$url = "/ads/auto-paint-correction";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$AutoPaintCorrection,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
