import { jsx, jsxs } from 'react/jsx-runtime';
import { useState } from 'react';

function QuoteModal({ isOpen, onClose, service = "" }) {
  const [status, setStatus] = useState({ type: "idle" });
  async function onSubmit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const payload = {
      name: String(formData.get("name") || ""),
      email: String(formData.get("email") || ""),
      phone: String(formData.get("phone") || ""),
      message: `Quote request for: ${service || "General Service"}

${String(formData.get("message") || "")}`,
      service,
      website: ""
      // honeypot always empty in JS submit
    };
    setStatus({ type: "loading" });
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setStatus({ type: "error", message: json.error || "Submission failed." });
        return;
      }
      setStatus({ type: "success", message: "Thanks! We'll reach out shortly with your quote." });
      form.reset();
      setTimeout(() => {
        onClose();
        setStatus({ type: "idle" });
      }, 2e3);
    } catch (err) {
      setStatus({ type: "error", message: "Network error. Please try again." });
    }
  }
  if (!isOpen) return null;
  return /* @__PURE__ */ jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4", children: /* @__PURE__ */ jsx("div", { className: "bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto", children: /* @__PURE__ */ jsxs("div", { className: "p-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center mb-4", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold text-gray-800", children: "Get Your Free Quote" }),
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => {
            if (typeof window !== "undefined" && window.closeQuoteModal) {
              window.closeQuoteModal();
            } else {
              onClose();
            }
          },
          className: "text-gray-400 hover:text-gray-600 text-2xl",
          "aria-label": "Close modal",
          children: "×"
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("form", { onSubmit, className: "space-y-4", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { htmlFor: "name", className: "block text-sm font-semibold text-gray-700 mb-1", children: "Name *" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            id: "name",
            name: "name",
            type: "text",
            required: true,
            className: "w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600",
            placeholder: "Your full name"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { htmlFor: "email", className: "block text-sm font-semibold text-gray-700 mb-1", children: "Email *" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            id: "email",
            name: "email",
            type: "email",
            required: true,
            className: "w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600",
            placeholder: "your.email@example.com"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { htmlFor: "phone", className: "block text-sm font-semibold text-gray-700 mb-1", children: "Phone" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            id: "phone",
            name: "phone",
            type: "tel",
            className: "w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600",
            placeholder: "(970) 123-4567"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { htmlFor: "message", className: "block text-sm font-semibold text-gray-700 mb-1", children: "Additional Details" }),
        /* @__PURE__ */ jsx(
          "textarea",
          {
            id: "message",
            name: "message",
            rows: 3,
            className: "w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600",
            placeholder: "Tell us about your vehicle and specific needs..."
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { "aria-hidden": "true", className: "hidden", children: [
        /* @__PURE__ */ jsx("label", { htmlFor: "website", children: "Website" }),
        /* @__PURE__ */ jsx("input", { id: "website", name: "website", type: "text", tabIndex: -1, autoComplete: "off" })
      ] }),
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "submit",
          disabled: status.type === "loading",
          className: "w-full bg-green-600 text-white font-semibold py-3 rounded hover:bg-green-700 transition disabled:opacity-60",
          children: status.type === "loading" ? "Sending Quote Request..." : "Get My Free Quote"
        }
      ),
      /* @__PURE__ */ jsxs("div", { role: "status", "aria-live": "polite", className: "min-h-[1.25rem]", children: [
        status.type === "success" && /* @__PURE__ */ jsx("p", { className: "text-green-700 text-sm text-center", children: status.message }),
        status.type === "error" && /* @__PURE__ */ jsx("p", { className: "text-red-700 text-sm text-center", children: status.message })
      ] })
    ] })
  ] }) }) });
}

export { QuoteModal as Q };
