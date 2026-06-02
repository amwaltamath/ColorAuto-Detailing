import { useState, useEffect, useCallback } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────────
interface Vehicle {
  id: string;
  year?: string;
  make: string;
  model: string;
  color?: string;
  vin?: string;
  license_plate?: string;
}

interface JobPhoto {
  id: string;
  photo_url: string;
  photo_type: 'before' | 'after' | 'progress';
  caption?: string;
}

interface InvoiceSummary {
  id: string;
  invoice_number: string;
  status: string;
  total: number;
}

interface Job {
  id: string;
  service_type: string;
  status: string;
  scheduled_date?: string;
  started_at?: string;
  completed_at?: string;
  notes?: string;
  crm_vehicles?: Vehicle;
  crm_job_photos?: JobPhoto[];
  crm_invoices?: InvoiceSummary[];
}

interface Invoice {
  id: string;
  invoice_number: string;
  status: string;
  subtotal: number;
  tax: number;
  total: number;
  due_date?: string;
  paid_at?: string;
  created_at: string;
  crm_jobs?: { id: string; service_type: string; scheduled_date?: string };
}

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────
const JOB_STATUS_CONFIG: Record<string, { label: string; color: string; step: number }> = {
  scheduled: { label: 'Scheduled', color: 'text-blue-700 bg-blue-50 border-blue-200', step: 1 },
  in_progress: { label: 'In Progress', color: 'text-yellow-700 bg-yellow-50 border-yellow-200', step: 2 },
  completed: { label: 'Completed', color: 'text-green-700 bg-green-50 border-green-200', step: 3 },
  cancelled: { label: 'Cancelled', color: 'text-red-700 bg-red-50 border-red-200', step: 0 },
  no_show: { label: 'No Show', color: 'text-gray-600 bg-gray-50 border-gray-200', step: 0 },
};

const INVOICE_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  draft: { label: 'Draft', color: 'text-gray-600 bg-gray-100' },
  sent: { label: 'Sent', color: 'text-blue-700 bg-blue-100' },
  paid: { label: 'Paid', color: 'text-green-700 bg-green-100' },
  overdue: { label: 'Overdue', color: 'text-red-700 bg-red-100' },
  void: { label: 'Void', color: 'text-gray-400 bg-gray-50' },
};

function fmtDate(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function fmtCurrency(n: number) {
  return '$' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function getAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('authToken');
  const userId = localStorage.getItem('userId');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (userId) headers['x-user-id'] = userId;
  return headers;
}

// ── Job Status Tracker ─────────────────────────────────────────────────────────
function JobStatusTracker({ status }: { status: string }) {
  const steps = [
    { key: 'scheduled', label: 'Scheduled' },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'completed', label: 'Done' },
  ];
  const cfg = JOB_STATUS_CONFIG[status];
  const currentStep = cfg?.step ?? 0;
  const isCancelled = status === 'cancelled' || status === 'no_show';

  if (isCancelled) {
    return (
      <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${cfg.color}`}>{cfg.label}</span>
    );
  }

  return (
    <div className="flex items-center gap-1">
      {steps.map((step, i) => {
        const done = currentStep > step.key ? true : false;
        const active = currentStep === (i + 1);
        return (
          <div key={step.key} className="flex items-center gap-1">
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
              active ? 'bg-blue-600 text-white border-blue-600' :
              currentStep > i + 1 ? 'bg-green-50 text-green-700 border-green-200' :
              'bg-gray-50 text-gray-400 border-gray-200'
            }`}>
              {currentStep > i + 1 ? (
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
              ) : null}
              {step.label}
            </div>
            {i < steps.length - 1 && (
              <svg className={`w-3 h-3 ${currentStep > i + 1 ? 'text-green-400' : 'text-gray-200'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Profile Tab ───────────────────────────────────────────────────────────────
function ProfileTab() {
  const [profile, setProfile] = useState<Partial<Profile>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/customer/profile', { headers: getAuthHeaders() });
        const json = await res.json();
        if (json.profile) setProfile(json.profile);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/customer/profile', {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(profile),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error || 'Failed to save'); return; }
      setProfile(json.profile);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-16"><div className="cd-spinner" /></div>;

  const field = (key: keyof Profile, label: string, type = 'text', placeholder = '') => (
    <div>
      <label className="cd-label">{label}</label>
      <input
        className="cd-input"
        type={type}
        placeholder={placeholder}
        value={(profile[key] as string) || ''}
        onChange={e => setProfile(p => ({ ...p, [key]: e.target.value }))}
      />
    </div>
  );

  return (
    <form onSubmit={handleSave} className="max-w-lg space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {field('first_name', 'First Name', 'text', 'John')}
        {field('last_name', 'Last Name', 'text', 'Smith')}
      </div>
      {field('email', 'Email', 'email', 'you@example.com')}
      {field('phone', 'Phone', 'tel', '(480) 555-0100')}
      {field('address', 'Address', 'text', '123 Main St')}
      <div className="grid grid-cols-3 gap-4">
        {field('city', 'City', 'text', 'Scottsdale')}
        {field('state', 'State', 'text', 'AZ')}
        {field('zip', 'ZIP', 'text', '85251')}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={saving} className="cd-btn-primary">
        {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save Profile'}
      </button>
    </form>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
type Tab = 'overview' | 'history' | 'vehicles' | 'invoices' | 'profile';

export function CustomerDashboard() {
  const [tab, setTab] = useState<Tab>('overview');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<JobPhoto | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [jobsRes, vehiclesRes, invoicesRes] = await Promise.all([
        fetch('/api/customer/jobs', { headers: getAuthHeaders() }),
        fetch('/api/customer/vehicles', { headers: getAuthHeaders() }),
        fetch('/api/customer/invoices', { headers: getAuthHeaders() }),
      ]);
      const [jobsJson, vehiclesJson, invoicesJson] = await Promise.all([
        jobsRes.json(), vehiclesRes.json(), invoicesRes.json(),
      ]);
      setJobs(jobsJson.jobs || []);
      setVehicles(vehiclesJson.vehicles || []);
      setInvoices(invoicesJson.invoices || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const activeJobs = jobs.filter(j => j.status === 'scheduled' || j.status === 'in_progress');
  const completedJobs = jobs.filter(j => j.status === 'completed');
  const unpaidInvoices = invoices.filter(i => i.status === 'sent' || i.status === 'overdue');

  const tabs: { key: Tab; label: string; badge?: number }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'history', label: 'History', badge: completedJobs.length || undefined },
    { key: 'vehicles', label: 'My Vehicles', badge: vehicles.length || undefined },
    { key: 'invoices', label: 'Invoices', badge: unpaidInvoices.length || undefined },
    { key: 'profile', label: 'Profile' },
  ];

  return (
    <div className="bg-gray-50">
      <style>{`
        .cd-label { display:block; font-size:.75rem; font-weight:600; color:#6b7280; text-transform:uppercase; letter-spacing:.05em; margin-bottom:.25rem; }
        .cd-input { width:100%; border:1px solid #e5e7eb; border-radius:.5rem; padding:.5rem .75rem; font-size:.875rem; color:#111827; background:#fff; outline:none; }
        .cd-input:focus { border-color:#3b82f6; box-shadow:0 0 0 2px rgba(59,130,246,.15); }
        .cd-btn-primary { background:#2563eb; color:#fff; border-radius:.5rem; padding:.5rem 1.25rem; font-size:.875rem; font-weight:600; cursor:pointer; border:none; transition:background .15s; }
        .cd-btn-primary:hover { background:#1d4ed8; }
        .cd-btn-primary:disabled { opacity:.5; cursor:not-allowed; }
        .cd-spinner { width:2rem; height:2rem; border:3px solid #e5e7eb; border-top-color:#3b82f6; border-radius:50%; animation:cd-spin .7s linear infinite; }
        @keyframes cd-spin { to { transform:rotate(360deg); } }
      `}</style>

      {/* Tab bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4">
          <nav className="flex gap-1 overflow-x-auto">
            {tabs.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                  tab === t.key ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {t.label}
                {t.badge ? (
                  <span className={`text-xs rounded-full px-1.5 py-0.5 min-w-[1.25rem] text-center ${
                    tab === t.key ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {t.badge}
                  </span>
                ) : null}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex justify-center py-16"><div className="cd-spinner" /></div>
        ) : (
          <>
            {/* ── Overview ── */}
            {tab === 'overview' && (
              <div className="space-y-5">
                {/* Summary cards */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                    <p className="text-2xl font-bold text-gray-900">{activeJobs.length}</p>
                    <p className="text-sm text-gray-500 mt-0.5">Active Jobs</p>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                    <p className="text-2xl font-bold text-gray-900">{completedJobs.length}</p>
                    <p className="text-sm text-gray-500 mt-0.5">Completed</p>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                    <p className="text-2xl font-bold text-gray-900">{vehicles.length}</p>
                    <p className="text-sm text-gray-500 mt-0.5">Vehicles</p>
                  </div>
                </div>

                {/* Active jobs */}
                {activeJobs.length > 0 ? (
                  <div>
                    <h2 className="text-base font-semibold text-gray-800 mb-3">Active Services</h2>
                    <div className="space-y-4">
                      {activeJobs.map(job => (
                        <div key={job.id} className="bg-white rounded-xl border border-gray-200 p-5">
                          <div className="flex justify-between items-start gap-4 mb-4">
                            <div>
                              <p className="font-semibold text-gray-900 text-lg">{job.service_type}</p>
                              {job.crm_vehicles && (
                                <p className="text-sm text-gray-500">{job.crm_vehicles.year} {job.crm_vehicles.make} {job.crm_vehicles.model} {job.crm_vehicles.color ? `· ${job.crm_vehicles.color}` : ''}</p>
                              )}
                              {job.scheduled_date && (
                                <p className="text-sm text-gray-400 mt-0.5">Scheduled: {fmtDate(job.scheduled_date)}</p>
                              )}
                            </div>
                          </div>
                          <JobStatusTracker status={job.status} />
                          {job.notes && (
                            <div className="mt-3 bg-blue-50 rounded-lg px-4 py-3">
                              <p className="text-sm text-blue-800">{job.notes}</p>
                            </div>
                          )}
                          {/* Photos */}
                          {job.crm_job_photos && job.crm_job_photos.length > 0 && (
                            <div className="mt-4">
                              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-2">Photos</p>
                              <div className="flex gap-2 overflow-x-auto">
                                {job.crm_job_photos.map(photo => (
                                  <button key={photo.id} onClick={() => setSelectedPhoto(photo)} className="flex-shrink-0">
                                    <img src={photo.photo_url} alt={photo.caption || photo.photo_type} className="w-20 h-20 object-cover rounded-lg border border-gray-200 hover:opacity-90 transition-opacity" />
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-xl border border-dashed border-gray-200 p-10 text-center">
                    <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
                      <svg className="w-7 h-7 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                      </svg>
                    </div>
                    <p className="text-gray-600 font-medium mb-1">No active services</p>
                    <p className="text-sm text-gray-400">Book a service to get started.</p>
                    <a href="/contact" className="inline-block mt-4 bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">Book Now</a>
                  </div>
                )}

                {/* Unpaid invoices notice */}
                {unpaidInvoices.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
                    <svg className="w-5 h-5 text-amber-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-amber-800">You have {unpaidInvoices.length} outstanding invoice{unpaidInvoices.length !== 1 ? 's' : ''}</p>
                      <button onClick={() => setTab('invoices')} className="text-xs text-amber-700 underline mt-0.5">View invoices →</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── History ── */}
            {tab === 'history' && (
              <div>
                <h2 className="text-base font-semibold text-gray-800 mb-4">Service History</h2>
                {completedJobs.length === 0 ? (
                  <div className="text-center py-16 text-gray-400">No completed services yet.</div>
                ) : (
                  <div className="space-y-3">
                    {completedJobs.map(job => (
                      <div key={job.id} className="bg-white rounded-xl border border-gray-200 p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold text-gray-900">{job.service_type}</p>
                            {job.crm_vehicles && (
                              <p className="text-sm text-gray-500">{job.crm_vehicles.year} {job.crm_vehicles.make} {job.crm_vehicles.model}</p>
                            )}
                            {job.completed_at && <p className="text-xs text-gray-400 mt-0.5">Completed {fmtDate(job.completed_at)}</p>}
                          </div>
                          <span className="text-xs font-medium px-2.5 py-1 rounded-full border bg-green-50 text-green-700 border-green-200">Completed</span>
                        </div>
                        {/* After photos */}
                        {job.crm_job_photos && job.crm_job_photos.filter(p => p.photo_type === 'after').length > 0 && (
                          <div className="mt-3 flex gap-2 overflow-x-auto">
                            {job.crm_job_photos.filter(p => p.photo_type === 'after').map(photo => (
                              <button key={photo.id} onClick={() => setSelectedPhoto(photo)}>
                                <img src={photo.photo_url} alt="After" className="w-16 h-16 object-cover rounded-lg border hover:opacity-90 transition-opacity" />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Vehicles ── */}
            {tab === 'vehicles' && (
              <div>
                <h2 className="text-base font-semibold text-gray-800 mb-4">My Vehicles</h2>
                {vehicles.length === 0 ? (
                  <div className="text-center py-16 text-gray-400">
                    <p className="text-base font-medium text-gray-500 mb-1">No vehicles on file</p>
                    <p className="text-sm">Your vehicles will appear here after your first service.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {vehicles.map(v => (
                      <div key={v.id} className="bg-white rounded-xl border border-gray-200 p-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{v.year} {v.make} {v.model}</p>
                            {v.color && <p className="text-sm text-gray-500">{v.color}</p>}
                          </div>
                        </div>
                        {(v.vin || v.license_plate) && (
                          <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-400 space-y-0.5">
                            {v.vin && <p className="font-mono">VIN: {v.vin}</p>}
                            {v.license_plate && <p>Plate: {v.license_plate}</p>}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Invoices ── */}
            {tab === 'invoices' && (
              <div>
                <h2 className="text-base font-semibold text-gray-800 mb-4">Invoices</h2>
                {invoices.length === 0 ? (
                  <div className="text-center py-16 text-gray-400">No invoices yet.</div>
                ) : (
                  <div className="space-y-3">
                    {invoices.map(inv => {
                      const s = INVOICE_STATUS_CONFIG[inv.status] || INVOICE_STATUS_CONFIG.draft;
                      return (
                        <div key={inv.id} className="bg-white rounded-xl border border-gray-200 p-5">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-mono text-sm text-gray-500">{inv.invoice_number}</p>
                              <p className="font-semibold text-gray-900 text-lg mt-0.5">{fmtCurrency(inv.total)}</p>
                              {inv.crm_jobs && <p className="text-sm text-gray-500 mt-0.5">{inv.crm_jobs.service_type}</p>}
                            </div>
                            <div className="text-right">
                              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${s.color}`}>{s.label}</span>
                              {inv.due_date && inv.status !== 'paid' && (
                                <p className="text-xs text-gray-400 mt-1.5">Due {fmtDate(inv.due_date)}</p>
                              )}
                              {inv.paid_at && (
                                <p className="text-xs text-green-600 mt-1.5">Paid {fmtDate(inv.paid_at)}</p>
                              )}
                            </div>
                          </div>
                          {inv.subtotal !== inv.total && (
                            <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500 flex justify-between">
                              <span>Subtotal: {fmtCurrency(inv.subtotal)}</span>
                              <span>Tax: {fmtCurrency(inv.tax)}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── Profile ── */}
            {tab === 'profile' && (
              <div>
                <h2 className="text-base font-semibold text-gray-800 mb-4">Profile</h2>
                <ProfileTab />
              </div>
            )}
          </>
        )}
      </div>

      {/* Lightbox */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setSelectedPhoto(null)}>
          <div className="relative max-w-2xl w-full" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedPhoto(null)} className="absolute -top-10 right-0 text-white/80 hover:text-white">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <img src={selectedPhoto.photo_url} alt={selectedPhoto.caption || selectedPhoto.photo_type} className="w-full rounded-xl max-h-[80vh] object-contain" />
            {selectedPhoto.caption && <p className="text-white/80 text-sm text-center mt-3">{selectedPhoto.caption}</p>}
            <p className="text-white/40 text-xs text-center mt-1 capitalize">{selectedPhoto.photo_type} photo</p>
          </div>
        </div>
      )}
    </div>
  );
}
