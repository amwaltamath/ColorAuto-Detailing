import type { APIRoute } from 'astro';
import { getAuthenticatedEmployee } from '../../../utils/employeeApiAuth';
import { fetchOrbisxMarketingContacts } from '../../../utils/orbisxMarketing';
import { supabaseServer } from '../../../utils/supabaseServer';

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export const POST: APIRoute = async ({ request }) => {
  if (!supabaseServer) {
    return json({ error: 'Database not configured' }, 503);
  }

  const employee = await getAuthenticatedEmployee(request);
  if (!employee) {
    return json({ error: 'Unauthorized' }, 401);
  }

  try {
    const body = await request.json();
    let importSource = typeof body?.source === 'string' ? body.source : 'csv_import';

    if (body?.from_orbisx === true) {
      const orbis = await fetchOrbisxMarketingContacts();
      if (!orbis.ok || !orbis.contacts.length) {
        return json({ error: orbis.error || 'No OrbisX contacts with email found' }, 502);
      }
      body.records = orbis.contacts;
      importSource = 'orbisx';
    }

    if (body?.from_leads === true) {
      const { data: leads, error: leadErr } = await supabaseServer
        .from('leads')
        .select('name, email')
        .not('email', 'is', null)
        .order('created_at', { ascending: false })
        .limit(5000);

      if (leadErr) return json({ error: leadErr.message }, 500);

      const records = (leads ?? [])
        .map((row) => ({
          email: String(row.email ?? '').trim().toLowerCase(),
          name: row.name ? String(row.name).trim() : undefined,
        }))
        .filter((row) => row.email && isValidEmail(row.email));

      if (!records.length) {
        return json({ error: 'No leads with email addresses found' }, 400);
      }

      body.records = records;
      importSource = 'leads';
    }

    const records = Array.isArray(body?.records) ? body.records : [];

    if (!records.length) {
      return json({ error: 'No records to import' }, 400);
    }

    const normalized = records
      .map((row: { email?: string; name?: string }) => ({
        email: String(row.email ?? '').trim().toLowerCase(),
        name: row.name ? String(row.name).trim() : null,
      }))
      .filter((row) => row.email && isValidEmail(row.email));

    const uniqueByEmail = new Map<string, { email: string; name: string | null }>();
    for (const row of normalized) {
      if (!uniqueByEmail.has(row.email)) uniqueByEmail.set(row.email, row);
    }

    const toUpsert = [...uniqueByEmail.values()].map((row) => ({
      email: row.email,
      name: row.name,
      email_opt_in: true,
      source: importSource,
    }));

    const BATCH = 100;
    let imported = 0;

    for (let i = 0; i < toUpsert.length; i += BATCH) {
      const batch = toUpsert.slice(i, i + BATCH);
      const { error } = await supabaseServer
        .from('newsletter_subscribers')
        .upsert(batch, { onConflict: 'email', ignoreDuplicates: false });

      if (error) {
        if (error.message.includes('newsletter_subscribers')) {
          return json({ error: 'Run supabase/email_campaign_migration.sql in Supabase first' }, 503);
        }
        return json({ error: error.message }, 500);
      }
      imported += batch.length;
    }

    return json({
      ok: true,
      imported,
      skipped_duplicates_in_file: normalized.length - uniqueByEmail.size,
      parsed: normalized.length,
    });
  } catch (err) {
    console.error('[email-campaign-import]', err);
    return json({ error: 'Import failed' }, 500);
  }
};
