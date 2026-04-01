import React, { useEffect, useState, useCallback } from 'react';

interface ReportStats {
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

interface ReportHistory {
  id: string;
  period: string;
  date_range_start: string;
  date_range_end: string;
  total_leads: number;
  conversion_rate: number;
  revenue: number;
  pipeline_value: number;
  sent_to: string;
  sent_at: string;
}

interface ReportData {
  period: string;
  start: string;
  end: string;
  stats: ReportStats;
  openPipelineValue: number;
  openPipelineCount: number;
  reportHistory: ReportHistory[];
}

const STATUS_LABELS: Record<string, string> = {
  new: 'New',
  contacted: 'Contacted',
  quoted: 'Quoted',
  booked: 'Booked',
  completed: 'Completed',
  lost: 'Lost',
};

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-500',
  contacted: 'bg-cyan-500',
  quoted: 'bg-yellow-500',
  booked: 'bg-purple-500',
  completed: 'bg-green-500',
  lost: 'bg-red-500',
};

const SOURCE_LABELS: Record<string, string> = {
  google_ads: 'Google Ads',
  meta_ads: 'Meta Ads',
  website: 'Website',
  phone: 'Phone',
  walk_in: 'Walk-in',
  referral: 'Referral',
  other: 'Other',
};

const PERIODS = [
  { value: 'week', label: 'Last 7 Days' },
  { value: 'month', label: 'Last 30 Days' },
  { value: 'quarter', label: 'Last 90 Days' },
];

function formatCurrency(val: number) {
  return `$${val.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatHours(hours: number | null) {
  if (hours === null) return 'N/A';
  if (hours < 1) return `${Math.round(hours * 60)}min`;
  return `${hours.toFixed(1)}hrs`;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatShortDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export const ReportsDashboard: React.FC = () => {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('week');
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ ok: boolean; message: string } | null>(null);

  const fetchReport = useCallback(async (p: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/employee/reports?period=${p}`);
      const json = await res.json();
      setData(json);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReport(period);
  }, [period, fetchReport]);

  const handleSendReport = async () => {
    setSending(true);
    setSendResult(null);
    try {
      const token = localStorage.getItem('authToken') || '';
      const res = await fetch('/api/cron/weekly-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ period }),
      });
      const json = await res.json();
      if (json.ok) {
        setSendResult({ ok: true, message: `Report sent! (${json.totalLeads} leads included)` });
        // Refresh to get updated history
        fetchReport(period);
      } else {
        setSendResult({ ok: false, message: json.error || 'Failed to send report' });
      }
    } catch {
      setSendResult({ ok: false, message: 'Network error sending report' });
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex items-center gap-3 text-slate-400">
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading report data...
        </div>
      </div>
    );
  }

  if (!data || !data.stats) {
    return (
      <div className="text-center py-16 text-slate-400">
        <p>Unable to load report data. Make sure the database is configured.</p>
      </div>
    );
  }

  const { stats } = data;
  const maxSourceCount = Math.max(...Object.values(stats.bySource), 1);

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                period === p.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700/50 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <button
          onClick={handleSendReport}
          disabled={sending}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
        >
          {sending ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Sending...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
              Send Report Now
            </>
          )}
        </button>
      </div>

      {/* Send result */}
      {sendResult && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm ${
          sendResult.ok
            ? 'bg-green-900/30 border border-green-500/30 text-green-300'
            : 'bg-red-900/30 border border-red-500/30 text-red-300'
        }`}>
          {sendResult.ok ? (
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          )}
          {sendResult.message}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard label="Total Leads" value={String(stats.total)} sub={`${formatShortDate(data.start)} – ${formatShortDate(data.end)}`} color="blue" />
        <KPICard label="Conversion Rate" value={`${(stats.conversionRate * 100).toFixed(1)}%`} sub={`${stats.completed + stats.booked} won / ${stats.lost} lost`} color="emerald" />
        <KPICard label="Closed Revenue" value={formatCurrency(stats.closedRevenue)} sub={`${formatCurrency(stats.estimatedRevenue)} quoted`} color="amber" />
        <KPICard label="Avg Response" value={formatHours(stats.avgResponseTime)} sub={`Pipeline: ${formatCurrency(data.openPipelineValue)}`} color="purple" />
      </div>

      {/* Two Columns: Status + Sources */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Status Breakdown */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Lead Pipeline</h3>
          <div className="space-y-3">
            {(['new', 'contacted', 'quoted', 'booked', 'completed', 'lost'] as const).map((status) => {
              const count = (stats as any)[status] || 0;
              const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
              return (
                <div key={status} className="flex items-center gap-3">
                  <span className="text-xs text-slate-400 w-20">{STATUS_LABELS[status]}</span>
                  <div className="flex-1 h-2 bg-slate-700/50 rounded-full overflow-hidden">
                    <div className={`h-full ${STATUS_COLORS[status]} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs font-medium text-slate-300 w-8 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Source Breakdown */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Lead Sources</h3>
          {Object.keys(stats.bySource).length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">No leads in this period</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(stats.bySource)
                .sort(([, a], [, b]) => b - a)
                .map(([source, count]) => (
                  <div key={source} className="flex items-center gap-3">
                    <span className="text-xs text-slate-400 w-20 truncate">{SOURCE_LABELS[source] || source}</span>
                    <div className="flex-1 h-2 bg-slate-700/50 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${(count / maxSourceCount) * 100}%` }} />
                    </div>
                    <span className="text-xs font-medium text-slate-300 w-8 text-right">{count}</span>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Service Breakdown */}
      {Object.keys(stats.byService).length > 0 && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Services Requested</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {Object.entries(stats.byService)
              .sort(([, a], [, b]) => b - a)
              .map(([service, count]) => (
                <div key={service} className="flex items-center justify-between bg-slate-700/30 rounded-lg px-3 py-2">
                  <span className="text-xs text-slate-300 truncate mr-2">{service}</span>
                  <span className="text-xs font-semibold text-blue-400">{count}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Recent Leads Table */}
      {stats.topLeads.length > 0 && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Recent Leads</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-500 border-b border-slate-700/50">
                  <th className="text-left py-2 px-3 font-medium">Name</th>
                  <th className="text-left py-2 px-3 font-medium">Service</th>
                  <th className="text-left py-2 px-3 font-medium">Status</th>
                  <th className="text-left py-2 px-3 font-medium">Source</th>
                  <th className="text-right py-2 px-3 font-medium">Value</th>
                  <th className="text-right py-2 px-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {stats.topLeads.map((lead, i) => (
                  <tr key={i} className="border-b border-slate-700/30 hover:bg-slate-700/20">
                    <td className="py-2 px-3 text-slate-200">{lead.name}</td>
                    <td className="py-2 px-3 text-slate-400">{lead.service_interest || '—'}</td>
                    <td className="py-2 px-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[lead.status]}/20 text-slate-200`}>
                        {STATUS_LABELS[lead.status] || lead.status}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-slate-400">{SOURCE_LABELS[lead.source] || lead.source}</td>
                    <td className="py-2 px-3 text-right text-slate-300">{lead.estimated_value ? formatCurrency(lead.estimated_value) : '—'}</td>
                    <td className="py-2 px-3 text-right text-slate-500">{formatShortDate(lead.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Report History */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-slate-300 mb-4">Sent Report History</h3>
        {data.reportHistory.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-8">No reports sent yet. Click "Send Report Now" to email your first report.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-500 border-b border-slate-700/50">
                  <th className="text-left py-2 px-3 font-medium">Sent</th>
                  <th className="text-left py-2 px-3 font-medium">Period</th>
                  <th className="text-right py-2 px-3 font-medium">Leads</th>
                  <th className="text-right py-2 px-3 font-medium">Conversion</th>
                  <th className="text-right py-2 px-3 font-medium">Revenue</th>
                  <th className="text-right py-2 px-3 font-medium">Pipeline</th>
                  <th className="text-left py-2 px-3 font-medium">Sent To</th>
                </tr>
              </thead>
              <tbody>
                {data.reportHistory.map((r) => (
                  <tr key={r.id} className="border-b border-slate-700/30">
                    <td className="py-2 px-3 text-slate-300">{formatDate(r.sent_at)}</td>
                    <td className="py-2 px-3 text-slate-400 capitalize">{r.period}</td>
                    <td className="py-2 px-3 text-right text-slate-300">{r.total_leads}</td>
                    <td className="py-2 px-3 text-right text-slate-300">{r.conversion_rate?.toFixed(1)}%</td>
                    <td className="py-2 px-3 text-right text-slate-300">{formatCurrency(r.revenue || 0)}</td>
                    <td className="py-2 px-3 text-right text-slate-300">{formatCurrency(r.pipeline_value || 0)}</td>
                    <td className="py-2 px-3 text-slate-400 truncate max-w-[200px]">{r.sent_to}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// KPI Card sub-component
function KPICard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  const colorMap: Record<string, { border: string; iconBg: string; valueTxt: string }> = {
    blue:    { border: 'border-blue-500/30',    iconBg: 'bg-blue-500/10',    valueTxt: 'text-blue-50' },
    emerald: { border: 'border-emerald-500/30', iconBg: 'bg-emerald-500/10', valueTxt: 'text-emerald-50' },
    amber:   { border: 'border-amber-500/30',   iconBg: 'bg-amber-500/10',   valueTxt: 'text-amber-50' },
    purple:  { border: 'border-purple-500/30',  iconBg: 'bg-purple-500/10',  valueTxt: 'text-purple-50' },
  };
  const c = colorMap[color] || colorMap.blue;

  return (
    <div className={`border ${c.border} bg-slate-800/40 rounded-xl p-4`}>
      <div className="text-xs text-slate-500 font-medium mb-1">{label}</div>
      <div className={`text-2xl font-bold ${c.valueTxt}`}>{value}</div>
      <div className="text-xs text-slate-500 mt-1">{sub}</div>
    </div>
  );
}
