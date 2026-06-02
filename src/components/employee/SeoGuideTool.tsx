import React, { useEffect, useMemo, useState } from 'react';

interface ScoreBreakdown {
  onPage: number;
  localSignals: number;
  contentDepth: number;
  technical: number;
  authority: number;
}

interface SeoGuideResponse {
  input: {
    businessName: string;
    serviceType: string;
    primaryCity: string;
    nearbyCities: string[];
    competitors: string[];
    budgetLevel: 'starter' | 'growth' | 'aggressive';
    goalType: 'calls' | 'form-leads' | 'maps-visibility';
  };
  score: {
    total: number;
    breakdown: ScoreBreakdown;
  };
  fastWins: string[];
  keywordClusters: Array<{ intent: string; keywords: string[] }>;
  pageBrief: {
    titleOptions: string[];
    h1: string;
    slug: string;
    metaDescription: string;
    faq: string[];
    internalLinks: string[];
  };
  localChecklist: string[];
  technicalChecklist: string[];
  contentCalendar: Array<{ week: number; topic: string; keyword: string; intent: string }>;
  roadmap: Array<{ week: string; focus: string; tasks: string[] }>;
  promptTemplates: Array<{ title: string; prompt: string }>;
  generatedAt: string;
}

interface SnapshotSummary {
  id: string;
  business_name: string;
  service_type: string;
  primary_city: string;
  score_total: number;
  created_at: string;
}

interface SnapshotRecord {
  id: string;
  payload: SeoGuideResponse;
  created_at: string;
}

const SERVICE_OPTIONS = [
  'Auto Window Tinting',
  'Residential Window Tinting',
  'Commercial Window Tinting',
  'Ceramic Tint',
];

export const SeoGuideTool = () => {
  const [businessName, setBusinessName] = useState('Color Auto Detailing');
  const [serviceType, setServiceType] = useState('Auto Window Tinting');
  const [primaryCity, setPrimaryCity] = useState('Mesa');
  const [nearbyCitiesRaw, setNearbyCitiesRaw] = useState('Gilbert, Chandler, Tempe');
  const [competitorsRaw, setCompetitorsRaw] = useState('');
  const [budgetLevel, setBudgetLevel] = useState<'starter' | 'growth' | 'aggressive'>('growth');
  const [goalType, setGoalType] = useState<'calls' | 'form-leads' | 'maps-visibility'>('calls');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<SeoGuideResponse | null>(null);
  const [history, setHistory] = useState<SnapshotSummary[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [saving, setSaving] = useState(false);
  const [historyError, setHistoryError] = useState('');
  const [activeSnapshotId, setActiveSnapshotId] = useState('');

  const nearbyCities = useMemo(
    () => nearbyCitiesRaw.split(',').map((x) => x.trim()).filter(Boolean),
    [nearbyCitiesRaw]
  );

  const competitors = useMemo(
    () => competitorsRaw.split(',').map((x) => x.trim()).filter(Boolean),
    [competitorsRaw]
  );

  const hydrateInputs = (payload: SeoGuideResponse) => {
    setBusinessName(payload.input.businessName || 'Color Auto Detailing');
    setServiceType(payload.input.serviceType || 'Auto Window Tinting');
    setPrimaryCity(payload.input.primaryCity || 'Mesa');
    setNearbyCitiesRaw((payload.input.nearbyCities || []).join(', '));
    setCompetitorsRaw((payload.input.competitors || []).join(', '));
    setBudgetLevel(payload.input.budgetLevel || 'growth');
    setGoalType(payload.input.goalType || 'calls');
  };

  const fetchHistory = async () => {
    setLoadingHistory(true);
    setHistoryError('');

    try {
      const res = await fetch('/api/employee/seo-guide/history');
      const json = await res.json();
      setHistory(Array.isArray(json.snapshots) ? json.snapshots : []);
    } catch {
      setHistoryError('Unable to load history right now.');
      setHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const saveSnapshot = async () => {
    if (!result) return;

    setSaving(true);
    setHistoryError('');

    try {
      const res = await fetch('/api/employee/seo-guide/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Save failed');
      }

      if (json?.snapshot?.id) {
        setActiveSnapshotId(json.snapshot.id);
      }

      await fetchHistory();
    } catch (err: any) {
      setHistoryError(err?.message || 'Unable to save this plan right now.');
    } finally {
      setSaving(false);
    }
  };

  const loadSnapshot = async (id: string) => {
    setHistoryError('');

    try {
      const res = await fetch(`/api/employee/seo-guide/history/${id}`);
      const json = await res.json();
      if (!res.ok || !json?.snapshot?.payload) {
        throw new Error(json.error || 'Load failed');
      }

      const snapshot = json.snapshot as SnapshotRecord;
      const payload = snapshot.payload;
      setResult(payload);
      hydrateInputs(payload);
      setActiveSnapshotId(id);
    } catch (err: any) {
      setHistoryError(err?.message || 'Unable to load selected snapshot.');
    }
  };

  const deleteSnapshot = async (id: string) => {
    setHistoryError('');

    try {
      const res = await fetch(`/api/employee/seo-guide/history/${id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Delete failed');
      }

      if (activeSnapshotId === id) {
        setActiveSnapshotId('');
      }

      setHistory((prev) => prev.filter((item) => item.id !== id));
    } catch (err: any) {
      setHistoryError(err?.message || 'Unable to delete selected snapshot.');
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const runGenerator = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/employee/seo-guide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName,
          serviceType,
          primaryCity,
          nearbyCities,
          competitors,
          budgetLevel,
          goalType,
        }),
      });

      if (!res.ok) {
        throw new Error('Request failed');
      }

      const data = (await res.json()) as SeoGuideResponse;
      setResult(data);
      setActiveSnapshotId('');
    } catch {
      setError('Unable to generate SEO guide right now. Please try again.');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const breakdownCards: Array<{ label: string; value: number; max: number }> = result
    ? [
        { label: 'On-page', value: result.score.breakdown.onPage, max: 25 },
        { label: 'Local signals', value: result.score.breakdown.localSignals, max: 30 },
        { label: 'Content depth', value: result.score.breakdown.contentDepth, max: 20 },
        { label: 'Technical', value: result.score.breakdown.technical, max: 15 },
        { label: 'Authority', value: result.score.breakdown.authority, max: 10 },
      ]
    : [];

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <label className="block">
            <span className="block text-xs font-semibold text-gray-500 mb-1">Business Name</span>
            <input
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <label className="block">
            <span className="block text-xs font-semibold text-gray-500 mb-1">Primary City</span>
            <input
              value={primaryCity}
              onChange={(e) => setPrimaryCity(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <label className="block">
            <span className="block text-xs font-semibold text-gray-500 mb-1">Service Type</span>
            <select
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              {SERVICE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="block text-xs font-semibold text-gray-500 mb-1">Goal</span>
            <select
              value={goalType}
              onChange={(e) => setGoalType(e.target.value as 'calls' | 'form-leads' | 'maps-visibility')}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="calls">Phone calls</option>
              <option value="form-leads">Form leads</option>
              <option value="maps-visibility">Maps visibility</option>
            </select>
          </label>

          <label className="block">
            <span className="block text-xs font-semibold text-gray-500 mb-1">Nearby Cities (comma separated)</span>
            <input
              value={nearbyCitiesRaw}
              onChange={(e) => setNearbyCitiesRaw(e.target.value)}
              placeholder="Gilbert, Chandler, Tempe"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <label className="block">
            <span className="block text-xs font-semibold text-gray-500 mb-1">Competitors (comma separated URLs)</span>
            <input
              value={competitorsRaw}
              onChange={(e) => setCompetitorsRaw(e.target.value)}
              placeholder="https://competitor-1.com, https://competitor-2.com"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <label className="block lg:col-span-2">
            <span className="block text-xs font-semibold text-gray-500 mb-1">Budget Level</span>
            <div className="grid grid-cols-3 gap-2">
              {(['starter', 'growth', 'aggressive'] as const).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setBudgetLevel(level)}
                  className={`rounded-lg border px-3 py-2 text-xs font-medium capitalize transition-colors ${
                    budgetLevel === level
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </label>
        </div>

        <aside className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900">History</h3>
            <button
              type="button"
              onClick={fetchHistory}
              className="text-xs font-medium text-blue-600 hover:text-blue-700"
            >
              Refresh
            </button>
          </div>

          {loadingHistory && <p className="text-xs text-gray-500">Loading snapshots...</p>}

          {!loadingHistory && history.length === 0 && (
            <p className="text-xs text-gray-500">No saved SEO plans yet.</p>
          )}

          {!loadingHistory && history.length > 0 && (
            <ul className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {history.map((item) => (
                <li key={item.id} className={`rounded-lg border p-2 ${activeSnapshotId === item.id ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-gray-50'}`}>
                  <button
                    type="button"
                    onClick={() => loadSnapshot(item.id)}
                    className="w-full text-left"
                  >
                    <p className="text-xs font-semibold text-gray-900">{item.service_type} - {item.primary_city}</p>
                    <p className="text-[11px] text-gray-600">{item.business_name}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">Score {item.score_total} | {new Date(item.created_at).toLocaleString()}</p>
                  </button>
                  <div className="mt-1.5 flex justify-end">
                    <button
                      type="button"
                      onClick={() => deleteSnapshot(item.id)}
                      className="text-[11px] text-rose-600 hover:text-rose-700"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </section>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={runGenerator}
          disabled={loading}
          className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? 'Generating...' : 'Generate SEO Guide'}
        </button>
        <button
          type="button"
          onClick={saveSnapshot}
          disabled={!result || saving}
          className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Snapshot'}
        </button>
        {error && <p className="text-sm text-rose-600">{error}</p>}
        {historyError && <p className="text-sm text-rose-600">{historyError}</p>}
      </div>

      {result && (
        <div className="space-y-6">
          <section className="bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl p-5 text-white">
            <p className="text-xs uppercase tracking-wider text-blue-100">SEO Score</p>
            <p className="text-4xl font-bold mt-1">{result.score.total}/100</p>
            <p className="text-sm text-blue-100 mt-1">
              Generated for {result.input.serviceType} in {result.input.primaryCity}
            </p>
          </section>

          <section className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {breakdownCards.map((card) => (
              <div key={card.label} className="rounded-xl border border-gray-200 bg-white p-3">
                <p className="text-xs text-gray-500">{card.label}</p>
                <p className="text-xl font-bold text-gray-900 mt-1">
                  {card.value}
                  <span className="text-xs text-gray-400">/{card.max}</span>
                </p>
              </div>
            ))}
          </section>

          <section className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Top 5 Fast Wins</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              {result.fastWins.map((item, idx) => (
                <li key={idx} className="flex gap-2">
                  <span className="text-blue-600 font-semibold">{idx + 1}.</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {result.keywordClusters.map((cluster) => (
              <div key={cluster.intent} className="bg-white border border-gray-200 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">{cluster.intent} Keywords</h3>
                <ul className="space-y-1.5 text-sm text-gray-600">
                  {cluster.keywords.map((keyword, idx) => (
                    <li key={idx}>- {keyword}</li>
                  ))}
                </ul>
              </div>
            ))}
          </section>

          <section className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900">Page Brief</h3>
            <div>
              <p className="text-xs text-gray-500">Title Options</p>
              <ul className="mt-1 space-y-1 text-sm text-gray-700">
                {result.pageBrief.titleOptions.map((title, idx) => (
                  <li key={idx}>- {title}</li>
                ))}
              </ul>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-500">H1</p>
                <p className="text-sm text-gray-800">{result.pageBrief.h1}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Slug</p>
                <p className="text-sm text-gray-800">{result.pageBrief.slug}</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500">Meta Description</p>
              <p className="text-sm text-gray-800">{result.pageBrief.metaDescription}</p>
            </div>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Local Checklist</h3>
              <ul className="space-y-1.5 text-sm text-gray-700">
                {result.localChecklist.map((item, idx) => (
                  <li key={idx}>- {item}</li>
                ))}
              </ul>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Technical Checklist</h3>
              <ul className="space-y-1.5 text-sm text-gray-700">
                {result.technicalChecklist.map((item, idx) => (
                  <li key={idx}>- {item}</li>
                ))}
              </ul>
            </div>
          </section>

          <section className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">4-Week Content Calendar</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-xs text-gray-500">
                    <th className="py-2 pr-4">Week</th>
                    <th className="py-2 pr-4">Topic</th>
                    <th className="py-2 pr-4">Primary Keyword</th>
                    <th className="py-2">Intent</th>
                  </tr>
                </thead>
                <tbody>
                  {result.contentCalendar.map((item, idx) => (
                    <tr key={idx} className="border-b border-gray-100 last:border-0">
                      <td className="py-2 pr-4 text-gray-500">{item.week}</td>
                      <td className="py-2 pr-4 text-gray-800">{item.topic}</td>
                      <td className="py-2 pr-4 text-gray-700">{item.keyword}</td>
                      <td className="py-2 text-gray-500">{item.intent}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">30-Day Roadmap</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {result.roadmap.map((item) => (
                <div key={item.week} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <p className="text-xs font-semibold text-blue-600">{item.week}</p>
                  <p className="text-sm font-medium text-gray-900 mt-0.5">{item.focus}</p>
                  <ul className="mt-2 space-y-1 text-sm text-gray-700">
                    {item.tasks.map((task, idx) => (
                      <li key={idx}>- {task}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">AI Prompt Pack</h3>
            <div className="space-y-3">
              {result.promptTemplates.map((template, idx) => (
                <div key={idx} className="rounded-lg border border-gray-200 p-3">
                  <p className="text-sm font-semibold text-gray-900">{template.title}</p>
                  <p className="text-xs text-gray-600 mt-1 whitespace-pre-wrap">{template.prompt}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
};
