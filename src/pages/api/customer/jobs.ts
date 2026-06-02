import type { APIRoute } from 'astro';
import { supabaseServer } from '../../../utils/supabaseServer';
import { getAuthenticatedCustomer } from '../../../utils/customerAuth';

/**
 * Customer-facing: returns the authenticated customer's jobs.
 * Uses JWT auth to resolve the CRM customer record.
 */
export const GET: APIRoute = async ({ request }) => {
  if (!supabaseServer) {
    return new Response(JSON.stringify({ jobs: [] }), { status: 200 });
  }
  try {
    const authCustomer = await getAuthenticatedCustomer(request);
    if (!authCustomer) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), { status: 401 });
    }
    if (!authCustomer.customerId) {
      return new Response(JSON.stringify({ jobs: [] }), { status: 200 });
    }

    const { data, error } = await supabaseServer
      .from('crm_jobs')
      .select(`
        id, service_type, status, scheduled_date, started_at, completed_at, notes,
        crm_vehicles(id, year, make, model, color),
        crm_job_photos(id, photo_url, photo_type, caption),
        crm_invoices(id, invoice_number, status, total)
      `)
      .eq('customer_id', authCustomer.customerId)
      .order('scheduled_date', { ascending: false });

    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });

    return new Response(JSON.stringify({ jobs: data || [] }), { status: 200 });
  } catch (err) {
    console.error('Customer jobs GET error:', err);
    return new Response(JSON.stringify({ jobs: [] }), { status: 200 });
  }
};
