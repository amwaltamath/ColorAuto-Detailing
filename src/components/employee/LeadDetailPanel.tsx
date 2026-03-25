import { useState, useEffect } from 'react';
import type { Lead } from './LeadsTable';

interface LeadNote {
  id: string;
  lead_id: string;
  author_name: string;
  note: string;
  created_at: string;
}

interface LeadDetailPanelProps {
  lead: Lead;
  onClose: () => void;
  onStatusChange: (leadId: string, status: string) => void;
  onEdit: (lead: Lead) => void;
  onDelete: (leadId: string) => void;
}

const STATUS_OPTIONS = [
  { value: 'new', label: 'New', color: 'bg-blue-600' },
  { value: 'contacted', label: 'Contacted', color: 'bg-cyan-600' },
  { value: 'quoted', label: 'Quoted', color: 'bg-yellow-600' },
  { value: 'booked', label: 'Booked', color: 'bg-purple-600' },
  { value: 'completed', label: 'Completed', color: 'bg-green-600' },
  { value: 'lost', label: 'Lost', color: 'bg-red-600' },
];

function getSourceLabel(source: string) {
  const map: Record<string, string> = {
    google_ads: 'Google Ads', meta_ads: 'Meta Ads', website: 'Website',
    phone: 'Phone', walk_in: 'Walk-in', referral: 'Referral', other: 'Other',
  };
  return map[source] || source;
}

function formatDate(dateStr: string | undefined) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString();
}

export function LeadDetailPanel({ lead, onClose, onStatusChange, onEdit, onDelete }: LeadDetailPanelProps) {
  const [notes, setNotes] = useState<LeadNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [loadingNotes, setLoadingNotes] = useState(true);
  const [submittingNote, setSubmittingNote] = useState(false);

  useEffect(() => {
    fetchNotes();
  }, [lead.id]);

  const fetchNotes = async () => {
    setLoadingNotes(true);
    try {
      const res = await fetch(`/api/employee/lead-notes?leadId=${lead.id}`);
      const data = await res.json();
      setNotes(data.notes || []);
    } catch (err) {
      console.error('Error fetching notes:', err);
    } finally {
      setLoadingNotes(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    setSubmittingNote(true);
    try {
      const res = await fetch('/api/employee/lead-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_id: lead.id, note: newNote.trim() }),
      });
      if (res.ok) {
        setNewNote('');
        await fetchNotes();
      }
    } catch (err) {
      console.error('Error adding note:', err);
    } finally {
      setSubmittingNote(false);
    }
  };

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-600 overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-slate-750 border-b border-slate-700 flex justify-between items-start">
        <div>
          <h3 className="text-lg font-bold text-white">{lead.name}</h3>
          <p className="text-slate-400 text-sm">{getSourceLabel(lead.source)}{lead.utm_campaign ? ` · ${lead.utm_campaign}` : ''}</p>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-white text-xl leading-none ml-4">&times;</button>
      </div>

      <div className="p-4 space-y-4">
        {/* Status Pipeline */}
        <div>
          <label className="text-xs font-medium text-slate-400 uppercase mb-2 block">Pipeline Status</label>
          <div className="flex flex-wrap gap-1.5">
            {STATUS_OPTIONS.map(s => (
              <button
                key={s.value}
                onClick={() => onStatusChange(lead.id, s.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                  lead.status === s.value
                    ? `${s.color} text-white`
                    : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Contact Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {lead.email && (
            <a href={`mailto:${lead.email}`} className="flex items-center gap-2 p-2 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition">
              <span className="text-blue-400">✉️</span>
              <span className="text-sm text-white truncate">{lead.email}</span>
            </a>
          )}
          {lead.phone && (
            <a href={`tel:${lead.phone}`} className="flex items-center gap-2 p-2 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition">
              <span className="text-green-400">📞</span>
              <span className="text-sm text-white">{lead.phone}</span>
            </a>
          )}
        </div>

        {/* Details */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-slate-400 text-xs">Service</span>
            <p className="text-white">{lead.service_interest || '—'}</p>
          </div>
          <div>
            <span className="text-slate-400 text-xs">Vehicle</span>
            <p className="text-white">{lead.vehicle_info || '—'}</p>
          </div>
          <div>
            <span className="text-slate-400 text-xs">Est. Value</span>
            <p className="text-white">{lead.estimated_value ? `$${Number(lead.estimated_value).toLocaleString()}` : '—'}</p>
          </div>
          <div>
            <span className="text-slate-400 text-xs">Created</span>
            <p className="text-white text-xs">{formatDate(lead.created_at)}</p>
          </div>
        </div>

        {lead.message && (
          <div>
            <span className="text-slate-400 text-xs">Message</span>
            <p className="text-slate-300 text-sm bg-slate-700/50 p-3 rounded-lg mt-1">{lead.message}</p>
          </div>
        )}

        {/* UTM Tracking */}
        {(lead.utm_source || lead.utm_medium || lead.utm_campaign) && (
          <div>
            <span className="text-slate-400 text-xs uppercase font-medium">Ad Tracking</span>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {lead.utm_source && <span className="px-2 py-0.5 bg-slate-700 text-slate-300 text-xs rounded">src: {lead.utm_source}</span>}
              {lead.utm_medium && <span className="px-2 py-0.5 bg-slate-700 text-slate-300 text-xs rounded">med: {lead.utm_medium}</span>}
              {lead.utm_campaign && <span className="px-2 py-0.5 bg-slate-700 text-slate-300 text-xs rounded">camp: {lead.utm_campaign}</span>}
            </div>
            {lead.landing_page && <p className="text-xs text-slate-500 mt-1 truncate">Landing: {lead.landing_page}</p>}
          </div>
        )}

        {/* Notes / Follow-ups */}
        <div>
          <h4 className="text-sm font-medium text-slate-300 mb-2">Notes & Follow-ups</h4>
          <form onSubmit={handleAddNote} className="flex gap-2 mb-3">
            <input
              type="text"
              placeholder="Add a note or follow-up..."
              value={newNote}
              onChange={e => setNewNote(e.target.value)}
              className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-400 focus:border-blue-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={submittingNote || !newNote.trim()}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm disabled:opacity-50"
            >
              Add
            </button>
          </form>

          {loadingNotes ? (
            <p className="text-slate-500 text-xs">Loading notes...</p>
          ) : notes.length === 0 ? (
            <p className="text-slate-500 text-xs">No notes yet</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {notes.map(n => (
                <div key={n.id} className="bg-slate-700/50 p-2.5 rounded-lg border border-slate-600/50">
                  <p className="text-slate-200 text-sm">{n.note}</p>
                  <p className="text-slate-500 text-xs mt-1">
                    {n.author_name || 'Staff'} · {new Date(n.created_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t border-slate-700">
          <button
            onClick={() => onEdit(lead)}
            className="flex-1 px-3 py-2 bg-slate-700 text-slate-200 rounded-lg hover:bg-slate-600 transition text-sm"
          >
            ✏️ Edit Lead
          </button>
          <button
            onClick={() => onDelete(lead.id)}
            className="px-3 py-2 bg-red-900/50 text-red-300 rounded-lg hover:bg-red-900 transition text-sm border border-red-700"
          >
            🗑️ Delete
          </button>
        </div>
      </div>
    </div>
  );
}
