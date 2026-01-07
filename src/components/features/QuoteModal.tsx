import React, { useState } from "react";

type Status = { type: "idle" | "loading" | "success" | "error"; message?: string };

interface QuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  service?: string;
}

export default function QuoteModal({ isOpen, onClose, service = "" }: QuoteModalProps) {
  const [status, setStatus] = useState<Status>({ type: "idle" });

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const payload = {
      name: String(formData.get("name") || ""),
      email: String(formData.get("email") || ""),
      phone: String(formData.get("phone") || ""),
      message: `Quote request for: ${service || 'General Service'}\n\n${String(formData.get("message") || "")}`,
      service: service,
      website: "", // honeypot always empty in JS submit
    };

    setStatus({ type: "loading" });
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setStatus({ type: "error", message: json.error || "Submission failed." });
        return;
      }
      setStatus({ type: "success", message: "Thanks! We'll reach out shortly with your quote." });
      form.reset();
      // Close modal after 2 seconds on success
      setTimeout(() => {
        onClose();
        setStatus({ type: "idle" });
      }, 2000);
    } catch (err: any) {
      setStatus({ type: "error", message: "Network error. Please try again." });
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-800">Get Your Free Quote</h2>
            <button
              onClick={() => {
                if (typeof window !== 'undefined' && window.closeQuoteModal) {
                  window.closeQuoteModal();
                } else {
                  onClose();
                }
              }}
              className="text-gray-400 hover:text-gray-600 text-2xl"
              aria-label="Close modal"
            >
              ×
            </button>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-1">Name *</label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="Your full name"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1">Email *</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="your.email@example.com"
              />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-1">Phone</label>
              <input
                id="phone"
                name="phone"
                type="tel"
                className="w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="(970) 123-4567"
              />
            </div>
            <div>
              <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-1">Additional Details</label>
              <textarea
                id="message"
                name="message"
                rows={3}
                className="w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="Tell us about your vehicle and specific needs..."
              ></textarea>
            </div>

            {/* Honeypot for bots (not visible to humans) */}
            <div aria-hidden="true" className="hidden">
              <label htmlFor="website">Website</label>
              <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
            </div>

            <button
              type="submit"
              disabled={status.type === "loading"}
              className="w-full bg-green-600 text-white font-semibold py-3 rounded hover:bg-green-700 transition disabled:opacity-60"
            >
              {status.type === "loading" ? "Sending Quote Request..." : "Get My Free Quote"}
            </button>

            <div role="status" aria-live="polite" className="min-h-[1.25rem]">
              {status.type === "success" && (
                <p className="text-green-700 text-sm text-center">{status.message}</p>
              )}
              {status.type === "error" && (
                <p className="text-red-700 text-sm text-center">{status.message}</p>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}