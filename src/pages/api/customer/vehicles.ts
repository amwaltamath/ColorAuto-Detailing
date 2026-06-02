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
