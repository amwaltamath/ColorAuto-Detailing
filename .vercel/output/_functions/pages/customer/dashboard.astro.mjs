import { e as createComponent, k as renderComponent, r as renderTemplate, m as maybeRenderHead } from '../../chunks/astro/server_CeE5WmXa.mjs';
import 'piccolore';
import { $ as $$Layout } from '../../chunks/Layout_D3BXhY_Q.mjs';
export { renderers } from '../../renderers.mjs';

const $$Dashboard = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Customer Dashboard" }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="max-w-7xl mx-auto px-4 py-8"> <h1 class="text-4xl font-bold mb-8">Customer Dashboard</h1> <div class="grid grid-cols-3 gap-8 mb-8"> <div class="bg-white p-6 rounded-lg shadow"> <h2 class="text-2xl font-bold mb-2">5</h2> <p class="text-gray-600">Total Bookings</p> </div> <div class="bg-white p-6 rounded-lg shadow"> <h2 class="text-2xl font-bold mb-2">2</h2> <p class="text-gray-600">Upcoming Appointments</p> </div> <div class="bg-white p-6 rounded-lg shadow"> <h2 class="text-2xl font-bold mb-2">$450</h2> <p class="text-gray-600">Total Spent</p> </div> </div> <div class="bg-white p-8 rounded-lg shadow"> <h2 class="text-2xl font-bold mb-6">Upcoming Appointments</h2> <div class="space-y-4"> <div class="border-l-4 border-blue-600 p-4 bg-blue-50"> <h3 class="font-bold">Exterior Detail Service</h3> <p class="text-gray-600">December 27, 2025 at 10:00 AM</p> </div> <div class="border-l-4 border-green-600 p-4 bg-green-50"> <h3 class="font-bold">Interior Cleaning</h3> <p class="text-gray-600">January 5, 2026 at 2:00 PM</p> </div> </div> </div> <div class="mt-8"> <a href="#" class="bg-blue-600 text-white px-6 py-2 rounded font-bold hover:bg-blue-700 transition">
Book New Service
</a> </div> </div> ` })}`;
}, "C:/colorautodetailing/src/pages/customer/dashboard.astro", void 0);

const $$file = "C:/colorautodetailing/src/pages/customer/dashboard.astro";
const $$url = "/customer/dashboard";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Dashboard,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
