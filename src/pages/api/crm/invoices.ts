import type { APIRoute } from 'astro';
import { supabaseServer } from '../../../utils/supabaseServer';

export const GET: APIRoute = async ({ request }) => {
  if (!supabaseServer) {
    return new Response(JSON.stringify({ invoices: [] }), { status: 200 });
  }
  try {
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const customerId = url.searchParams.get('customer_id');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    let query = supabaseServer
      .from('crm_invoices')
      .select(`
        *,
        crm_customers(id, first_name, last_name, email),
        crm_jobs(id, service_type, status)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) query = query.eq('status', status);
    if (customerId) query = query.eq('customer_id', customerId);

    const { data, error, count } = await query;
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });

    return new Response(JSON.stringify({ invoices: data || [], total: count || 0 }), { status: 200 });
  } catch (err) {
    console.error('CRM invoices GET error:', err);
    return new Response(JSON.stringify({ invoices: [], total: 0 }), { status: 200 });
  }
};

export const POST: APIRoute = async ({ request }) => {
  if (!supabaseServer) {
    return new Response(JSON.stringify({ error: 'Database not configured' }), { status: 503 });
  }
  try {
    const body = await request.json();
    const { job_id, customer_id, line_items = [], subtotal = 0, tax = 0, total = 0, due_date, notes, status = 'draft' } = body;

    if (!customer_id) {
      return new Response(JSON.stringify({ error: 'customer_id is required' }), { status: 400 });
    }

    const { data, error } = await supabaseServer
      .from('crm_invoices')
      .insert({ job_id, customer_id, line_items, subtotal, tax, total, due_date, notes, status })
      .select()
      .single();

    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });

    return new Response(JSON.stringify({ invoice: data }), { status: 201 });
  } catch (err) {
    console.error('CRM invoices POST error:', err);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
};
