import type { APIRoute } from 'astro';
import { supabaseServer } from '../../../../utils/supabaseServer';

export const GET: APIRoute = async ({ params }) => {
  if (!supabaseServer) {
    return new Response(JSON.stringify({ error: 'Database not configured' }), { status: 503 });
  }
  try {
    const { data, error } = await supabaseServer
      .from('crm_customers')
      .select(`
        *,
        crm_vehicles(*),
        crm_jobs(
          *,
          crm_job_photos(*),
          crm_invoices(id, invoice_number, status, total)
        ),
        crm_customer_notes(*, created_at)
      `)
      .eq('id', params.id!)
      .single();

    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 404 });

    return new Response(JSON.stringify({ customer: data }), { status: 200 });
  } catch (err) {
    console.error('CRM customer GET error:', err);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
};

export const PATCH: APIRoute = async ({ params, request }) => {
  if (!supabaseServer) {
    return new Response(JSON.stringify({ error: 'Database not configured' }), { status: 503 });
  }
  try {
    const body = await request.json();
    const allowed = ['first_name', 'last_name', 'email', 'phone', 'address', 'city', 'state', 'zip', 'source', 'tags'];
    const updates: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body) updates[key] = body[key];
    }

    const { data, error } = await supabaseServer
      .from('crm_customers')
      .update(updates)
      .eq('id', params.id!)
      .select()
      .single();

    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });

    return new Response(JSON.stringify({ customer: data }), { status: 200 });
  } catch (err) {
    console.error('CRM customer PATCH error:', err);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ params }) => {
  if (!supabaseServer) {
    return new Response(JSON.stringify({ error: 'Database not configured' }), { status: 503 });
  }
  try {
    const { error } = await supabaseServer
      .from('crm_customers')
      .delete()
      .eq('id', params.id!);

    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    console.error('CRM customer DELETE error:', err);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
};

// POST /api/crm/customers/[id] with ?action=add_note or ?action=add_vehicle
export const POST: APIRoute = async ({ params, request }) => {
  if (!supabaseServer) {
    return new Response(JSON.stringify({ error: 'Database not configured' }), { status: 503 });
  }
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    const body = await request.json();

    if (action === 'add_note') {
      const { note, created_by } = body;
      if (!note || !created_by) {
        return new Response(JSON.stringify({ error: 'note and created_by required' }), { status: 400 });
      }
      const { data, error } = await supabaseServer
        .from('crm_customer_notes')
        .insert({ customer_id: params.id, note, created_by })
        .select()
        .single();
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });
      return new Response(JSON.stringify({ note: data }), { status: 201 });
    }

    if (action === 'add_vehicle') {
      const { year, make, model, trim, color, vin, license_plate, notes } = body;
      if (!make || !model) {
        return new Response(JSON.stringify({ error: 'make and model required' }), { status: 400 });
      }
      const { data, error } = await supabaseServer
        .from('crm_vehicles')
        .insert({ customer_id: params.id, year, make, model, trim, color, vin, license_plate, notes })
        .select()
        .single();
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });
      return new Response(JSON.stringify({ vehicle: data }), { status: 201 });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400 });
  } catch (err) {
    console.error('CRM customer POST action error:', err);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
};
