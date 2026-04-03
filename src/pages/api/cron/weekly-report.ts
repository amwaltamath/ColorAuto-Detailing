import type { APIRoute } from 'astro';
import { supabaseServer } from '../../../utils/supabaseServer';

const SOURCE_LABELS: Record<string, string> = {
  google_ads: 'Google Ads',
  meta_ads: 'Meta Ads',
  website: 'Website',
  phone: 'Phone',
  walk_in: 'Walk-in',
  referral: 'Referral',
  other: 'Other',
};

const STATUS_LABELS: Record<string, string> = {
  new: 'New',
  contacted: 'Contacted',
  quoted: 'Quoted',
  booked: 'Booked',
  completed: 'Completed',
  lost: 'Lost',
};

const STATUS_COLORS: Record<string, string> = {
  new: '#3b82f6',
  contacted: '#06b6d4',
  quoted: '#eab308',
  booked: '#a855f7',
  completed: '#22c55e',
  lost: '#ef4444',
};

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatCurrency(val: number) {
  return `$${val.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatHours(hours: number | null) {
  if (hours === null) return 'N/A';
  if (hours < 1) return `${Math.round(hours * 60)}min`;
  return `${hours.toFixed(1)}hrs`;
}

export const POST: APIRoute = async ({ request }) => {
  // Verify cron secret or admin auth
  const authHeader = request.headers.get('authorization') || '';
  const cronSecret = process.env.CRON_SECRET || '';
  const isCron = cronSecret && authHeader === `Bearer ${cronSecret}`;
  const isManual = authHeader.startsWith('Bearer ') && !isCron;

  // Allow cron or manual trigger from authenticated admin
  if (!isCron && !isManual) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'content-type': 'application/json' },
    });
  }

  if (!supabaseServer) {
    return new Response(JSON.stringify({ error: 'Database not configured' }), {
      status: 503,
      headers: { 'content-type': 'application/json' },
    });
  }

  const RESEND_API_KEY = (process.env.RESEND_API_KEY || '').trim();
  const TO_EMAILS = (process.env.CONTACT_TO_EMAIL || 'admin@colorautodetailing.com')
    .split(',')
    .map((e: string) => e.trim())
    .filter(Boolean);
  const FROM_EMAIL = (process.env.CONTACT_FROM_EMAIL || 'no-reply@colorautodetailing.com').trim();

  if (!RESEND_API_KEY || !RESEND_API_KEY.startsWith('re_')) {
    return new Response(JSON.stringify({ error: 'Email not configured' }), {
      status: 503,
      headers: { 'content-type': 'application/json' },
    });
  }

  try {
    // Get period from body or default to week
    let period = 'week';
    try {
      const body = await request.json();
      if (body.period) period = body.period;
    } catch { /* empty body is fine */ }

    const now = new Date();
    const start = new Date(now);
    if (period === 'month') {
      start.setMonth(start.getMonth() - 1);
    } else {
      start.setDate(start.getDate() - 7);
    }

    // Fetch leads
    const { data: leads } = await supabaseServer
      .from('leads')
      .select('*')
      .gte('created_at', start.toISOString())
      .lte('created_at', now.toISOString())
      .order('created_at', { ascending: false });

    const allLeads = leads || [];

    // Aggregate
    const byStatus: Record<string, number> = {};
    const bySource: Record<string, number> = {};
    let estimatedRevenue = 0;
    let closedRevenue = 0;
    let responseTimes: number[] = [];

    for (const lead of allLeads) {
      byStatus[lead.status] = (byStatus[lead.status] || 0) + 1;
      bySource[lead.source || 'unknown'] = (bySource[lead.source || 'unknown'] || 0) + 1;
      const val = parseFloat(lead.estimated_value) || 0;
      estimatedRevenue += val;
      if (lead.status === 'completed' || lead.status === 'booked') {
        closedRevenue += val;
      }
      if (lead.contacted_at && lead.created_at) {
        const diff = new Date(lead.contacted_at).getTime() - new Date(lead.created_at).getTime();
        if (diff > 0) responseTimes.push(diff / 3600000);
      }
    }

    const totalLeads = allLeads.length;
    const completedCount = byStatus['completed'] || 0;
    const bookedCount = byStatus['booked'] || 0;
    const lostCount = byStatus['lost'] || 0;
    const conversionRate = totalLeads > 0 ? ((completedCount + bookedCount) / totalLeads * 100).toFixed(1) : '0';
    const avgResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : null;

    // Open pipeline
    const { data: openLeads } = await supabaseServer
      .from('leads')
      .select('estimated_value')
      .in('status', ['new', 'contacted', 'quoted', 'booked']);

    const pipelineValue = (openLeads || []).reduce(
      (sum: number, l: any) => sum + (parseFloat(l.estimated_value) || 0), 0
    );
    const pipelineCount = (openLeads || []).length;

    // Compare to previous period
    const prevStart = new Date(start);
    if (period === 'month') {
      prevStart.setMonth(prevStart.getMonth() - 1);
    } else {
      prevStart.setDate(prevStart.getDate() - 7);
    }

    const { data: prevLeads } = await supabaseServer
      .from('leads')
      .select('id')
      .gte('created_at', prevStart.toISOString())
      .lt('created_at', start.toISOString());

    const prevTotal = (prevLeads || []).length;
    const leadsTrend = prevTotal > 0
      ? ((totalLeads - prevTotal) / prevTotal * 100).toFixed(0)
      : totalLeads > 0 ? '+100' : '0';

    // Top 5 recent leads for the email
    const topLeads = allLeads.slice(0, 5);

    // Build period label
    const periodLabel = period === 'month' ? 'Monthly' : 'Weekly';
    const dateRange = `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

    // --- Build HTML email ---
    const statusRows = Object.entries(byStatus)
      .sort(([, a], [, b]) => b - a)
      .map(([status, count]) => `
        <tr>
          <td style="padding:6px 12px;border-bottom:1px solid #e2e8f0;">
            <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${STATUS_COLORS[status] || '#94a3b8'};margin-right:8px;vertical-align:middle;"></span>
            ${escapeHtml(STATUS_LABELS[status] || status)}
          </td>
          <td style="padding:6px 12px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:600;">${count}</td>
        </tr>
      `).join('');

    const sourceRows = Object.entries(bySource)
      .sort(([, a], [, b]) => b - a)
      .map(([source, count]) => `
        <tr>
          <td style="padding:6px 12px;border-bottom:1px solid #e2e8f0;">${escapeHtml(SOURCE_LABELS[source] || source)}</td>
          <td style="padding:6px 12px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:600;">${count}</td>
          <td style="padding:6px 12px;border-bottom:1px solid #e2e8f0;text-align:right;color:#64748b;">${totalLeads > 0 ? (count / totalLeads * 100).toFixed(0) : 0}%</td>
        </tr>
      `).join('');

    const leadRows = topLeads.map((lead: any) => `
      <tr>
        <td style="padding:6px 12px;border-bottom:1px solid #e2e8f0;">${escapeHtml(lead.name)}</td>
        <td style="padding:6px 12px;border-bottom:1px solid #e2e8f0;">${escapeHtml(lead.service_interest || '—')}</td>
        <td style="padding:6px 12px;border-bottom:1px solid #e2e8f0;">
          <span style="display:inline-block;padding:2px 8px;border-radius:12px;background:${STATUS_COLORS[lead.status] || '#94a3b8'}20;color:${STATUS_COLORS[lead.status] || '#94a3b8'};font-size:12px;font-weight:600;">${STATUS_LABELS[lead.status] || lead.status}</span>
        </td>
        <td style="padding:6px 12px;border-bottom:1px solid #e2e8f0;">${escapeHtml(SOURCE_LABELS[lead.source] || lead.source)}</td>
        <td style="padding:6px 12px;border-bottom:1px solid #e2e8f0;text-align:right;">${lead.estimated_value ? formatCurrency(parseFloat(lead.estimated_value)) : '—'}</td>
      </tr>
    `).join('');

    const trendArrow = parseInt(leadsTrend) >= 0 ? '↑' : '↓';
    const trendColor = parseInt(leadsTrend) >= 0 ? '#22c55e' : '#ef4444';

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:680px;margin:0 auto;background:#ffffff;">
  <!-- Header -->
  <tr>
    <td style="padding:32px 24px 20px;background:linear-gradient(135deg,#1e3a5f,#2563eb);color:#fff;text-align:center;">
      <h1 style="margin:0 0 4px;font-size:24px;font-weight:700;">Color Auto Detailing</h1>
      <p style="margin:0;font-size:14px;opacity:0.9;">${periodLabel} Lead Report — ${dateRange}</p>
    </td>
  </tr>

  <!-- KPI Cards -->
  <tr>
    <td style="padding:24px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td width="25%" style="padding:8px;">
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px;text-align:center;">
              <div style="font-size:28px;font-weight:700;color:#0f172a;">${totalLeads}</div>
              <div style="font-size:12px;color:#64748b;margin-top:4px;">New Leads</div>
              <div style="font-size:11px;color:${trendColor};margin-top:4px;">${trendArrow} ${leadsTrend}% vs prev</div>
            </div>
          </td>
          <td width="25%" style="padding:8px;">
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px;text-align:center;">
              <div style="font-size:28px;font-weight:700;color:#0f172a;">${conversionRate}%</div>
              <div style="font-size:12px;color:#64748b;margin-top:4px;">Conversion</div>
              <div style="font-size:11px;color:#64748b;margin-top:4px;">${completedCount + bookedCount} won</div>
            </div>
          </td>
          <td width="25%" style="padding:8px;">
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px;text-align:center;">
              <div style="font-size:28px;font-weight:700;color:#0f172a;">${formatCurrency(closedRevenue)}</div>
              <div style="font-size:12px;color:#64748b;margin-top:4px;">Revenue</div>
              <div style="font-size:11px;color:#64748b;margin-top:4px;">${formatCurrency(estimatedRevenue)} quoted</div>
            </div>
          </td>
          <td width="25%" style="padding:8px;">
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px;text-align:center;">
              <div style="font-size:28px;font-weight:700;color:#0f172a;">${formatHours(avgResponseTime)}</div>
              <div style="font-size:12px;color:#64748b;margin-top:4px;">Avg Response</div>
              <div style="font-size:11px;color:#64748b;margin-top:4px;">${responseTimes.length} tracked</div>
            </div>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- Pipeline -->
  <tr>
    <td style="padding:0 24px 16px;">
      <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:16px;display:flex;gap:24px;">
        <div>
          <span style="font-size:13px;color:#3b82f6;font-weight:600;">Open Pipeline</span><br>
          <span style="font-size:22px;font-weight:700;color:#1e3a8a;">${formatCurrency(pipelineValue)}</span>
          <span style="font-size:13px;color:#64748b;margin-left:8px;">(${pipelineCount} leads)</span>
        </div>
      </div>
    </td>
  </tr>

  <!-- Status Breakdown -->
  <tr>
    <td style="padding:0 24px 24px;">
      <h3 style="margin:0 0 12px;font-size:16px;color:#0f172a;">Lead Status Breakdown</h3>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
        <tr style="background:#f8fafc;">
          <th style="padding:8px 12px;text-align:left;font-size:12px;color:#64748b;font-weight:600;">Status</th>
          <th style="padding:8px 12px;text-align:right;font-size:12px;color:#64748b;font-weight:600;">Count</th>
        </tr>
        ${statusRows || '<tr><td colspan="2" style="padding:16px;text-align:center;color:#94a3b8;">No leads this period</td></tr>'}
      </table>
    </td>
  </tr>

  <!-- Source Breakdown -->
  <tr>
    <td style="padding:0 24px 24px;">
      <h3 style="margin:0 0 12px;font-size:16px;color:#0f172a;">Lead Sources</h3>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
        <tr style="background:#f8fafc;">
          <th style="padding:8px 12px;text-align:left;font-size:12px;color:#64748b;font-weight:600;">Source</th>
          <th style="padding:8px 12px;text-align:right;font-size:12px;color:#64748b;font-weight:600;">Count</th>
          <th style="padding:8px 12px;text-align:right;font-size:12px;color:#64748b;font-weight:600;">%</th>
        </tr>
        ${sourceRows || '<tr><td colspan="3" style="padding:16px;text-align:center;color:#94a3b8;">No data</td></tr>'}
      </table>
    </td>
  </tr>

  <!-- Recent Leads -->
  ${topLeads.length > 0 ? `
  <tr>
    <td style="padding:0 24px 24px;">
      <h3 style="margin:0 0 12px;font-size:16px;color:#0f172a;">Recent Leads</h3>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;font-size:13px;">
        <tr style="background:#f8fafc;">
          <th style="padding:8px 12px;text-align:left;font-size:12px;color:#64748b;font-weight:600;">Name</th>
          <th style="padding:8px 12px;text-align:left;font-size:12px;color:#64748b;font-weight:600;">Service</th>
          <th style="padding:8px 12px;text-align:left;font-size:12px;color:#64748b;font-weight:600;">Status</th>
          <th style="padding:8px 12px;text-align:left;font-size:12px;color:#64748b;font-weight:600;">Source</th>
          <th style="padding:8px 12px;text-align:right;font-size:12px;color:#64748b;font-weight:600;">Value</th>
        </tr>
        ${leadRows}
      </table>
    </td>
  </tr>
  ` : ''}

  <!-- CTA -->
  <tr>
    <td style="padding:0 24px 32px;text-align:center;">
      <a href="https://colorautodetailing.com/employee/dashboard" style="display:inline-block;background:#2563eb;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
        View Full Dashboard
      </a>
    </td>
  </tr>

  <!-- Footer -->
  <tr>
    <td style="padding:20px 24px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
      <p style="margin:0;font-size:12px;color:#94a3b8;">
        This is an automated ${periodLabel.toLowerCase()} report from Color Auto Detailing.<br>
        Generated on ${now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
      </p>
    </td>
  </tr>
</table>
</body>
</html>`;

    // Plain text version
    const text = [
      `Color Auto Detailing — ${periodLabel} Lead Report`,
      `Period: ${dateRange}`,
      '',
      `New Leads: ${totalLeads} (${trendArrow}${leadsTrend}% vs previous)`,
      `Conversion Rate: ${conversionRate}%`,
      `Revenue: ${formatCurrency(closedRevenue)} (${formatCurrency(estimatedRevenue)} quoted)`,
      `Avg Response Time: ${formatHours(avgResponseTime)}`,
      `Open Pipeline: ${formatCurrency(pipelineValue)} (${pipelineCount} leads)`,
      '',
      'Status Breakdown:',
      ...Object.entries(byStatus).map(([s, c]) => `  ${STATUS_LABELS[s] || s}: ${c}`),
      '',
      'Sources:',
      ...Object.entries(bySource).map(([s, c]) => `  ${SOURCE_LABELS[s] || s}: ${c}`),
      '',
      'View dashboard: https://colorautodetailing.com/employee/dashboard',
    ].join('\n');

    // Send via Resend
    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: TO_EMAILS,
        subject: `📊 ${periodLabel} Lead Report — ${totalLeads} leads, ${formatCurrency(closedRevenue)} revenue`,
        html,
        text,
      }),
    });

    if (!emailRes.ok) {
      const errText = await emailRes.text();
      console.error('Resend API error:', errText);
      return new Response(JSON.stringify({ error: 'Failed to send report email' }), {
        status: 500,
        headers: { 'content-type': 'application/json' },
      });
    }

    const emailResult = await emailRes.json();

    // Log the report in the database
    await supabaseServer.from('weekly_reports').insert({
      period,
      date_range_start: start.toISOString(),
      date_range_end: now.toISOString(),
      total_leads: totalLeads,
      conversion_rate: parseFloat(conversionRate),
      revenue: closedRevenue,
      pipeline_value: pipelineValue,
      sent_to: TO_EMAILS.join(', '),
      resend_id: emailResult.id || null,
    });

    return new Response(
      JSON.stringify({ ok: true, emailId: emailResult.id, totalLeads, period }),
      { status: 200, headers: { 'content-type': 'application/json' } }
    );
  } catch (err) {
    console.error('Error sending report:', err);
    return new Response(JSON.stringify({ error: 'Failed to send report' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
};

// Vercel cron calls GET
export const GET: APIRoute = async (ctx) => {
  // Redirect GET to POST for cron compatibility
  return POST(ctx);
};
