import React, { useEffect, useState } from 'react';

interface ScheduleStats {
  today: number;
  completed: number;
  inProgress: number;
  scheduled: number;
}

export const DashboardStats = () => {
  const [stats, setStats] = useState<ScheduleStats>({
    today: 0,
    completed: 0,
    inProgress: 0,
    scheduled: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/employee/schedules');
        const data = await response.json();
        const schedules = data.schedules || [];

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const stats: ScheduleStats = {
          today: schedules.filter((s: any) => {
            const schedDate = new Date(s.scheduled_date);
            schedDate.setHours(0, 0, 0, 0);
            return schedDate.getTime() === today.getTime();
          }).length,
          completed: schedules.filter((s: any) => s.status === 'completed').length,
          inProgress: schedules.filter((s: any) => s.status === 'in_progress').length,
          scheduled: schedules.filter((s: any) => s.status === 'scheduled').length,
        };

        setStats(stats);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const StatCard = ({ label, value }: { label: string; value: number }) => (
    <div className="bg-slate-800 p-4 md:p-6 rounded-lg shadow-lg border border-slate-700 hover:border-slate-600 transition">
      <h2 className="text-lg md:text-2xl font-bold mb-1 md:mb-2 text-white">{value}</h2>
      <p className="text-xs md:text-base text-slate-300">{label}</p>
    </div>
  );

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
        <div className="bg-slate-800 p-4 md:p-6 rounded-lg shadow-lg border border-slate-700 animate-pulse">
          <div className="h-8 bg-slate-700 rounded w-12 mb-2"></div>
          <div className="h-4 bg-slate-700 rounded w-24"></div>
        </div>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-slate-800 p-4 md:p-6 rounded-lg shadow-lg border border-slate-700 animate-pulse hidden md:block">
            <div className="h-8 bg-slate-700 rounded w-12 mb-2"></div>
            <div className="h-4 bg-slate-700 rounded w-24"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
      <StatCard label="Today's Jobs" value={stats.today} />
      <StatCard label="Completed" value={stats.completed} />
      <StatCard label="In Progress" value={stats.inProgress} />
      <StatCard label="Scheduled" value={stats.scheduled} />
    </div>
  );
};
