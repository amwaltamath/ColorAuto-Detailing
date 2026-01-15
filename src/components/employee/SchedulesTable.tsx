import { useEffect, useState } from 'react';

interface Schedule {
  id: string;
  service_type: string;
  customer_name: string;
  scheduled_date: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
}

export const SchedulesTable = () => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

    fetchSchedules();
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

  if (loading) {
    return <div className="text-slate-400">Loading schedules...</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-700">
            <th className="text-left py-3 px-4 text-slate-300 font-semibold">Service</th>
            <th className="text-left py-3 px-4 text-slate-300 font-semibold">Customer</th>
            <th className="text-left py-3 px-4 text-slate-300 font-semibold">Date & Time</th>
            <th className="text-left py-3 px-4 text-slate-300 font-semibold">Status</th>
          </tr>
        </thead>
        <tbody>
          {schedules.length === 0 ? (
            <tr>
              <td colSpan={4} className="py-4 px-4 text-center text-slate-400">
                No schedules yet
              </td>
            </tr>
          ) : (
            schedules.map((schedule) => (
              <tr key={schedule.id} className="border-b border-slate-700 hover:bg-slate-700/50">
                <td className="py-3 px-4 text-white">{schedule.service_type}</td>
                <td className="py-3 px-4 text-slate-300">{schedule.customer_name}</td>
                <td className="py-3 px-4 text-slate-300">
                  {new Date(schedule.scheduled_date).toLocaleDateString()} {new Date(schedule.scheduled_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </td>
                <td className="py-3 px-4">
                  <span className={`px-3 py-1 rounded border text-xs font-medium ${getStatusColor(schedule.status)}`}>
                    {schedule.status}
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};
