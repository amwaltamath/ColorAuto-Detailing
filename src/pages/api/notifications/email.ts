import type { APIContext } from 'astro';

interface EmailNotificationPayload {
  sessionCount: number;
  latestSession?: {
    id: string;
    visitorEmail?: string;
    visitorName?: string;
    lastMessage?: string;
  };
}

export async function POST({ request }: APIContext) {
  if (request.headers.get('content-type') !== 'application/json') {
    return new Response(JSON.stringify({ ok: false, error: 'Invalid content type' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  const body = (await request.json()) as EmailNotificationPayload;
  const { sessionCount, latestSession } = body;

  // Get email settings from environment
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const TO_EMAIL = process.env.CONTACT_TO_EMAIL || 'info@colorautodetailing.com';
  const FROM_EMAIL = process.env.CONTACT_FROM_EMAIL || 'noreply@colorautodetailing.com';

  if (!RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not configured - skipping email notification');
    return new Response(JSON.stringify({ ok: true, sent: false, reason: 'No API key' }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  }

  try {
    // Send email using Resend
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: TO_EMAIL,
        subject: `🔔 New Customer Chat Message - ${sessionCount} Active Session${sessionCount > 1 ? 's' : ''}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">New Customer Chat Message</h2>
            <p>You have <strong>${sessionCount}</strong> active chat session${sessionCount > 1 ? 's' : ''} waiting for response.</p>
            
            ${
              latestSession
                ? `
              <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
                <h3 style="margin-top: 0;">Latest Message:</h3>
                <p><strong>From:</strong> ${latestSession.visitorName || latestSession.visitorEmail || 'Anonymous Visitor'}</p>
                ${latestSession.visitorEmail ? `<p><strong>Email:</strong> ${latestSession.visitorEmail}</p>` : ''}
                ${latestSession.lastMessage ? `<p><strong>Message:</strong> ${latestSession.lastMessage}</p>` : ''}
              </div>
            `
                : ''
            }
            
            <p style="margin-top: 24px;">
              <a href="https://colorautodetailing.com/employee/dashboard" 
                 style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                View Dashboard
              </a>
            </p>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">
              This is an automated notification from your ColorAuto Detailing chat system.
            </p>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Resend API error:', error);
      return new Response(JSON.stringify({ ok: false, error: 'Failed to send email' }), {
        status: 500,
        headers: { 'content-type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ ok: true, sent: true }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  } catch (error) {
    console.error('Error sending email notification:', error);
    return new Response(JSON.stringify({ ok: false, error: 'Server error' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
}
