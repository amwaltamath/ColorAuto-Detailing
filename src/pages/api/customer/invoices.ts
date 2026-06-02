import type { APIRoute } from 'astro';
import { supabaseServer } from '../../../utils/supabaseServer';
import { getAuthenticatedCustomer } from '../../../utils/customerAuth';

export const GET: APIRoute = async ({ request }) => {
  if (!supabaseServer) {
    return new Response(JSON.stringify({ invoices: [] }), { status: 200 });
  }
  try {
    const authCustomer = await getAuthenticatedCustomer(request);
    if (!authCustomer) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), { status: 401 });
    }
    if (!authCustomer.customerId) {
      return new Response(JSON.stringify({ invoices: [] }), { status: 200 });
    }

    const { data, error } = await supabaseServer
      .from('crm_invoices')
      .select(`
        id, invoice_number, status, subtotal, tax, total, due_date, paid_at, created_at,
        crm_jobs(id, service_type, scheduled_date)
      `)
      .eq('customer_id', authCustomer.customerId)
      .order('created_at', { ascending: false });

    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });

    return new Response(JSON.stringify({ invoices: data || [] }), { status: 200 });
  } catch (err) {
    console.error('Customer invoices GET error:', err);
    return new Response(JSON.stringify({ invoices: [] }), { status: 200 });
  }
};
