import type { APIRoute } from 'astro';
import { supabaseServer } from '../../../utils/supabaseServer';
import { getAuthenticatedCustomer } from '../../../utils/customerAuth';

export const GET: APIRoute = async ({ request }) => {
  if (!supabaseServer) {
    return new Response(JSON.stringify({ vehicles: [] }), { status: 200 });
  }
  try {
    const authCustomer = await getAuthenticatedCustomer(request);
    if (!authCustomer) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), { status: 401 });
    }
    if (!authCustomer.customerId) {
      return new Response(JSON.stringify({ vehicles: [] }), { status: 200 });
    }

    const { data, error } = await supabaseServer
      .from('crm_vehicles')
      .select('*')
      .eq('customer_id', authCustomer.customerId)
      .order('created_at', { ascending: false });

    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });

    return new Response(JSON.stringify({ vehicles: data || [] }), { status: 200 });
  } catch (err) {
    console.error('Customer vehicles GET error:', err);
    return new Response(JSON.stringify({ vehicles: [] }), { status: 200 });
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
      return new Response(JSON.stringify({ error: 'Please complete your profile before adding vehicles.' }), { status: 409 });
    }

    const body = await request.json();
    const make = String(body.make || '').trim();
    const model = String(body.model || '').trim();
    if (!make || !model) {
      return new Response(JSON.stringify({ error: 'Make and model are required' }), { status: 400 });
    }

    const payload = {
      customer_id: authCustomer.customerId,
      year: String(body.year || '').trim() || null,
      make,
      model,
      trim: String(body.trim || '').trim() || null,
      color: String(body.color || '').trim() || null,
      vin: String(body.vin || '').trim() || null,
      license_plate: String(body.license_plate || '').trim() || null,
      notes: String(body.notes || '').trim() || null,
    };

    const { data, error } = await supabaseServer
      .from('crm_vehicles')
      .insert(payload)
      .select()
      .single();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 400 });
    }

    return new Response(JSON.stringify({ vehicle: data }), { status: 201 });
  } catch (err) {
    console.error('Customer vehicles POST error:', err);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
};
