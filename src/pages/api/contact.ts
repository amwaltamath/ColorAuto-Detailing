import type { APIContext } from "astro";
import { supabaseServer } from "../../utils/supabaseServer";

interface ContactPayload {
  name: string;
  email: string;
  phone?: string;
  message: string;
  vehicle?: string;
  service?: string;
  website?: string; // honeypot
  source?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  landing_page?: string;
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
          source: String(form.get("source") || ""),
          utm_source: String(form.get("utm_source") || ""),
          utm_medium: String(form.get("utm_medium") || ""),
          utm_campaign: String(form.get("utm_campaign") || ""),
          utm_term: String(form.get("utm_term") || ""),
          utm_content: String(form.get("utm_content") || ""),
          landing_page: String(form.get("landing_page") || ""),
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

    const RESEND_API_KEY = (process.env.RESEND_API_KEY || "").trim();
    const TO_EMAILS = (process.env.CONTACT_TO_EMAIL || "admin@colorautodetailing.com")
      .split(",")
      .map((e) => e.trim())
      .filter(Boolean);
    const FROM_EMAIL = (process.env.CONTACT_FROM_EMAIL || "no-reply@colorautodetailing.com").trim();

    // Validate email addresses
    if (!TO_EMAILS.length || TO_EMAILS.some((e) => !isValidEmail(e))) {
      console.error("Configuration error: Invalid TO_EMAIL.", { TO_EMAILS });
      return new Response(JSON.stringify({ ok: false, error: "Email service misconfigured (invalid recipient)" }), {
        status: 500,
        headers: { "content-type": "application/json" },
      });
    }
    if (!FROM_EMAIL || !isValidEmail(FROM_EMAIL)) {
      console.error("Configuration error: Invalid FROM_EMAIL.", { FROM_EMAIL });
      return new Response(JSON.stringify({ ok: false, error: "Email service misconfigured (invalid sender)" }), {
        status: 500,
        headers: { "content-type": "application/json" },
      });
    }

    if (!RESEND_API_KEY) {
      console.warn("[DEV MODE] RESEND_API_KEY not configured. Logging submission only.", { name, email, phone, message, service, vehicle });
      return new Response(JSON.stringify({ ok: true, dev: true, message: "Email not sent (dev mode) — check logs" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }

    // Validate API key format (must start with 're_' and not be placeholder)
    if (!RESEND_API_KEY.startsWith("re_") || RESEND_API_KEY.includes("your_actual_resend_api_key")) {
      console.error("[ERROR] Invalid RESEND_API_KEY. Must be a real Resend key starting with 're_'. Check Vercel env vars.");
      return new Response(JSON.stringify({ ok: false, error: "Email service not properly configured" }), {
        status: 500,
        headers: { "content-type": "application/json" },
      });
    }

    const subject = `New Inquiry — ${service || "Contact"} — ${name}`;

    // Derive absolute URL for assets (e.g., logo) from request headers with safe fallback
    let host: string;
    try {
      host = (request.headers.get("x-forwarded-host") || request.headers.get("host") || "www.colorautodetailing.com").trim();
      if (!host) host = "www.colorautodetailing.com";
    } catch (e) {
      host = "www.colorautodetailing.com";
    }
    const proto = request.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
    const baseUrl = `${proto}://${host}`;
    const logoUrl = `${baseUrl}/images/ColorAuto.png`;

    // Escape HTML to prevent injection in email markup
    const escapeHtml = (s: string) =>
      s
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#39;");

    const createdAt = new Date().toISOString();

    // Plain-text fallback
    const textLines = [
      "New inquiry from Color Auto Detailing",
      `Submitted: ${createdAt}`,
      `Name: ${name}`,
      `Email: ${email}`,
      `Phone: ${phone || "N/A"}`,
      service ? `Service: ${service}` : null,
      vehicle ? `Vehicle: ${vehicle}` : null,
      "",
      "Message:",
      message,
    ].filter(Boolean);
    const text = textLines.join("\n");

    // HTML version (email friendly, minimal inline styles)
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background:#f6f7f9; padding:24px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px; margin:0 auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 16px rgba(0,0,0,0.06);">
          <tr>
            <td style="padding:16px 20px; background:linear-gradient(90deg,#1e40af,#2563eb); color:#fff;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align:middle; width:1%; white-space:nowrap;">
                    <img src="${logoUrl}" alt="Color Auto Detailing" style="display:block; height:28px; border:0; outline:none; text-decoration:none;"/>
                  </td>
                  <td style="vertical-align:middle; padding-left:12px;">
                    <div style="font-size:16px; font-weight:700; margin:0;">New Inquiry${service ? ` — ${escapeHtml(service)}` : ''}</div>
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
                  <td style="padding:8px 0; color:#0f172a;">${escapeHtml(phone || 'N/A')}</td>
                </tr>
                ${service ? `
                <tr>
                  <td style="padding:8px 0; width:140px; color:#64748b; font-weight:600;">Service</td>
                  <td style="padding:8px 0; color:#0f172a;">${escapeHtml(service)}</td>
                </tr>` : ''}
                ${vehicle ? `
                <tr>
                  <td style="padding:8px 0; width:140px; color:#64748b; font-weight:600;">Vehicle</td>
                  <td style="padding:8px 0; color:#0f172a;">${escapeHtml(vehicle)}</td>
                </tr>` : ''}
              </table>

              <div style="margin-top:16px; padding:16px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px;">
                <div style="color:#64748b; font-weight:700; margin-bottom:8px;">Message</div>
                <div style="white-space:pre-wrap; color:#0f172a; line-height:1.6;">${escapeHtml(message)}</div>
              </div>

              <p style="margin-top:20px; font-size:12px; color:#64748b;">Reply directly to this email to respond to the customer.</p>
            </td>
          </tr>
          <tr>
            <td style="background:#0b1220; color:#cbd5e1; padding:16px 20px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size:12px; line-height:1.4;">
                    <div style="font-weight:700; color:#e2e8f0;">Color Auto Detailing</div>
                    <div>562 S. Westgate Drive, Grand Junction, CO</div>
                    <div><a href="tel:9706281505" style="color:#93c5fd; text-decoration:none;">(970) 628-1505</a> • <a href="${baseUrl}" style="color:#93c5fd; text-decoration:none;">${baseUrl.replace(/^https?:\/\//, '')}</a></div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </div>
    `;

    // Send via Resend REST API to avoid SDK dependency
    console.log("Attempting to send email via Resend API...");
    console.log("From:", FROM_EMAIL, "To:", TO_EMAILS, "Reply-to:", email);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `ColorAuto <${FROM_EMAIL}>`,
        to: TO_EMAILS,
        reply_to: email,
        subject,
        text,
        html,
      }),
    });

    console.log("Resend API response status:", res.status);

    if (!res.ok) {
      const errText = await res.text();
      console.error("Resend API error response:", errText);
      console.error("Request details - FROM:", FROM_EMAIL, "TO:", TO_EMAILS, "Subject:", subject);

      // Parse Resend error for user-friendly message
      let resendMsg = "";
      try {
        const errJson = JSON.parse(errText);
        resendMsg = errJson.message || "";
      } catch {}

      // Check for common Resend errors
      if (res.status === 401) {
        return new Response(JSON.stringify({ ok: false, error: "Email service authentication failed. Please check API key." }), {
          status: 500,
          headers: { "content-type": "application/json" },
        });
      }
      if (res.status === 403) {
        return new Response(JSON.stringify({ ok: false, error: "Email service access denied. Domain may not be verified." }), {
          status: 500,
          headers: { "content-type": "application/json" },
        });
      }
      if (res.status === 422) {
        return new Response(JSON.stringify({ ok: false, error: `Email validation failed: ${resendMsg || "check sender domain is verified in Resend"}` }), {
          status: 500,
          headers: { "content-type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ ok: false, error: `Email service error: ${res.status}${resendMsg ? " — " + resendMsg : ""}` }), {
        status: 500,
        headers: { "content-type": "application/json" },
      });
    }

    // Auto-create lead in database
    const VALID_SOURCES = ['google_ads', 'meta_ads', 'website', 'phone', 'walk_in', 'referral', 'other'];
    const leadSource = (data.source && VALID_SOURCES.includes(data.source)) ? data.source : 'website';
    if (supabaseServer) {
      try {
        await supabaseServer.from('leads').insert({
          name,
          email: email || null,
          phone: phone || null,
          source: leadSource,
          service_interest: service || null,
          vehicle_info: vehicle || null,
          message: message || null,
          status: 'new',
          utm_source: (data.utm_source || '').trim() || null,
          utm_medium: (data.utm_medium || '').trim() || null,
          utm_campaign: (data.utm_campaign || '').trim() || null,
          utm_term: (data.utm_term || '').trim() || null,
          utm_content: (data.utm_content || '').trim() || null,
          landing_page: (data.landing_page || '').trim() || null,
        });
      } catch (leadErr) {
        console.error('Failed to create lead from contact form:', leadErr);
      }
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
