import type { APIContext } from 'astro';
import { supabaseServer } from '../../utils/supabaseServer';
import { quoSendSMS } from '../../utils/quo';
import { createOrbisxChatLead } from '../../utils/orbisx';
import {
  detectHandoffRequest,
  generateAIEmployeeReply,
  getAIEmployeeName,
  getAIReplyRateLimitMs,
  isAIChatEnabled,
  isAIQualificationEnabled,
  qualifyLeadMessage,
  shouldQualifyForAIReply,
} from '../../utils/openai';

interface ChatMessage {
  id: string;
  sessionId: string;
  senderType: 'visitor' | 'employee' | 'admin';
  senderName?: string;
  message: string;
  timestamp: string;
  isRead: boolean;
}

// ── In-memory rate limiting per session (resets on server restart) ──
const aiReplyLastTimestamp = new Map<string, number>();

function canReplyWithAI(sessionId: string): boolean {
  const rateLimitMs = getAIReplyRateLimitMs();
  const lastReply = aiReplyLastTimestamp.get(sessionId);
  const now = Date.now();

  if (!lastReply || now - lastReply >= rateLimitMs) {
    aiReplyLastTimestamp.set(sessionId, now);
    return true;
  }

  return false;
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
    visitorPhone?: string;
  };

  const { sessionId, message, visitorEmail, visitorName, visitorPhone } = body;
  const isTestSession = /^session_(ai_fulltest|dev|test)/i.test(sessionId || '');
  const skipSmsForTests = (process.env.SKIP_SMS_FOR_TEST_SESSIONS || import.meta.env.SKIP_SMS_FOR_TEST_SESSIONS || (import.meta.env.DEV ? 'true' : 'false')).toLowerCase() === 'true';
  const smsBridgeEnabled = (process.env.CHAT_SMS_BRIDGE_ENABLED || import.meta.env.CHAT_SMS_BRIDGE_ENABLED || (import.meta.env.DEV ? 'false' : 'true')).toLowerCase() === 'true';
  const shouldSkipSms = isTestSession && skipSmsForTests;

  console.log('[POST /api/messages] Received:', { sessionId, message, visitorEmail, visitorName, visitorPhone });
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
        visitor_phone: visitorPhone || null,
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

    // Sync first chat message in a session to OrbisX (non-blocking).
    (async () => {
      try {
        const { count } = await supabaseServer
          .from('chat_messages')
          .select('id', { count: 'exact', head: true })
          .eq('session_id', sessionId)
          .eq('sender_type', 'visitor');

        if ((count || 0) > 1) return;

        const result = await createOrbisxChatLead({
          sessionId,
          name: visitorName,
          email: visitorEmail,
          phone: visitorPhone,
          message: message.trim(),
        });

        if (result.ok) {
          console.log('[POST /api/messages] OrbisX chat lead synced for session:', sessionId);
        } else {
          console.error('[POST /api/messages] OrbisX chat sync failed:', result.error);
        }
      } catch (orbisErr) {
        console.error('[POST /api/messages] OrbisX chat sync error:', orbisErr);
      }
    })();

    // Non-blocking AI qualification for employee triage.
    if (isAIQualificationEnabled()) {
      (async () => {
        try {
          const qualification = await qualifyLeadMessage({
            message: message.trim(),
            visitorName,
          });

          const { error: aiError } = await supabaseServer
            .from('ai_qualifications')
            .insert({
              session_id: sessionId,
              message_id: data.id,
              intent: qualification.intent,
              urgency: qualification.urgency,
              fit: qualification.fit,
              confidence: qualification.confidence,
              provider: qualification.provider,
              next_action: qualification.nextAction,
              summary: qualification.summary,
            });

          if (aiError) {
            console.error('[POST /api/messages] AI qualification insert error:', aiError);
          }
        } catch (aiErr) {
          console.error('[POST /api/messages] AI qualification error:', aiErr);
        }
      })();
    }

    // ── Quo SMS: notify team phone on every new visitor message ──
    const normalizePhone = (phone: string): string | null => {
      const digits = phone.replace(/\D/g, '');
      if (digits.length === 10) return `+1${digits}`;
      if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
      if (phone.startsWith('+') && digits.length >= 10) return `+${digits}`;
      return null;
    };

    const visitorE164 = visitorPhone ? normalizePhone(visitorPhone) : null;
    const teamNotifyNumber = process.env.QUO_SMS_NOTIFY_NUMBER || import.meta.env.QUO_SMS_NOTIFY_NUMBER;

    if (teamNotifyNumber && !shouldSkipSms && smsBridgeEnabled) {
      const smsBody = visitorName
        ? `💬 ${visitorName}: ${message.trim()}`
        : `💬 Website chat: ${message.trim()}`;

      quoSendSMS(teamNotifyNumber, smsBody)
        .then((res) => {
          if (res.ok) {
            console.log('[POST /api/messages] Team SMS sent to', teamNotifyNumber, '→', res.messageId);
          } else {
            console.error('[POST /api/messages] Quo SMS failed:', res.error);
          }
        })
        .catch((err) => console.error('[POST /api/messages] Quo SMS error:', err));
    }

    // Map visitor phone → chat session so SMS replies route back into the widget
    if (visitorE164 && supabaseServer && smsBridgeEnabled && !shouldSkipSms) {
      supabaseServer
        .from('chat_sms_bridge')
        .upsert(
          {
            phone_number: visitorE164,
            session_id: sessionId,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'phone_number' }
        )
        .then(({ error: bridgeErr }) => {
          if (bridgeErr) console.error('[POST /api/messages] Bridge upsert error:', bridgeErr);
        });
    }

    if (shouldSkipSms) {
      console.log('[POST /api/messages] SMS skipped for test session:', sessionId);
    }
    if (!smsBridgeEnabled) {
      console.log('[POST /api/messages] SMS bridge disabled via CHAT_SMS_BRIDGE_ENABLED');
    }
    console.log('[POST /api/messages] QUO_SMS_NOTIFY_NUMBER:', teamNotifyNumber ? 'SET' : 'NOT SET');

    // Fire push notification to employee devices (non-blocking)
    const pushTitle = visitorName
      ? `💬 ${visitorName} sent a message`
      : '💬 New customer message';
    const pushBody = message.trim().length > 100
      ? message.trim().slice(0, 100) + '…'
      : message.trim();

    fetch(new URL('/api/push/send', request.url).href, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: pushTitle,
        body: pushBody,
        data: { sessionId },
      }),
    }).catch((err) => console.error('[POST /api/messages] Push send error:', err));

    let aiResponseMessage: ChatMessage | null = null;

    // Optional AI employee response for booking and customer assistance.
    // Gated by: enable flag, handoff detection, qualification threshold, and rate limiting.
    if (isAIChatEnabled() && !detectHandoffRequest(message) && canReplyWithAI(sessionId)) {
      try {
        // First, qualify the message to check intent and confidence.
        const qualification = await qualifyLeadMessage({
          message: message.trim(),
          visitorName,
        });

        // Only generate reply if it meets qualification criteria.
        if (shouldQualifyForAIReply(qualification)) {
          const aiReply = await generateAIEmployeeReply({
            message: message.trim(),
            visitorName,
          });

          if (aiReply) {
            const aiName = getAIEmployeeName();
            const { data: aiData, error: aiInsertError } = await supabaseServer
              .from('chat_messages')
              .insert({
                session_id: sessionId,
                sender_type: 'employee',
                sender_name: aiName,
                message: aiReply,
                is_read: false,
              })
              .select()
              .single();

            if (aiInsertError) {
              console.error('[POST /api/messages] AI response insert error:', aiInsertError);
            } else if (aiData) {
              aiResponseMessage = {
                id: aiData.id,
                sessionId: aiData.session_id,
                senderType: aiData.sender_type,
                senderName: aiData.sender_name || undefined,
                message: aiData.message,
                timestamp: aiData.timestamp,
                isRead: aiData.is_read,
              };
            }
          }
        }
      } catch (aiReplyErr) {
        console.error('[POST /api/messages] AI response error:', aiReplyErr);
      }
    }

    const newMessage: ChatMessage = {
      id: data.id,
      sessionId: data.session_id,
      senderType: data.sender_type,
      senderName: data.sender_name || undefined,
      message: data.message,
      timestamp: data.timestamp,
      isRead: data.is_read,
    };

    return new Response(JSON.stringify({ ok: true, message: newMessage, aiMessage: aiResponseMessage }), {
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
