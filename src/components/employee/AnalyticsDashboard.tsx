import React, { useEffect, useState } from 'react';

interface OverviewData {
  users: number;
  sessions: number;
  pageViews: number;
  avgSessionDuration: number;
  bounceRate: number;
  conversions: number;
}

interface PageData {
  path: string;
  views: number;
  users: number;
}

interface SourceData {
  channel: string;
  sessions: number;
  users: number;
}

interface DailyData {
  date: string;
  users: number;
  sessions: number;
}

interface AnalyticsData {
  demo: boolean;
  error?: string;
  period: number;
  overview: OverviewData;
  topPages: PageData[];
  trafficSources: SourceData[];
  dailyTrend: DailyData[];
}

const PERIODS = [
  { label: '7 days', value: '7' },
  { label: '14 days', value: '14' },
  { label: '28 days', value: '28' },
  { label: '90 days', value: '90' },
];

export const AnalyticsDashboard = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('28');

  const fetchData = async (p: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/employee/analytics?period=${p}`);
      const json = await res.json();
      setData(json);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(period);
    const interval = setInterval(() => fetchData(period), 300000); // 5 min refresh
    return () => clearInterval(interval);
  }, [period]);

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.round(seconds % 60);
    return `${m}m ${s}s`;
  };

  const formatPercent = (val: number) => `${(val * 100).toFixed(1)}%`;

  const formatDate = (raw: string) => {
    if (raw.length !== 8) return raw;
    const y = raw.slice(0, 4);
    const m = raw.slice(4, 6);
    const d = raw.slice(6, 8);
    return `${m}/${d}`;
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>Unable to load analytics data.</p>
      </div>
    );
  }

  const maxDailyUsers = Math.max(...(data.dailyTrend.map(d => d.users)), 1);
  const maxSourceSessions = Math.max(...(data.trafficSources.map(s => s.sessions)), 1);

  const statCards = [
    { label: 'Users', value: data.overview.users.toLocaleString(), color: 'blue', icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>
    )},
    { label: 'Sessions', value: data.overview.sessions.toLocaleString(), color: 'emerald', icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" /></svg>
    )},
    { label: 'Page Views', value: data.overview.pageViews.toLocaleString(), color: 'violet', icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
    )},
    { label: 'Avg. Duration', value: formatDuration(data.overview.avgSessionDuration), color: 'amber', icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
    )},
    { label: 'Bounce Rate', value: formatPercent(data.overview.bounceRate), color: 'rose', icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" /></svg>
    )},
    { label: 'Conversions', value: data.overview.conversions.toLocaleString(), color: 'cyan', icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
    )},
  ];

  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    violet: 'bg-violet-50 text-violet-600',
    amber: 'bg-amber-50 text-amber-600',
    rose: 'bg-rose-50 text-rose-600',
    cyan: 'bg-cyan-50 text-cyan-600',
  };

  return (
    <div className="space-y-6">
      {/* Header & Period Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          {data.demo && (
            <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
              Not configured — Set GA4 service account env vars
            </span>
          )}
          {loading && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
          )}
        </div>
        <div className="flex gap-1.5 bg-gray-100 rounded-lg p-1 border border-gray-200">
          {PERIODS.map(p => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                period === p.value
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-white'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map(card => (
          <div key={card.label} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colorMap[card.color]}`}>
                {card.icon}
              </div>
            </div>
            <p className="text-xl md:text-2xl font-bold text-gray-900">{card.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Trend */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Daily Users</h3>
          {data.dailyTrend.length > 0 ? (
            <div className="flex items-end gap-[2px] h-40">
              {data.dailyTrend.map((d, i) => {
                const height = (d.users / maxDailyUsers) * 100;
                return (
                  <div
                    key={i}
                    className="group relative flex-1 min-w-0"
                    title={`${formatDate(d.date)}: ${d.users} users, ${d.sessions} sessions`}
                  >
                    <div
                      className="bg-blue-500/60 hover:bg-blue-400/80 rounded-t transition-colors w-full"
                      style={{ height: `${Math.max(height, 2)}%` }}
                    ></div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
              No data yet
            </div>
          )}
          {data.dailyTrend.length > 0 && (
            <div className="flex justify-between mt-2 text-[10px] text-gray-400">
              <span>{formatDate(data.dailyTrend[0]?.date)}</span>
              <span>{formatDate(data.dailyTrend[data.dailyTrend.length - 1]?.date)}</span>
            </div>
          )}
        </div>

        {/* Traffic Sources */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Traffic Sources</h3>
          {data.trafficSources.length > 0 ? (
            <div className="space-y-3">
              {data.trafficSources.map((s, i) => (
                <div key={i}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-700">{s.channel}</span>
                    <span className="text-gray-500">{s.sessions} sessions</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full"
                      style={{ width: `${(s.sessions / maxSourceSessions) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
              No data yet
            </div>
          )}
        </div>
      </div>

      {/* Top Pages */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Top Pages</h3>
        {data.topPages.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left text-xs text-gray-500 font-medium pb-2 pr-4">Page</th>
                  <th className="text-right text-xs text-gray-500 font-medium pb-2 px-4">Views</th>
                  <th className="text-right text-xs text-gray-500 font-medium pb-2 pl-4">Users</th>
                </tr>
              </thead>
              <tbody>
                {data.topPages.map((page, i) => (
                  <tr key={i} className="border-b border-gray-100 last:border-0">
                    <td className="py-2.5 pr-4">
                      <span className="text-gray-700 font-mono text-xs">{page.path}</span>
                    </td>
                    <td className="py-2.5 px-4 text-right text-gray-900 font-medium">{page.views.toLocaleString()}</td>
                    <td className="py-2.5 pl-4 text-right text-gray-500">{page.users.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex items-center justify-center py-8 text-gray-400 text-sm">
            No data yet
          </div>
        )}
      </div>
    </div>
  );
};
