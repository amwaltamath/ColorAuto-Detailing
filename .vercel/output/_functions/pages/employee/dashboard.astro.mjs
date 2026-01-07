import { e as createComponent, k as renderComponent, r as renderTemplate, m as maybeRenderHead } from '../../chunks/astro/server_DoXgqcN7.mjs';
import 'piccolore';
import { $ as $$Layout } from '../../chunks/Layout_Cl2g-nRv.mjs';
export { renderers } from '../../renderers.mjs';

const $$Dashboard = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Employee Dashboard" }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="max-w-7xl mx-auto px-4 py-8"> <h1 class="text-4xl font-bold mb-8">Employee Dashboard</h1> <div class="grid grid-cols-4 gap-6 mb-8"> <div class="bg-white p-6 rounded-lg shadow"> <h2 class="text-2xl font-bold mb-2">12</h2> <p class="text-gray-600">Today's Jobs</p> </div> <div class="bg-white p-6 rounded-lg shadow"> <h2 class="text-2xl font-bold mb-2">8</h2> <p class="text-gray-600">Completed</p> </div> <div class="bg-white p-6 rounded-lg shadow"> <h2 class="text-2xl font-bold mb-2">3</h2> <p class="text-gray-600">In Progress</p> </div> <div class="bg-white p-6 rounded-lg shadow"> <h2 class="text-2xl font-bold mb-2">1</h2> <p class="text-gray-600">Pending</p> </div> </div> <div class="grid grid-cols-2 gap-8"> <div class="bg-white p-8 rounded-lg shadow"> <h2 class="text-2xl font-bold mb-6">Today's Schedule</h2> <div class="space-y-4"> <div class="border-l-4 border-yellow-500 p-4 bg-yellow-50"> <h3 class="font-bold">10:00 AM - Full Service Detail</h3> <p class="text-gray-600">Vehicle: BMW 3 Series - Customer: John Smith</p> </div> <div class="border-l-4 border-green-500 p-4 bg-green-50"> <h3 class="font-bold">1:00 PM - Exterior Detail</h3> <p class="text-gray-600">Vehicle: Honda Civic - Customer: Sarah Johnson</p> </div> </div> </div> <div class="bg-white p-8 rounded-lg shadow"> <h2 class="text-2xl font-bold mb-6">Quick Actions</h2> <div class="space-y-3"> <button class="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition">
Clock In
</button> <button class="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition">
View My Schedule
</button> <button class="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700 transition">
Update Job Status
</button> <button class="w-full bg-gray-600 text-white py-2 rounded hover:bg-gray-700 transition">
View Reports
</button> </div> </div> </div> </div> ` })}`;
}, "C:/colorautodetailing/src/pages/employee/dashboard.astro", void 0);

const $$file = "C:/colorautodetailing/src/pages/employee/dashboard.astro";
const $$url = "/employee/dashboard";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Dashboard,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
