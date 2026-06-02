import type { APIRoute } from 'astro';
import { supabaseServer } from '../../../../utils/supabaseServer';

export const GET: APIRoute = async ({ params }) => {
  if (!supabaseServer) {
    return new Response(JSON.stringify({ error: 'Database not configured' }), { status: 503 });
  }
  try {
    const { data, error } = await supabaseServer
      .from('crm_jobs')
      .select(`
        *,
        crm_customers(id, first_name, last_name, email, phone),
        crm_vehicles(id, year, make, model, color),
        crm_job_photos(*),
        crm_invoices(*)
      `)
      .eq('id', params.id!)
      .single();

    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 404 });

    return new Response(JSON.stringify({ job: data }), { status: 200 });
  } catch (err) {
    console.error('CRM job GET error:', err);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
};

export const PATCH: APIRoute = async ({ params, request }) => {
  if (!supabaseServer) {
    return new Response(JSON.stringify({ error: 'Database not configured' }), { status: 503 });
  }
  try {
    const body = await request.json();
    const allowed = [
      'vehicle_id', 'assigned_employee_id', 'service_type',
      'status', 'scheduled_date', 'started_at', 'completed_at',
      'notes', 'internal_notes',
    ];
    const updates: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body) updates[key] = body[key];
    }

    // Auto-set timestamps based on status transitions
    if (updates.status === 'in_progress' && !updates.started_at) {
      updates.started_at = new Date().toISOString();
    }
    if (updates.status === 'completed' && !updates.completed_at) {
      updates.completed_at = new Date().toISOString();
    }

    const { data, error } = await supabaseServer
      .from('crm_jobs')
      .update(updates)
      .eq('id', params.id!)
      .select()
      .single();

    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });

    return new Response(JSON.stringify({ job: data }), { status: 200 });
  } catch (err) {
    console.error('CRM job PATCH error:', err);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
};

// POST /api/crm/jobs/[id]?action=add_photo
export const POST: APIRoute = async ({ params, request }) => {
  if (!supabaseServer) {
    return new Response(JSON.stringify({ error: 'Database not configured' }), { status: 503 });
  }
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    const body = await request.json();

    if (action === 'add_photo') {
      const { photo_url, photo_type = 'progress', caption, uploaded_by } = body;
      if (!photo_url) {
        return new Response(JSON.stringify({ error: 'photo_url required' }), { status: 400 });
      }
      const { data, error } = await supabaseServer
        .from('crm_job_photos')
        .insert({ job_id: params.id, photo_url, photo_type, caption, uploaded_by })
        .select()
        .single();
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });
      return new Response(JSON.stringify({ photo: data }), { status: 201 });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400 });
  } catch (err) {
    console.error('CRM job POST action error:', err);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
};
