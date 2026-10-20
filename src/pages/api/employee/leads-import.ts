import type { APIRoute } from 'astro';
import { supabaseServer } from '../../../utils/supabaseServer';
import { mapCsvToLeads, type LeadSource } from '../../../utils/csvLeadsImport';

const VALID_SOURCES: LeadSource[] = [
  'google_ads',
  'meta_ads',
  'website',
  'phone',
  'walk_in',
  'referral',
  'other',
];

export const POST: APIRoute = async ({ request }) => {
  if (!supabaseServer) {
    return new Response(JSON.stringify({ error: 'Database not configured' }), {
      status: 503,
      headers: { 'content-type': 'application/json' },
    });
  }

  try {
    const contentType = request.headers.get('content-type') || '';
    let csvText = '';
    let defaultSource: LeadSource = 'meta_ads';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file');
      const sourceField = formData.get('default_source');
      if (typeof sourceField === 'string' && VALID_SOURCES.includes(sourceField as LeadSource)) {
        defaultSource = sourceField as LeadSource;
      }
      if (!(file instanceof File)) {
        return new Response(JSON.stringify({ error: 'Upload a CSV file in the "file" field' }), {
          status: 400,
          headers: { 'content-type': 'application/json' },
        });
      }
      csvText = await file.text();
    } else {
      const body = await request.json().catch(() => null) as { csv?: string; default_source?: string } | null;
      if (!body?.csv?.trim()) {
        return new Response(JSON.stringify({ error: 'Send multipart file or JSON { csv: "..." }' }), {
          status: 400,
          headers: { 'content-type': 'application/json' },
        });
      }
      csvText = body.csv;
      if (body.default_source && VALID_SOURCES.includes(body.default_source as LeadSource)) {
        defaultSource = body.default_source as LeadSource;
      }
    }

    if (!csvText.trim()) {
      return new Response(JSON.stringify({ error: 'CSV is empty' }), {
        status: 400,
        headers: { 'content-type': 'application/json' },
      });
    }

    const { leads, errors, headers } = mapCsvToLeads(csvText, { defaultSource });

    if (!leads.length && errors.length) {
      return new Response(
        JSON.stringify({
          ok: false,
          imported: 0,
          skipped: 0,
          parse_errors: errors,
          headers,
          error: 'No valid rows to import',
        }),
        { status: 400, headers: { 'content-type': 'application/json' } },
      );
    }

    let imported = 0;
    let skipped = 0;
    const insertErrors: { external_id: string; error: string }[] = [];

    for (const lead of leads) {
      const { data: existing } = await supabaseServer
        .from('leads')
        .select('id')
        .eq('external_id', lead.external_id)
        .maybeSingle();

      if (existing?.id) {
        skipped++;
        continue;
      }

      const insertRow: Record<string, unknown> = {
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        source: lead.source,
        service_interest: lead.service_interest,
        vehicle_info: lead.vehicle_info,
        message: lead.message,
        status: lead.status,
        external_id: lead.external_id,
        utm_source: lead.utm_source,
        utm_medium: lead.utm_medium,
        utm_campaign: lead.utm_campaign,
        utm_content: lead.utm_content,
        landing_page: lead.landing_page,
      };

      if (lead.created_at) {
        insertRow.created_at = lead.created_at;
      }

      const { error } = await supabaseServer.from('leads').insert(insertRow);

      if (error) {
        if (error.code === '23505') {
          skipped++;
          continue;
        }
        if (error.message?.includes('external_id')) {
          delete insertRow.external_id;
          const { error: retryErr } = await supabaseServer.from('leads').insert(insertRow);
          if (retryErr) {
            insertErrors.push({ external_id: lead.external_id, error: retryErr.message });
            continue;
          }
          imported++;
          continue;
        }
        insertErrors.push({ external_id: lead.external_id, error: error.message });
        continue;
      }

      imported++;
    }

    return new Response(
      JSON.stringify({
        ok: true,
        imported,
        skipped,
        total_parsed: leads.length,
        parse_errors: errors,
        insert_errors: insertErrors,
        headers,
      }),
      { status: 200, headers: { 'content-type': 'application/json' } },
    );
  } catch (err) {
    console.error('[leads-import]', err);
    return new Response(JSON.stringify({ error: 'Import failed' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
};
