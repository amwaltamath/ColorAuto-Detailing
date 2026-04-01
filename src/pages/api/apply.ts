import type { APIContext } from "astro";

interface ApplyPayload {
  name: string;
  email: string;
  phone: string;
  position: string;
  experience?: string;
  message: string;
  website?: string; // honeypot
}

function isValidEmail(email: string) {
  return /.+@.+\..+/.test(email);
}

export async function POST({ request }: APIContext) {
  try {
    const contentType = request.headers.get("content-type") || "";

    let data: ApplyPayload | null = null;
    if (contentType.includes("application/json")) {
      data = (await request.json()) as ApplyPayload;
    } else {
      try {
        const form = await request.formData();
        data = {
          name: String(form.get("name") || ""),
          email: String(form.get("email") || ""),
          phone: String(form.get("phone") || ""),
          position: String(form.get("position") || ""),
          experience: String(form.get("experience") || ""),
          message: String(form.get("message") || ""),
          website: String(form.get("website") || ""),
        };
      } catch {
        return new Response(JSON.stringify({ ok: false, error: "Invalid request format" }), {
          status: 400,
          headers: { "content-type": "application/json" },
        });
      }
    }

    if (!data) {
      return new Response(JSON.stringify({ ok: false, error: "Missing payload" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    const name = (data.name || "").trim();
    const email = (data.email || "").trim();
    const phone = (data.phone || "").trim();
    const position = (data.position || "").trim();
    const experience = (data.experience || "").trim();
    const message = (data.message || "").trim();
    const website = (data.website || "").trim();

    // Honeypot check
    if (website) {
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }

    if (!name || !email || !phone || !message) {
      return new Response(JSON.stringify({ ok: false, error: "Name, email, phone, and message are required" }), {
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

    const RESEND_API_KEY = (process.env.RESEND_API_KEY || "").trim();
    const TO_EMAIL = "Admin@colorautodetailling.com";
    const FROM_EMAIL = (process.env.CONTACT_FROM_EMAIL || "no-reply@colorautodetailing.com").trim();

    if (!RESEND_API_KEY) {
      console.warn("[DEV MODE] RESEND_API_KEY not configured. Logging application only.", { name, email, phone, position, experience, message });
      return new Response(JSON.stringify({ ok: true, dev: true, message: "Email not sent (dev mode) — check logs" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }

    if (!RESEND_API_KEY.startsWith("re_") || RESEND_API_KEY.includes("your_actual_resend_api_key")) {
      console.error("[ERROR] Invalid RESEND_API_KEY.");
      return new Response(JSON.stringify({ ok: false, error: "Email service not properly configured" }), {
        status: 500,
        headers: { "content-type": "application/json" },
      });
    }

    const subject = `New Job Application — ${position || "General"} — ${name}`;

    let host: string;
    try {
      host = (request.headers.get("x-forwarded-host") || request.headers.get("host") || "www.colorautodetailing.com").trim();
      if (!host) host = "www.colorautodetailing.com";
    } catch {
      host = "www.colorautodetailing.com";
    }
    const proto = request.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
    const baseUrl = `${proto}://${host}`;
    const logoUrl = `${baseUrl}/images/ColorAuto.png`;

    const escapeHtml = (s: string) =>
      s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&#39;");

    const createdAt = new Date().toISOString();

    const text = [
      "New Job Application — Color Auto Detailing",
      `Submitted: ${createdAt}`,
      `Name: ${name}`,
      `Email: ${email}`,
      `Phone: ${phone}`,
      position ? `Position: ${position}` : null,
      experience ? `Experience: ${experience}` : null,
      "",
      "Why they want to join:",
      message,
    ].filter(Boolean).join("\n");

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background:#f6f7f9; padding:24px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px; margin:0 auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 16px rgba(0,0,0,0.06);">
          <tr>
            <td style="padding:16px 20px; background:linear-gradient(90deg,#065f46,#059669); color:#fff;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align:middle; width:1%; white-space:nowrap;">
                    <img src="${logoUrl}" alt="Color Auto Detailing" style="display:block; height:28px; border:0; outline:none; text-decoration:none;"/>
                  </td>
                  <td style="vertical-align:middle; padding-left:12px;">
                    <div style="font-size:16px; font-weight:700; margin:0;">New Job Application${position ? ` — ${escapeHtml(position)}` : ''}</div>
                    <div style="margin:4px 0 0 0; opacity:0.9; font-size:12px;">${escapeHtml(createdAt)}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                <tr>
                  <td style="padding:8px 0; width:140px; color:#64748b; font-weight:600;">Name</td>
                  <td style="padding:8px 0; color:#0f172a;">${escapeHtml(name)}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0; width:140px; color:#64748b; font-weight:600;">Email</td>
                  <td style="padding:8px 0; color:#0f172a;">${escapeHtml(email)}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0; width:140px; color:#64748b; font-weight:600;">Phone</td>
                  <td style="padding:8px 0; color:#0f172a;">${escapeHtml(phone)}</td>
                </tr>
                ${position ? `
                <tr>
                  <td style="padding:8px 0; width:140px; color:#64748b; font-weight:600;">Position</td>
                  <td style="padding:8px 0; color:#0f172a;">${escapeHtml(position)}</td>
                </tr>` : ''}
                ${experience ? `
                <tr>
                  <td style="padding:8px 0; width:140px; color:#64748b; font-weight:600;">Experience</td>
                  <td style="padding:8px 0; color:#0f172a;">${escapeHtml(experience)}</td>
                </tr>` : ''}
              </table>

              <div style="margin-top:16px; padding:16px; background:#f0fdf4; border:1px solid #bbf7d0; border-radius:10px;">
                <div style="color:#065f46; font-weight:700; margin-bottom:8px;">Why They Want to Join</div>
                <div style="white-space:pre-wrap; color:#0f172a; line-height:1.6;">${escapeHtml(message)}</div>
              </div>

              <p style="margin-top:20px; font-size:12px; color:#64748b;">Reply directly to this email to respond to the applicant.</p>
            </td>
          </tr>
          <tr>
            <td style="background:#0b1220; color:#cbd5e1; padding:16px 20px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size:12px; line-height:1.4;">
                    <div style="font-weight:700; color:#e2e8f0;">Color Auto Detailing</div>
                    <div>562 S. Westgate Drive, Grand Junction, CO</div>
                    <div><a href="tel:9706281505" style="color:#93c5fd; text-decoration:none;">(970) 628-1505</a> &bull; <a href="${baseUrl}" style="color:#93c5fd; text-decoration:none;">${baseUrl.replace(/^https?:\/\//, '')}</a></div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </div>
    `;

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
        html,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Resend API error (apply):", errText);
      return new Response(JSON.stringify({ ok: false, error: `Email service error: ${res.status}` }), {
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
