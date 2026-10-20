import crypto from 'node:crypto';

export type LeadSource =
  | 'google_ads'
  | 'meta_ads'
  | 'website'
  | 'phone'
  | 'walk_in'
  | 'referral'
  | 'other';

export interface ParsedCsvLeadRow {
  name: string;
  email: string | null;
  phone: string | null;
  source: LeadSource;
  service_interest: string | null;
  vehicle_info: string | null;
  message: string | null;
  status: 'new';
  external_id: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  landing_page: string | null;
  created_at: string | null;
}

const KNOWN_SOURCES: LeadSource[] = [
  'google_ads',
  'meta_ads',
  'website',
  'phone',
  'walk_in',
  'referral',
  'other',
];

/** Parse CSV text into rows (handles quoted fields, commas, CRLF, UTF-8 BOM). */
export function parseCsv(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const cleaned = text.replace(/^\uFEFF/, '');
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < cleaned.length; i++) {
    const c = cleaned[i];
    const next = cleaned[i + 1];

    if (inQuotes) {
      if (c === '"' && next === '"') {
        field += '"';
        i++;
      } else if (c === '"') {
        inQuotes = false;
      } else {
        field += c;
      }
      continue;
    }

    if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n' || (c === '\r' && next === '\n')) {
      row.push(field);
      field = '';
      if (row.some((cell) => cell.trim() !== '')) rows.push(row);
      row = [];
      if (c === '\r') i++;
    } else if (c !== '\r') {
      field += c;
    }
  }

  if (field.length || row.length) {
    row.push(field);
    if (row.some((cell) => cell.trim() !== '')) rows.push(row);
  }

  if (!rows.length) {
    return { headers: [], rows: [] };
  }

  const headers = rows[0].map(normalizeHeader);
  const records = rows.slice(1).map((cells) => {
    const record: Record<string, string> = {};
    headers.forEach((h, idx) => {
      if (h) record[h] = (cells[idx] ?? '').trim();
    });
    return record;
  });

  return { headers, rows: records };
}

function normalizeHeader(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/\uFEFF/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

function pick(row: Record<string, string>, ...keys: string[]): string {
  for (const key of keys) {
    const val = row[key];
    if (val?.trim()) return val.trim();
  }
  return '';
}

function buildName(row: Record<string, string>): string {
  const full = pick(row, 'full_name', 'fullname', 'name', 'contact_name', 'lead_name');
  if (full) return full;
  const first = pick(row, 'first_name', 'firstname');
  const last = pick(row, 'last_name', 'lastname');
  const combined = `${first} ${last}`.trim();
  if (combined) return combined;
  return '';
}

function pickService(row: Record<string, string>): string | null {
  const direct = pick(
    row,
    'service_interest',
    'service',
    'services',
    'which_service',
    'which_service_are_you_interested_in',
    'what_service_are_you_interested_in',
    'interested_in',
    'product',
  );
  if (direct) return direct;

  for (const [key, val] of Object.entries(row)) {
    if (!val) continue;
    if (key.includes('service') || key.includes('interested')) return val;
  }
  return null;
}

function parseCreatedAt(raw: string): string | null {
  if (!raw?.trim()) return null;
  const d = new Date(raw.trim());
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function hashExternalFallback(parts: string[]): string {
  const payload = parts.filter(Boolean).join('|').toLowerCase();
  return crypto.createHash('sha256').update(payload).digest('hex').slice(0, 32);
}

const CONSUMED_KEYS = new Set([
  'id',
  'lead_id',
  'leadgen_id',
  'created_time',
  'created',
  'created_at',
  'submission_date',
  'date',
  'full_name',
  'fullname',
  'name',
  'first_name',
  'firstname',
  'last_name',
  'lastname',
  'email',
  'email_address',
  'phone',
  'phone_number',
  'mobile_phone',
  'source',
  'campaign_name',
  'campaign_id',
  'ad_name',
  'ad_id',
  'adset_name',
  'form_name',
  'form_id',
  'platform',
  'is_organic',
  'service_interest',
  'service',
  'vehicle',
  'vehicle_info',
  'make',
  'model',
]);

function buildExtraMessage(row: Record<string, string>): string | null {
  const lines: string[] = ['[CSV import — extra fields]'];
  let count = 0;
  for (const [key, val] of Object.entries(row)) {
    if (!val || CONSUMED_KEYS.has(key)) continue;
    if (pickService(row) && (key.includes('service') || key.includes('interested'))) continue;
    lines.push(`${key}: ${val}`);
    count++;
  }
  return count ? lines.join('\n') : null;
}

export interface MapCsvOptions {
  defaultSource?: LeadSource;
}

export function mapCsvRowToLead(
  row: Record<string, string>,
  rowIndex: number,
  options: MapCsvOptions = {},
): { ok: true; lead: ParsedCsvLeadRow } | { ok: false; error: string; row: number } {
  const name = buildName(row);
  if (!name) {
    return { ok: false, error: 'Missing name (full_name, name, or first/last name)', row: rowIndex };
  }

  const email = pick(row, 'email', 'email_address') || null;
  const phone = pick(row, 'phone_number', 'phone', 'mobile_phone') || null;

  if (!email && !phone) {
    return { ok: false, error: 'Row needs at least email or phone', row: rowIndex };
  }

  const metaId = pick(row, 'id', 'lead_id', 'leadgen_id');
  let external_id: string;
  if (metaId) {
    external_id = `meta_leadgen:${metaId}`;
  } else {
    const created = pick(row, 'created_time', 'created', 'created_at', 'submission_date', 'date');
    external_id = `csv_import:${hashExternalFallback([name, email || '', phone || '', created, String(rowIndex)])}`;
  }

  const sourceRaw = pick(row, 'source').toLowerCase().replace(/\s+/g, '_');
  let source: LeadSource = options.defaultSource || 'meta_ads';
  if (KNOWN_SOURCES.includes(sourceRaw as LeadSource)) {
    source = sourceRaw as LeadSource;
  } else if (sourceRaw.includes('google')) {
    source = 'google_ads';
  } else if (sourceRaw.includes('meta') || sourceRaw.includes('facebook') || sourceRaw.includes('instagram')) {
    source = 'meta_ads';
  }

  const campaign = pick(row, 'campaign_name', 'campaign_id', 'utm_campaign');
  const ad = pick(row, 'ad_name', 'ad_id', 'utm_content');
  const form = pick(row, 'form_name', 'form_id');
  const platform = pick(row, 'platform');

  const messageParts = [
    form ? `Form: ${form}` : null,
    platform ? `Platform: ${platform}` : null,
    pick(row, 'adset_name') ? `Ad set: ${pick(row, 'adset_name')}` : null,
    buildExtraMessage(row),
  ].filter(Boolean);

  const created_at = parseCreatedAt(
    pick(row, 'created_time', 'created', 'created_at', 'submission_date', 'date'),
  );

  return {
    ok: true,
    lead: {
      name,
      email,
      phone,
      source,
      service_interest: pickService(row) || null,
      vehicle_info: pick(row, 'vehicle_info', 'vehicle', 'make', 'model') || null,
      message: messageParts.length ? messageParts.join('\n') : null,
      status: 'new',
      external_id,
      utm_source: source === 'meta_ads' ? 'facebook' : source === 'google_ads' ? 'google' : null,
      utm_medium: source === 'meta_ads' || source === 'google_ads' ? 'paid_social' : null,
      utm_campaign: campaign || null,
      utm_content: ad || null,
      landing_page: form ? `meta_form:${form}` : 'csv_import',
      created_at,
    },
  };
}

export function mapCsvToLeads(
  csvText: string,
  options: MapCsvOptions = {},
): {
  leads: ParsedCsvLeadRow[];
  errors: { row: number; error: string }[];
  headers: string[];
} {
  const { headers, rows } = parseCsv(csvText);
  const leads: ParsedCsvLeadRow[] = [];
  const errors: { row: number; error: string }[] = [];

  rows.forEach((row, idx) => {
    const rowNum = idx + 2;
    const result = mapCsvRowToLead(row, rowNum, options);
    if (result.ok) {
      leads.push(result.lead);
    } else {
      errors.push({ row: result.row, error: result.error });
    }
  });

  return { leads, errors, headers };
}
