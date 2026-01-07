import { e as createComponent, k as renderComponent, r as renderTemplate } from '../../chunks/astro/server_CeE5WmXa.mjs';
import 'piccolore';
import { $ as $$AuthLayout, L as LoginForm } from '../../chunks/LoginForm_CG17nT0W.mjs';
export { renderers } from '../../renderers.mjs';

const $$Login = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "AuthLayout", $$AuthLayout, { "title": "Customer Login" }, { "default": ($$result2) => renderTemplate` ${renderComponent($$result2, "LoginForm", LoginForm, { "client:load": true, "role": "customer", "client:component-hydration": "load", "client:component-path": "C:/colorautodetailing/src/components/auth/LoginForm", "client:component-export": "LoginForm" })} ` })}`;
}, "C:/colorautodetailing/src/pages/customer/login.astro", void 0);

const $$file = "C:/colorautodetailing/src/pages/customer/login.astro";
const $$url = "/customer/login";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Login,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
