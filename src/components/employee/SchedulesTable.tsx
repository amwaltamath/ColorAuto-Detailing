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
      const response = await fetch('/api/employee/schedules');
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
        return 'bg-blue-900/50 border-blue-500 text-blue-300';
      case 'in_progress':
        return 'bg-yellow-900/50 border-yellow-500 text-yellow-300';
      case 'completed':
        return 'bg-green-900/50 border-green-500 text-green-300';
      case 'cancelled':
        return 'bg-red-900/50 border-red-500 text-red-300';
      default:
        return 'bg-slate-700 border-slate-600 text-slate-300';
    }
  };

  const handleSaveSchedule = async (formData: any) => {
    setIsSubmitting(true);
    try {
      const method = selectedSchedule ? 'PUT' : 'POST';
      const response = await fetch('/api/employee/schedules', {
        method,
        headers: { 'Content-Type': 'application/json' },
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
        headers: { 'Content-Type': 'application/json' },
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
      });

      if (!response.ok) throw new Error('Failed to delete schedule');
      
      setSchedules(schedules.filter(s => s.id !== scheduleId));
    } catch (error) {
      console.error('Error deleting schedule:', error);
      alert('Failed to delete schedule');
    }
  };

  if (loading) {
    return <div className="text-slate-400 text-sm md:text-base">Loading schedules...</div>;
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
            <div className="text-slate-400 text-center py-4 text-sm">No schedules yet</div>
          ) : (
            schedules.map((schedule) => (
              <div key={schedule.id} className="bg-slate-700/50 p-3 md:p-4 rounded border border-slate-600">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-white font-semibold text-sm">{schedule.service_type}</h3>
                  <select
                    value={schedule.status}
                    onChange={(e) => handleStatusChange(schedule.id, e.target.value)}
                    className={`px-2 py-1 rounded border text-xs font-medium bg-slate-600 text-white focus:outline-none cursor-pointer ${getStatusColor(schedule.status)}`}
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <p className="text-slate-300 text-sm mb-1">👤 {schedule.customer_name}</p>
                {schedule.customer_phone && (
                  <p className="text-slate-400 text-xs mb-1">📞 {schedule.customer_phone}</p>
                )}
                <p className="text-slate-400 text-xs mb-3">
                  🕐 {new Date(schedule.scheduled_date).toLocaleDateString()} {new Date(schedule.scheduled_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedSchedule(schedule);
                      setModalOpen(true);
                    }}
                    className="flex-1 px-2 py-1 bg-slate-700 text-slate-300 rounded text-xs hover:bg-slate-600 transition"
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
            <tr className="border-b border-slate-700">
              <th className="text-left py-3 px-4 text-slate-300 font-semibold">Service</th>
              <th className="text-left py-3 px-4 text-slate-300 font-semibold">Customer</th>
              <th className="text-left py-3 px-4 text-slate-300 font-semibold">Date & Time</th>
              <th className="text-left py-3 px-4 text-slate-300 font-semibold">Status</th>
              <th className="text-left py-3 px-4 text-slate-300 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {schedules.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-4 px-4 text-center text-slate-400">
                  No schedules yet
                </td>
              </tr>
            ) : (
              schedules.map((schedule) => (
                <tr key={schedule.id} className="border-b border-slate-700 hover:bg-slate-700/50">
                  <td className="py-3 px-4 text-white">{schedule.service_type}</td>
                  <td className="py-3 px-4 text-slate-300">
                    <div>{schedule.customer_name}</div>
                    {schedule.customer_phone && (
                      <div className="text-xs text-slate-400">{schedule.customer_phone}</div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-300">
                    {new Date(schedule.scheduled_date).toLocaleDateString()} {new Date(schedule.scheduled_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-3 px-4">
                    <select
                      value={schedule.status}
                      onChange={(e) => handleStatusChange(schedule.id, e.target.value)}
                      className={`px-2 py-1 rounded border text-xs font-medium bg-slate-600 text-white focus:outline-none cursor-pointer ${getStatusColor(schedule.status)}`}
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
                      className="px-3 py-1 bg-slate-700 text-slate-300 rounded text-xs hover:bg-slate-600 transition"
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
