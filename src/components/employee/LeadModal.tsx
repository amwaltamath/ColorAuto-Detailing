import { useState, useEffect } from 'react';
import type { Lead } from './LeadsTable';

interface LeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  lead?: Lead;
}

const SOURCE_OPTIONS = [
  { value: 'google_ads', label: 'Google Ads' },
  { value: 'meta_ads', label: 'Meta Ads' },
  { value: 'website', label: 'Website' },
  { value: 'phone', label: 'Phone' },
  { value: 'walk_in', label: 'Walk-in' },
  { value: 'referral', label: 'Referral' },
  { value: 'other', label: 'Other' },
];

const SERVICE_OPTIONS = [
  'Auto Detailing',
  'Ceramic Coating',
  'Paint Protection Film',
  'Window Tinting',
  'Paint Correction',
  'Interior Cleaning',
  'Color PPF',
  'Other',
];

const STATUS_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'quoted', label: 'Quoted' },
  { value: 'booked', label: 'Booked' },
  { value: 'completed', label: 'Completed' },
  { value: 'lost', label: 'Lost' },
];

export function LeadModal({ isOpen, onClose, onSave, lead }: LeadModalProps) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    source: 'phone',
    service_interest: '',
    vehicle_info: '',
    message: '',
    status: 'new',
    estimated_value: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (lead) {
      setForm({
        name: lead.name || '',
        email: lead.email || '',
        phone: lead.phone || '',
        source: lead.source || 'phone',
        service_interest: lead.service_interest || '',
        vehicle_info: lead.vehicle_info || '',
        message: lead.message || '',
        status: lead.status || 'new',
        estimated_value: lead.estimated_value ? String(lead.estimated_value) : '',
      });
    } else {
      setForm({ name: '', email: '', phone: '', source: 'phone', service_interest: '', vehicle_info: '', message: '', status: 'new', estimated_value: '' });
    }
  }, [lead, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSubmitting(true);
    await onSave({
      ...form,
      estimated_value: form.estimated_value ? parseFloat(form.estimated_value) : null,
    });
    setSubmitting(false);
  };

  const inputClass = 'w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm focus:border-blue-500 focus:outline-none';
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1';

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl border border-gray-200 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">{lead ? 'Edit Lead' : 'New Lead'}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">&times;</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={labelClass}>Name *</label>
              <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={inputClass} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Email</label>
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Phone</label>
                <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className={inputClass} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Source</label>
                <select value={form.source} onChange={e => setForm({ ...form, source: e.target.value })} className={inputClass}>
                  {SOURCE_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Service Interest</label>
                <select value={form.service_interest} onChange={e => setForm({ ...form, service_interest: e.target.value })} className={inputClass}>
                  <option value="">Select...</option>
                  {SERVICE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Status</label>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className={inputClass}>
                  {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Estimated Value ($)</label>
                <input type="number" step="0.01" min="0" value={form.estimated_value} onChange={e => setForm({ ...form, estimated_value: e.target.value })} className={inputClass} placeholder="0.00" />
              </div>
            </div>

            <div>
              <label className={labelClass}>Vehicle Info</label>
              <input type="text" value={form.vehicle_info} onChange={e => setForm({ ...form, vehicle_info: e.target.value })} className={inputClass} placeholder="Year, make, model, color..." />
            </div>

            <div>
              <label className={labelClass}>Notes / Message</label>
              <textarea rows={3} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} className={inputClass} />
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm">
                Cancel
              </button>
              <button type="submit" disabled={submitting} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium disabled:opacity-50">
                {submitting ? 'Saving...' : lead ? 'Update Lead' : 'Create Lead'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
