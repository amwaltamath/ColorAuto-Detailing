import type { APIRoute } from 'astro';
import { createColorAutoCampaignEmail } from '../../../utils/emailCampaignTemplate';
import { getAuthenticatedEmployee } from '../../../utils/employeeApiAuth';
import { sanitizeEnv } from '../../../utils/envSanitize';
import { supabaseServer } from '../../../utils/supabaseServer';

export const prerender = false;
export const maxDuration = 60;

const PAGE_SIZE = 1000;
const SEND_CONCURRENCY = 8;
const CAMPAIGN_FROM = sanitizeEnv(process.env.CONTACT_FROM_EMAIL) || 'ColorAuto Detailing <no-reply@colorautodetailing.com>';
const CAMPAIGN_REPLY = sanitizeEnv(process.env.CONTACT_TO_EMAIL) || 'admin@colorautodetailing.com';

interface Subscriber {
  email: string;
  name?: string | null;
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function isTestSubject(subject: string) {
  return subject.trim().toUpperCase().startsWith('[TEST]');
}

async function fetchAllSubscribers() {
  const rows: { id: string; email: string; name: string | null; email_opt_in: boolean; created_at: string }[] = [];
  let from = 0;

  for (;;) {
    const { data, error } = await supabaseServer!
      .from('newsletter_subscribers')
      .select('id, email, name, email_opt_in, created_at')
      .eq('email_opt_in', true)
      .order('created_at', { ascending: false })
      .range(from, from + PAGE_SIZE - 1);

    if (error) throw new Error(error.message);
    const page = data ?? [];
    rows.push(...page);
    if (page.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return rows;
}

async function sendOneEmail(subject: string, message: string, subscriber: Subscriber, resendKey: string) {
  const { html, text } = createColorAutoCampaignEmail({
    subject,
    message,
    recipientName: subscriber.name,
  });

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: CAMPAIGN_FROM,
      to: subscriber.email,
      reply_to: CAMPAIGN_REPLY,
      subject,
      html,
      text,
      headers: {
        'List-Unsubscribe': `<mailto:${CAMPAIGN_REPLY}?subject=unsubscribe>`,
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    const retryable = res.status === 429;
    throw Object.assign(new Error(errText || `Resend ${res.status}`), { retryable });
  }
}

async function sendWithRetry(subject: string, message: string, subscriber: Subscriber, resendKey: string) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await sendOneEmail(subject, message, subscriber, resendKey);
      return;
    } catch (err) {
      const retryable = Boolean((err as { retryable?: boolean }).retryable);
      if (retryable && attempt < 3) {
        await new Promise((r) => setTimeout(r, 1200 * attempt));
        continue;
      }
      throw err;
    }
  }
}

async function sendBatch(
  subject: string,
  message: string,
  subscribers: Subscriber[],
  resendKey: string,
  onProgress?: (sent: number) => Promise<void>,
) {
  let sent = 0;
  let failed = 0;
  const failedEmails: string[] = [];

  for (let i = 0; i < subscribers.length; i += SEND_CONCURRENCY) {
    const chunk = subscribers.slice(i, i + SEND_CONCURRENCY);
    const results = await Promise.allSettled(
      chunk.map((s) => sendWithRetry(subject, message, s, resendKey)),
    );

    for (let j = 0; j < results.length; j++) {
      if (results[j].status === 'fulfilled') {
        sent++;
      } else {
        failed++;
        const email = chunk[j]?.email;
        if (email && failedEmails.length < 20) failedEmails.push(email);
        console.error('[email-campaign] send failed:', email, results[j]);
      }
    }

    if (onProgress && sent > 0) await onProgress(sent);
  }

  return { sent, failed, failedEmails };
}

export const GET: APIRoute = async ({ request }) => {
  if (!supabaseServer) {
    return json({ error: 'Database not configured' }, 503);
  }

  const employee = await getAuthenticatedEmployee(request);
  if (!employee) {
    return json({ error: 'Unauthorized' }, 401);
  }

  try {
    const { count: subscriberTotal, error: countErr } = await supabaseServer
      .from('newsletter_subscribers')
      .select('id', { count: 'exact', head: true })
      .eq('email_opt_in', true);

    if (countErr) throw new Error(countErr.message);

    const { data: subscribers, error: subErr } = await supabaseServer
      .from('newsletter_subscribers')
      .select('id, email, name, email_opt_in, created_at')
      .eq('email_opt_in', true)
      .order('created_at', { ascending: false })
      .limit(500);

    if (subErr) throw new Error(subErr.message);

    const { data: campaigns, error: campErr } = await supabaseServer
      .from('email_campaigns')
      .select('id, subject, sent_count, failed_count, created_at, sent_at')
      .order('created_at', { ascending: false })
      .limit(100);

    if (campErr) {
      if (campErr.message.includes('email_campaigns')) {
        return json({
          subscribers: [],
          campaigns: [],
          schema_ready: false,
          error: 'Run supabase/email_campaign_migration.sql in Supabase',
        });
      }
      return json({ error: campErr.message }, 500);
    }

    const visibleCampaigns = (campaigns ?? []).filter(
      (c) => !c.subject?.toUpperCase().startsWith('[TEST]'),
    );

    return json({
      schema_ready: true,
      subscribers: subscribers ?? [],
      subscriber_total: subscriberTotal ?? (subscribers ?? []).length,
      subscribers_truncated: (subscriberTotal ?? 0) > (subscribers ?? []).length,
      campaigns: visibleCampaigns,
    });
  } catch (err) {
    console.error('[email-campaign] GET', err);
    return json({ error: 'Failed to load campaign data' }, 500);
  }
};

export const POST: APIRoute = async ({ request }) => {
  if (!supabaseServer) {
    return json({ error: 'Database not configured' }, 503);
  }

  const employee = await getAuthenticatedEmployee(request);
  if (!employee) {
    return json({ error: 'Unauthorized' }, 401);
  }

  const resendKey = sanitizeEnv(process.env.RESEND_API_KEY);
  if (!resendKey?.startsWith('re_')) {
    return json({ error: 'RESEND_API_KEY is not configured' }, 503);
  }

  try {
    const body = await request.json();
    const subject = String(body?.subject ?? '').trim();
    const message = String(body?.message ?? '').trim();
    const subscribers = Array.isArray(body?.subscribers) ? (body.subscribers as Subscriber[]) : [];

    if (!subject || !message || subscribers.length === 0) {
      return json({ error: 'Subject, message, and subscribers are required' }, 400);
    }

    const recordHistory = !isTestSubject(subject);
    let campaignId: string | null = null;

    if (recordHistory) {
      const { data: created, error } = await supabaseServer
        .from('email_campaigns')
        .insert({
          subject,
          message,
          sent_count: 0,
          failed_count: 0,
          sent_at: new Date().toISOString(),
          created_by: employee.id,
        })
        .select('id')
        .single();

      if (error) {
        return json({ error: error.message }, 500);
      }
      campaignId = created?.id ?? null;
    }

    const recipients = subscribers
      .map((s) => ({
        email: String(s.email ?? '').trim().toLowerCase(),
        name: s.name ?? null,
      }))
      .filter((s) => s.email);

    const { sent, failed, failedEmails } = await sendBatch(
      subject,
      message,
      recipients,
      resendKey,
      campaignId
        ? async (sentSoFar) => {
            await supabaseServer!
              .from('email_campaigns')
              .update({ sent_count: sentSoFar, sent_at: new Date().toISOString() })
              .eq('id', campaignId);
          }
        : undefined,
    );

    if (campaignId) {
      await supabaseServer
        .from('email_campaigns')
        .update({
          sent_count: sent,
          failed_count: failed,
          sent_at: new Date().toISOString(),
        })
        .eq('id', campaignId);
    }

    return json({
      ok: true,
      sent,
      failed,
      failedEmails,
      total: recipients.length,
    });
  } catch (err) {
    console.error('[email-campaign] POST', err);
    return json({ error: err instanceof Error ? err.message : 'Failed to send' }, 500);
  }
};
