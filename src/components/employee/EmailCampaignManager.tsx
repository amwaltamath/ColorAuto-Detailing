import React, { useCallback, useEffect, useState } from 'react';
import { employeeAuthHeaders } from '../../utils/employeeApiAuth';

interface Subscriber {
  id: string;
  email: string;
  name: string | null;
}

interface Campaign {
  id: string;
  subject: string;
  sent_count: number;
  failed_count: number;
  created_at: string;
  sent_at: string | null;
}

export function EmailCampaignManager() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [schemaReady, setSchemaReady] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sendLoading, setSendLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [testEmail, setTestEmail] = useState('');
  const [formData, setFormData] = useState({ subject: '', message: '' });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/employee/email-campaign', { headers: employeeAuthHeaders() });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || 'Failed to load');
      setSchemaReady(payload.schema_ready !== false);
      setSubscribers(payload.subscribers ?? []);
      setCampaigns(payload.campaigns ?? []);
      if (payload.schema_ready === false) {
        setError(payload.error || 'Database tables missing');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const parseCSVLine = (line: string, delimiter: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          current += '"';
          i++;
        } else inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else current += char;
    }
    result.push(current.trim());
    return result;
  };

  const parseCSV = (text: string): Array<{ email: string; name?: string }> => {
    const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const lines = normalized.split('\n').filter((l) => l.trim());
    if (!lines.length) return [];

    const firstLine = lines[0];
    let delimiter = ',';
    if (firstLine.includes('\t')) delimiter = '\t';
    else if (firstLine.includes('|')) delimiter = '|';

    const header = parseCSVLine(lines[0], delimiter).map((h) =>
      h.trim().toLowerCase().replace(/['"]/g, '').replace(/\s+/g, ' '),
    );
    const emailIndex = header.findIndex(
      (h) => h === 'email' || h === 'email_address' || h === 'email address' || h === 'e-mail',
    );
    const nameIndex = header.findIndex(
      (h) => h === 'name' || h === 'full_name' || h === 'full name' || h === 'first name',
    );
    if (emailIndex === -1) throw new Error(`CSV needs an email column. Found: ${header.join(', ')}`);

    const records: Array<{ email: string; name?: string }> = [];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i], delimiter);
      const email = values[emailIndex]?.trim().replace(/['"]/g, '').toLowerCase();
      const name = nameIndex >= 0 ? values[nameIndex]?.trim().replace(/['"]/g, '') : undefined;
      if (email && emailRegex.test(email)) records.push({ email, name: name || undefined });
    }
    return records;
  };

  const handleCSVImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportLoading(true);
    setError('');
    setSuccess('');
    try {
      const records = parseCSV(await file.text());
      if (!records.length) throw new Error('No valid emails in CSV');

      const res = await fetch('/api/employee/email-campaign-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...employeeAuthHeaders() },
        body: JSON.stringify({ records }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || 'Import failed');

      setSuccess(`Imported ${payload.imported} subscriber(s).`);
      await loadData();
      e.target.value = '';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setImportLoading(false);
    }
  };

  const selectedSubscribers = subscribers.filter((s) => selectedIds.includes(s.id));

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setTestLoading(true);
    setError('');
    setSuccess('');
    try {
      if (!formData.subject.trim() || !formData.message.trim()) throw new Error('Subject and message required');
      if (!testEmail.trim()) throw new Error('Enter a test email');

      const res = await fetch('/api/employee/email-campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...employeeAuthHeaders() },
        body: JSON.stringify({
          subject: `[TEST] ${formData.subject}`,
          message: formData.message,
          subscribers: [{ email: testEmail.trim(), name: 'Test' }],
        }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || 'Test send failed');
      setSuccess(`Test email sent to ${testEmail}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Test send failed');
    } finally {
      setTestLoading(false);
    }
  };

  const handleSendCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendLoading(true);
    setError('');
    setSuccess('');
    try {
      if (!formData.subject.trim() || !formData.message.trim()) throw new Error('Subject and message required');
      if (!selectedSubscribers.length) throw new Error('Select at least one subscriber');

      const confirmed = window.confirm(
        `Send to ${selectedSubscribers.length} of ${subscribers.length} subscribers?`,
      );
      if (!confirmed) {
        setSendLoading(false);
        return;
      }

      const res = await fetch('/api/employee/email-campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...employeeAuthHeaders() },
        body: JSON.stringify({
          subject: formData.subject,
          message: formData.message,
          subscribers: selectedSubscribers.map((s) => ({ email: s.email, name: s.name })),
        }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || 'Send failed');

      const failNote = payload.failed ? ` ${payload.failed} failed.` : '';
      setSuccess(`Sent ${payload.sent} of ${payload.total}.${failNote}`);
      setFormData({ subject: '', message: '' });
      setSelectedIds([]);
      setShowForm(false);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Send failed');
    } finally {
      setSendLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
      )}
      {success && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{success}</div>
      )}

      {!schemaReady && (
        <motionNotice message="Run supabase/email_campaign_migration.sql in Supabase once, then refresh this tab." />
      )}

      <section className="rounded-xl border border-gray-200 bg-gray-50 p-4 sm:p-6">
        <h3 className="text-base font-semibold text-gray-900">Import subscribers</h3>
        <p className="mt-1 text-sm text-gray-600">
          Upload CSV, pull from OrbisX, or sync from leads. New quotes and Meta leads with an email address are added to this list automatically when they hit the dashboard.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
            <input type="file" accept=".csv" className="hidden" disabled={importLoading || !schemaReady} onChange={handleCSVImport} />
            {importLoading ? 'Importing…' : 'Choose CSV file'}
          </label>
          <button
            type="button"
            disabled={importLoading || !schemaReady}
            onClick={async () => {
              setImportLoading(true);
              setError('');
              setSuccess('');
              try {
                const res = await fetch('/api/employee/email-campaign-import', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', ...employeeAuthHeaders() },
                  body: JSON.stringify({ from_leads: true }),
                });
                const payload = await res.json();
                if (!res.ok) throw new Error(payload.error || 'Import failed');
                setSuccess(`Added ${payload.imported} address(es) from leads.`);
                await loadData();
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Import failed');
              } finally {
                setImportLoading(false);
              }
            }}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50 disabled:opacity-50"
          >
            Import from leads
          </button>
          <button
            type="button"
            disabled={importLoading || !schemaReady}
            onClick={async () => {
              setImportLoading(true);
              setError('');
              setSuccess('');
              try {
                const res = await fetch('/api/employee/email-campaign-import', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', ...employeeAuthHeaders() },
                  body: JSON.stringify({ from_orbisx: true }),
                });
                const payload = await res.json();
                if (!res.ok) throw new Error(payload.error || 'OrbisX import failed');
                setSuccess(`Imported ${payload.imported} email(s) from OrbisX.`);
                await loadData();
              } catch (err) {
                setError(err instanceof Error ? err.message : 'OrbisX import failed');
              } finally {
                setImportLoading(false);
              }
            }}
            className="rounded-lg border border-violet-200 bg-violet-50 px-4 py-2.5 text-sm font-semibold text-violet-900 hover:bg-violet-100 disabled:opacity-50"
          >
            Import from OrbisX
          </button>
        </div>
      </section>

      <motionStats loading={loading} subscribers={subscribers.length} campaigns={campaigns.length} />

      {!showForm ? (
        <button
          type="button"
          disabled={!schemaReady}
          onClick={() => setShowForm(true)}
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          Create email campaign
        </button>
      ) : (
        <aForm
          formData={formData}
          setFormData={setFormData}
          testEmail={testEmail}
          setTestEmail={setTestEmail}
          testLoading={testLoading}
          sendLoading={sendLoading}
          subscribers={subscribers}
          selectedIds={selectedIds}
          setSelectedIds={setSelectedIds}
          onSendTest={handleSendTest}
          onSend={handleSendCampaign}
          onCancel={() => {
            setShowForm(false);
            setFormData({ subject: '', message: '' });
            setSelectedIds([]);
          }}
        />
      )}

      <section>
        <h3 className="text-base font-semibold text-gray-900">Campaign history</h3>
        {campaigns.length === 0 ? (
          <p className="mt-2 text-sm text-gray-500">No campaigns sent yet.</p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-xl border border-gray-200">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3">Subject</th>
                  <th className="px-4 py-3">Sent</th>
                  <th className="px-4 py-3">Failed</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {campaigns.map((c) => (
                  <tr key={c.id}>
                    <td className="px-4 py-3 font-medium text-gray-900">{c.subject}</td>
                    <td className="px-4 py-3">{c.sent_count}</td>
                    <td className="px-4 py-3">{c.failed_count ?? 0}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {c.sent_at ? new Date(c.sent_at).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function motionNotice({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{message}</div>
  );
}

function motionStats({
  loading,
  subscribers,
  campaigns,
}: {
  loading: boolean;
  subscribers: number;
  campaigns: number;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="rounded-xl border border-gray-200 bg-white p-5 text-center shadow-sm">
        <p className="text-3xl font-bold text-blue-600">{loading ? '…' : subscribers}</p>
        <p className="text-sm text-gray-600">Email subscribers</p>
      </div>
      <div className="rounded-xl border border-gray-200 bg-white p-5 text-center shadow-sm">
        <p className="text-3xl font-bold text-gray-900">{loading ? '…' : campaigns}</p>
        <p className="text-sm text-gray-600">Campaigns sent</p>
      </div>
    </div>
  );
}

function aForm(props: {
  formData: { subject: string; message: string };
  setFormData: React.Dispatch<React.SetStateAction<{ subject: string; message: string }>>;
  testEmail: string;
  setTestEmail: (v: string) => void;
  testLoading: boolean;
  sendLoading: boolean;
  subscribers: Subscriber[];
  selectedIds: string[];
  setSelectedIds: React.Dispatch<React.SetStateAction<string[]>>;
  onSendTest: (e: React.FormEvent) => void;
  onSend: (e: React.FormEvent) => void;
  onCancel: () => void;
}) {
  const allSelected = props.subscribers.length > 0 && props.selectedIds.length === props.subscribers.length;

  return (
    <form onSubmit={props.onSend} className="space-y-6 rounded-xl border border-gray-200 bg-white p-4 sm:p-6">
      <h3 className="text-lg font-semibold text-gray-900">Compose campaign</h3>

      <motionTestSection
        testEmail={props.testEmail}
        setTestEmail={props.setTestEmail}
        testLoading={props.testLoading}
        onSendTest={props.onSendTest}
        canTest={Boolean(props.formData.subject.trim() && props.formData.message.trim())}
      />

      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Subject</label>
        <input
          value={props.formData.subject}
          onChange={(e) => props.setFormData((p) => ({ ...p, subject: e.target.value }))}
          maxLength={120}
          required
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Message</label>
        <textarea
          value={props.formData.message}
          onChange={(e) => props.setFormData((p) => ({ ...p, message: e.target.value }))}
          rows={8}
          required
          placeholder="Plain text or HTML. Blank lines become paragraphs in plain-text mode."
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <label className="flex items-center gap-2 text-sm font-medium text-gray-800">
        <input
          type="checkbox"
          checked={allSelected}
          onChange={(e) =>
            props.setSelectedIds(e.target.checked ? props.subscribers.map((s) => s.id) : [])
          }
          className="rounded border-gray-300"
        />
        Select all ({props.subscribers.length})
      </label>

      <div className="max-h-64 overflow-y-auto rounded-lg border border-gray-200 divide-y divide-gray-100">
        {props.subscribers.length === 0 ? (
          <p className="p-4 text-sm text-gray-500">No subscribers yet — import a CSV or add from future site signups.</p>
        ) : (
          props.subscribers.map((s) => (
            <label key={s.id} className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-50">
              <input
                type="checkbox"
                checked={props.selectedIds.includes(s.id)}
                onChange={(e) => {
                  props.setSelectedIds((ids) =>
                    e.target.checked ? [...ids, s.id] : ids.filter((id) => id !== s.id),
                  );
                }}
                className="rounded border-gray-300"
              />
              <span className="font-medium text-gray-900">{s.name || '—'}</span>
              <span className="text-gray-500">{s.email}</span>
            </label>
          ))
        )}
      </div>

      <p className="text-xs text-gray-500">
        {props.selectedIds.length} of {props.subscribers.length} selected · Sends via Resend with ColorAuto branding
      </p>

      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={props.sendLoading || !props.selectedIds.length}
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {props.sendLoading ? 'Sending…' : 'Send campaign'}
        </button>
        <button type="button" onClick={props.onCancel} className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700">
          Cancel
        </button>
      </div>
    </form>
  );
}

function motionTestSection({
  testEmail,
  setTestEmail,
  testLoading,
  onSendTest,
  canTest,
}: {
  testEmail: string;
  setTestEmail: (v: string) => void;
  testLoading: boolean;
  onSendTest: (e: React.FormEvent) => void;
  canTest: boolean;
}) {
  return (
    <motionForm className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4" onSubmit={onSendTest}>
      <p className="text-sm font-semibold text-gray-900">Send test email</p>
      <motionDiv className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
        <input
          type="email"
          placeholder="you@example.com"
          value={testEmail}
          onChange={(e) => setTestEmail(e.target.value)}
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={testLoading || !canTest}
          className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900 disabled:opacity-50"
        >
          {testLoading ? 'Sending…' : 'Send test'}
        </button>
      </motionDiv>
    </motionForm>
  );
}

function motionForm({
  children,
  className,
  onSubmit,
}: {
  children: React.ReactNode;
  className?: string;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <form className={className} onSubmit={onSubmit}>
      {children}
    </form>
  );
}

function motionDiv({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}
