import type { APIContext } from 'astro';
import { supabaseServer } from '../../../utils/supabaseServer';

interface ChatSession {
  id: string;
  visitorEmail?: string;
  visitorPhone?: string;
  visitorName?: string;
  messageCount: number;
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

    // Fetch sessions with aggregates
    const { data: msgs, error } = await supabaseServer
      .from('chat_messages')
      .select('id, session_id, sender_type, sender_name, message, timestamp')
      .order('timestamp', { ascending: false });

    if (error) {
      // Return empty sessions instead of failing
      return new Response(JSON.stringify({ ok: true, sessions: [] }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }

    const sessionMap = new Map<string, ChatSession>();
    (msgs || []).forEach((m: any) => {
      if (!sessionMap.has(m.session_id)) {
        sessionMap.set(m.session_id, {
          id: m.session_id,
          visitorName: m.sender_type === 'visitor' ? m.sender_name : undefined,
          messageCount: 0,
          lastMessage: m.message,
          lastMessageTime: m.timestamp,
        });
      }
      const s = sessionMap.get(m.session_id)!;
      s.messageCount += 1;
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
