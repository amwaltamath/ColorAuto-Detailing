import React, { useState, useEffect } from 'react';

interface ScheduleData {
  id?: string;
  service_type: string;
  customer_name: string;
  customer_phone?: string;
  customer_email?: string;
  scheduled_date: string;
  notes?: string;
  status?: string;
}

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (schedule: ScheduleData) => void;
  schedule?: ScheduleData;
}

export const ScheduleModal: React.FC<ScheduleModalProps> = ({
  isOpen,
  onClose,
  onSave,
  schedule,
}) => {
  const [formData, setFormData] = useState<ScheduleData>({
    service_type: 'auto-detailing',
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    scheduled_date: '',
    notes: '',
    status: 'scheduled',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (schedule) {
      setFormData(schedule);
    } else {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setFormData({
        service_type: 'auto-detailing',
        customer_name: '',
        customer_phone: '',
        customer_email: '',
        scheduled_date: tomorrow.toISOString().split('T')[0],
        notes: '',
        status: 'scheduled',
      });
    }
    setErrors({});
  }, [schedule, isOpen]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.customer_name.trim()) newErrors.customer_name = 'Customer name is required';
    if (!formData.scheduled_date) newErrors.scheduled_date = 'Date is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      onSave(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg shadow-xl max-w-md w-full border border-slate-700">
        {/* Header */}
        <div className="bg-slate-850 px-4 md:px-6 py-3 md:py-4 border-b border-slate-700 flex items-center justify-between">
          <h2 className="text-lg md:text-xl font-bold text-white">
            {schedule ? 'Edit Schedule' : 'Create Schedule'}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition p-1"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-4">
          {/* Service Type */}
          <div>
            <label className="block text-xs md:text-sm font-semibold text-slate-300 mb-1">
              Service Type
            </label>
            <select
              name="service_type"
              value={formData.service_type}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-600 rounded bg-slate-700 text-slate-100 text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="auto-detailing">Auto Detailing</option>
              <option value="ceramic-coating">Ceramic Coating</option>
              <option value="paint-protection">Paint Protection Film</option>
              <option value="window-tinting">Window Tinting</option>
              <option value="paint-correction">Paint Correction</option>
            </select>
          </div>

          {/* Customer Name */}
          <div>
            <label className="block text-xs md:text-sm font-semibold text-slate-300 mb-1">
              Customer Name *
            </label>
            <input
              type="text"
              name="customer_name"
              value={formData.customer_name}
              onChange={handleChange}
              placeholder="Enter customer name"
              className={`w-full px-3 py-2 border rounded bg-slate-700 text-slate-100 text-sm focus:outline-none ${
                errors.customer_name ? 'border-red-500' : 'border-slate-600 focus:border-blue-500'
              }`}
            />
            {errors.customer_name && (
              <p className="text-red-400 text-xs mt-1">{errors.customer_name}</p>
            )}
          </div>

          {/* Customer Phone */}
          <div>
            <label className="block text-xs md:text-sm font-semibold text-slate-300 mb-1">
              Phone
            </label>
            <input
              type="tel"
              name="customer_phone"
              value={formData.customer_phone || ''}
              onChange={handleChange}
              placeholder="(555) 123-4567"
              className="w-full px-3 py-2 border border-slate-600 rounded bg-slate-700 text-slate-100 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Customer Email */}
          <div>
            <label className="block text-xs md:text-sm font-semibold text-slate-300 mb-1">
              Email
            </label>
            <input
              type="email"
              name="customer_email"
              value={formData.customer_email || ''}
              onChange={handleChange}
              placeholder="customer@example.com"
              className="w-full px-3 py-2 border border-slate-600 rounded bg-slate-700 text-slate-100 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs md:text-sm font-semibold text-slate-300 mb-1">
              Date *
            </label>
            <input
              type="date"
              name="scheduled_date"
              value={formData.scheduled_date}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded bg-slate-700 text-slate-100 text-sm focus:outline-none ${
                errors.scheduled_date ? 'border-red-500' : 'border-slate-600 focus:border-blue-500'
              }`}
            />
            {errors.scheduled_date && (
              <p className="text-red-400 text-xs mt-1">{errors.scheduled_date}</p>
            )}
          </div>

          {/* Status */}
          {schedule && (
            <div>
              <label className="block text-xs md:text-sm font-semibold text-slate-300 mb-1">
                Status
              </label>
              <select
                name="status"
                value={formData.status || 'scheduled'}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-600 rounded bg-slate-700 text-slate-100 text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="scheduled">Scheduled</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs md:text-sm font-semibold text-slate-300 mb-1">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes || ''}
              onChange={handleChange}
              placeholder="Add any special instructions..."
              rows={3}
              className="w-full px-3 py-2 border border-slate-600 rounded bg-slate-700 text-slate-100 text-sm focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-600 text-slate-300 rounded hover:bg-slate-700 transition text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-slate-700 transition text-sm font-medium"
            >
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
