import { e as createComponent, k as renderComponent, r as renderTemplate, m as maybeRenderHead, l as renderScript } from '../../chunks/astro/server_CeE5WmXa.mjs';
import 'piccolore';
import { $ as $$Layout } from '../../chunks/Layout_D3BXhY_Q.mjs';
import { Q as QuoteModal } from '../../chunks/QuoteModal_Cg7FdWh3.mjs';
export { renderers } from '../../renderers.mjs';

const $$CeramicCoating = createComponent(($$result, $$props, $$slots) => {
  const title = "Ceramic Coating | Protect Your Paint | Color Auto Detailing";
  const description = "Professional ceramic coating in Grand Junction. Long-lasting paint protection, hydrophobic coating, 5-year warranty. Book now!";
  const keywords = ["ceramic coating", "paint protection", "hydrophobic coating", "Grand Junction"];
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": title, "description": description, "keywords": keywords, "noindex": true }, { "default": ($$result2) => renderTemplate`  ${maybeRenderHead()}<section class="relative text-white py-70 overflow-hidden"> <div class="absolute inset-0"> <img src="/images/ceramic-coating.jpg" alt="Ceramic Coating" class="w-full h-full object-cover"> <div class="absolute inset-0 bg-black/60"></div> </div> <div class="relative max-w-4xl mx-auto px-4 text-center"> <h1 class="text-5xl font-bold mb-4 drop-shadow-lg">Ceramic Coating Protection</h1> <p class="text-2xl text-gray-200 drop-shadow-md mb-8">Paint Protection That Lasts Years</p> <div class="flex flex-col sm:flex-row gap-4 justify-center"> <a href="tel:970-628-1505" class="bg-blue-600 text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-blue-700 transition shadow-lg inline-block">
Call Now: 970-628-1505
</a> <button class="bg-green-600 text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-green-700 transition shadow-lg" onclick="document.getElementById('quote-modal').classList.remove('hidden')">
Get Free Quote
</button> </div> </div> </section>  <section class="bg-gradient-to-b from-blue-600 to-blue-800 text-white py-16"> <div class="max-w-5xl mx-auto px-4"> <h2 class="text-4xl font-extrabold text-center mb-12">Why Ceramic Coating?</h2> <div class="grid grid-cols-1 md:grid-cols-3 gap-8"> <div class="group bg-white/10 backdrop-blur-md p-8 rounded-2xl border border-white/20 hover:bg-white/20 hover:border-white/40 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"> <div class="text-6xl mb-4">🛡️</div> <h3 class="font-extrabold text-2xl mb-3">5+ Year Protection</h3> <p class="text-blue-100 leading-relaxed">Long-lasting defense against UV, dirt, and oxidation</p> </div> <div class="group bg-white/10 backdrop-blur-md p-8 rounded-2xl border border-white/20 hover:bg-white/20 hover:border-white/40 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"> <div class="text-6xl mb-4">💧</div> <h3 class="font-extrabold text-2xl mb-3">Hydrophobic Finish</h3> <p class="text-blue-100 leading-relaxed">Water beads and rolls off for easy cleaning</p> </div> <div class="group bg-white/10 backdrop-blur-md p-8 rounded-2xl border border-white/20 hover:bg-white/20 hover:border-white/40 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"> <div class="text-6xl mb-4">✨</div> <h3 class="font-extrabold text-2xl mb-3">Showroom Shine</h3> <p class="text-blue-100 leading-relaxed">Professional gloss that turns heads</p> </div> </div> </div> </section>  <section class="bg-gray-50 py-12"> <div class="max-w-4xl mx-auto px-4"> <h2 class="text-3xl font-bold text-center mb-8">What You Get</h2> <ul class="space-y-3"> <li class="flex items-start text-lg"> <span class="text-green-600 font-bold text-2xl mr-3">✓</span> <span>Professional application by certified installers</span> </li> <li class="flex items-start text-lg"> <span class="text-green-600 font-bold text-2xl mr-3">✓</span> <span>5-year manufacturer warranty coverage</span> </li> <li class="flex items-start text-lg"> <span class="text-green-600 font-bold text-2xl mr-3">✓</span> <span>Superior UV and oxidation protection</span> </li> <li class="flex items-start text-lg"> <span class="text-green-600 font-bold text-2xl mr-3">✓</span> <span>Enhanced water beading and dirt resistance</span> </li> <li class="flex items-start text-lg"> <span class="text-green-600 font-bold text-2xl mr-3">✓</span> <span>Reduced washing and maintenance time</span> </li> </ul> </div> </section>  <section class="bg-white border-t-4 border-blue-600 py-12"> <div class="max-w-4xl mx-auto px-4 text-center"> <h2 class="text-3xl font-bold mb-6">Protect Your Paint Today</h2> <p class="text-xl text-gray-600 mb-8">Expert ceramic coating application with warranty protection</p> <div class="flex flex-col sm:flex-row gap-4 justify-center"> <a href="tel:970-628-1505" class="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700 transition">
☎️ Call: 970-628-1505
</a> <button class="bg-green-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-green-700 transition" onclick="document.getElementById('quote-modal').classList.remove('hidden')">
📧 Get Free Quote
</button> </div> <p class="text-sm text-gray-500 mt-6">📍 562 S. Westgate Drive, Grand Junction, CO</p> </div> </section>  <div id="quote-modal" class="hidden"> ${renderComponent($$result2, "QuoteModal", QuoteModal, { "service": "Ceramic Coating", "client:load": true, "client:component-hydration": "load", "client:component-path": "C:/colorautodetailing/src/components/features/QuoteModal.tsx", "client:component-export": "default" })} </div> ${renderScript($$result2, "C:/colorautodetailing/src/pages/ads/ceramic-coating.astro?astro&type=script&index=0&lang.ts")} ` })}`;
}, "C:/colorautodetailing/src/pages/ads/ceramic-coating.astro", void 0);

const $$file = "C:/colorautodetailing/src/pages/ads/ceramic-coating.astro";
const $$url = "/ads/ceramic-coating";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$CeramicCoating,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
