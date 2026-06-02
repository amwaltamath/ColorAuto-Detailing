import { useState, useEffect, useCallback } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────────
interface Vehicle {
  id: string;
  year?: string;
  make: string;
  model: string;
  trim?: string;
  color?: string;
  vin?: string;
  license_plate?: string;
}

interface Job {
  id: string;
  service_type: string;
  status: string;
  scheduled_date?: string;
  started_at?: string;
  completed_at?: string;
  notes?: string;
  internal_notes?: string;
  crm_vehicles?: Vehicle;
  crm_job_photos?: { id: string; photo_url: string; photo_type: string; caption?: string }[];
  crm_invoices?: { id: string; invoice_number: string; status: string; total: number }[];
}

interface CustomerNote {
  id: string;
  note: string;
  created_by: string;
  created_at: string;
}

interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  source: string;
  tags: string[];
  created_at: string;
  crm_vehicles?: Vehicle[];
  crm_jobs?: Job[];
  crm_customer_notes?: CustomerNote[];
}

interface Invoice {
  id: string;
  invoice_number: string;
  status: string;
  total: number;
  subtotal: number;
  tax: number;
  due_date?: string;
  paid_at?: string;
  created_at: string;
  crm_customers?: { id: string; first_name: string; last_name: string };
  crm_jobs?: { id: string; service_type: string };
}

// ── Constants ─────────────────────────────────────────────────────────────────
const JOB_STATUSES = [
  { value: 'scheduled', label: 'Scheduled', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  { value: 'completed', label: 'Completed', color: 'bg-green-100 text-green-800 border-green-200' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800 border-red-200' },
  { value: 'no_show', label: 'No Show', color: 'bg-gray-100 text-gray-600 border-gray-200' },
];

const INVOICE_STATUSES = [
  { value: 'draft', label: 'Draft', color: 'bg-gray-100 text-gray-700' },
  { value: 'sent', label: 'Sent', color: 'bg-blue-100 text-blue-700' },
  { value: 'paid', label: 'Paid', color: 'bg-green-100 text-green-700' },
  { value: 'overdue', label: 'Overdue', color: 'bg-red-100 text-red-700' },
  { value: 'void', label: 'Void', color: 'bg-gray-100 text-gray-500' },
];

const SERVICE_TYPES = [
  'Full Detail', 'Exterior Detail', 'Interior Detail', 'Paint Correction',
  'Ceramic Coating', 'Window Tinting', 'PPF – Full Front', 'PPF – Full Vehicle',
  'Color PPF', 'Wash & Wax', 'Maintenance Detail', 'Other',
];

function getJobStatus(status: string) {
  return JOB_STATUSES.find(s => s.value === status) || JOB_STATUSES[0];
}

function getInvoiceStatus(status: string) {
  return INVOICE_STATUSES.find(s => s.value === status) || INVOICE_STATUSES[0];
}

function fmtDate(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function fmtCurrency(n: number) {
  return '$' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// ── Subcomponents ─────────────────────────────────────────────────────────────

function NewCustomerForm({ onSave, onCancel }: { onSave: (c: Customer) => void; onCancel: () => void }) {
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', phone: '', city: '', state: '', source: 'website' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/crm/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error || 'Failed to create customer'); return; }
      onSave(json.customer);
    } catch {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="crm-label">First Name *</label>
          <input className="crm-input" value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} required />
        </div>
        <div>
          <label className="crm-label">Last Name *</label>
          <input className="crm-input" value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} required />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="crm-label">Email</label>
          <input className="crm-input" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
        </div>
        <div>
          <label className="crm-label">Phone</label>
          <input className="crm-input" type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="crm-label">City</label>
          <input className="crm-input" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
        </div>
        <div>
          <label className="crm-label">Source</label>
          <select className="crm-input" value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))}>
            {['website','phone','walk_in','referral','google_ads','meta_ads','other'].map(s => (
              <option key={s} value={s}>{s.replace('_', ' ')}</option>
            ))}
          </select>
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={saving} className="crm-btn-primary">
          {saving ? 'Saving…' : 'Create Customer'}
        </button>
        <button type="button" onClick={onCancel} className="crm-btn-secondary">Cancel</button>
      </div>
    </form>
  );
}

function NewJobForm({ customers, onSave, onCancel, preselectedCustomer }: {
  customers: Customer[];
  onSave: (j: Job) => void;
  onCancel: () => void;
  preselectedCustomer?: Customer;
}) {
  const [form, setForm] = useState({
    customer_id: preselectedCustomer?.id || '',
    vehicle_id: '',
    service_type: SERVICE_TYPES[0],
    status: 'scheduled',
    scheduled_date: '',
    notes: '',
    internal_notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const selectedCustomer = customers.find(c => c.id === form.customer_id) || preselectedCustomer;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/crm/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, scheduled_date: form.scheduled_date || undefined }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error || 'Failed to create job'); return; }
      onSave(json.job);
    } catch {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="crm-label">Customer *</label>
        {preselectedCustomer ? (
          <p className="crm-input bg-gray-50 text-gray-700">{preselectedCustomer.first_name} {preselectedCustomer.last_name}</p>
        ) : (
          <select className="crm-input" value={form.customer_id} onChange={e => setForm(f => ({ ...f, customer_id: e.target.value, vehicle_id: '' }))} required>
            <option value="">Select customer…</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>
            ))}
          </select>
        )}
      </div>
      {selectedCustomer?.crm_vehicles && selectedCustomer.crm_vehicles.length > 0 && (
        <div>
          <label className="crm-label">Vehicle</label>
          <select className="crm-input" value={form.vehicle_id} onChange={e => setForm(f => ({ ...f, vehicle_id: e.target.value }))}>
            <option value="">No vehicle selected</option>
            {selectedCustomer.crm_vehicles.map(v => (
              <option key={v.id} value={v.id}>{v.year} {v.make} {v.model} {v.color ? `(${v.color})` : ''}</option>
            ))}
          </select>
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="crm-label">Service Type *</label>
          <select className="crm-input" value={form.service_type} onChange={e => setForm(f => ({ ...f, service_type: e.target.value }))}>
            {SERVICE_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="crm-label">Status</label>
          <select className="crm-input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
            {JOB_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="crm-label">Scheduled Date</label>
        <input className="crm-input" type="datetime-local" value={form.scheduled_date} onChange={e => setForm(f => ({ ...f, scheduled_date: e.target.value }))} />
      </div>
      <div>
        <label className="crm-label">Notes (visible to customer)</label>
        <textarea className="crm-input" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
      </div>
      <div>
        <label className="crm-label">Internal Notes</label>
        <textarea className="crm-input" rows={2} value={form.internal_notes} onChange={e => setForm(f => ({ ...f, internal_notes: e.target.value }))} />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={saving} className="crm-btn-primary">
          {saving ? 'Saving…' : 'Create Job'}
        </button>
        <button type="button" onClick={onCancel} className="crm-btn-secondary">Cancel</button>
      </div>
    </form>
  );
}

function CustomerDetail({ customerId, onBack, allCustomers }: { customerId: string; onBack: () => void; allCustomers: Customer[] }) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [subTab, setSubTab] = useState<'jobs' | 'vehicles' | 'notes'>('jobs');
  const [newNote, setNewNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [showNewJob, setShowNewJob] = useState(false);
  const [showNewVehicle, setShowNewVehicle] = useState(false);
  const [vehicleForm, setVehicleForm] = useState({ year: '', make: '', model: '', color: '', vin: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/crm/customers/${customerId}`);
      const json = await res.json();
      if (res.ok) setCustomer(json.customer);
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => { load(); }, [load]);

  const handleStatusChange = async (jobId: string, status: string) => {
    await fetch(`/api/crm/jobs/${jobId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    load();
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    setAddingNote(true);
    const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') || 'employee' : 'employee';
    await fetch(`/api/crm/customers/${customerId}?action=add_note`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note: newNote, created_by: userId }),
    });
    setNewNote('');
    setAddingNote(false);
    load();
  };

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch(`/api/crm/customers/${customerId}?action=add_vehicle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(vehicleForm),
    });
    setVehicleForm({ year: '', make: '', model: '', color: '', vin: '' });
    setShowNewVehicle(false);
    load();
  };

  if (loading) return <div className="flex items-center justify-center py-16"><div className="crm-spinner" /></div>;
  if (!customer) return <div className="text-center py-16 text-gray-500">Customer not found.</div>;

  const fullName = `${customer.first_name} ${customer.last_name}`;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="crm-btn-ghost">
          <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Customers
        </button>
        <span className="text-gray-300">/</span>
        <h2 className="text-lg font-semibold text-gray-900">{fullName}</h2>
      </div>

      {/* Customer info card */}
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-100 rounded-xl p-5 mb-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">Email</p>
          <p className="font-medium text-gray-800">{customer.email || '—'}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">Phone</p>
          <p className="font-medium text-gray-800">{customer.phone || '—'}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">City</p>
          <p className="font-medium text-gray-800">{customer.city ? `${customer.city}, ${customer.state || ''}` : '—'}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">Source</p>
          <p className="font-medium text-gray-800 capitalize">{customer.source?.replace('_', ' ')}</p>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-2 mb-5 border-b border-gray-200">
        {(['jobs', 'vehicles', 'notes'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setSubTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize ${
              subTab === tab ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab}
            {tab === 'jobs' && customer.crm_jobs && (
              <span className="ml-1.5 text-xs bg-gray-100 text-gray-600 rounded-full px-1.5 py-0.5">{customer.crm_jobs.length}</span>
            )}
            {tab === 'vehicles' && customer.crm_vehicles && (
              <span className="ml-1.5 text-xs bg-gray-100 text-gray-600 rounded-full px-1.5 py-0.5">{customer.crm_vehicles.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Jobs tab */}
      {subTab === 'jobs' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium text-gray-700">Service Jobs</h3>
            <button onClick={() => setShowNewJob(true)} className="crm-btn-primary text-sm">+ New Job</button>
          </div>
          {showNewJob && (
            <div className="border border-gray-200 rounded-xl p-5 mb-5 bg-gray-50">
              <h4 className="font-medium text-gray-700 mb-4">New Job for {fullName}</h4>
              <NewJobForm
                customers={allCustomers}
                preselectedCustomer={customer}
                onSave={() => { setShowNewJob(false); load(); }}
                onCancel={() => setShowNewJob(false)}
              />
            </div>
          )}
          {!customer.crm_jobs?.length && !showNewJob && (
            <p className="text-center text-gray-400 py-10 text-sm">No jobs yet. Create the first one.</p>
          )}
          <div className="space-y-3">
            {customer.crm_jobs?.map(job => {
              const s = getJobStatus(job.status);
              return (
                <div key={job.id} className="border border-gray-200 rounded-xl p-4 bg-white hover:border-blue-200 transition-colors">
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <p className="font-semibold text-gray-900">{job.service_type}</p>
                      {job.crm_vehicles && (
                        <p className="text-sm text-gray-500">{job.crm_vehicles.year} {job.crm_vehicles.make} {job.crm_vehicles.model}</p>
                      )}
                      {job.scheduled_date && (
                        <p className="text-xs text-gray-400 mt-0.5">{fmtDate(job.scheduled_date)}</p>
                      )}
                      {job.notes && <p className="text-sm text-gray-600 mt-1 italic">"{job.notes}"</p>}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${s.color}`}>{s.label}</span>
                      <select
                        value={job.status}
                        onChange={e => handleStatusChange(job.id, e.target.value)}
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1 text-gray-600 bg-white"
                      >
                        {JOB_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                    </div>
                  </div>
                  {job.crm_job_photos && job.crm_job_photos.length > 0 && (
                    <div className="mt-3 flex gap-2 overflow-x-auto">
                      {job.crm_job_photos.map(photo => (
                        <img key={photo.id} src={photo.photo_url} alt={photo.caption || photo.photo_type} className="w-20 h-20 object-cover rounded-lg border" />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Vehicles tab */}
      {subTab === 'vehicles' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium text-gray-700">Vehicles</h3>
            <button onClick={() => setShowNewVehicle(v => !v)} className="crm-btn-primary text-sm">+ Add Vehicle</button>
          </div>
          {showNewVehicle && (
            <form onSubmit={handleAddVehicle} className="border border-gray-200 rounded-xl p-5 mb-5 bg-gray-50 space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="crm-label">Year</label>
                  <input className="crm-input" value={vehicleForm.year} onChange={e => setVehicleForm(f => ({ ...f, year: e.target.value }))} placeholder="2023" />
                </div>
                <div>
                  <label className="crm-label">Make *</label>
                  <input className="crm-input" value={vehicleForm.make} onChange={e => setVehicleForm(f => ({ ...f, make: e.target.value }))} required placeholder="Toyota" />
                </div>
                <div>
                  <label className="crm-label">Model *</label>
                  <input className="crm-input" value={vehicleForm.model} onChange={e => setVehicleForm(f => ({ ...f, model: e.target.value }))} required placeholder="Camry" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="crm-label">Color</label>
                  <input className="crm-input" value={vehicleForm.color} onChange={e => setVehicleForm(f => ({ ...f, color: e.target.value }))} placeholder="Midnight Black" />
                </div>
                <div>
                  <label className="crm-label">VIN</label>
                  <input className="crm-input" value={vehicleForm.vin} onChange={e => setVehicleForm(f => ({ ...f, vin: e.target.value }))} />
                </div>
              </div>
              <div className="flex gap-3">
                <button type="submit" className="crm-btn-primary text-sm">Save Vehicle</button>
                <button type="button" onClick={() => setShowNewVehicle(false)} className="crm-btn-secondary text-sm">Cancel</button>
              </div>
            </form>
          )}
          {!customer.crm_vehicles?.length && !showNewVehicle && (
            <p className="text-center text-gray-400 py-10 text-sm">No vehicles on record.</p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {customer.crm_vehicles?.map(v => (
              <div key={v.id} className="border border-gray-200 rounded-xl p-4 bg-white">
                <p className="font-semibold text-gray-900">{v.year} {v.make} {v.model}</p>
                {v.color && <p className="text-sm text-gray-500">{v.color}</p>}
                {v.vin && <p className="text-xs text-gray-400 font-mono mt-1">VIN: {v.vin}</p>}
                {v.license_plate && <p className="text-xs text-gray-400">Plate: {v.license_plate}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes tab */}
      {subTab === 'notes' && (
        <div>
          <h3 className="font-medium text-gray-700 mb-4">Internal Notes</h3>
          <div className="flex gap-2 mb-5">
            <input
              className="crm-input flex-1"
              placeholder="Add a note…"
              value={newNote}
              onChange={e => setNewNote(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddNote()}
            />
            <button onClick={handleAddNote} disabled={addingNote || !newNote.trim()} className="crm-btn-primary text-sm">
              {addingNote ? '…' : 'Add'}
            </button>
          </div>
          {!customer.crm_customer_notes?.length && (
            <p className="text-center text-gray-400 py-10 text-sm">No notes yet.</p>
          )}
          <div className="space-y-3">
            {customer.crm_customer_notes?.slice().reverse().map(note => (
              <div key={note.id} className="border-l-4 border-blue-200 pl-4 py-2">
                <p className="text-sm text-gray-800">{note.note}</p>
                <p className="text-xs text-gray-400 mt-1">{fmtDate(note.created_at)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
type CRMView = 'customers' | 'customer_detail' | 'jobs' | 'invoices' | 'new_customer' | 'new_job';

export function CRMManager() {
  const [view, setView] = useState<CRMView>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('activeCrmView');
      if (stored && ['customers', 'jobs', 'invoices'].includes(stored)) return stored as CRMView;
    }
    return 'customers';
  });
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [jobFilter, setJobFilter] = useState('');
  const [invoiceFilter, setInvoiceFilter] = useState('');

  const loadCustomers = useCallback(async (q = '') => {
    setLoading(true);
    try {
      const res = await fetch(`/api/crm/customers?search=${encodeURIComponent(q)}`);
      const json = await res.json();
      setCustomers(json.customers || []);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadJobs = useCallback(async (status = '') => {
    setLoading(true);
    try {
      const res = await fetch(`/api/crm/jobs${status ? `?status=${status}` : ''}`);
      const json = await res.json();
      setJobs(json.jobs || []);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadInvoices = useCallback(async (status = '') => {
    setLoading(true);
    try {
      const res = await fetch(`/api/crm/invoices${status ? `?status=${status}` : ''}`);
      const json = await res.json();
      setInvoices(json.invoices || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadCustomers(); }, [loadCustomers]);

  useEffect(() => {
    if (view === 'jobs') loadJobs(jobFilter);
  }, [view, jobFilter, loadJobs]);

  useEffect(() => {
    if (view === 'invoices') loadInvoices(invoiceFilter);
  }, [view, invoiceFilter, loadInvoices]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { if (view === 'customers') loadCustomers(search); }, 350);
    return () => clearTimeout(t);
  }, [search, view, loadCustomers]);

  // Persist top-level CRM view to localStorage so sidebar stays in sync
  useEffect(() => {
    if (typeof window !== 'undefined' && ['customers', 'jobs', 'invoices'].includes(view)) {
      localStorage.setItem('activeCrmView', view);
    }
  }, [view]);

  // Listen for sidebar navigation events (crm:navigate dispatched by EmployeeLayout)
  useEffect(() => {
    const handleNavigate = (e: Event) => {
      const v = (e as CustomEvent<{ view: string }>).detail.view as CRMView;
      if (['customers', 'jobs', 'invoices'].includes(v)) setView(v);
    };
    window.addEventListener('crm:navigate', handleNavigate);
    return () => window.removeEventListener('crm:navigate', handleNavigate);
  }, []);

  const handleJobStatusChange = async (jobId: string, status: string) => {
    await fetch(`/api/crm/jobs/${jobId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    loadJobs(jobFilter);
  };

  const handleInvoiceStatusChange = async (invoiceId: string, status: string) => {
    await fetch(`/api/crm/invoices/${invoiceId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    loadInvoices(invoiceFilter);
  };

  // ── Top nav ──────────────────────────────────────────────────────────────────
  const topNavItems: { key: CRMView; label: string }[] = [
    { key: 'customers', label: 'Customers' },
    { key: 'jobs', label: 'Jobs' },
    { key: 'invoices', label: 'Invoices' },
  ];

  return (
    <div className="crm-shell">
      <style>{`
        .crm-shell { width: 100%; }
        .crm-scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .crm-scrollbar-hide::-webkit-scrollbar { display: none; }
        .crm-label { display: block; font-size: .75rem; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: .05em; margin-bottom: .25rem; }
        .crm-input { width: 100%; border: 1px solid #e5e7eb; border-radius: .5rem; padding: .5rem .75rem; font-size: .875rem; color: #111827; background: #fff; outline: none; transition: border-color .15s; }
        .crm-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59,130,246,.15); }
        .crm-btn-primary { background: #2563eb; color: #fff; border-radius: .5rem; padding: .45rem 1rem; font-size: .875rem; font-weight: 600; cursor: pointer; transition: background .15s; border: none; display: inline-flex; align-items: center; }
        .crm-btn-primary:hover { background: #1d4ed8; }
        .crm-btn-primary:disabled { opacity: .5; cursor: not-allowed; }
        .crm-btn-secondary { background: #fff; color: #374151; border: 1px solid #e5e7eb; border-radius: .5rem; padding: .45rem 1rem; font-size: .875rem; font-weight: 500; cursor: pointer; transition: background .15s; }
        .crm-btn-secondary:hover { background: #f9fafb; }
        .crm-btn-ghost { background: none; border: none; color: #6b7280; font-size: .875rem; cursor: pointer; display: inline-flex; align-items: center; padding: .25rem .5rem; border-radius: .375rem; }
        .crm-btn-ghost:hover { background: #f3f4f6; color: #111827; }
        .crm-spinner { width: 2rem; height: 2rem; border: 3px solid #e5e7eb; border-top-color: #3b82f6; border-radius: 50%; animation: crm-spin .7s linear infinite; }
        @keyframes crm-spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* CRM sub-nav */}
      {view !== 'customer_detail' && (
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="crm-scrollbar-hide flex w-full gap-1 overflow-x-auto bg-gray-100 rounded-lg p-1 md:w-auto">
            {topNavItems.map(item => (
              <button
                key={item.key}
                onClick={() => { setView(item.key); }}
                className={`flex-shrink-0 px-3 py-1.5 text-xs sm:px-4 sm:text-sm font-medium rounded-md transition-all ${
                  view === item.key ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          {view === 'customers' && (
            <button onClick={() => setView('new_customer')} className="crm-btn-primary w-full justify-center md:w-auto">
              + New Customer
            </button>
          )}
          {view === 'jobs' && (
            <button onClick={() => setView('new_job')} className="crm-btn-primary w-full justify-center md:w-auto">
              + New Job
            </button>
          )}
        </div>
      )}

      {/* ── Customers list ── */}
      {view === 'customers' && (
        <div>
          <input
            className="crm-input mb-5"
            placeholder="Search by name, email, or phone…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {loading ? (
            <div className="flex justify-center py-12"><div className="crm-spinner" /></div>
          ) : customers.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p className="text-lg font-medium text-gray-500 mb-1">No customers yet</p>
              <p className="text-sm">Add your first customer to get started.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {customers.map(c => (
                <button
                  key={c.id}
                  onClick={() => { setSelectedCustomerId(c.id); setView('customer_detail'); }}
                  className="w-full text-left border border-gray-200 rounded-xl p-4 bg-white hover:border-blue-200 hover:bg-blue-50/30 transition-all"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-start">
                    <div>
                      <p className="font-semibold text-gray-900">{c.first_name} {c.last_name}</p>
                      <p className="text-sm text-gray-500">{c.email || '—'} {c.phone ? `· ${c.phone}` : ''}</p>
                    </div>
                    <div className="text-left sm:text-right">
                      {c.city && <p className="text-xs text-gray-400">{c.city}</p>}
                      <p className="text-xs text-gray-400 mt-0.5">{fmtDate(c.created_at)}</p>
                    </div>
                  </div>
                  {(c.crm_jobs?.length || c.crm_vehicles?.length) ? (
                    <div className="mt-2 flex flex-wrap gap-2 sm:gap-3">
                      {c.crm_jobs && c.crm_jobs.length > 0 && (
                        <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                          {c.crm_jobs.length} job{c.crm_jobs.length !== 1 ? 's' : ''}
                        </span>
                      )}
                      {c.crm_vehicles && c.crm_vehicles.length > 0 && (
                        <span className="text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
                          {c.crm_vehicles.length} vehicle{c.crm_vehicles.length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  ) : null}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── New Customer ── */}
      {view === 'new_customer' && (
        <div>
          <div className="flex items-center gap-3 mb-6">
            <button onClick={() => setView('customers')} className="crm-btn-ghost">
              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
              Customers
            </button>
            <span className="text-gray-300">/</span>
            <h2 className="text-lg font-semibold text-gray-900">New Customer</h2>
          </div>
          <NewCustomerForm
            onSave={c => { setCustomers(prev => [c, ...prev]); setView('customers'); }}
            onCancel={() => setView('customers')}
          />
        </div>
      )}

      {/* ── Customer Detail ── */}
      {view === 'customer_detail' && selectedCustomerId && (
        <CustomerDetail
          customerId={selectedCustomerId}
          onBack={() => { setView('customers'); loadCustomers(search); }}
          allCustomers={customers}
        />
      )}

      {/* ── Jobs list ── */}
      {view === 'jobs' && (
        <div>
          <div className="flex gap-2 mb-5 flex-wrap">
            <button onClick={() => setJobFilter('')} className={`px-3 py-1 rounded-full text-sm border ${!jobFilter ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200'}`}>All</button>
            {JOB_STATUSES.map(s => (
              <button key={s.value} onClick={() => setJobFilter(s.value)} className={`px-3 py-1 rounded-full text-sm border ${jobFilter === s.value ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200'}`}>
                {s.label}
              </button>
            ))}
          </div>
          {loading ? (
            <div className="flex justify-center py-12"><div className="crm-spinner" /></div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-16 text-gray-400">No jobs found.</div>
          ) : (
            <div className="space-y-3">
              {jobs.map(job => {
                const s = getJobStatus(job.status);
                const c = (job as any).crm_customers as { first_name: string; last_name: string } | undefined;
                return (
                  <div key={job.id} className="border border-gray-200 rounded-xl p-4 bg-white">
                    <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-start">
                      <div>
                        <p className="font-semibold text-gray-900">{job.service_type}</p>
                        {c && (
                          <button
                            onClick={() => { setSelectedCustomerId((job as any).crm_customers.id); setView('customer_detail'); }}
                            className="text-sm text-blue-600 hover:underline"
                          >
                            {c.first_name} {c.last_name}
                          </button>
                        )}
                        {job.crm_vehicles && (
                          <p className="text-xs text-gray-500">{job.crm_vehicles.year} {job.crm_vehicles.make} {job.crm_vehicles.model}</p>
                        )}
                        {job.scheduled_date && <p className="text-xs text-gray-400 mt-0.5">{fmtDate(job.scheduled_date)}</p>}
                      </div>
                      <div className="flex flex-row items-center gap-2 sm:flex-col sm:items-end">
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${s.color}`}>{s.label}</span>
                        <select
                          value={job.status}
                          onChange={e => handleJobStatusChange(job.id, e.target.value)}
                          className="min-w-[120px] text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white"
                        >
                          {JOB_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── New Job ── */}
      {view === 'new_job' && (
        <div>
          <div className="flex items-center gap-3 mb-6">
            <button onClick={() => setView('jobs')} className="crm-btn-ghost">
              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
              Jobs
            </button>
            <span className="text-gray-300">/</span>
            <h2 className="text-lg font-semibold text-gray-900">New Job</h2>
          </div>
          <NewJobForm
            customers={customers}
            onSave={() => { loadJobs(jobFilter); setView('jobs'); }}
            onCancel={() => setView('jobs')}
          />
        </div>
      )}

      {/* ── Invoices ── */}
      {view === 'invoices' && (
        <div>
          <div className="flex gap-2 mb-5 flex-wrap">
            <button onClick={() => setInvoiceFilter('')} className={`px-3 py-1 rounded-full text-sm border ${!invoiceFilter ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200'}`}>All</button>
            {INVOICE_STATUSES.map(s => (
              <button key={s.value} onClick={() => setInvoiceFilter(s.value)} className={`px-3 py-1 rounded-full text-sm border ${invoiceFilter === s.value ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200'}`}>
                {s.label}
              </button>
            ))}
          </div>
          {loading ? (
            <div className="flex justify-center py-12"><div className="crm-spinner" /></div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-16 text-gray-400">No invoices found.</div>
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 uppercase tracking-wide border-b border-gray-100">
                    <th className="pb-3 pr-4">Invoice #</th>
                    <th className="pb-3 pr-4">Customer</th>
                    <th className="pb-3 pr-4">Service</th>
                    <th className="pb-3 pr-4">Total</th>
                    <th className="pb-3 pr-4">Due</th>
                    <th className="pb-3 pr-4">Status</th>
                    <th className="pb-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {invoices.map(inv => {
                    const s = getInvoiceStatus(inv.status);
                    return (
                      <tr key={inv.id} className="hover:bg-gray-50">
                        <td className="py-3 pr-4 font-mono text-xs text-gray-600">{inv.invoice_number}</td>
                        <td className="py-3 pr-4">{inv.crm_customers ? `${inv.crm_customers.first_name} ${inv.crm_customers.last_name}` : '—'}</td>
                        <td className="py-3 pr-4 text-gray-500">{inv.crm_jobs?.service_type || '—'}</td>
                        <td className="py-3 pr-4 font-semibold">{fmtCurrency(inv.total)}</td>
                        <td className="py-3 pr-4 text-gray-500">{fmtDate(inv.due_date)}</td>
                        <td className="py-3 pr-4">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.color}`}>{s.label}</span>
                        </td>
                        <td className="py-3">
                          <select
                            value={inv.status}
                            onChange={e => handleInvoiceStatusChange(inv.id, e.target.value)}
                            className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white"
                          >
                            {INVOICE_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                </table>
              </div>

              <div className="space-y-3 md:hidden">
                {invoices.map(inv => {
                  const s = getInvoiceStatus(inv.status);
                  return (
                    <div key={inv.id} className="border border-gray-200 rounded-xl p-4 bg-white">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-mono text-xs text-gray-600">{inv.invoice_number}</p>
                          <p className="text-sm font-semibold text-gray-900 mt-1">{inv.crm_customers ? `${inv.crm_customers.first_name} ${inv.crm_customers.last_name}` : '—'}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{inv.crm_jobs?.service_type || '—'}</p>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.color}`}>{s.label}</span>
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-2">
                        <div>
                          <p className="text-xs text-gray-400">Due {fmtDate(inv.due_date)}</p>
                          <p className="text-sm font-semibold text-gray-900 mt-0.5">{fmtCurrency(inv.total)}</p>
                        </div>
                        <select
                          value={inv.status}
                          onChange={e => handleInvoiceStatusChange(inv.id, e.target.value)}
                          className="min-w-[124px] text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white"
                        >
                          {INVOICE_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
