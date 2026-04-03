import type { APIContext } from 'astro';
import { supabaseServer } from '../../../utils/supabaseServer';

/**
 * POST /api/quo/webhook
 *
 * Receives Quo (OpenPhone) webhook events.  We listen for "message.received"
 * so that SMS replies from employees/owners land in the matching chat session.
 *
 * Quo webhook payload shape:
 * {
 *   id: "EV...",
 *   object: "event",
 *   apiVersion: "v4",
 *   type: "message.received",
 *   data: {
 *     object: {
 *       id, from, to, text, direction, phoneNumberId, userId, status, createdAt
 *     }
 *   }
 * }
 */

export async function POST({ request }: APIContext) {
  const webhookSecret = import.meta.env.QUO_WEBHOOK_SECRET ?? process.env.QUO_WEBHOOK_SECRET;

  // Optional: validate shared secret via query param or header
  if (webhookSecret) {
    const url = new URL(request.url);
    const token = url.searchParams.get('secret') || request.headers.get('x-quo-secret');
    if (token !== webhookSecret) {
      return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), {
        status: 401,
        headers: { 'content-type': 'application/json' },
      });
    }
  }

  let payload: any;
  try {
    payload = await request.json();
  } catch {
    return new Response(JSON.stringify({ ok: false, error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  console.log('[quo-webhook] Received event:', payload?.type, payload?.id);

  // We only care about incoming messages (SMS replies from the owner/employee)
  if (payload?.type !== 'message.received') {
    return new Response(JSON.stringify({ ok: true, ignored: true }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  }

  const msg = payload?.data?.object;
  if (!msg || msg.direction !== 'incoming') {
    return new Response(JSON.stringify({ ok: true, ignored: true }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  }

  const fromNumber = msg.from; // E.164 phone that sent the reply
  const text = msg.text;

  if (!text || !fromNumber) {
    return new Response(JSON.stringify({ ok: true, ignored: true }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  }

  if (!supabaseServer) {
    console.warn('[quo-webhook] Supabase not configured');
    return new Response(JSON.stringify({ ok: false, error: 'Supabase not configured' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }

  // Look up which chat session was last bridged to this phone number
  const { data: bridge } = await supabaseServer
    .from('chat_sms_bridge')
    .select('session_id')
    .eq('phone_number', fromNumber)
    .order('updated_at', { ascending: false })
    .limit(1)
    .single();

  if (!bridge?.session_id) {
    console.warn('[quo-webhook] No active session mapped for', fromNumber);
    return new Response(JSON.stringify({ ok: true, noSession: true }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  }

  const sessionId = bridge.session_id;

  // Insert the reply as an employee message in the chat
  const { data: inserted, error } = await supabaseServer
    .from('chat_messages')
    .insert({
      session_id: sessionId,
      sender_type: 'employee',
      sender_name: 'Team (SMS)',
      message: text.trim(),
      is_read: false,
    })
    .select()
    .single();

  if (error) {
    console.error('[quo-webhook] Insert error:', error);
    return new Response(JSON.stringify({ ok: false, error: error.message }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }

  console.log('[quo-webhook] Saved SMS reply to session', sessionId, '→', inserted.id);

  return new Response(JSON.stringify({ ok: true, messageId: inserted.id, sessionId }), {
    status: 201,
    headers: { 'content-type': 'application/json' },
  });
}
