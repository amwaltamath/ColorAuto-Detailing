import { useEffect, useState } from 'react';
import { ScheduleModal } from './ScheduleModal';

interface Schedule {
  id: string;
  service_type: string;
  customer_name: string;
  customer_phone?: string;
  customer_email?: string;
  scheduled_date: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
}

export const SchedulesTable = () => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchSchedules = async () => {
    try {
      const response = await fetch('/api/employee/schedules', {
        headers: { 'x-user-id': localStorage.getItem('user_id') || '' },
      });
      const data = await response.json();
      setSchedules(data.schedules || []);
    } catch (error) {
      console.error('Error fetching schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
    const interval = setInterval(fetchSchedules, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-50 border-blue-200 text-blue-700';
      case 'in_progress':
        return 'bg-yellow-50 border-yellow-200 text-yellow-700';
      case 'completed':
        return 'bg-green-50 border-green-200 text-green-700';
      case 'cancelled':
        return 'bg-red-50 border-red-200 text-red-700';
      default:
        return 'bg-gray-100 border-gray-200 text-gray-600';
    }
  };

  const handleSaveSchedule = async (formData: any) => {
    setIsSubmitting(true);
    try {
      const method = selectedSchedule ? 'PUT' : 'POST';
      const response = await fetch('/api/employee/schedules', {
        method,
        headers: { 'Content-Type': 'application/json', 'x-user-id': localStorage.getItem('user_id') || '' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to save schedule');
      
      const data = await response.json();
      
      if (selectedSchedule) {
        setSchedules(schedules.map(s => s.id === data.schedule.id ? data.schedule : s));
      } else {
        setSchedules([...schedules, data.schedule]);
      }
      
      setModalOpen(false);
      setSelectedSchedule(undefined);
    } catch (error) {
      console.error('Error saving schedule:', error);
      alert('Failed to save schedule');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (scheduleId: string, newStatus: string) => {
    try {
      const response = await fetch('/api/employee/schedules', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-user-id': localStorage.getItem('user_id') || '' },
        body: JSON.stringify({ id: scheduleId, status: newStatus }),
      });

      if (!response.ok) throw new Error('Failed to update status');
      
      const data = await response.json();
      setSchedules(schedules.map(s => s.id === data.schedule.id ? data.schedule : s));
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    if (!confirm('Are you sure you want to delete this schedule?')) return;

    try {
      const response = await fetch(`/api/employee/schedules/${scheduleId}`, {
        method: 'DELETE',
        headers: { 'x-user-id': localStorage.getItem('user_id') || '' },
      });

      if (!response.ok) throw new Error('Failed to delete schedule');
      
      setSchedules(schedules.filter(s => s.id !== scheduleId));
    } catch (error) {
      console.error('Error deleting schedule:', error);
      alert('Failed to delete schedule');
    }
  };

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-9 w-36 bg-gray-200 rounded" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex justify-between items-center mb-3">
              <div className="h-4 w-32 bg-gray-200 rounded" />
              <div className="h-6 w-20 bg-gray-200 rounded-full" />
            </div>
            <div className="space-y-2">
              <div className="h-3 w-48 bg-gray-200 rounded" />
              <div className="h-3 w-36 bg-gray-200 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Mobile card view
  if (isMobile) {
    return (
      <>
        <div className="space-y-3">
          <button
            onClick={() => {
              setSelectedSchedule(undefined);
              setModalOpen(true);
            }}
            className="w-full mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm font-medium"
          >
            + Add Schedule
          </button>
          {schedules.length === 0 ? (
            <div className="text-gray-500 text-center py-4 text-sm">No schedules yet</div>
          ) : (
            schedules.map((schedule) => (
              <div key={schedule.id} className="bg-white p-3 md:p-4 rounded-lg border border-gray-200 shadow-sm">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-gray-900 font-semibold text-sm">{schedule.service_type}</h3>
                  <select
                    value={schedule.status}
                    onChange={(e) => handleStatusChange(schedule.id, e.target.value)}
                    className={`px-2 py-1 rounded border text-xs font-medium focus:outline-none cursor-pointer ${getStatusColor(schedule.status)}`}
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <p className="text-gray-700 text-sm mb-1">👤 {schedule.customer_name}</p>
                {schedule.customer_phone && (
                  <p className="text-gray-500 text-xs mb-1">📞 {schedule.customer_phone}</p>
                )}
                <p className="text-gray-500 text-xs mb-3">
                  🕐 {new Date(schedule.scheduled_date).toLocaleDateString()} {new Date(schedule.scheduled_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedSchedule(schedule);
                      setModalOpen(true);
                    }}
                    className="flex-1 px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200 transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteSchedule(schedule.id)}
                    className="flex-1 px-2 py-1 bg-red-900/50 text-red-300 rounded text-xs hover:bg-red-900 transition border border-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <ScheduleModal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setSelectedSchedule(undefined);
          }}
          onSave={handleSaveSchedule}
          schedule={selectedSchedule}
        />
      </>
    );
  }

  // Desktop table view
  return (
    <>
      <div className="mb-4">
        <button
          onClick={() => {
            setSelectedSchedule(undefined);
            setModalOpen(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm font-medium"
        >
          + Add Schedule
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 text-gray-600 font-semibold">Service</th>
              <th className="text-left py-3 px-4 text-gray-600 font-semibold">Customer</th>
              <th className="text-left py-3 px-4 text-gray-600 font-semibold">Date & Time</th>
              <th className="text-left py-3 px-4 text-gray-600 font-semibold">Status</th>
              <th className="text-left py-3 px-4 text-gray-600 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {schedules.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-4 px-4 text-center text-gray-500">
                  No schedules yet
                </td>
              </tr>
            ) : (
              schedules.map((schedule) => (
                <tr key={schedule.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-gray-900">{schedule.service_type}</td>
                  <td className="py-3 px-4 text-gray-700">
                    <div>{schedule.customer_name}</div>
                    {schedule.customer_phone && (
                      <div className="text-xs text-gray-500">{schedule.customer_phone}</div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-gray-700">
                    {new Date(schedule.scheduled_date).toLocaleDateString()} {new Date(schedule.scheduled_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-3 px-4">
                    <select
                      value={schedule.status}
                      onChange={(e) => handleStatusChange(schedule.id, e.target.value)}
                      className={`px-2 py-1 rounded border text-xs font-medium focus:outline-none cursor-pointer ${getStatusColor(schedule.status)}`}
                    >
                      <option value="scheduled">Scheduled</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td className="py-3 px-4 space-x-2">
                    <button
                      onClick={() => {
                        setSelectedSchedule(schedule);
                        setModalOpen(true);
                      }}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200 transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteSchedule(schedule.id)}
                      className="px-3 py-1 bg-red-900/50 text-red-300 rounded text-xs hover:bg-red-900 transition border border-red-700"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ScheduleModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedSchedule(undefined);
        }}
        onSave={handleSaveSchedule}
        schedule={selectedSchedule}
      />
    </>
  );
};
