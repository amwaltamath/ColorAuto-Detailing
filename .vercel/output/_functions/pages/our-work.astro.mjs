import { e as createComponent, k as renderComponent, r as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_CeE5WmXa.mjs';
import 'piccolore';
import { $ as $$PublicLayout } from '../chunks/PublicLayout_GXblmFh_.mjs';
export { renderers } from '../renderers.mjs';

const $$OurWork = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "PublicLayout", $$PublicLayout, { "title": "Our Work - ColorAuto", "description": "Gallery of recent auto detailing, PPF, ceramic coating, and window tinting projects by ColorAuto in Grand Junction.", "keywords": [
    "auto detailing gallery",
    "PPF installs",
    "ceramic coating results",
    "window tint examples",
    "ColorAuto Grand Junction"
  ], "image": "/images/professional auto detailing.jpg" }, { "default": ($$result2) => renderTemplate`  ${maybeRenderHead()}<section class="relative text-white py-70 overflow-hidden"> <div class="absolute inset-0"> <img src="/images/background.jpg" alt="ColorAuto Gallery" class="w-full h-full object-cover"> <div class="absolute inset-0 bg-black/60"></div> </div> <div class="relative max-w-7xl mx-auto px-4 text-center"> <h1 class="text-5xl font-bold mb-4 drop-shadow-lg">Our Work</h1> <p class="text-xl text-gray-200 drop-shadow-md max-w-3xl mx-auto">Recent detailing, paint protection film, ceramic coating, and window tint projects from our Grand Junction shop.</p> </div> </section>  <section class="bg-white py-16"> <div class="max-w-7xl mx-auto px-4"> <div class="flex items-center justify-between mb-8"> <h2 class="text-3xl font-bold">Showcase Gallery</h2> <a href="/contact" class="text-blue-600 font-semibold hover:underline">Book Your Project →</a> </div> <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"> <figure class="overflow-hidden rounded-xl shadow"> <img src="/images/professional auto detailing.jpg" alt="Auto detailing finish" class="w-full h-60 object-cover" loading="lazy"> <figcaption class="p-4 text-sm text-gray-700">Full interior + exterior detail</figcaption> </figure> <figure class="overflow-hidden rounded-xl shadow"> <img src="/images/Paint Protection Film.jpg" alt="Paint protection film install" class="w-full h-60 object-cover" loading="lazy"> <figcaption class="p-4 text-sm text-gray-700">Full front PPF install</figcaption> </figure> <figure class="overflow-hidden rounded-xl shadow"> <img src="/images/ceramic coating.jpg" alt="Ceramic coating gloss" class="w-full h-60 object-cover" loading="lazy"> <figcaption class="p-4 text-sm text-gray-700">5-year ceramic coating</figcaption> </figure> <figure class="overflow-hidden rounded-xl shadow"> <img src="/images/window tint.jpg" alt="Window tint" class="w-full h-60 object-cover" loading="lazy"> <figcaption class="p-4 text-sm text-gray-700">Automotive window tint</figcaption> </figure> <figure class="overflow-hidden rounded-xl shadow"> <img src="/images/colorppf.jpg" alt="Color PPF wrap" class="w-full h-60 object-cover" loading="lazy"> <figcaption class="p-4 text-sm text-gray-700">Color PPF transformation</figcaption> </figure> <figure class="overflow-hidden rounded-xl shadow"> <img src="/images/paint correction.jpg" alt="Paint correction" class="w-full h-60 object-cover" loading="lazy"> <figcaption class="p-4 text-sm text-gray-700">Two-stage paint correction</figcaption> </figure> </div> </div> </section>  <section class="bg-blue-600 text-white py-12"> <div class="max-w-7xl mx-auto px-4 text-center"> <h2 class="text-3xl font-bold mb-3">Ready for a showroom finish?</h2> <p class="text-lg text-blue-100 mb-6">Tell us about your vehicle and goals—we'll recommend the right service package.</p> <div class="flex flex-col sm:flex-row gap-4 justify-center"> <a href="/contact" class="bg-white text-blue-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition">Get a Quote</a> <a href="tel:970-628-1505" class="bg-blue-800 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-900 transition">Call: 970-628-1505</a> </div> </div> </section> ` })}`;
}, "C:/colorautodetailing/src/pages/our-work.astro", void 0);

const $$file = "C:/colorautodetailing/src/pages/our-work.astro";
const $$url = "/our-work";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$OurWork,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
