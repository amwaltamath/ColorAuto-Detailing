import type { APIRoute } from 'astro';
import { supabaseServer } from '../../../utils/supabaseServer';

interface LeadStats {
  total: number;
  new: number;
  contacted: number;
  quoted: number;
  booked: number;
  completed: number;
  lost: number;
  bySource: Record<string, number>;
  byService: Record<string, number>;
  estimatedRevenue: number;
  closedRevenue: number;
  conversionRate: number;
  avgResponseTime: number | null;
  topLeads: Array<{
    name: string;
    email?: string;
    service_interest?: string;
    status: string;
    estimated_value?: number;
    source: string;
    created_at: string;
  }>;
}

function getDateRange(period: string): { start: string; end: string } {
  const now = new Date();
  const end = now.toISOString();
  let start: Date;

  switch (period) {
    case 'week':
      start = new Date(now);
      start.setDate(start.getDate() - 7);
      break;
    case 'month':
      start = new Date(now);
      start.setMonth(start.getMonth() - 1);
      break;
    case 'quarter':
      start = new Date(now);
      start.setMonth(start.getMonth() - 3);
      break;
    default:
      start = new Date(now);
      start.setDate(start.getDate() - 7);
  }

  return { start: start.toISOString(), end };
}

export const GET: APIRoute = async ({ url }) => {
  if (!supabaseServer) {
    return new Response(JSON.stringify({ error: 'Database not configured' }), {
      status: 503,
      headers: { 'content-type': 'application/json' },
    });
  }

  try {
    const period = url.searchParams.get('period') || 'week';
    const { start, end } = getDateRange(period);

    // Fetch leads in the period
    const { data: leads, error: leadsErr } = await supabaseServer
      .from('leads')
      .select('*')
      .gte('created_at', start)
      .lte('created_at', end)
      .order('created_at', { ascending: false });

    if (leadsErr) {
      return new Response(JSON.stringify({ error: leadsErr.message }), {
        status: 400,
        headers: { 'content-type': 'application/json' },
      });
    }

    const allLeads = leads || [];

    // Also fetch all-time pipeline counts for context
    const { data: pipelineLeads } = await supabaseServer
      .from('leads')
      .select('status, estimated_value, contacted_at, created_at')
      .in('status', ['new', 'contacted', 'quoted', 'booked']);

    const openPipeline = pipelineLeads || [];

    // Aggregate stats
    const byStatus: Record<string, number> = {};
    const bySource: Record<string, number> = {};
    const byService: Record<string, number> = {};
    let estimatedRevenue = 0;
    let closedRevenue = 0;
    let responseTimes: number[] = [];

    for (const lead of allLeads) {
      // Status counts
      byStatus[lead.status] = (byStatus[lead.status] || 0) + 1;

      // Source counts
      const src = lead.source || 'unknown';
      bySource[src] = (bySource[src] || 0) + 1;

      // Service counts
      if (lead.service_interest) {
        byService[lead.service_interest] = (byService[lead.service_interest] || 0) + 1;
      }

      // Revenue
      const val = parseFloat(lead.estimated_value) || 0;
      estimatedRevenue += val;
      if (lead.status === 'completed' || lead.status === 'booked') {
        closedRevenue += val;
      }

      // Response time (created_at → contacted_at)
      if (lead.contacted_at && lead.created_at) {
        const created = new Date(lead.created_at).getTime();
        const contacted = new Date(lead.contacted_at).getTime();
        if (contacted > created) {
          responseTimes.push((contacted - created) / 3600000); // hours
        }
      }
    }

    const totalLeads = allLeads.length;
    const completedCount = byStatus['completed'] || 0;
    const bookedCount = byStatus['booked'] || 0;
    const conversionRate = totalLeads > 0 ? (completedCount + bookedCount) / totalLeads : 0;
    const avgResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : null;

    // Top leads (most recent or highest value)
    const topLeads = allLeads.slice(0, 10).map((l: any) => ({
      name: l.name,
      email: l.email,
      service_interest: l.service_interest,
      status: l.status,
      estimated_value: l.estimated_value,
      source: l.source,
      created_at: l.created_at,
    }));

    // Open pipeline value
    const openPipelineValue = openPipeline.reduce(
      (sum: number, l: any) => sum + (parseFloat(l.estimated_value) || 0),
      0
    );

    const stats: LeadStats = {
      total: totalLeads,
      new: byStatus['new'] || 0,
      contacted: byStatus['contacted'] || 0,
      quoted: byStatus['quoted'] || 0,
      booked: bookedCount,
      completed: completedCount,
      lost: byStatus['lost'] || 0,
      bySource,
      byService,
      estimatedRevenue,
      closedRevenue,
      conversionRate,
      avgResponseTime,
      topLeads,
    };

    // Fetch report history
    const { data: history } = await supabaseServer
      .from('weekly_reports')
      .select('*')
      .order('sent_at', { ascending: false })
      .limit(10);

    return new Response(
      JSON.stringify({
        period,
        start,
        end,
        stats,
        openPipelineValue,
        openPipelineCount: openPipeline.length,
        reportHistory: history || [],
      }),
      { status: 200, headers: { 'content-type': 'application/json' } }
    );
  } catch (err) {
    console.error('Error generating report:', err);
    return new Response(JSON.stringify({ error: 'Failed to generate report' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
};
