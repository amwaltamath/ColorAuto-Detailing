import type { APIRoute } from 'astro';
import { supabaseServer } from '../../../utils/supabaseServer';
import { getAuthenticatedCustomer } from '../../../utils/customerAuth';

/**
 * GET  — fetch customer profile linked to the auth user.
 * PATCH — update profile (or create/link on first save).
 */
export const GET: APIRoute = async ({ request }) => {
  if (!supabaseServer) {
    return new Response(JSON.stringify({ profile: null }), { status: 200 });
  }
  try {
    const authCustomer = await getAuthenticatedCustomer(request);
    if (!authCustomer) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), { status: 401 });
    }
    if (!authCustomer.customerId) {
      return new Response(JSON.stringify({ profile: null }), { status: 200 });
    }

    const { data, error } = await supabaseServer
      .from('crm_customers')
      .select('*')
      .eq('id', authCustomer.customerId)
      .maybeSingle();

    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });

    return new Response(JSON.stringify({ profile: data || null }), { status: 200 });
  } catch (err) {
    console.error('Customer profile GET error:', err);
    return new Response(JSON.stringify({ profile: null }), { status: 200 });
  }
};

export const PATCH: APIRoute = async ({ request }) => {
  if (!supabaseServer) {
    return new Response(JSON.stringify({ error: 'Database not configured' }), { status: 503 });
  }
  try {
    const authCustomer = await getAuthenticatedCustomer(request);
    if (!authCustomer) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), { status: 401 });
    }

    const body = await request.json();
    const allowed = ['first_name', 'last_name', 'email', 'phone', 'address', 'city', 'state', 'zip'];
    const updates: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body) updates[key] = body[key];
    }

    if (authCustomer.customerId) {
      const { data, error } = await supabaseServer
        .from('crm_customers')
        .update(updates)
        .eq('id', authCustomer.customerId)
        .select()
        .single();
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });
      return new Response(JSON.stringify({ profile: data }), { status: 200 });
    }

    const { first_name, last_name, ...rest } = updates as Record<string, string>;
    if (!first_name || !last_name) {
      return new Response(JSON.stringify({ error: 'first_name and last_name required for new profile' }), { status: 400 });
    }

    const { data, error } = await supabaseServer
      .from('crm_customers')
      .insert({
        user_id: authCustomer.authUserId,
        email: authCustomer.authEmail,
        first_name,
        last_name,
        ...rest,
        source: 'website',
      })
      .select()
      .single();

    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });

    return new Response(JSON.stringify({ profile: data }), { status: 200 });
  } catch (err) {
    console.error('Customer profile PATCH error:', err);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
};
