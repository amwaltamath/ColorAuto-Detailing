function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Plain text with optional simple HTML passthrough for campaign body. */
function messageToHtml(message: string): string {
  const trimmed = message.trim();
  if (/<[a-z][\s\S]*>/i.test(trimmed)) {
    return trimmed;
  }
  return trimmed
    .split(/\n\s*\n/)
    .filter(Boolean)
    .map((block) => `<p style="margin:0 0 16px;line-height:1.6;color:#334155;">${escapeHtml(block).replace(/\n/g, '<br />')}</p>`)
    .join('');
}

export function createColorAutoCampaignEmail(input: {
  subject: string;
  message: string;
  recipientName?: string | null;
}): { html: string; text: string } {
  const greeting = input.recipientName?.trim()
    ? `Hi ${input.recipientName.trim()},`
    : 'Hi there,';
  const bodyHtml = messageToHtml(input.message);
  const site = 'https://colorautodetailing.com';
  const phone = '970-628-1505';

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
        <tr>
          <td style="background:linear-gradient(135deg,#0f172a,#1e3a8a);padding:28px 24px;text-align:center;">
            <p style="margin:0;font-size:13px;letter-spacing:0.12em;text-transform:uppercase;color:#93c5fd;">ColorAuto Detailing</p>
            <h1 style="margin:8px 0 0;font-size:22px;color:#ffffff;font-weight:700;">Grand Junction, CO</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 24px;">
            <p style="margin:0 0 16px;font-size:16px;color:#0f172a;font-weight:600;">${escapeHtml(greeting)}</p>
            ${bodyHtml}
            <p style="margin:24px 0 0;font-size:14px;line-height:1.6;color:#64748b;">
              <a href="${site}/contact" style="color:#2563eb;text-decoration:none;font-weight:600;">Request a quote</a>
              &nbsp;·&nbsp;
              <a href="tel:${phone}" style="color:#2563eb;text-decoration:none;">${phone}</a>
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 24px;background:#f8fafc;border-top:1px solid #e2e8f0;font-size:12px;line-height:1.5;color:#94a3b8;text-align:center;">
            ColorAuto Detailing · 562 S Westgate Dr, Grand Junction, CO<br />
            Reply to this email or contact <a href="mailto:admin@colorautodetailing.com" style="color:#64748b;">admin@colorautodetailing.com</a> to unsubscribe.
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = `${greeting}\n\n${input.message.trim()}\n\n— ColorAuto Detailing\n${phone}\n${site}/contact`;

  return { html, text };
}
