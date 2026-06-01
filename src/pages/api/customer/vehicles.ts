import type { APIRoute } from 'astro';
import { supabaseServer } from '../../../utils/supabaseServer';

export const GET: APIRoute = async ({ request }) => {
  if (!supabaseServer) {
    return new Response(JSON.stringify({ vehicles: [] }), { status: 200 });
  }
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), { status: 401 });
    }

    const { data: customer, error: customerError } = await supabaseServer
      .from('crm_customers')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (customerError || !customer) {
      return new Response(JSON.stringify({ vehicles: [] }), { status: 200 });
    }

    const { data, error } = await supabaseServer
      .from('crm_vehicles')
      .select('*')
      .eq('customer_id', customer.id)
      .order('created_at', { ascending: false });

    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });

    return new Response(JSON.stringify({ vehicles: data || [] }), { status: 200 });
  } catch (err) {
    console.error('Customer vehicles GET error:', err);
    return new Response(JSON.stringify({ vehicles: [] }), { status: 200 });
  }
};
