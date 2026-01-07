import { e as createComponent, f as createAstro, k as renderComponent, r as renderTemplate, m as maybeRenderHead, n as renderSlot } from './astro/server_CeE5WmXa.mjs';
import 'piccolore';
import { $ as $$Layout } from './Layout_D3BXhY_Q.mjs';
import { jsxs, jsx, Fragment } from 'react/jsx-runtime';
import { useState } from 'react';
import { create } from 'zustand';

const $$Astro = createAstro();
const $$AuthLayout = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$AuthLayout;
  const { title, description, keywords, canonical, image, noindex } = Astro2.props;
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": title, "description": description, "keywords": keywords, "canonical": canonical, "image": image, "noindex": noindex }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-700"> ${renderSlot($$result2, $$slots["default"])} </div> ` })}`;
}, "C:/colorautodetailing/src/layouts/AuthLayout.astro", void 0);

const useAuthStore = create((set) => ({
  user: null,
  isLoggedIn: false,
  login: (user) => set({ user, isLoggedIn: true }),
  logout: () => set({ user: null, isLoggedIn: false }),
  setUser: (user) => set({ user, isLoggedIn: user !== null })
}));

function LoginForm({ role }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuthStore();
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }
    try {
      const mockUser = {
        id: "1",
        email,
        name: email.split("@")[0],
        role
      };
      login(mockUser);
      window.location.href = role === "customer" ? "/customer/dashboard" : "/employee/dashboard";
    } catch (err) {
      setError("Login failed. Please try again.");
    }
  };
  return /* @__PURE__ */ jsxs(
    "form",
    {
      onSubmit: handleSubmit,
      className: "bg-white p-8 rounded-lg shadow-lg w-96",
      children: [
        /* @__PURE__ */ jsxs("h1", { className: "text-2xl font-bold mb-6 text-gray-800", children: [
          role === "customer" ? "Customer" : "Employee",
          " Login"
        ] }),
        error && /* @__PURE__ */ jsx("div", { className: "bg-red-100 text-red-700 p-3 rounded mb-4", children: error }),
        /* @__PURE__ */ jsxs("div", { className: "mb-4", children: [
          /* @__PURE__ */ jsx("label", { className: "block text-gray-700 font-bold mb-2", children: "Email" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "email",
              value: email,
              onChange: (e) => setEmail(e.target.value),
              className: "w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500",
              placeholder: "you@example.com"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mb-6", children: [
          /* @__PURE__ */ jsx("label", { className: "block text-gray-700 font-bold mb-2", children: "Password" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "password",
              value: password,
              onChange: (e) => setPassword(e.target.value),
              className: "w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500",
              placeholder: "••••••••"
            }
          )
        ] }),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "submit",
            className: "w-full bg-blue-600 text-white font-bold py-2 rounded hover:bg-blue-700 transition",
            children: "Sign In"
          }
        ),
        /* @__PURE__ */ jsx("p", { className: "text-center text-gray-600 mt-4 text-sm", children: role === "customer" ? /* @__PURE__ */ jsxs(Fragment, { children: [
          "Don't have an account?",
          " ",
          /* @__PURE__ */ jsx("a", { href: "/customer/register", className: "text-blue-600 hover:underline", children: "Register here" })
        ] }) : "Contact your administrator for access" })
      ]
    }
  );
}

export { $$AuthLayout as $, LoginForm as L };
