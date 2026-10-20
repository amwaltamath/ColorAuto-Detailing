import type { APIRoute } from 'astro';
import { supabaseServer } from '../../../utils/supabaseServer';
import { createOrbisxLead } from '../../../utils/orbisx';
import { notifyTeamOfMetaLead } from '../../../utils/leadNotifications';
import {
  fetchMetaLeadFromGraph,
  getMetaLeadWebhookConfig,
  metaLeadExternalId,
  parseMetaLeadGraphResponse,
  verifyMetaWebhookSignature,
  type MetaLeadgenWebhookValue,
} from '../../../utils/metaLeads';

/** GET — Meta webhook verification (hub.challenge). */
export const GET: APIRoute = async ({ url }) => {
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');

  const { verifyToken } = getMetaLeadWebhookConfig();

  if (mode === 'subscribe' && token && challenge && verifyToken && token === verifyToken) {
    return new Response(challenge, { status: 200, headers: { 'content-type': 'text/plain' } });
  }

  console.warn('[meta-leads] Webhook verification failed or META_WEBHOOK_VERIFY_TOKEN not set');
  return new Response('Forbidden', { status: 403 });
};

/** POST — leadgen notifications from Facebook / Instagram Instant Forms. */
export const POST: APIRoute = async ({ request }) => {
  const rawBody = await request.text();
  const { appSecret, pageAccessToken } = getMetaLeadWebhookConfig();

  if (appSecret) {
    const signature = request.headers.get('x-hub-signature-256');
    if (!verifyMetaWebhookSignature(rawBody, signature, appSecret)) {
      console.error('[meta-leads] Invalid X-Hub-Signature-256');
      return new Response(JSON.stringify({ ok: false, error: 'Invalid signature' }), {
        status: 401,
        headers: { 'content-type': 'application/json' },
      });
    }
  } else {
    console.warn('[meta-leads] META_APP_SECRET not set — skipping signature verification');
  }

  let payload: unknown;
  try {
    payload = rawBody ? JSON.parse(rawBody) : null;
  } catch {
    return new Response(JSON.stringify({ ok: false, error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  if (!supabaseServer) {
    console.error('[meta-leads] Supabase not configured');
    return new Response(JSON.stringify({ ok: false, error: 'Database not configured' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }

  const body = payload as { object?: string; entry?: unknown[] };
  if (body?.object !== 'page' || !Array.isArray(body.entry)) {
    return new Response(JSON.stringify({ ok: true, ignored: true }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  }

  const leadgenEvents: MetaLeadgenWebhookValue[] = [];
  for (const entry of body.entry) {
    const e = entry as { changes?: { field?: string; value?: MetaLeadgenWebhookValue }[] };
    for (const change of e.changes || []) {
      if (change.field === 'leadgen' && change.value?.leadgen_id) {
        leadgenEvents.push(change.value);
      }
    }
  }

  if (!leadgenEvents.length) {
    return new Response(JSON.stringify({ ok: true, processed: 0 }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  }

  const results: { leadgen_id: string; status: string; lead_id?: string; error?: string }[] = [];

  for (const meta of leadgenEvents) {
    const leadgenId = meta.leadgen_id;
    const externalId = metaLeadExternalId(leadgenId);

    const { data: existing } = await supabaseServer
      .from('leads')
      .select('id')
      .eq('external_id', externalId)
      .maybeSingle();

    if (existing?.id) {
      results.push({ leadgen_id: leadgenId, status: 'duplicate', lead_id: existing.id });
      continue;
    }

    const graph = await fetchMetaLeadFromGraph(leadgenId, pageAccessToken);
    if (!graph.ok) {
      console.error('[meta-leads] Graph fetch failed:', leadgenId, graph.error);
      results.push({ leadgen_id: leadgenId, status: 'error', error: graph.error });
      continue;
    }

    const parsed = parseMetaLeadGraphResponse(leadgenId, graph.data, meta);

    const { data: lead, error } = await supabaseServer
      .from('leads')
      .insert({
        name: parsed.name,
        email: parsed.email,
        phone: parsed.phone,
        source: 'meta_ads',
        service_interest: parsed.serviceInterest,
        message: parsed.message,
        status: 'new',
        external_id: externalId,
        utm_source: 'facebook',
        utm_medium: 'paid_social',
        utm_campaign: parsed.formId ? `form_${parsed.formId}` : null,
        utm_content: parsed.adId || null,
        landing_page: 'meta_instant_form',
      })
      .select('id')
      .single();

    if (error) {
      if (error.code === '23505') {
        results.push({ leadgen_id: leadgenId, status: 'duplicate' });
        continue;
      }
      if (error.message?.includes('external_id')) {
        console.error('[meta-leads] Missing external_id column — run supabase/meta_leads_migration.sql');
      }
      console.error('[meta-leads] Insert failed:', error.message);
      results.push({ leadgen_id: leadgenId, status: 'error', error: error.message });
      continue;
    }

    createOrbisxLead({
      name: parsed.name,
      email: parsed.email,
      phone: parsed.phone,
      serviceInterest: parsed.serviceInterest,
      message: parsed.message,
      source: 'meta_ads',
      landingPage: 'meta_instant_form',
      utmSource: 'facebook',
      utmMedium: 'paid_social',
      utmCampaign: parsed.formId ? `form_${parsed.formId}` : null,
      utmContent: parsed.adId || null,
    }).catch((err) => {
      console.error('[meta-leads] OrbisX sync failed:', err);
    });

    notifyTeamOfMetaLead(parsed, lead?.id);

    results.push({ leadgen_id: leadgenId, status: 'created', lead_id: lead?.id });
    console.log('[meta-leads] Created lead', lead?.id, 'from leadgen', leadgenId);
  }

  return new Response(JSON.stringify({ ok: true, processed: results.length, results }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
};
