import type { APIContext } from 'astro';
import { supabaseServer } from '../../utils/supabaseServer';

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

export async function GET({ request }: APIContext) {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get('sessionId');

  if (!sessionId) {
    return new Response(JSON.stringify({ ok: false, error: 'Missing sessionId' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  if (!supabaseServer) {
    return new Response(JSON.stringify({ ok: true, messages: [] }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  }

  // Fetch from Supabase
  const { data, error } = await supabaseServer
    .from('chat_messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('timestamp', { ascending: true });

  if (error) {
    return new Response(JSON.stringify({ ok: false, error: error.message }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }

  // Map to API shape if needed
  const messages = (data || []).map((m: any) => ({
    id: m.id,
    sessionId: m.session_id,
    senderType: m.sender_type,
    senderName: m.sender_name || undefined,
    message: m.message,
    timestamp: m.timestamp,
    isRead: m.is_read,
  }));

  return new Response(JSON.stringify({ ok: true, messages }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
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
    visitorEmail?: string;
    visitorName?: string;
  };

  const { sessionId, message, visitorEmail, visitorName } = body;

  console.log('[POST /api/messages] Received:', { sessionId, message, visitorEmail, visitorName });
  console.log('[POST /api/messages] Supabase server configured:', !!supabaseServer);

  if (!sessionId || !message) {
    console.log('[POST /api/messages] Missing fields');
    return new Response(JSON.stringify({ ok: false, error: 'Missing required fields' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  if (!supabaseServer) {
    // If Supabase is not configured, accept but do nothing (avoids runtime error)
    console.warn('[POST /api/messages] Supabase not configured, accepting but not saving');
    return new Response(JSON.stringify({ ok: true, message: null }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  }

  try {
    // Ensure session exists/upsert
    console.log('[POST /api/messages] Upserting session:', sessionId);
    await supabaseServer
      .from('chat_sessions')
      .upsert({
        id: sessionId,
        visitor_email: visitorEmail || null,
        visitor_name: visitorName || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });

    // Insert message
    console.log('[POST /api/messages] Inserting message to session:', sessionId);
    const { data, error } = await supabaseServer
      .from('chat_messages')
      .insert({
        session_id: sessionId,
        sender_type: 'visitor',
        sender_name: visitorName || null,
        message: message.trim(),
        is_read: false,
      })
      .select()
      .single();

    if (error) {
      console.error('[POST /api/messages] Insert error:', error);
      return new Response(JSON.stringify({ ok: false, error: error.message }), {
        status: 500,
        headers: { 'content-type': 'application/json' },
      });
    }

    console.log('[POST /api/messages] Message saved successfully:', data.id);

    const newMessage: ChatMessage = {
      id: data.id,
      sessionId: data.session_id,
      senderType: data.sender_type,
      senderName: data.sender_name || undefined,
      message: data.message,
      timestamp: data.timestamp,
      isRead: data.is_read,
    };

    return new Response(JSON.stringify({ ok: true, message: newMessage }), {
      status: 201,
      headers: { 'content-type': 'application/json' },
    });
  } catch (err: any) {
    console.error('[POST /api/messages] Catch error:', err);
    return new Response(JSON.stringify({ ok: false, error: err.message }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
}
