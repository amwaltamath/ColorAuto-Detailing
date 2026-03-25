import type { APIRoute } from 'astro';
import { supabaseServer } from '../../../utils/supabaseServer';

export const GET: APIRoute = async ({ url }) => {
  if (!supabaseServer) {
    return new Response(JSON.stringify({ notes: [] }), { status: 200, headers: { 'content-type': 'application/json' } });
  }

  const leadId = url.searchParams.get('leadId');
  if (!leadId) {
    return new Response(JSON.stringify({ error: 'leadId required' }), { status: 400, headers: { 'content-type': 'application/json' } });
  }

  const { data: notes, error } = await supabaseServer
    .from('lead_notes')
    .select('*')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { 'content-type': 'application/json' } });
  }

  return new Response(JSON.stringify({ notes: notes || [] }), { status: 200, headers: { 'content-type': 'application/json' } });
};

export const POST: APIRoute = async ({ request }) => {
  if (!supabaseServer) {
    return new Response(JSON.stringify({ error: 'Database not configured' }), { status: 503, headers: { 'content-type': 'application/json' } });
  }

  try {
    const { lead_id, author_name, note } = await request.json();

    if (!lead_id || !note) {
      return new Response(JSON.stringify({ error: 'lead_id and note are required' }), { status: 400, headers: { 'content-type': 'application/json' } });
    }

    const { data, error } = await supabaseServer
      .from('lead_notes')
      .insert({ lead_id, author_name: author_name || 'Staff', note })
      .select()
      .single();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { 'content-type': 'application/json' } });
    }

    return new Response(JSON.stringify({ ok: true, note: data }), { status: 201, headers: { 'content-type': 'application/json' } });
  } catch (err) {
    console.error('Error creating lead note:', err);
    return new Response(JSON.stringify({ error: 'Failed to create note' }), { status: 500, headers: { 'content-type': 'application/json' } });
  }
};
