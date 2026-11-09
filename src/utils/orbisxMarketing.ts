const ORBISX_API_BASE = 'https://orbisx.ca/app/open-api/v1';

function getConfig() {
  const apiKey = (process.env.ORBISX_API_KEY || import.meta.env.ORBISX_API_KEY) as string | undefined;
  const businessId = (process.env.ORBISX_BUSINESS_ID || import.meta.env.ORBISX_BUSINESS_ID) as string | undefined;
  return { apiKey, businessId };
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function pickEmail(row: Record<string, unknown>): string | null {
  const candidates = [row.email, row.Email, row.contact_email];
  for (const c of candidates) {
    if (typeof c === 'string' && isValidEmail(c.trim())) return c.trim().toLowerCase();
  }
  return null;
}

function pickName(row: Record<string, unknown>): string | null {
  const candidates = [row.contact, row.name, row.full_name, row.contact_name];
  for (const c of candidates) {
    if (typeof c === 'string' && c.trim()) return c.trim();
  }
  const first = typeof row.first_name === 'string' ? row.first_name.trim() : '';
  const last = typeof row.last_name === 'string' ? row.last_name.trim() : '';
  const full = `${first} ${last}`.trim();
  return full || null;
}

function extractRows(payload: unknown): Record<string, unknown>[] {
  if (!payload || typeof payload !== 'object') return [];
  const record = payload as Record<string, unknown>;
  const arrays = [record.data, record.clients, record.leads, record.results, record.items, record.contacts];
  for (const maybe of arrays) {
    if (Array.isArray(maybe)) return maybe.filter((r) => r && typeof r === 'object') as Record<string, unknown>[];
  }
  if (Array.isArray(payload)) return payload.filter((r) => r && typeof r === 'object') as Record<string, unknown>[];
  return [];
}

async function orbisxGet(path: string, params: Record<string, string>) {
  const { apiKey, businessId } = getConfig();
  if (!apiKey || !businessId) {
    return { ok: false as const, status: 0, error: 'OrbisX not configured (ORBISX_API_KEY, ORBISX_BUSINESS_ID)' };
  }

  const url = new URL(`${ORBISX_API_BASE}${path}`);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'X-Business-ID': businessId,
        Accept: 'application/json',
      },
    });
    const text = await response.text();
    let parsed: unknown = null;
    try {
      parsed = text ? JSON.parse(text) : null;
    } catch {
      parsed = text;
    }
    if (!response.ok) {
      return {
        ok: false as const,
        status: response.status,
        error: typeof parsed === 'object' && parsed && 'message' in parsed
          ? String((parsed as { message: unknown }).message)
          : text || `OrbisX ${response.status}`,
      };
    }
    return { ok: true as const, status: response.status, data: parsed };
  } catch (err) {
    return { ok: false as const, status: 0, error: err instanceof Error ? err.message : 'OrbisX request failed' };
  }
}

function mergeContacts(
  target: Map<string, { email: string; name: string | null; origin: string }>,
  rows: Record<string, unknown>[],
  origin: string,
) {
  for (const row of rows) {
    const email = pickEmail(row);
    if (!email) continue;
    const existing = target.get(email);
    const name = pickName(row);
    if (!existing) {
      target.set(email, { email, name, origin });
    } else if (!existing.name && name) {
      existing.name = name;
    }
  }
}

/**
 * Pull marketing emails from OrbisX leads + clients via Open API list/search endpoints.
 */
export async function fetchOrbisxMarketingContacts(): Promise<{
  ok: boolean;
  contacts: { email: string; name: string | null }[];
  error?: string;
  diagnostics?: string[];
}> {
  const merged = new Map<string, { email: string; name: string | null; origin: string }>();
  const diagnostics: string[] = [];
  const today = new Date();
  const start = new Date(today);
  start.setFullYear(start.getFullYear() - 2);
  const startDate = start.toISOString().slice(0, 10);
  const endDate = today.toISOString().slice(0, 10);

  const listPaths: Array<{ path: string; origin: string; params: Record<string, string> }> = [
    { path: '/clients', origin: 'orbisx_client', params: { limit: '100', page: '1' } },
    { path: '/leads', origin: 'orbisx_lead', params: { limit: '100', page: '1', start_date: startDate, end_date: endDate } },
    { path: '/clients/search', origin: 'orbisx_client', params: { query: '@', limit: '100' } },
    { path: '/leads/search', origin: 'orbisx_lead', params: { query: '@', limit: '100' } },
    { path: '/find/clients', origin: 'orbisx_client', params: { query: '@', limit: '100' } },
    { path: '/find/leads', origin: 'orbisx_lead', params: { query: '@', limit: '100' } },
  ];

  let anySuccess = false;

  for (const attempt of listPaths) {
    let page = 1;
    let emptyPages = 0;

    for (;;) {
      const params = { ...attempt.params, page: String(page) };
      const result = await orbisxGet(attempt.path, params);
      if (!result.ok) {
        diagnostics.push(`${attempt.path} p${page}: ${result.error}`);
        break;
      }

      const rows = extractRows(result.data);
      if (!rows.length) {
        emptyPages++;
        if (page === 1) {
          diagnostics.push(`${attempt.path}: empty`);
        }
        break;
      }

      anySuccess = true;
      mergeContacts(merged, rows, attempt.origin);

      if (rows.length < 100) break;
      page++;
      if (page > 50) break;
    }
  }

  if (!anySuccess) {
    return {
      ok: false,
      contacts: [],
      error:
        'Could not list contacts from OrbisX Open API. Confirm ORBISX_API_KEY has read access, or export a CSV from OrbisX and upload it here.',
      diagnostics,
    };
  }

  return {
    ok: true,
    contacts: [...merged.values()].map((c) => ({ email: c.email, name: c.name })),
    diagnostics,
  };
}
