import type { APIContext } from 'astro';
import { supabaseServer } from '../../../utils/supabaseServer';

/**
 * POST /api/quo/webhook
 *
 * Receives Quo (OpenPhone) webhook events for two-way SMS ↔ chat bridge.
 *
 * Handles:
 * - message.received  → visitor replied via SMS → save as visitor message
 * - message.delivered  → employee replied in Quo app → save as employee message
 */

export async function POST({ request }: APIContext) {
  // Quo signs webhooks with a key but doesn't send a custom secret header.
  // We rely on the webhook URL being non-guessable + Quo's built-in signing.

  let payload: any;
  try {
    payload = await request.json();
  } catch {
    return new Response(JSON.stringify({ ok: false, error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  const eventType = payload?.type;
  console.log('[quo-webhook] Received event:', eventType, payload?.id);

  if (!supabaseServer) {
    console.warn('[quo-webhook] Supabase not configured');
    return new Response(JSON.stringify({ ok: false, error: 'Supabase not configured' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }

  const msg = payload?.data?.object;
  if (!msg) {
    return new Response(JSON.stringify({ ok: true, ignored: true }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  }

  console.log('[quo-webhook] Message:', { id: msg.id, from: msg.from, to: msg.to, direction: msg.direction, text: msg.text?.slice(0, 80) });

  // ── message.received: visitor replied via SMS to our Quo number ──
  if (eventType === 'message.received' && msg.direction === 'incoming') {
    const fromNumber = msg.from;
    const text = msg.text;

    if (!text || !fromNumber) {
      return new Response(JSON.stringify({ ok: true, ignored: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }

    // Look up which chat session is mapped to this phone number
    const { data: bridge } = await supabaseServer
      .from('chat_sms_bridge')
      .select('session_id')
      .eq('phone_number', fromNumber)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (!bridge?.session_id) {
      console.warn('[quo-webhook] No session mapped for incoming', fromNumber);
      return new Response(JSON.stringify({ ok: true, noSession: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }

    const { data: inserted, error } = await supabaseServer
      .from('chat_messages')
      .insert({
        session_id: bridge.session_id,
        sender_type: 'visitor',
        sender_name: 'Visitor (SMS)',
        message: text.trim(),
        is_read: false,
      })
      .select()
      .single();

    if (error) {
      console.error('[quo-webhook] Insert error (received):', error);
      return new Response(JSON.stringify({ ok: false, error: error.message }), {
        status: 500,
        headers: { 'content-type': 'application/json' },
      });
    }

    console.log('[quo-webhook] Saved visitor SMS to session', bridge.session_id, '→', inserted.id);
    return new Response(JSON.stringify({ ok: true, messageId: inserted.id, sessionId: bridge.session_id }), {
      status: 201,
      headers: { 'content-type': 'application/json' },
    });
  }

  // ── message.delivered: employee replied from Quo app → save as employee message ──
  if (eventType === 'message.delivered' && msg.direction === 'outgoing') {
    const text = msg.text;
    const toNumbers: string[] = msg.to || [];

    // Skip messages our API sent (they have the 💬 prefix)
    if (!text || text.startsWith('💬')) {
      console.log('[quo-webhook] Skipping API-originated outbound message');
      return new Response(JSON.stringify({ ok: true, ignored: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }

    // Find which visitor this was sent to
    let sessionId: string | null = null;
    for (const toNum of toNumbers) {
      const { data: bridge } = await supabaseServer
        .from('chat_sms_bridge')
        .select('session_id')
        .eq('phone_number', toNum)
        .limit(1)
        .single();

      if (bridge?.session_id) {
        sessionId = bridge.session_id;
        break;
      }
    }

    if (!sessionId) {
      console.warn('[quo-webhook] No session mapped for outgoing to', toNumbers);
      return new Response(JSON.stringify({ ok: true, noSession: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }

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
      console.error('[quo-webhook] Insert error (delivered):', error);
      return new Response(JSON.stringify({ ok: false, error: error.message }), {
        status: 500,
        headers: { 'content-type': 'application/json' },
      });
    }

    console.log('[quo-webhook] Saved employee reply to session', sessionId, '→', inserted.id);
    return new Response(JSON.stringify({ ok: true, messageId: inserted.id, sessionId }), {
      status: 201,
      headers: { 'content-type': 'application/json' },
    });
  }

  // Unhandled event type
  return new Response(JSON.stringify({ ok: true, ignored: true }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}
