/**
 * Quo (OpenPhone) API utility – sends SMS via the REST API.
 * Docs: https://www.quo.com/docs/mdx/api-reference/messages/send-a-text-message
 */

const QUO_API_BASE = 'https://api.quo.com/v1';

function getApiKey(): string {
  const key = process.env.QUO_API_KEY || import.meta.env.QUO_API_KEY;
  if (!key) throw new Error('QUO_API_KEY is not configured');
  return key;
}

/** Quo "from" — phone number ID (PN…) or E.164 number (+1…). See Quo send-message docs. */
function getFromNumber(): string {
  return (
    process.env.QUO_PHONE_NUMBER_ID ||
    import.meta.env.QUO_PHONE_NUMBER_ID ||
    process.env.QUO_PHONE_NUMBER ||
    import.meta.env.QUO_PHONE_NUMBER ||
    ''
  );
}

export interface QuoSendResult {
  ok: boolean;
  messageId?: string;
  error?: string;
  skipped?: boolean;
}

function normalizeE164(phone: string): string | null {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  if (phone.startsWith('+') && digits.length >= 10) return `+${digits}`;
  return null;
}

export function toE164Phone(phone: string): string | null {
  return normalizeE164(phone);
}

function quoHeaders(apiKey: string): Record<string, string> {
  return {
    Authorization: apiKey,
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
}

export interface QuoContactInput {
  phone: string;
  firstName: string;
  lastName?: string;
  email?: string;
  externalId: string;
}

/** Create or update a Quo contact so thread names match website submissions. */
export async function quoUpsertContact(input: QuoContactInput): Promise<{ ok: boolean; error?: string }> {
  let apiKey: string;
  try {
    apiKey = getApiKey();
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'QUO_API_KEY missing' };
  }

  const e164 = normalizeE164(input.phone);
  if (!e164) {
    return { ok: false, error: 'Invalid phone number for Quo contact' };
  }

  const defaultFields: Record<string, unknown> = {
    firstName: input.firstName.trim(),
    phoneNumbers: [{ name: 'primary', value: e164 }],
  };

  if (input.lastName?.trim()) {
    defaultFields.lastName = input.lastName.trim();
  }

  if (input.email?.trim()) {
    defaultFields.emails = [{ name: 'primary', value: input.email.trim() }];
  }

  try {
    const listRes = await fetch(
      `${QUO_API_BASE}/contacts?externalIds=${encodeURIComponent(input.externalId)}`,
      { headers: quoHeaders(apiKey) },
    );

    let contactId: string | undefined;
    if (listRes.ok) {
      const listJson = await listRes.json();
      contactId = listJson?.data?.[0]?.id;
    }

    const payload = {
      externalId: input.externalId,
      source: 'public-api',
      defaultFields,
    };

    const res = await fetch(
      contactId ? `${QUO_API_BASE}/contacts/${contactId}` : `${QUO_API_BASE}/contacts`,
      {
        method: contactId ? 'PATCH' : 'POST',
        headers: quoHeaders(apiKey),
        body: JSON.stringify(payload),
      },
    );

    if (!res.ok) {
      const text = await res.text();
      console.error('[quo] upsert contact failed:', res.status, text);
      return { ok: false, error: `Quo contact API ${res.status}: ${text}` };
    }

    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Quo contact request failed';
    console.error('[quo] upsert contact error:', message);
    return { ok: false, error: message };
  }
}

function splitPersonName(fullName: string): { firstName: string; lastName?: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: 'Website Lead' };
  if (parts.length === 1) return { firstName: parts[0] };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

export function quoExternalIdForPhone(phone: string, prefix: string): string | null {
  const e164 = normalizeE164(phone);
  if (!e164) return null;
  return `${prefix}-${e164.replace(/\D/g, '')}`;
}

export function quoContactNameFromForm(fullName: string): { firstName: string; lastName?: string } {
  return splitPersonName(fullName);
}

export function getTeamNotifyNumber(): string | undefined {
  return process.env.QUO_SMS_NOTIFY_NUMBER || import.meta.env.QUO_SMS_NOTIFY_NUMBER;
}

export function isSmsBridgeEnabled(): boolean {
  return (
    process.env.CHAT_SMS_BRIDGE_ENABLED ||
    import.meta.env.CHAT_SMS_BRIDGE_ENABLED ||
    (import.meta.env.DEV ? 'false' : 'true')
  ).toLowerCase() === 'true';
}

/** True when notify target is the same line we send from (OpenPhone rejects / ignores self-SMS). */
export function isQuoSelfSms(to: string): boolean {
  const toE164 = normalizeE164(to);
  const from = getFromNumber();
  if (!toE164 || !from) return false;

  const fromE164 = from.startsWith('PN') ? null : normalizeE164(from);
  if (fromE164 && toE164 === fromE164) return true;

  return false;
}

/**
 * Send an SMS message through the Quo (OpenPhone) API.
 *
 * @param to  – recipient phone number in E.164 format (e.g. "+15551234567")
 * @param content – text body (max 1 600 chars)
 */
export async function quoSendSMS(to: string, content: string): Promise<QuoSendResult> {
  const apiKey = getApiKey();
  const from = getFromNumber();

  if (!from) {
    console.error('[quo] Set QUO_PHONE_NUMBER (+19706281505) or QUO_PHONE_NUMBER_ID – cannot send SMS');
    return { ok: false, error: 'QUO_PHONE_NUMBER not configured' };
  }

  if (isQuoSelfSms(to)) {
    console.warn(
      '[quo] QUO_SMS_NOTIFY_NUMBER matches your OpenPhone line – use a personal cell for SMS alerts',
    );
    return {
      ok: false,
      skipped: true,
      error: 'Cannot SMS your OpenPhone number from itself; set QUO_SMS_NOTIFY_NUMBER to your personal cell',
    };
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
