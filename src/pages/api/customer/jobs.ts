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

export const POST: APIRoute = async ({ request }) => {
  if (!supabaseServer) {
    return new Response(JSON.stringify({ error: 'Database not configured' }), { status: 503 });
  }

  try {
    const authCustomer = await getAuthenticatedCustomer(request);
    if (!authCustomer) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), { status: 401 });
    }
    if (!authCustomer.customerId) {
      return new Response(JSON.stringify({ error: 'Please complete your profile before booking.' }), { status: 409 });
    }

    const body = await request.json();
    const serviceType = String(body.service_type || '').trim();
    const vehicleId = String(body.vehicle_id || '').trim() || null;
    const preferredDatetime = String(body.preferred_datetime || '').trim();
    const customerNote = String(body.notes || '').trim();

    if (!serviceType) {
      return new Response(JSON.stringify({ error: 'service_type is required' }), { status: 400 });
    }

    if (vehicleId) {
      const { data: vehicle, error: vehicleError } = await supabaseServer
        .from('crm_vehicles')
        .select('id')
        .eq('id', vehicleId)
        .eq('customer_id', authCustomer.customerId)
        .maybeSingle();

      if (vehicleError || !vehicle) {
        return new Response(JSON.stringify({ error: 'Selected vehicle does not belong to your account.' }), { status: 400 });
      }
    }

    const portalMessage = customerNote
      ? `Booking request received. Awaiting confirmation.\n\nCustomer note: ${customerNote}`
      : 'Booking request received. Awaiting confirmation.';

    const { data, error } = await supabaseServer
      .from('crm_jobs')
      .insert({
        customer_id: authCustomer.customerId,
        vehicle_id: vehicleId,
        service_type: serviceType,
        status: 'scheduled',
        scheduled_date: preferredDatetime || null,
        notes: portalMessage,
        internal_notes: `Customer portal booking request ${new Date().toISOString()}`,
      })
      .select('id, service_type, status, scheduled_date, notes')
      .single();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 400 });
    }

    return new Response(JSON.stringify({ job: data }), { status: 201 });
  } catch (err) {
    console.error('Customer jobs POST error:', err);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
};
