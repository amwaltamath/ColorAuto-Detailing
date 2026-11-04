const ORBISX_API_BASE = 'https://orbisx.ca/app/open-api/v1';

export interface OrbisxLeadInput {
  name: string;
  email?: string | null;
  phone?: string | null;
  serviceInterest?: string | null;
  vehicleInfo?: string | null;
  message?: string | null;
  source?: string | null;
  landingPage?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmTerm?: string | null;
  utmContent?: string | null;
}

function getConfig() {
  const apiKey = (process.env.ORBISX_API_KEY || import.meta.env.ORBISX_API_KEY) as string | undefined;
  const businessId = (process.env.ORBISX_BUSINESS_ID || import.meta.env.ORBISX_BUSINESS_ID) as string | undefined;
  return { apiKey, businessId };
}

function mapSource(source?: string | null): string {
  const labels: Record<string, string> = {
    google_ads: 'Google Ads',
    meta_ads: 'Meta Ads',
    website: 'Website',
    phone: 'Phone',
    walk_in: 'Walk-in',
    referral: 'Referral',
    other: 'Other',
  };
  if (!source) return 'Website';
  return labels[source] || source;
}

function buildNotes(input: OrbisxLeadInput): string | undefined {
  const parts: string[] = [];
  if (input.message?.trim()) parts.push(input.message.trim());
  if (input.vehicleInfo?.trim()) parts.push(`Vehicle: ${input.vehicleInfo.trim()}`);
  if (input.landingPage?.trim()) parts.push(`Landing page: ${input.landingPage.trim()}`);

  const utmParts = [
    input.utmSource && `utm_source=${input.utmSource}`,
    input.utmMedium && `utm_medium=${input.utmMedium}`,
    input.utmCampaign && `utm_campaign=${input.utmCampaign}`,
    input.utmTerm && `utm_term=${input.utmTerm}`,
    input.utmContent && `utm_content=${input.utmContent}`,
  ].filter(Boolean);

  if (utmParts.length) parts.push(`UTM: ${utmParts.join(', ')}`);
  return parts.length ? parts.join('\n\n') : undefined;
}

function buildPayload(input: OrbisxLeadInput) {
  const contact = input.name.trim();
  const email = input.email?.trim() || undefined;
  const phone = input.phone?.trim() || undefined;

  return {
    contact,
    name: contact,
    email,
    phone,
    interest: input.serviceInterest?.trim() || undefined,
    initial_interest: input.serviceInterest?.trim() || undefined,
    source: mapSource(input.source),
    notes: buildNotes(input),
  };
}

function extractLeadId(parsed: unknown): string | number | undefined {
  if (!parsed || typeof parsed !== 'object') return undefined;
  const record = parsed as Record<string, unknown>;
  const direct = record.id ?? record.lead_id;
  if (typeof direct === 'string' || typeof direct === 'number') return direct;

  for (const key of ['data', 'lead']) {
    const nested = record[key];
    if (!nested || typeof nested !== 'object') continue;
    const nestedId = (nested as Record<string, unknown>).id ?? (nested as Record<string, unknown>).lead_id;
    if (typeof nestedId === 'string' || typeof nestedId === 'number') return nestedId;
  }

  return undefined;
}

export async function createOrbisxLead(input: OrbisxLeadInput): Promise<{ ok: boolean; error?: string; leadId?: string | number }> {
  const { apiKey, businessId } = getConfig();

  if (!apiKey || !businessId) {
    return { ok: false, error: 'OrbisX not configured (ORBISX_API_KEY, ORBISX_BUSINESS_ID)' };
  }

  if (!input.name?.trim()) {
    return { ok: false, error: 'Lead name is required' };
  }

  if (!input.email?.trim() && !input.phone?.trim()) {
    return { ok: false, error: 'Lead requires email or phone for OrbisX' };
  }

  try {
    const response = await fetch(`${ORBISX_API_BASE}/leads`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'X-Business-ID': businessId,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(buildPayload(input)),
    });

    const text = await response.text();
    let parsed: unknown;
    try {
      parsed = text ? JSON.parse(text) : null;
    } catch {
      parsed = text;
    }

    if (!response.ok) {
      const message =
        typeof parsed === 'object' && parsed !== null && 'message' in parsed
          ? String((parsed as { message: unknown }).message)
          : typeof parsed === 'object' && parsed !== null && 'error' in parsed
            ? String((parsed as { error: unknown }).error)
            : text || `OrbisX API error (${response.status})`;
      console.error('[OrbisX] Failed to create lead:', response.status, message);
      return { ok: false, error: message };
    }

    return { ok: true, leadId: extractLeadId(parsed) };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'OrbisX request failed';
    console.error('[OrbisX] Failed to create lead:', message);
    return { ok: false, error: message };
  }
}

/** Add a follow-up onto an OrbisX lead. Tries the notes route, then falls back quietly. */
export async function appendOrbisxLeadNote(
  leadId: string | number,
  note: string,
): Promise<{ ok: boolean; error?: string }> {
  const { apiKey, businessId } = getConfig();
  if (!apiKey || !businessId) {
    return { ok: false, error: 'OrbisX not configured (ORBISX_API_KEY, ORBISX_BUSINESS_ID)' };
  }

  const body = JSON.stringify({ note, notes: note });
  const headers = {
    Authorization: `Bearer ${apiKey}`,
    'X-Business-ID': businessId,
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };

  for (const path of [`/leads/${leadId}/notes`, `/leads/${leadId}/note`]) {
    try {
      const response = await fetch(`${ORBISX_API_BASE}${path}`, { method: 'POST', headers, body });
      if (response.ok) return { ok: true };
      if (response.status === 404 || response.status === 405) continue;
      const text = await response.text();
      return { ok: false, error: text || `OrbisX note error (${response.status})` };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'OrbisX note request failed';
      return { ok: false, error: message };
    }
  }

  return { ok: false, error: 'OrbisX note endpoint not available' };
}

/** Sync a website chat message into OrbisX (once per session). */
export async function createOrbisxChatLead(input: {
  sessionId: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  message: string;
}): Promise<{ ok: boolean; error?: string }> {
  const phone = input.phone?.trim() || undefined;
  const email = input.email?.trim() || undefined;
  const trackingEmail = email || `website-chat+${input.sessionId.slice(-12)}@colorautodetailing.com`;
  const visitorLabel = input.name?.trim();
  const messageBody = visitorLabel
    ? `[Website chat]\nVisitor: ${visitorLabel}\n\n${input.message.trim()}`
    : `[Website chat]\n\n${input.message.trim()}`;

  return createOrbisxLead({
    name: 'Website Chat',
    email: trackingEmail,
    phone: phone || null,
    message: messageBody,
    source: 'website',
    landingPage: '/',
  });
}
