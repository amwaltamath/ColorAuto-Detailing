import type { APIContext } from 'astro';
import { supabaseServer } from '../../../utils/supabaseServer';

interface ChatSession {
  id: string;
  visitorEmail?: string;
  visitorPhone?: string;
  visitorName?: string;
  messageCount: number;
  unreadCount: number;
  lastMessage?: string;
  lastMessageTime?: string;
}

interface ChatMessage {
  id: string;
  sessionId: string;
  senderType: 'visitor' | 'employee' | 'admin';
  senderName?: string;
  message: string;
  timestamp: string;
  isRead: boolean;
}

// Supabase-backed aggregation

export async function GET({ request }: APIContext) {
  // TODO: Add auth check - verify admin/employee status from token

  try {
    if (!supabaseServer) {
      // Supabase not configured; return empty list quietly
      return new Response(JSON.stringify({ ok: true, sessions: [] }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }

    // Fetch sessions with visitor info from chat_sessions table
    const { data: sessionRows } = await supabaseServer
      .from('chat_sessions')
      .select('id, visitor_name, visitor_email, visitor_phone');

    const sessionInfoMap = new Map<string, { visitorName?: string; visitorEmail?: string; visitorPhone?: string }>();
    (sessionRows || []).forEach((s: any) => {
      sessionInfoMap.set(s.id, {
        visitorName: s.visitor_name || undefined,
        visitorEmail: s.visitor_email || undefined,
        visitorPhone: s.visitor_phone || undefined,
      });
    });

    // Fetch messages and aggregate per session
    const { data: msgs, error } = await supabaseServer
      .from('chat_messages')
      .select('id, session_id, sender_type, sender_name, message, timestamp, is_read')
      .order('timestamp', { ascending: false });

    if (error) {
      return new Response(JSON.stringify({ ok: true, sessions: [] }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }

    const sessionMap = new Map<string, ChatSession>();
    (msgs || []).forEach((m: any) => {
      if (!sessionMap.has(m.session_id)) {
        const info = sessionInfoMap.get(m.session_id);
        sessionMap.set(m.session_id, {
          id: m.session_id,
          visitorName: info?.visitorName || (m.sender_type === 'visitor' ? m.sender_name : undefined),
          visitorEmail: info?.visitorEmail,
          visitorPhone: info?.visitorPhone,
          messageCount: 0,
          unreadCount: 0,
          lastMessage: m.message,
          lastMessageTime: m.timestamp,
        });
      }
      const s = sessionMap.get(m.session_id)!;
      s.messageCount += 1;
      // Count unread visitor messages
      if (m.sender_type === 'visitor' && !m.is_read) {
        s.unreadCount = (s.unreadCount || 0) + 1;
      }
    });

    const sessions = Array.from(sessionMap.values());

    return new Response(JSON.stringify({ ok: true, sessions }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  } catch (err: any) {
    console.error('Chat sessions endpoint error:', err);
    // Return empty sessions on error instead of 500
    return new Response(JSON.stringify({ ok: true, sessions: [], error: err.message }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  }
}

export async function DELETE({ request }: APIContext) {
  if (request.headers.get('content-type') !== 'application/json') {
    return new Response(JSON.stringify({ ok: false, error: 'Invalid content type' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  if (!supabaseServer) {
    return new Response(JSON.stringify({ ok: false, error: 'Database not configured' }), {
      status: 503,
      headers: { 'content-type': 'application/json' },
    });
  }

  try {
    const body = (await request.json()) as { sessionId: string };
    const { sessionId } = body;

    if (!sessionId) {
      return new Response(JSON.stringify({ ok: false, error: 'Session ID required' }), {
        status: 400,
        headers: { 'content-type': 'application/json' },
      });
    }

    // Delete all messages for this session
    const { error: msgError } = await supabaseServer
      .from('chat_messages')
      .delete()
      .eq('session_id', sessionId);

    if (msgError) {
      console.error('Error deleting messages:', msgError);
      return new Response(JSON.stringify({ ok: false, error: msgError.message }), {
        status: 500,
        headers: { 'content-type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ ok: true, deleted: true }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  } catch (err: any) {
    console.error('Error in DELETE /api/admin/chat-sessions:', err);
    return new Response(JSON.stringify({ ok: false, error: err.message }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
}
