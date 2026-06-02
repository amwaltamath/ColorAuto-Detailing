import type { APIRoute } from 'astro';
import { supabaseServer } from '../../../../utils/supabaseServer';

export const PATCH: APIRoute = async ({ params, request }) => {
  if (!supabaseServer) {
    return new Response(JSON.stringify({ error: 'Database not configured' }), { status: 503 });
  }
  try {
    const body = await request.json();
    const allowed = ['status', 'line_items', 'subtotal', 'tax', 'total', 'due_date', 'paid_at', 'notes'];
    const updates: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body) updates[key] = body[key];
    }

    if (updates.status === 'paid' && !updates.paid_at) {
      updates.paid_at = new Date().toISOString();
    }

    const { data, error } = await supabaseServer
      .from('crm_invoices')
      .update(updates)
      .eq('id', params.id!)
      .select()
      .single();

    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });

    return new Response(JSON.stringify({ invoice: data }), { status: 200 });
  } catch (err) {
    console.error('CRM invoice PATCH error:', err);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
};
