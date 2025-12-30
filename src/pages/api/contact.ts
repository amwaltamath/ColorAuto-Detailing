import type { APIContext } from "astro";

interface ContactPayload {
  name: string;
  email: string;
  phone?: string;
  message: string;
  vehicle?: string;
  service?: string;
  website?: string; // honeypot
}

function isValidEmail(email: string) {
  return /.+@.+\..+/.test(email);
}

export async function POST({ request }: APIContext) {
  try {
    const contentType = request.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");
    const isForm =
      contentType.includes("application/x-www-form-urlencoded") ||
      contentType.includes("multipart/form-data");

    let data: ContactPayload | null = null;
    if (isJson) {
      data = (await request.json()) as ContactPayload;
    } else {
      // Try formData first (handles multipart/form-data and url-encoded)
      try {
        const form = await request.formData();
        data = {
          name: String(form.get("name") || ""),
          email: String(form.get("email") || ""),
          phone: String(form.get("phone") || ""),
          message: String(form.get("message") || ""),
          vehicle: String(form.get("vehicle") || ""),
          service: String(form.get("service") || ""),
          website: String(form.get("website") || ""),
        };
      } catch (e) {
        // Fallback: if formData fails, try json
        try {
          data = (await request.json()) as ContactPayload;
        } catch (e2) {
          return new Response(JSON.stringify({ ok: false, error: "Invalid request format" }), {
            status: 400,
            headers: { "content-type": "application/json" },
          });
        }
      }
    }

    if (!data) {
      return new Response(JSON.stringify({ ok: false, error: "Missing payload" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    // Basic validation
    const name = (data.name || "").trim();
    const email = (data.email || "").trim();
    const phone = (data.phone || "").trim();
    const message = (data.message || "").trim();
    const vehicle = (data.vehicle || "").trim();
    const service = (data.service || "").trim();
    const website = (data.website || "").trim(); // honeypot

    if (website) {
      // Bot detected (honeypot filled)
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }

    if (!name || !email || !message) {
      return new Response(JSON.stringify({ ok: false, error: "Name, email, and message are required" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }
    if (!isValidEmail(email)) {
      return new Response(JSON.stringify({ ok: false, error: "Invalid email address" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }
    if (message.length > 5000) {
      return new Response(JSON.stringify({ ok: false, error: "Message too long" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const TO_EMAIL = process.env.CONTACT_TO_EMAIL || "admin@colorautodetailing.com";
    const FROM_EMAIL = process.env.CONTACT_FROM_EMAIL || "no-reply@colorautodetailing.com";

    if (!RESEND_API_KEY) {
      // Fallback: log but respond OK to avoid blocking UX in dev
      console.warn("Missing RESEND_API_KEY. Contact submission logged only.", { name, email, phone, message });
      return new Response(JSON.stringify({ ok: true, dev: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }

    const subject = `New Contact Form Submission — ${name}`;
    const lines = [
      "New inquiry from ColorAuto site",
      "",
      `Name: ${name}`,
      `Email: ${email}`,
      `Phone: ${phone || "N/A"}`,
      service ? `Service: ${service}` : null,
      vehicle ? `Vehicle: ${vehicle}` : null,
      "",
      "Message:",
      message,
    ].filter(Boolean);

    const text = lines.join("\n");

    // Send via Resend REST API to avoid SDK dependency
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `ColorAuto <${FROM_EMAIL}>`,
        to: [TO_EMAIL],
        reply_to: email,
        subject,
        text,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Resend error:", errText);
      return new Response(JSON.stringify({ ok: false, error: "Email service error" }), {
        status: 500,
        headers: { "content-type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (e: any) {
    console.error(e);
    return new Response(JSON.stringify({ ok: false, error: "Server error" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}
