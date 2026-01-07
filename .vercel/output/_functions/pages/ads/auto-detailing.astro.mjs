import { e as createComponent, k as renderComponent, r as renderTemplate, m as maybeRenderHead } from '../../chunks/astro/server_CeE5WmXa.mjs';
import 'piccolore';
import { $ as $$Layout } from '../../chunks/Layout_BbETkT4J.mjs';
export { renderers } from '../../renderers.mjs';

const $$AutoDetailing = createComponent(($$result, $$props, $$slots) => {
  const title = "Professional Auto Detailing | Color Auto Detailing";
  const description = "Expert auto detailing services in Grand Junction. Hand wash, interior cleaning, exterior protection. Book your appointment now!";
  const keywords = ["auto detailing", "car detailing", "professional detailing", "Grand Junction"];
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": title, "description": description, "keywords": keywords, "noindex": true }, { "default": ($$result2) => renderTemplate`  ${maybeRenderHead()}<section class="relative text-white py-70 overflow-hidden"> <div class="absolute inset-0"> <img src="/images/autodetailing.jpg" alt="Auto Detailing" class="w-full h-full object-cover"> <div class="absolute inset-0 bg-black/60"></div> </div> <div class="relative max-w-4xl mx-auto px-4 text-center"> <h1 class="text-5xl font-bold mb-4 drop-shadow-lg">Professional Auto Detailing</h1> <p class="text-2xl text-gray-200 drop-shadow-md mb-8">Restore Your Car's Showroom Shine</p> <div class="flex flex-col sm:flex-row gap-4 justify-center"> <a href="tel:970-628-1505" class="bg-blue-600 text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-blue-700 transition shadow-lg inline-block">
Call Now: 970-628-1505
</a> <a href="/contact" class="bg-green-600 text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-green-700 transition shadow-lg inline-block">
Get Free Quote
</a> </div> </div> </section>  <section class="bg-gradient-to-b from-blue-600 to-blue-800 text-white py-16"> <div class="max-w-5xl mx-auto px-4"> <h2 class="text-4xl font-extrabold text-center mb-12">Why Choose ColorAuto Detailing?</h2> <div class="grid grid-cols-1 md:grid-cols-3 gap-8"> <div class="group bg-white/10 backdrop-blur-md p-8 rounded-2xl border border-white/20 hover:bg-white/20 hover:border-white/40 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"> <div class="text-6xl mb-4">⭐</div> <h3 class="font-extrabold text-2xl mb-3">5-Star Rated</h3> <p class="text-blue-100 leading-relaxed">Trusted by local drivers with proven results and consistent excellence</p> </div> <div class="group bg-white/10 backdrop-blur-md p-8 rounded-2xl border border-white/20 hover:bg-white/20 hover:border-white/40 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"> <div class="text-6xl mb-4">💎</div> <h3 class="font-extrabold text-2xl mb-3">Premium Products</h3> <p class="text-blue-100 leading-relaxed">Only top-tier brands and professional techniques for best results</p> </div> <div class="group bg-white/10 backdrop-blur-md p-8 rounded-2xl border border-white/20 hover:bg-white/20 hover:border-white/40 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"> <div class="text-6xl mb-4">🏆</div> <h3 class="font-extrabold text-2xl mb-3">Expert Team</h3> <p class="text-blue-100 leading-relaxed">Certified professionals with years of hands-on experience</p> </div> </div> </div> </section>  <section class="bg-gray-50 py-12"> <div class="max-w-4xl mx-auto px-4"> <h2 class="text-3xl font-bold text-center mb-8">What's Included</h2> <ul class="space-y-3"> <li class="flex items-start text-lg"> <span class="text-green-600 font-bold text-2xl mr-3">✓</span> <span>Professional hand wash with pH-balanced soap</span> </li> <li class="flex items-start text-lg"> <span class="text-green-600 font-bold text-2xl mr-3">✓</span> <span>Interior vacuuming and sanitization</span> </li> <li class="flex items-start text-lg"> <span class="text-green-600 font-bold text-2xl mr-3">✓</span> <span>Exterior polish and wax protection</span> </li> <li class="flex items-start text-lg"> <span class="text-green-600 font-bold text-2xl mr-3">✓</span> <span>Wheel and tire cleaning</span> </li> <li class="flex items-start text-lg"> <span class="text-green-600 font-bold text-2xl mr-3">✓</span> <span>Glass and trim treatment</span> </li> </ul> </div> </section>  <section class="bg-white border-t-4 border-blue-600 py-12"> <div class="max-w-4xl mx-auto px-4 text-center"> <h2 class="text-3xl font-bold mb-6">Ready to Transform Your Vehicle?</h2> <p class="text-xl text-gray-600 mb-8">Limited-time specials available. Book your detailing appointment today!</p> <div class="flex flex-col sm:flex-row gap-4 justify-center"> <a href="tel:970-628-1505" class="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700 transition">
☎️ Call: 970-628-1505
</a> <a href="/contact" class="bg-green-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-green-700 transition">
📧 Get Free Quote
</a> </div> <p class="text-sm text-gray-500 mt-6">📍 562 S. Westgate Drive, Grand Junction, CO</p> </div> </section> ` })}`;
}, "C:/colorautodetailing/src/pages/ads/auto-detailing.astro", void 0);

const $$file = "C:/colorautodetailing/src/pages/ads/auto-detailing.astro";
const $$url = "/ads/auto-detailing";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$AutoDetailing,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
