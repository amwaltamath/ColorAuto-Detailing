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
  // Quo signs webhooks with a key but doesn't send a custom secret header.
  // We rely on the webhook URL being non-guessable + Quo's built-in signing.
  // If you need extra security, validate using the webhook key from Quo's payload.

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
  console.log('[quo-webhook] Full payload:', JSON.stringify(payload?.data?.object, null, 2));

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
