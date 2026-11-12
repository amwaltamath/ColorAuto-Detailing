import { sanitizeEnv } from './envSanitize';

export function getTurnstileSecretKey(): string {
  return sanitizeEnv(process.env.TURNSTILE_SECRET_KEY) || '';
}

/** When true, public forms must pass a Turnstile token. */
export function isTurnstileEnforced(): boolean {
  return Boolean(getTurnstileSecretKey());
}

export async function verifyTurnstileToken(token: string, remoteIp?: string | null): Promise<boolean> {
  const secret = getTurnstileSecretKey();
  if (!secret) {
    console.warn('[TURNSTILE] TURNSTILE_SECRET_KEY not configured. Skipping verification.');
    return true;
  }

  const responseToken = (token || '').trim();
  if (!responseToken) return false;

  try {
    const body = new URLSearchParams({
      secret,
      response: responseToken,
    });
    if (remoteIp) body.set('remoteip', remoteIp.trim());

    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    if (!response.ok) {
      console.error('[TURNSTILE] API error:', response.status);
      return false;
    }

    const result = (await response.json()) as { success?: boolean; 'error-codes'?: string[] };
    if (!result.success) {
      console.warn('[TURNSTILE] Verification failed:', result['error-codes']);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[TURNSTILE] Verification error:', error);
    return false;
  }
}

export function clientIpFromRequest(request: Request): string | null {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() || null;
  return request.headers.get('x-real-ip')?.trim() || null;
}

export async function assertTurnstileForRequest(
  token: string,
  request: Request,
): Promise<{ ok: true } | { ok: false; error: string; status: number }> {
  if (!isTurnstileEnforced()) {
    return { ok: true };
  }

  const trimmed = (token || '').trim();
  if (!trimmed) {
    return { ok: false, error: 'Please complete the security check and try again.', status: 400 };
  }

  const valid = await verifyTurnstileToken(trimmed, clientIpFromRequest(request));
  if (!valid) {
    return { ok: false, error: 'Security verification failed. Please try again.', status: 400 };
  }

  return { ok: true };
}
