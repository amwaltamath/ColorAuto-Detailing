import { SITE_ORIGIN } from './seo';
import {
  getTeamNotifyNumber,
  isQuoSelfSms,
  isSmsBridgeEnabled,
  quoContactNameFromForm,
  quoExternalIdForPhone,
  quoSendSMS,
  quoUpsertContact,
} from './quo';
import type { ParsedMetaLead } from './metaLeads';

function env(name: string): string {
  return (process.env[name] || import.meta.env[name] || '').trim();
}

function isValidEmail(email: string): boolean {
  return /.+@.+\..+/.test(email);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getMailConfig() {
  const resendKey = env('RESEND_API_KEY');
  const toEmails = env('CONTACT_TO_EMAIL')
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean);
  const fromEmail = env('CONTACT_FROM_EMAIL') || 'no-reply@colorautodetailing.com';
  return { resendKey, toEmails, fromEmail };
}

async function sendMetaLeadEmail(parsed: ParsedMetaLead, leadId?: string): Promise<void> {
  const { resendKey, toEmails, fromEmail } = getMailConfig();
  if (!resendKey?.startsWith('re_') || !toEmails.length || !isValidEmail(fromEmail)) {
    console.warn('[meta-lead-notify] Email skipped — Resend or CONTACT_TO_EMAIL not configured');
    return;
  }
  if (toEmails.some((e) => !isValidEmail(e))) {
    console.error('[meta-lead-notify] Invalid CONTACT_TO_EMAIL');
    return;
  }

  const service = parsed.serviceInterest || 'Meta Instant Form';
  const subject = `New Meta Lead — ${service} — ${parsed.name}`;
  const createdAt = new Date().toISOString();
  const dashboardUrl = `${SITE_ORIGIN}/employee/dashboard`;
  const logoUrl = `${SITE_ORIGIN}/images/ColorAuto.png`;

  const textLines = [
    'New lead from Meta Instant Form (Facebook/Instagram)',
    `Submitted: ${createdAt}`,
    `Name: ${parsed.name}`,
    `Email: ${parsed.email || 'N/A'}`,
    `Phone: ${parsed.phone || 'N/A'}`,
    parsed.serviceInterest ? `Service: ${parsed.serviceInterest}` : null,
    leadId ? `Dashboard lead ID: ${leadId}` : null,
    '',
    parsed.message,
    '',
    `Open leads: ${dashboardUrl}`,
  ].filter(Boolean);
  const text = textLines.join('\n');

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background:#f6f7f9; padding:24px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px; margin:0 auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 16px rgba(0,0,0,0.06);">
        <tr>
          <td style="padding:16px 20px; background:linear-gradient(90deg,#1e3a8a,#1877f2); color:#fff;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="vertical-align:middle; width:1%; white-space:nowrap;">
                  <img src="${logoUrl}" alt="ColorAuto" style="display:block; height:28px; border:0;"/>
                </td>
                <td style="vertical-align:middle; padding-left:12px;">
                  <div style="font-size:16px; font-weight:700;">New Meta Instant Form Lead</div>
                  <div style="margin:4px 0 0; opacity:0.9; font-size:12px;">${escapeHtml(createdAt)}</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:24px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr><td style="padding:8px 0; width:120px; color:#64748b; font-weight:600;">Name</td><td style="padding:8px 0;">${escapeHtml(parsed.name)}</td></tr>
              <tr><td style="padding:8px 0; color:#64748b; font-weight:600;">Email</td><td style="padding:8px 0;">${escapeHtml(parsed.email || 'N/A')}</td></tr>
              <tr><td style="padding:8px 0; color:#64748b; font-weight:600;">Phone</td><td style="padding:8px 0;">${escapeHtml(parsed.phone || 'N/A')}</td></tr>
              ${parsed.serviceInterest ? `<tr><td style="padding:8px 0; color:#64748b; font-weight:600;">Service</td><td style="padding:8px 0;">${escapeHtml(parsed.serviceInterest)}</td></tr>` : ''}
            </table>
            <div style="margin-top:16px; padding:16px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px;">
              <div style="color:#64748b; font-weight:700; margin-bottom:8px;">Details</div>
              <div style="white-space:pre-wrap; color:#0f172a; line-height:1.6;">${escapeHtml(parsed.message)}</div>
            </div>
            <p style="margin-top:20px;">
              <a href="${dashboardUrl}" style="display:inline-block; background:#2563eb; color:#fff; padding:12px 20px; border-radius:8px; text-decoration:none; font-weight:600;">View in dashboard</a>
            </p>
          </td>
        </tr>
      </table>
    </div>
  `;

  const payload: Record<string, unknown> = {
    from: `ColorAuto <${fromEmail}>`,
    to: toEmails,
    subject,
    text,
    html,
  };
  if (parsed.email && isValidEmail(parsed.email)) {
    payload.reply_to = parsed.email;
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error('[meta-lead-notify] Resend failed:', res.status, errText);
    return;
  }
  console.log('[meta-lead-notify] Team email sent for Meta lead', parsed.name);
}

async function sendMetaLeadSms(parsed: ParsedMetaLead): Promise<void> {
  if (!isSmsBridgeEnabled()) {
    console.log('[meta-lead-notify] SMS skipped — CHAT_SMS_BRIDGE_ENABLED is off');
    return;
  }

  const teamNotifyNumber = getTeamNotifyNumber();
  if (!teamNotifyNumber || isQuoSelfSms(teamNotifyNumber)) {
    console.log('[meta-lead-notify] SMS skipped — QUO_SMS_NOTIFY_NUMBER not set or same as business line');
    return;
  }

  const lines = [
    '📘 Meta Instant Form',
    parsed.name,
    parsed.phone ? `Phone: ${parsed.phone}` : null,
    parsed.email ? `Email: ${parsed.email}` : null,
    parsed.serviceInterest ? `Service: ${parsed.serviceInterest}` : null,
    '',
    'Call within 1 hour for best conversion.',
    `${SITE_ORIGIN}/employee/dashboard`,
  ].filter(Boolean);

  const res = await quoSendSMS(teamNotifyNumber, lines.join('\n'));
  if (res.ok) {
    console.log('[meta-lead-notify] Team SMS sent →', res.messageId);
  } else if (!res.skipped) {
    console.error('[meta-lead-notify] Quo SMS failed:', res.error);
  }
}

function syncMetaLeadQuoContact(parsed: ParsedMetaLead): void {
  if (!parsed.phone || !isSmsBridgeEnabled()) return;

  const externalId = quoExternalIdForPhone(parsed.phone, 'meta-lead');
  if (!externalId) return;

  const contactName = quoContactNameFromForm(parsed.name);
  quoUpsertContact({
    phone: parsed.phone,
    firstName: contactName.firstName,
    lastName: contactName.lastName,
    email: parsed.email || undefined,
    externalId,
  }).catch((err) => console.error('[meta-lead-notify] Quo contact upsert failed:', err));
}

/** Email + SMS alerts for a new Meta Instant Form lead (non-blocking; log errors only). */
export function notifyTeamOfMetaLead(parsed: ParsedMetaLead, leadId?: string): void {
  syncMetaLeadQuoContact(parsed);

  sendMetaLeadEmail(parsed, leadId).catch((err) => {
    console.error('[meta-lead-notify] Email error:', err);
  });

  sendMetaLeadSms(parsed).catch((err) => {
    console.error('[meta-lead-notify] SMS error:', err);
  });
}
