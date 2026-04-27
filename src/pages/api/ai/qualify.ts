import type { APIContext } from 'astro';
import { isAIQualificationEnabled, qualifyLeadMessage } from '../../../utils/openai';

export async function POST({ request }: APIContext) {
  if (request.headers.get('content-type') !== 'application/json') {
    return new Response(JSON.stringify({ ok: false, error: 'Invalid content type' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  const body = (await request.json()) as {
    message?: string;
    visitorName?: string;
  };

  const message = String(body.message || '').trim();
  const visitorName = String(body.visitorName || '').trim();

  if (!message) {
    return new Response(JSON.stringify({ ok: false, error: 'Message is required' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  if (!isAIQualificationEnabled()) {
    return new Response(JSON.stringify({ ok: false, error: 'AI qualification is disabled' }), {
      status: 503,
      headers: { 'content-type': 'application/json' },
    });
  }

  try {
    const qualification = await qualifyLeadMessage({ message, visitorName });

    return new Response(JSON.stringify({ ok: true, qualification }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[POST /api/ai/qualify] Error:', error);
    return new Response(JSON.stringify({ ok: false, error: error.message || 'Qualification failed' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
}
