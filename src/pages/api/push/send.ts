import type { APIContext } from 'astro';
import { supabaseServer } from '../../../utils/supabaseServer';

/**
 * Sends APNs push notifications to all registered iOS devices.
 * Uses APNs HTTP/2 API with JWT auth (requires APNS_KEY_ID, APNS_TEAM_ID, APNS_PRIVATE_KEY env vars).
 *
 * called internally by /api/messages when a visitor sends a chat message.
 */

interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

// Build a JWT for APNs authentication
async function buildApnsJwt(): Promise<string | null> {
  const keyId = process.env.APNS_KEY_ID;
  const teamId = process.env.APNS_TEAM_ID;
  const privateKeyPem = process.env.APNS_PRIVATE_KEY;

  if (!keyId || !teamId || !privateKeyPem) {
    console.warn('[push/send] APNs credentials not configured');
    return null;
  }

  // APNs JWT header + claims
  const header = { alg: 'ES256', kid: keyId };
  const now = Math.floor(Date.now() / 1000);
  const claims = { iss: teamId, iat: now };

  const enc = (obj: object) =>
    Buffer.from(JSON.stringify(obj)).toString('base64url');

  const unsignedToken = `${enc(header)}.${enc(claims)}`;

  // Import the private key and sign
  const keyData = privateKeyPem
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\s/g, '');

  const keyBuffer = Buffer.from(keyData, 'base64');

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    keyBuffer,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    cryptoKey,
    new TextEncoder().encode(unsignedToken)
  );

  // Convert DER signature to raw r||s format expected by JWT
  const sigBytes = new Uint8Array(signature);
  const sigBase64 = Buffer.from(sigBytes).toString('base64url');

  return `${unsignedToken}.${sigBase64}`;
}

async function sendApnsPush(
  deviceToken: string,
  payload: PushPayload,
  jwt: string,
  bundleId: string
): Promise<boolean> {
  const isProduction = process.env.APNS_PRODUCTION !== 'false';
  const host = isProduction
    ? 'https://api.push.apple.com'
    : 'https://api.sandbox.push.apple.com';

  const apnsPayload = {
    aps: {
      alert: {
        title: payload.title,
        body: payload.body,
      },
      sound: 'default',
      badge: 1,
    },
    ...payload.data,
  };

  try {
    const response = await fetch(`${host}/3/device/${deviceToken}`, {
      method: 'POST',
      headers: {
        authorization: `bearer ${jwt}`,
        'apns-topic': bundleId,
        'apns-push-type': 'alert',
        'apns-priority': '10',
        'content-type': 'application/json',
      },
      body: JSON.stringify(apnsPayload),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error(`[push/send] APNs error for ${deviceToken.slice(0, 8)}...:`, response.status, err);

      // If token is invalid, remove it
      if (response.status === 410 || response.status === 400) {
        await supabaseServer
          ?.from('push_tokens')
          .delete()
          .eq('token', deviceToken);
        console.log(`[push/send] Removed stale token ${deviceToken.slice(0, 8)}...`);
      }
      return false;
    }

    return true;
  } catch (err) {
    console.error(`[push/send] Network error for ${deviceToken.slice(0, 8)}...:`, err);
    return false;
  }
}

export async function POST({ request }: APIContext) {
  if (request.headers.get('content-type') !== 'application/json') {
    return new Response(JSON.stringify({ ok: false, error: 'Invalid content type' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  const body = await request.json() as PushPayload;
  const { title, body: messageBody, data } = body;

  if (!title || !messageBody) {
    return new Response(JSON.stringify({ ok: false, error: 'Missing title or body' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  if (!supabaseServer) {
    return new Response(JSON.stringify({ ok: true, sent: 0, reason: 'Supabase not configured' }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  }

  // Get all registered iOS tokens
  const { data: tokens, error } = await supabaseServer
    .from('push_tokens')
    .select('token')
    .eq('platform', 'ios');

  if (error || !tokens?.length) {
    return new Response(JSON.stringify({ ok: true, sent: 0, reason: error?.message || 'No tokens registered' }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  }

  // Build JWT for APNs
  const jwt = await buildApnsJwt();
  if (!jwt) {
    return new Response(JSON.stringify({ ok: true, sent: 0, reason: 'APNs credentials not configured' }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  }

  const bundleId = 'com.colorautodetailing.admin';
  let sentCount = 0;

  // Send to all registered devices
  const results = await Promise.allSettled(
    tokens.map(async ({ token }) => {
      const success = await sendApnsPush(token, { title, body: messageBody, data }, jwt, bundleId);
      if (success) sentCount++;
      return success;
    })
  );

  console.log(`[push/send] Sent ${sentCount}/${tokens.length} push notifications`);

  return new Response(JSON.stringify({ ok: true, sent: sentCount, total: tokens.length }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}
