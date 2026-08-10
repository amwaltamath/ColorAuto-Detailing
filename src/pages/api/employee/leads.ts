import type { APIRoute } from 'astro';
import { supabaseServer } from '../../../utils/supabaseServer';

export const GET: APIRoute = async ({ url }) => {
  if (!supabaseServer) {
    return new Response(
      JSON.stringify({ leads: [], error: 'Database not configured. Set PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.' }),
      { status: 503, headers: { 'content-type': 'application/json' } },
    );
  }

  try {
    const status = url.searchParams.get('status');
    const source = url.searchParams.get('source');
    const search = url.searchParams.get('search');

    let query = supabaseServer
      .from('leads')
      .select('*, lead_notes(id)')
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    if (source && source !== 'all') {
      query = query.eq('source', source);
    }
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    const { data: leads, error } = await query;

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { 'content-type': 'application/json' } });
    }

    // Add note count
    const leadsWithCount = (leads || []).map((lead: any) => ({
      ...lead,
      note_count: lead.lead_notes?.length || 0,
      lead_notes: undefined,
    }));

    return new Response(JSON.stringify({ leads: leadsWithCount }), { status: 200, headers: { 'content-type': 'application/json' } });
  } catch (err) {
    console.error('Error fetching leads:', err);
    const message = err instanceof Error ? err.message : 'Failed to fetch leads';
    return new Response(JSON.stringify({ leads: [], error: message }), { status: 500, headers: { 'content-type': 'application/json' } });
  }
};

export const POST: APIRoute = async ({ request }) => {
  if (!supabaseServer) {
    return new Response(JSON.stringify({ error: 'Database not configured' }), { status: 503, headers: { 'content-type': 'application/json' } });
  }

  try {
    const body = await request.json();
    const { name, email, phone, source, service_interest, vehicle_info, message, utm_source, utm_medium, utm_campaign, utm_term, utm_content, landing_page } = body;

    if (!name) {
      return new Response(JSON.stringify({ error: 'Name is required' }), { status: 400, headers: { 'content-type': 'application/json' } });
    }

    const { data: lead, error } = await supabaseServer
      .from('leads')
      .insert({
        name,
        email: email || null,
        phone: phone || null,
        source: source || 'website',
        service_interest: service_interest || null,
        vehicle_info: vehicle_info || null,
        message: message || null,
        utm_source: utm_source || null,
        utm_medium: utm_medium || null,
        utm_campaign: utm_campaign || null,
        utm_term: utm_term || null,
        utm_content: utm_content || null,
        landing_page: landing_page || null,
        status: 'new',
      })
      .select()
      .single();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { 'content-type': 'application/json' } });
    }

    return new Response(JSON.stringify({ ok: true, lead }), { status: 201, headers: { 'content-type': 'application/json' } });
  } catch (err) {
    console.error('Error creating lead:', err);
    return new Response(JSON.stringify({ error: 'Failed to create lead' }), { status: 500, headers: { 'content-type': 'application/json' } });
  }
};

export const PUT: APIRoute = async ({ request }) => {
  if (!supabaseServer) {
    return new Response(JSON.stringify({ error: 'Database not configured' }), { status: 503, headers: { 'content-type': 'application/json' } });
  }

  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return new Response(JSON.stringify({ error: 'Lead ID required' }), { status: 400, headers: { 'content-type': 'application/json' } });
    }

    // Set timestamps based on status changes
    if (updates.status === 'contacted' && !updates.contacted_at) {
      updates.contacted_at = new Date().toISOString();
    }
    if (['completed', 'lost'].includes(updates.status) && !updates.closed_at) {
      updates.closed_at = new Date().toISOString();
    }
    updates.updated_at = new Date().toISOString();

    const { data: lead, error } = await supabaseServer
      .from('leads')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { 'content-type': 'application/json' } });
    }

    return new Response(JSON.stringify({ ok: true, lead }), { status: 200, headers: { 'content-type': 'application/json' } });
  } catch (err) {
    console.error('Error updating lead:', err);
    return new Response(JSON.stringify({ error: 'Failed to update lead' }), { status: 500, headers: { 'content-type': 'application/json' } });
  }
};

export const DELETE: APIRoute = async ({ request }) => {
  if (!supabaseServer) {
    return new Response(JSON.stringify({ error: 'Database not configured' }), { status: 503, headers: { 'content-type': 'application/json' } });
  }

  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return new Response(JSON.stringify({ error: 'Lead ID required' }), { status: 400, headers: { 'content-type': 'application/json' } });
    }

    const { error } = await supabaseServer
      .from('leads')
      .delete()
      .eq('id', id);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { 'content-type': 'application/json' } });
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'content-type': 'application/json' } });
  } catch (err) {
    console.error('Error deleting lead:', err);
    return new Response(JSON.stringify({ error: 'Failed to delete lead' }), { status: 500, headers: { 'content-type': 'application/json' } });
  }
};
