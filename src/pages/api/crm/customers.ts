import type { APIRoute } from 'astro';
import { supabaseServer } from '../../../utils/supabaseServer';

export const GET: APIRoute = async ({ request }) => {
  if (!supabaseServer) {
    return new Response(JSON.stringify({ customers: [] }), { status: 200 });
  }
  try {
    const url = new URL(request.url);
    const search = url.searchParams.get('search') || '';
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    let query = supabaseServer
      .from('crm_customers')
      .select(`
        *,
        crm_vehicles(id, year, make, model, color),
        crm_jobs(id, status, service_type, scheduled_date)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.or(
        `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`
      );
    }

    const { data, error, count } = await query;
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });

    return new Response(JSON.stringify({ customers: data || [], total: count || 0 }), { status: 200 });
  } catch (err) {
    console.error('CRM customers GET error:', err);
    return new Response(JSON.stringify({ customers: [], total: 0 }), { status: 200 });
  }
};

export const POST: APIRoute = async ({ request }) => {
  if (!supabaseServer) {
    return new Response(JSON.stringify({ error: 'Database not configured' }), { status: 503 });
  }
  try {
    const body = await request.json();
    const { first_name, last_name, email, phone, address, city, state, zip, source, tags } = body;

    if (!first_name || !last_name) {
      return new Response(JSON.stringify({ error: 'first_name and last_name are required' }), { status: 400 });
    }

    const { data, error } = await supabaseServer
      .from('crm_customers')
      .insert({ first_name, last_name, email, phone, address, city, state, zip, source, tags })
      .select()
      .single();

    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });

    return new Response(JSON.stringify({ customer: data }), { status: 201 });
  } catch (err) {
    console.error('CRM customers POST error:', err);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
};
