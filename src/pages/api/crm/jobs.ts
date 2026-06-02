import type { APIRoute } from 'astro';
import { supabaseServer } from '../../../utils/supabaseServer';

export const GET: APIRoute = async ({ request }) => {
  if (!supabaseServer) {
    return new Response(JSON.stringify({ jobs: [] }), { status: 200 });
  }
  try {
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const customerId = url.searchParams.get('customer_id');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    let query = supabaseServer
      .from('crm_jobs')
      .select(`
        *,
        crm_customers(id, first_name, last_name, email, phone),
        crm_vehicles(id, year, make, model, color),
        crm_job_photos(id, photo_url, photo_type, caption),
        crm_invoices(id, invoice_number, status, total)
      `, { count: 'exact' })
      .order('scheduled_date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) query = query.eq('status', status);
    if (customerId) query = query.eq('customer_id', customerId);

    const { data, error, count } = await query;
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });

    return new Response(JSON.stringify({ jobs: data || [], total: count || 0 }), { status: 200 });
  } catch (err) {
    console.error('CRM jobs GET error:', err);
    return new Response(JSON.stringify({ jobs: [], total: 0 }), { status: 200 });
  }
};

export const POST: APIRoute = async ({ request }) => {
  if (!supabaseServer) {
    return new Response(JSON.stringify({ error: 'Database not configured' }), { status: 503 });
  }
  try {
    const body = await request.json();
    const {
      customer_id, vehicle_id, assigned_employee_id,
      service_type, status = 'scheduled', scheduled_date,
      notes, internal_notes,
    } = body;

    if (!customer_id || !service_type) {
      return new Response(JSON.stringify({ error: 'customer_id and service_type are required' }), { status: 400 });
    }

    const { data, error } = await supabaseServer
      .from('crm_jobs')
      .insert({
        customer_id, vehicle_id, assigned_employee_id,
        service_type, status, scheduled_date, notes, internal_notes,
      })
      .select()
      .single();

    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });

    return new Response(JSON.stringify({ job: data }), { status: 201 });
  } catch (err) {
    console.error('CRM jobs POST error:', err);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
};
