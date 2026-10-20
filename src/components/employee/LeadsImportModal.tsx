import { useRef, useState } from 'react';

interface LeadsImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

type ImportResult = {
  ok?: boolean;
  imported?: number;
  skipped?: number;
  total_parsed?: number;
  parse_errors?: { row: number; error: string }[];
  insert_errors?: { external_id: string; error: string }[];
  headers?: string[];
  error?: string;
};

export function LeadsImportModal({ isOpen, onClose, onComplete }: LeadsImportModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [defaultSource, setDefaultSource] = useState('meta_ads');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  if (!isOpen) return null;

  const reset = () => {
    setFile(null);
    setResult(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleImport = async () => {
    if (!file) return;
    setSubmitting(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('default_source', defaultSource);

      const res = await fetch('/api/employee/leads-import', {
        method: 'POST',
        body: formData,
      });
      const data: ImportResult = await res.json();
      setResult(data);

      if (res.ok && (data.imported ?? 0) > 0) {
        onComplete();
      }
    } catch {
      setResult({ error: 'Upload failed — check your connection.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="px-5 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Import leads from CSV</h2>
          <button type="button" onClick={handleClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none" aria-label="Close">
            ×
          </button>
        </div>

        <div className="p-5 space-y-4 text-sm text-gray-700">
          <p>
            Export leads from <strong>Meta Ads Manager</strong> or Business Suite (Leads → Download), then upload the CSV here.
            Columns like <code className="text-xs bg-gray-100 px-1 rounded">full_name</code>,{' '}
            <code className="text-xs bg-gray-100 px-1 rounded">email</code>,{' '}
            <code className="text-xs bg-gray-100 px-1 rounded">phone_number</code>, and{' '}
            <code className="text-xs bg-gray-100 px-1 rounded">id</code> map automatically. Duplicates (same Meta lead ID) are skipped.
          </p>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Default source</label>
            <select
              value={defaultSource}
              onChange={(e) => setDefaultSource(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:border-blue-500 focus:outline-none"
            >
              <option value="meta_ads">Meta Ads</option>
              <option value="google_ads">Google Ads</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">CSV file</label>
            <input
              ref={inputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 file:font-medium hover:file:bg-blue-100"
            />
            {file && <p className="mt-1 text-xs text-gray-500">{file.name}</p>}
          </div>

          {result && (
            <div
              className={`rounded-lg border px-3 py-3 text-sm ${
                result.error && !result.imported
                  ? 'border-red-200 bg-red-50 text-red-800'
                  : 'border-green-200 bg-green-50 text-green-900'
              }`}
            >
              {result.error && !result.imported ? (
                <p>{result.error}</p>
              ) : (
                <>
                  <p className="font-medium">
                    Imported {result.imported ?? 0} lead{(result.imported ?? 0) === 1 ? '' : 's'}
                    {(result.skipped ?? 0) > 0 && ` · ${result.skipped} skipped (already in dashboard)`}
                  </p>
                  {(result.parse_errors?.length ?? 0) > 0 && (
                    <p className="mt-2 text-amber-800">
                      {result.parse_errors!.length} row(s) skipped during parse (missing name/email/phone).
                    </p>
                  )}
                  {(result.insert_errors?.length ?? 0) > 0 && (
                    <p className="mt-1 text-red-700">{result.insert_errors!.length} row(s) failed to save.</p>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t border-gray-200 flex gap-2 justify-end">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            {result?.imported ? 'Done' : 'Cancel'}
          </button>
          <button
            type="button"
            disabled={!file || submitting}
            onClick={handleImport}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
          >
            {submitting ? 'Importing…' : 'Import'}
          </button>
        </div>
      </div>
    </div>
  );
}
