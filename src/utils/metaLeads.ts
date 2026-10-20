import crypto from 'node:crypto';

const GRAPH_API_VERSION = 'v21.0';

export interface MetaLeadgenWebhookValue {
  ad_id?: string;
  form_id?: string;
  leadgen_id: string;
  created_time?: number;
  page_id?: string;
  adgroup_id?: string;
}

export interface ParsedMetaLead {
  leadgenId: string;
  name: string;
  email: string | null;
  phone: string | null;
  serviceInterest: string | null;
  message: string;
  formId?: string;
  adId?: string;
  pageId?: string;
  createdTime?: string;
}

function env(name: string): string {
  return (process.env[name] || import.meta.env[name] || '').trim();
}

export function getMetaLeadWebhookConfig() {
  return {
    appSecret: env('META_APP_SECRET'),
    verifyToken: env('META_WEBHOOK_VERIFY_TOKEN'),
    pageAccessToken: env('META_PAGE_ACCESS_TOKEN'),
  };
}

export function verifyMetaWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  appSecret: string,
): boolean {
  if (!signatureHeader?.startsWith('sha256=') || !appSecret) return false;
  const expected = crypto.createHmac('sha256', appSecret).update(rawBody, 'utf8').digest('hex');
  const received = signatureHeader.slice('sha256='.length);
  if (expected.length !== received.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(expected, 'utf8'), Buffer.from(received, 'utf8'));
  } catch {
    return false;
  }
}

function fieldMap(fieldData: { name: string; values: string[] }[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const field of fieldData) {
    const key = (field.name || '').trim().toLowerCase();
    const value = field.values?.[0]?.trim();
    if (key && value) map.set(key, value);
  }
  return map;
}

function pickServiceInterest(map: Map<string, string>): string | null {
  const serviceKeys = [
    'which_service?',
    'which_service',
    'service',
    'services',
    'what_service_are_you_interested_in?',
    'what_service_are_you_interested_in',
    'interested_in',
  ];
  for (const key of serviceKeys) {
    const val = map.get(key);
    if (val) return val;
  }
  for (const [key, val] of map) {
    if (key.includes('service') && val) return val;
  }
  return null;
}

function buildName(map: Map<string, string>): string {
  const full = map.get('full_name') || map.get('name');
  if (full) return full;
  const first = map.get('first_name') || '';
  const last = map.get('last_name') || '';
  const combined = `${first} ${last}`.trim();
  if (combined) return combined;
  return 'Meta Lead';
}

function buildMessageExtras(
  map: Map<string, string>,
  meta: MetaLeadgenWebhookValue,
  usedKeys: Set<string>,
): string {
  const lines: string[] = ['[Meta Instant Form]'];
  if (meta.form_id) lines.push(`Form ID: ${meta.form_id}`);
  if (meta.ad_id) lines.push(`Ad ID: ${meta.ad_id}`);
  if (meta.page_id) lines.push(`Page ID: ${meta.page_id}`);

  for (const [key, val] of map) {
    if (usedKeys.has(key)) continue;
    lines.push(`${key}: ${val}`);
  }
  return lines.join('\n');
}

export function parseMetaLeadGraphResponse(
  leadgenId: string,
  graphBody: {
    field_data?: { name: string; values: string[] }[];
    created_time?: string;
  },
  meta: MetaLeadgenWebhookValue,
): ParsedMetaLead {
  const map = fieldMap(graphBody.field_data || []);
  const name = buildName(map);
  const email = map.get('email') || map.get('email_address') || null;
  const phone = map.get('phone_number') || map.get('phone') || map.get('mobile_phone') || null;
  const serviceInterest = pickServiceInterest(map);

  const usedKeys = new Set<string>([
    'full_name',
    'name',
    'first_name',
    'last_name',
    'email',
    'email_address',
    'phone_number',
    'phone',
    'mobile_phone',
  ]);
  for (const key of [
    'which_service?',
    'which_service',
    'service',
    'services',
    'what_service_are_you_interested_in?',
    'what_service_are_you_interested_in',
    'interested_in',
  ]) {
    if (map.has(key)) usedKeys.add(key);
  }
  for (const [key] of map) {
    if (key.includes('service')) usedKeys.add(key);
  }

  return {
    leadgenId,
    name,
    email,
    phone,
    serviceInterest,
    message: buildMessageExtras(map, meta, usedKeys),
    formId: meta.form_id,
    adId: meta.ad_id,
    pageId: meta.page_id,
    createdTime: graphBody.created_time,
  };
}

export async function fetchMetaLeadFromGraph(
  leadgenId: string,
  pageAccessToken: string,
): Promise<{ ok: true; data: { field_data?: { name: string; values: string[] }[]; created_time?: string } } | { ok: false; error: string }> {
  if (!pageAccessToken) {
    return { ok: false, error: 'META_PAGE_ACCESS_TOKEN not configured' };
  }

  const url = new URL(`https://graph.facebook.com/${GRAPH_API_VERSION}/${leadgenId}`);
  url.searchParams.set('access_token', pageAccessToken);

  try {
    const res = await fetch(url.toString(), { headers: { Accept: 'application/json' } });
    const text = await res.text();
    let parsed: unknown;
    try {
      parsed = text ? JSON.parse(text) : null;
    } catch {
      parsed = null;
    }

    if (!res.ok) {
      const message =
        typeof parsed === 'object' && parsed !== null && 'error' in parsed
          ? String((parsed as { error: { message?: string } }).error?.message || JSON.stringify(parsed))
          : text || `Graph API error (${res.status})`;
      return { ok: false, error: message };
    }

    return { ok: true, data: (parsed || {}) as { field_data?: { name: string; values: string[] }[]; created_time?: string } };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Graph API request failed';
    return { ok: false, error: message };
  }
}

export function metaLeadExternalId(leadgenId: string): string {
  return `meta_leadgen:${leadgenId}`;
}
