import React, { useEffect, useState } from 'react';
import { useNativePush } from '../../utils/useNativePush';

interface ScheduleStats {
  today: number;
  completed: number;
  inProgress: number;
  scheduled: number;
}

export const DashboardStats = () => {
  useNativePush();
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

  const statCards = [
    { label: "Today's Jobs", value: stats.today, color: 'blue', icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
    )},
    { label: 'Completed', value: stats.completed, color: 'emerald', icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
    )},
    { label: 'In Progress', value: stats.inProgress, color: 'amber', icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182M2.985 19.644h4.992" /></svg>
    )},
    { label: 'Scheduled', value: stats.scheduled, color: 'purple', icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>
    )},
  ];

  const colorMap: Record<string, { border: string; iconBg: string; iconText: string; valueTxt: string }> = {
    blue:    { border: 'border-blue-500/30',    iconBg: 'bg-blue-500/10',    iconText: 'text-blue-400',    valueTxt: 'text-blue-50' },
    emerald: { border: 'border-emerald-500/30', iconBg: 'bg-emerald-500/10', iconText: 'text-emerald-400', valueTxt: 'text-emerald-50' },
    amber:   { border: 'border-amber-500/30',   iconBg: 'bg-amber-500/10',   iconText: 'text-amber-400',   valueTxt: 'text-amber-50' },
    purple:  { border: 'border-purple-500/30',  iconBg: 'bg-purple-500/10',  iconText: 'text-purple-400',  valueTxt: 'text-purple-50' },
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-slate-800/80 p-4 md:p-5 rounded-xl border border-slate-700/50 animate-pulse">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-slate-700"></div>
              <div className="h-3 bg-slate-700 rounded w-16"></div>
            </div>
            <div className="h-7 bg-slate-700 rounded w-10"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
      {statCards.map((card) => {
        const colors = colorMap[card.color];
        return (
          <div
            key={card.label}
            className={`relative overflow-hidden bg-slate-800/60 backdrop-blur-sm p-4 md:p-5 rounded-xl border ${colors.border} hover:border-opacity-60 transition-all duration-200 group`}
          >
            <div className="flex items-center gap-2.5 mb-3">
              <div className={`w-8 h-8 md:w-9 md:h-9 rounded-lg ${colors.iconBg} ${colors.iconText} flex items-center justify-center flex-shrink-0`}>
                {card.icon}
              </div>
              <p className="text-[11px] md:text-xs text-slate-400 font-medium leading-tight">{card.label}</p>
            </div>
            <p className={`text-2xl md:text-3xl font-bold ${colors.valueTxt} tracking-tight`}>{card.value}</p>
          </div>
        );
      })}
    </div>
  );
};
