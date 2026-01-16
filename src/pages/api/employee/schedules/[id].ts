import type { APIRoute } from 'astro';
import { supabaseServer } from '../../../../utils/supabaseServer';

export const DELETE: APIRoute = async (context) => {
  if (!supabaseServer) {
    return new Response(JSON.stringify({ error: 'Database not configured' }), { status: 503 });
  }

  try {
    const scheduleId = context.params.id;

    if (!scheduleId) {
      return new Response(JSON.stringify({ error: 'Schedule ID required' }), { status: 400 });
    }

    const { error } = await supabaseServer
      .from('service_schedules')
      .delete()
      .eq('id', scheduleId);

    if (error) {
      console.error('Schedule deletion error:', error);
      return new Response(JSON.stringify({ error: error.message }), { status: 400 });
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err: any) {
    console.error('Error deleting schedule:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
};
