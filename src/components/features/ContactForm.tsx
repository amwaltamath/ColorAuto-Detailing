import React, { useState } from "react";

type Status = { type: "idle" | "loading" | "success" | "error"; message?: string };

export default function ContactForm() {
  const [status, setStatus] = useState<Status>({ type: "idle" });

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const payload = {
      name: String(formData.get("name") || ""),
      email: String(formData.get("email") || ""),
      phone: String(formData.get("phone") || ""),
      message: String(formData.get("message") || ""),
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
      setStatus({ type: "success", message: "Thanks! We’ll reach out shortly." });
      form.reset();
    } catch (err: any) {
      setStatus({ type: "error", message: "Network error. Please try again." });
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-xl mx-auto bg-white p-6 rounded-lg shadow space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-semibold text-gray-700">Name</label>
        <input id="name" name="name" type="text" required className="mt-1 w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600" />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-semibold text-gray-700">Email</label>
        <input id="email" name="email" type="email" required className="mt-1 w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600" />
      </div>
      <div>
        <label htmlFor="phone" className="block text-sm font-semibold text-gray-700">Phone</label>
        <input id="phone" name="phone" type="tel" className="mt-1 w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600" />
      </div>
      <div>
        <label htmlFor="message" className="block text-sm font-semibold text-gray-700">Message</label>
        <textarea id="message" name="message" rows={5} required className="mt-1 w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"></textarea>
      </div>
      {/* Honeypot for bots (not visible to humans) */}
      <div aria-hidden="true" className="hidden">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <button type="submit" disabled={status.type === "loading"} className="w-full bg-blue-600 text-white font-semibold py-3 rounded hover:bg-blue-700 transition disabled:opacity-60">
        {status.type === "loading" ? "Sending…" : "Send Message"}
      </button>

      <div role="status" aria-live="polite" className="min-h-[1.25rem]">
        {status.type === "success" && (
          <p className="text-green-700 text-sm">{status.message}</p>
        )}
        {status.type === "error" && (
          <p className="text-red-700 text-sm">{status.message}</p>
        )}
      </div>
    </form>
  );
}
