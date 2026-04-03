/**
 * Quo (OpenPhone) API utility – sends SMS via the REST API.
 * Docs: https://www.quo.com/docs/mdx/api-reference/messages/send-a-text-message
 */

const QUO_API_BASE = 'https://api.openphone.com/v1';

function getApiKey(): string {
  const key = process.env.QUO_API_KEY || import.meta.env.QUO_API_KEY;
  if (!key) throw new Error('QUO_API_KEY is not configured');
  return key;
}

function getPhoneNumberId(): string {
  return process.env.QUO_PHONE_NUMBER_ID || import.meta.env.QUO_PHONE_NUMBER_ID || '';
}

export interface QuoSendResult {
  ok: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send an SMS message through the Quo (OpenPhone) API.
 *
 * @param to  – recipient phone number in E.164 format (e.g. "+15551234567")
 * @param content – text body (max 1 600 chars)
 */
export async function quoSendSMS(to: string, content: string): Promise<QuoSendResult> {
  const apiKey = getApiKey();
  const from = getPhoneNumberId();

  if (!from) {
    console.error('[quo] QUO_PHONE_NUMBER_ID not set – cannot send SMS');
    return { ok: false, error: 'QUO_PHONE_NUMBER_ID not configured' };
  }

  try {
    const res = await fetch(`${QUO_API_BASE}/messages`, {
      method: 'POST',
      headers: {
        Authorization: apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: content.slice(0, 1600),
        from,
        to: [to],
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error('[quo] send SMS failed:', res.status, text);
      return { ok: false, error: `Quo API ${res.status}: ${text}` };
    }

    const json = await res.json();
    return { ok: true, messageId: json?.data?.id };
  } catch (err: any) {
    console.error('[quo] send SMS error:', err);
    return { ok: false, error: err.message };
  }
}
