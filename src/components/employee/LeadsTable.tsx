import { useEffect, useState, useCallback } from 'react';
import { LeadModal } from './LeadModal';
import { LeadDetailPanel } from './LeadDetailPanel';

export interface Lead {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  source: string;
  service_interest?: string;
  vehicle_info?: string;
  message?: string;
  status: string;
  assigned_to?: string;
  estimated_value?: number;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  landing_page?: string;
  note_count: number;
  created_at: string;
  updated_at: string;
  contacted_at?: string;
  closed_at?: string;
}

const STATUS_OPTIONS = [
  { value: 'new', label: 'New', color: 'bg-blue-50 border-blue-200 text-blue-700' },
  { value: 'contacted', label: 'Contacted', color: 'bg-cyan-50 border-cyan-200 text-cyan-700' },
  { value: 'quoted', label: 'Quoted', color: 'bg-yellow-50 border-yellow-200 text-yellow-700' },
  { value: 'booked', label: 'Booked', color: 'bg-purple-50 border-purple-200 text-purple-700' },
  { value: 'completed', label: 'Completed', color: 'bg-green-50 border-green-200 text-green-700' },
  { value: 'lost', label: 'Lost', color: 'bg-red-50 border-red-200 text-red-700' },
];

const SOURCE_OPTIONS = [
  { value: 'google_ads', label: 'Google Ads' },
  { value: 'meta_ads', label: 'Meta Ads' },
  { value: 'website', label: 'Website' },
  { value: 'phone', label: 'Phone' },
  { value: 'walk_in', label: 'Walk-in' },
  { value: 'referral', label: 'Referral' },
  { value: 'other', label: 'Other' },
];

function getStatusStyle(status: string) {
  return STATUS_OPTIONS.find(s => s.value === status)?.color || 'bg-gray-100 border-gray-200 text-gray-600';
}

function getStatusLabel(status: string) {
  return STATUS_OPTIONS.find(s => s.value === status)?.label || status;
}

function getSourceLabel(source: string) {
  return SOURCE_OPTIONS.find(s => s.value === source)?.label || source;
}

function getSourceIcon(source: string) {
  switch (source) {
    case 'google_ads': return '🔍';
    case 'meta_ads': return '📘';
    case 'website': return '🌐';
    case 'phone': return '📞';
    case 'walk_in': return '🚶';
    case 'referral': return '🤝';
    default: return '📋';
  }
}

function timeAgo(dateStr: string) {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export function LeadsTable() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | undefined>();
  const [detailLead, setDetailLead] = useState<Lead | undefined>();

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchLeads = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (sourceFilter !== 'all') params.set('source', sourceFilter);
      if (searchQuery) params.set('search', searchQuery);

      const res = await fetch(`/api/employee/leads?${params}`);
      const data = await res.json();
      setLeads(data.leads || []);
    } catch (err) {
      console.error('Error fetching leads:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, sourceFilter, searchQuery]);

  useEffect(() => {
    fetchLeads();
    const interval = setInterval(fetchLeads, 15000);
    return () => clearInterval(interval);
  }, [fetchLeads]);

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    try {
      const res = await fetch('/api/employee/leads', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: leadId, status: newStatus }),
      });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setLeads(prev => prev.map(l => l.id === data.lead.id ? { ...data.lead, note_count: l.note_count } : l));
      if (detailLead?.id === leadId) setDetailLead({ ...data.lead, note_count: detailLead.note_count });
    } catch (err) {
      console.error('Error updating lead status:', err);
    }
  };

  const handleSaveLead = async (formData: any) => {
    try {
      const method = selectedLead ? 'PUT' : 'POST';
      const res = await fetch('/api/employee/leads', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedLead ? { id: selectedLead.id, ...formData } : formData),
      });
      if (!res.ok) throw new Error('Failed');
      await fetchLeads();
      setModalOpen(false);
      setSelectedLead(undefined);
    } catch (err) {
      console.error('Error saving lead:', err);
      alert('Failed to save lead');
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    if (!confirm('Delete this lead? This cannot be undone.')) return;
    try {
      const res = await fetch('/api/employee/leads', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: leadId }),
      });
      if (!res.ok) throw new Error('Failed');
      setLeads(prev => prev.filter(l => l.id !== leadId));
      if (detailLead?.id === leadId) setDetailLead(undefined);
    } catch (err) {
      console.error('Error deleting lead:', err);
    }
  };

  // Stats summary
  const stats = {
    total: leads.length,
    new: leads.filter(l => l.status === 'new').length,
    contacted: leads.filter(l => l.status === 'contacted').length,
    quoted: leads.filter(l => l.status === 'quoted').length,
    booked: leads.filter(l => l.status === 'booked').length,
  };

  if (loading) {
    return <div className="text-gray-500 text-sm">Loading leads...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Pipeline Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        <button onClick={() => setStatusFilter('all')} className={`p-3 rounded-lg border text-center transition ${statusFilter === 'all' ? 'bg-gray-100 border-gray-300' : 'bg-white border-gray-200 hover:border-gray-300'}`}>
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-xs text-gray-500">Total</div>
        </button>
        <button onClick={() => setStatusFilter('new')} className={`p-3 rounded-lg border text-center transition ${statusFilter === 'new' ? 'bg-blue-50 border-blue-300' : 'bg-white border-gray-200 hover:border-blue-300'}`}>
          <div className="text-2xl font-bold text-blue-600">{stats.new}</div>
          <div className="text-xs text-blue-500">New</div>
        </button>
        <button onClick={() => setStatusFilter('contacted')} className={`p-3 rounded-lg border text-center transition ${statusFilter === 'contacted' ? 'bg-cyan-50 border-cyan-300' : 'bg-white border-gray-200 hover:border-cyan-300'}`}>
          <div className="text-2xl font-bold text-cyan-600">{stats.contacted}</div>
          <div className="text-xs text-cyan-500">Contacted</div>
        </button>
        <button onClick={() => setStatusFilter('quoted')} className={`p-3 rounded-lg border text-center transition ${statusFilter === 'quoted' ? 'bg-yellow-50 border-yellow-300' : 'bg-white border-gray-200 hover:border-yellow-300'}`}>
          <div className="text-2xl font-bold text-yellow-600">{stats.quoted}</div>
          <div className="text-xs text-yellow-500">Quoted</div>
        </button>
        <button onClick={() => setStatusFilter('booked')} className={`p-3 rounded-lg border text-center transition ${statusFilter === 'booked' ? 'bg-purple-50 border-purple-300' : 'bg-white border-gray-200 hover:border-purple-300'}`}>
          <div className="text-2xl font-bold text-purple-600">{stats.booked}</div>
          <div className="text-xs text-purple-500">Booked</div>
        </button>
      </div>

      {/* Filters and actions */}
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          placeholder="Search name, email, phone..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none"
        />
        <select
          value={sourceFilter}
          onChange={e => setSourceFilter(e.target.value)}
          className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm focus:border-blue-500 focus:outline-none"
        >
          <option value="all">All Sources</option>
          {SOURCE_OPTIONS.map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        <button
          onClick={() => { setSelectedLead(undefined); setModalOpen(true); }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium whitespace-nowrap"
        >
          + New Lead
        </button>
      </div>

      {/* Detail Panel (slides in when a lead is selected) */}
      {detailLead && (
        <LeadDetailPanel
          lead={detailLead}
          onClose={() => setDetailLead(undefined)}
          onStatusChange={handleStatusChange}
          onEdit={(lead: Lead) => { setSelectedLead(lead); setModalOpen(true); }}
          onDelete={handleDeleteLead}
        />
      )}

      {/* Leads list */}
      {leads.length === 0 ? (
        <div className="text-gray-500 text-center py-8 text-sm">
          {statusFilter !== 'all' || sourceFilter !== 'all' || searchQuery
            ? 'No leads match your filters'
            : 'No leads yet — they\'ll appear here from your contact form, or add one manually'}
        </div>
      ) : isMobile ? (
        /* Mobile card view */
        <div className="space-y-3">
          {leads.map(lead => (
            <div
              key={lead.id}
              className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm cursor-pointer hover:border-gray-300 transition"
              onClick={() => setDetailLead(lead)}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-gray-900 font-semibold text-sm">{lead.name}</h3>
                  <p className="text-gray-500 text-xs">{getSourceIcon(lead.source)} {getSourceLabel(lead.source)}</p>
                </div>
                <select
                  value={lead.status}
                  onChange={e => { e.stopPropagation(); handleStatusChange(lead.id, e.target.value); }}
                  onClick={e => e.stopPropagation()}
                  className={`px-2 py-1 rounded border text-xs font-medium focus:outline-none cursor-pointer ${getStatusStyle(lead.status)}`}
                >
                  {STATUS_OPTIONS.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
              {lead.service_interest && (
                <p className="text-gray-600 text-xs mb-1">🔧 {lead.service_interest}</p>
              )}
              {lead.phone && <p className="text-gray-500 text-xs">📞 {lead.phone}</p>}
              {lead.email && <p className="text-gray-500 text-xs">✉️ {lead.email}</p>}
              <div className="flex justify-between items-center mt-2 text-xs text-gray-400">
                <span>{timeAgo(lead.created_at)}</span>
                {lead.note_count > 0 && <span>📝 {lead.note_count} notes</span>}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Desktop table view */
        <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-4 py-3">Lead</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Service</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Value</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {leads.map(lead => (
                <tr
                  key={lead.id}
                  className="hover:bg-gray-50 cursor-pointer transition"
                  onClick={() => setDetailLead(lead)}
                >
                  <td className="px-4 py-3">
                    <div className="text-gray-900 font-medium">{lead.name}</div>
                    <div className="text-gray-500 text-xs">
                      {lead.email && <span>{lead.email}</span>}
                      {lead.email && lead.phone && <span> · </span>}
                      {lead.phone && <span>{lead.phone}</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    <span className="whitespace-nowrap">{getSourceIcon(lead.source)} {getSourceLabel(lead.source)}</span>
                    {lead.utm_campaign && (
                      <div className="text-xs text-gray-400 mt-0.5">{lead.utm_campaign}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{lead.service_interest || '—'}</td>
                  <td className="px-4 py-3">
                    <select
                      value={lead.status}
                      onChange={e => { e.stopPropagation(); handleStatusChange(lead.id, e.target.value); }}
                      onClick={e => e.stopPropagation()}
                      className={`px-2 py-1 rounded border text-xs font-medium focus:outline-none cursor-pointer ${getStatusStyle(lead.status)}`}
                    >
                      {STATUS_OPTIONS.map(s => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {lead.estimated_value ? `$${Number(lead.estimated_value).toLocaleString()}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{timeAgo(lead.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => { setSelectedLead(lead); setModalOpen(true); }}
                        className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition"
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDeleteLead(lead.id)}
                        className="px-2 py-1 text-xs bg-red-900/50 text-red-300 rounded hover:bg-red-900 transition border border-red-700"
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <LeadModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setSelectedLead(undefined); }}
        onSave={handleSaveLead}
        lead={selectedLead}
      />
    </div>
  );
}
