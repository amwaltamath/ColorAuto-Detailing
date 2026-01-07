import { e as createComponent, k as renderComponent, l as renderScript, r as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_CeE5WmXa.mjs';
import 'piccolore';
import { $ as $$PublicLayout } from '../chunks/PublicLayout_CmOuk8Rq.mjs';
export { renderers } from '../renderers.mjs';

const $$Contact = createComponent(async ($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "PublicLayout", $$PublicLayout, { "title": "Contact ColorAuto Detailing", "description": "Contact ColorAuto Detailing in Grand Junction, CO for quotes on auto detailing, PPF, ceramic coating, and window tinting. Call 970-628-1505 or email admin@colorautodetailing.com.", "keywords": [
    "contact ColorAuto",
    "auto detailing quote",
    "PPF quote",
    "ceramic coating quote",
    "window tinting Grand Junction"
  ], "image": "/images/protection.jpg" }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="max-w-7xl mx-auto px-4 py-12"> <h1 class="text-4xl font-bold mb-4 text-center">Contact Us</h1> <p class="text-xl text-gray-600 text-center mb-12 max-w-3xl mx-auto">
Get in touch with our team for a free quote or to ask any questions about our services.
</p> <div class="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12"> <!-- Contact Form --> <div class="bg-white p-8 rounded-lg shadow-lg"> <h2 class="text-2xl font-bold mb-6">Send us a Message</h2> <form id="contact-form" class="space-y-4" method="POST" action="/api/contact"> <input type="text" name="website" class="hidden" tabindex="-1" autocomplete="off" aria-hidden="true"> <div> <label class="block text-gray-700 font-semibold mb-2" for="name">Name</label> <input id="name" name="name" type="text" required class="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500" placeholder="Your name"> </div> <div> <label class="block text-gray-700 font-semibold mb-2" for="email">Email</label> <input id="email" name="email" type="email" required class="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500" placeholder="your@email.com"> </div> <div> <label class="block text-gray-700 font-semibold mb-2" for="phone">Phone</label> <input id="phone" name="phone" type="tel" class="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500" placeholder="(970) 123-4567"> </div> <div> <label class="block text-gray-700 font-semibold mb-2" for="vehicle">Vehicle</label> <input id="vehicle" name="vehicle" type="text" class="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500" placeholder="Year, Make, Model"> </div> <div> <label class="block text-gray-700 font-semibold mb-2" for="service">Service Interested In</label> <select id="service" name="service" class="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"> <option value="">Select a service...</option> <option>Auto Detailing</option> <option>Paint Protection Film</option> <option>Ceramic Coating</option> <option>Window Tinting</option> <option>Color PPF</option> <option>Other</option> </select> </div> <div> <label class="block text-gray-700 font-semibold mb-2" for="message">Message</label> <textarea id="message" name="message" rows="4" required class="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500" placeholder="Tell us about your vehicle and service needs..."></textarea> </div> <div id="form-status" class="text-sm font-semibold hidden"></div> <button type="submit" class="w-full bg-blue-600 text-white font-bold py-3 rounded hover:bg-blue-700 transition">
Send Message
</button> </form> </div> <!-- Contact Information --> <div class="space-y-8"> <!-- Address --> <div class="bg-white p-8 rounded-lg shadow-lg"> <h3 class="text-2xl font-bold mb-4 text-blue-600">📍 Location</h3> <p class="text-gray-700 text-lg font-semibold">ColorAuto Detailing</p> <p class="text-gray-600 text-lg">562 S Westgate Drive</p> <p class="text-gray-600 text-lg mb-4">Grand Junction, CO 81505</p> <a href="https://maps.app.goo.gl/U8GewAAibaMwEZ8q8" target="_blank" class="text-blue-600 font-semibold hover:underline">
Get Directions →
</a> <div class="mt-6 rounded-lg overflow-hidden border border-gray-200"> <iframe title="Map to ColorAuto Detailing" src="https://www.google.com/maps?q=562+S+Westgate+Drive,+Grand+Junction,+CO+81505&output=embed" width="100%" height="260" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe> </div> </div> <!-- Phone --> <div class="bg-white p-8 rounded-lg shadow-lg"> <h3 class="text-2xl font-bold mb-4 text-blue-600">☎️ Phone</h3> <a href="tel:970-628-1505" class="text-2xl font-bold text-blue-600 hover:underline">
970-628-1505
</a> <p class="text-gray-600 mt-2">Call for immediate assistance</p> </div> <!-- Email --> <div class="bg-white p-8 rounded-lg shadow-lg"> <h3 class="text-2xl font-bold mb-4 text-blue-600">✉️ Email</h3> <a href="mailto:admin@colorautodetailing.com" class="text-lg text-blue-600 hover:underline">
admin@colorautodetailing.com
</a> <p class="text-gray-600 mt-2">We'll respond within 24 hours</p> </div> <!-- Hours --> <div class="bg-white p-8 rounded-lg shadow-lg"> <h3 class="text-2xl font-bold mb-4 text-blue-600">🕐 Hours</h3> <div class="space-y-2 text-gray-700"> <p><strong>Monday - Friday:</strong> <span class="text-gray-600">8:00 AM - 5:00 PM</span></p> <p><strong>Saturday:</strong> <span class="text-gray-600">Closed</span></p> <p><strong>Sunday:</strong> <span class="text-gray-600">Closed</span></p> </div> </div> </div> </div> <!-- Why Choose Us --> <div class="bg-gray-50 p-12 rounded-lg"> <h2 class="text-3xl font-bold text-center mb-8">Why Choose ColorAuto?</h2> <div class="grid grid-cols-1 md:grid-cols-3 gap-8"> <div class="text-center"> <div class="text-4xl mb-4">⭐</div> <h3 class="text-xl font-bold mb-2">Professional Team</h3> <p class="text-gray-600">Experienced detailers with years of expertise in automotive care and protection.</p> </div> <div class="text-center"> <div class="text-4xl mb-4">💯</div> <h3 class="text-xl font-bold mb-2">Quality Guaranteed</h3> <p class="text-gray-600">We stand behind our work with satisfaction guarantees and use only premium products.</p> </div> <div class="text-center"> <div class="text-4xl mb-4">🎯</div> <h3 class="text-xl font-bold mb-2">Attention to Detail</h3> <p class="text-gray-600">Every vehicle receives personalized care and meticulous attention to ensure perfection.</p> </div> </div> </div> </div> ` })} ${renderScript($$result, "C:/colorautodetailing/src/pages/contact.astro?astro&type=script&index=0&lang.ts")}`;
}, "C:/colorautodetailing/src/pages/contact.astro", void 0);

const $$file = "C:/colorautodetailing/src/pages/contact.astro";
const $$url = "/contact";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Contact,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
