import type { APIContext } from 'astro';
import { supabaseServer } from '../../../utils/supabaseServer';

export async function POST({ request }: APIContext) {
  if (request.headers.get('content-type') !== 'application/json') {
    return new Response(JSON.stringify({ ok: false, error: 'Invalid content type' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  const body = await request.json() as {
    token: string;
    platform?: string;
    employeeId?: string;
  };

  const { token, platform = 'ios', employeeId } = body;

  if (!token) {
    return new Response(JSON.stringify({ ok: false, error: 'Missing token' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  if (!supabaseServer) {
    return new Response(JSON.stringify({ ok: true, saved: false, reason: 'Supabase not configured' }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  }

  const { error } = await supabaseServer
    .from('push_tokens')
    .upsert(
      {
        token,
        platform,
        employee_id: employeeId || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'token' }
    );

  if (error) {
    console.error('[push/register] Error:', error);
    return new Response(JSON.stringify({ ok: false, error: error.message }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ ok: true, saved: true }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}
