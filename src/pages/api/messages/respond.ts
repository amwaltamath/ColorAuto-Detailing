import type { APIContext } from 'astro';
import { supabaseServer } from '../../../utils/supabaseServer';
import { quoSendSMS } from '../../../utils/quo';

interface ChatMessage {
  id: string;
  sessionId: string;
  senderType: 'visitor' | 'employee' | 'admin';
  senderName?: string;
  message: string;
  timestamp: string;
  isRead: boolean;
}

export async function POST({ request }: APIContext) {
  if (request.headers.get('content-type') !== 'application/json') {
    return new Response(JSON.stringify({ ok: false, error: 'Invalid content type' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  const body = (await request.json()) as {
    sessionId: string;
    message: string;
    employeeName: string;
    employeeRole: 'employee' | 'admin';
  };

  const { sessionId, message, employeeName, employeeRole } = body;
  const smsBridgeEnabled = (process.env.CHAT_SMS_BRIDGE_ENABLED || import.meta.env.CHAT_SMS_BRIDGE_ENABLED || (import.meta.env.DEV ? 'false' : 'true')).toLowerCase() === 'true';

  if (!sessionId || !message || !employeeName) {
    return new Response(JSON.stringify({ ok: false, error: 'Missing required fields' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  if (!supabaseServer) {
    return new Response(JSON.stringify({ ok: true, message: null }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  }

  // Insert message in Supabase
  const { data, error } = await supabaseServer
    .from('chat_messages')
    .insert({
      session_id: sessionId,
      sender_type: employeeRole,
      sender_name: employeeName,
      message: message.trim(),
      is_read: false,
    })
    .select()
    .single();

  if (error) {
    return new Response(JSON.stringify({ ok: false, error: error.message }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }

  // ── Send SMS to visitor's phone so they get the reply even if they left the site ──
  const { data: bridge } = await supabaseServer
    .from('chat_sms_bridge')
    .select('phone_number')
    .eq('session_id', sessionId)
    .limit(1)
    .single();

  if (bridge?.phone_number && smsBridgeEnabled) {
    const smsBody = `${employeeName}: ${message.trim()}`;
    quoSendSMS(bridge.phone_number, smsBody)
      .then((res) => {
        if (res.ok) {
          console.log('[respond] SMS sent to', bridge.phone_number, '→', res.messageId);
        } else {
          console.error('[respond] SMS failed:', res.error);
        }
      })
      .catch((err) => console.error('[respond] SMS error:', err));
  }
  if (bridge?.phone_number && !smsBridgeEnabled) {
    console.log('[respond] SMS bridge disabled via CHAT_SMS_BRIDGE_ENABLED');
  }

  const responseMessage: ChatMessage = {
    id: data.id,
    sessionId: data.session_id,
    senderType: data.sender_type,
    senderName: data.sender_name || undefined,
    message: data.message,
    timestamp: data.timestamp,
    isRead: data.is_read,
  };

  return new Response(JSON.stringify({ ok: true, message: responseMessage }), {
    status: 201,
    headers: { 'content-type': 'application/json' },
  });
}
