import type { APIContext } from 'astro';
import { supabaseServer } from '../../../utils/supabaseServer';

interface ChatMessage {
  id: string;
  sessionId: string;
  senderType: 'visitor' | 'employee' | 'admin';
  senderName?: string;
  message: string;
  timestamp: string;
  isRead: boolean;
}

// Supabase-backed storage

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

  // TODO: Add auth check - verify employee/admin status from token
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
