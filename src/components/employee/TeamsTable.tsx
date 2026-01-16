import { useEffect, useState } from 'react';

interface Team {
  id: string;
  name: string;
  description: string;
}

export const TeamsTable = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await fetch('/api/employee/teams');
        const data = await response.json();
        setTeams(data.teams || []);
      } catch (error) {
        console.error('Error fetching teams:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, []);

  if (loading) {
    return <div className="text-slate-400 text-sm md:text-base">Loading teams...</div>;
  }

  // Mobile card view
  if (isMobile) {
    return (
      <div className="space-y-3">
        {teams.length === 0 ? (
          <div className="text-slate-400 text-center py-4 text-sm">You're not in any teams yet</div>
        ) : (
          teams.map((team) => (
            <div key={team.id} className="bg-slate-700/50 p-4 rounded border border-slate-600">
              <h3 className="text-white font-semibold mb-2 text-sm">{team.name}</h3>
              <p className="text-slate-300 text-sm mb-3">{team.description || 'No description'}</p>
              <button className="text-blue-400 hover:text-blue-300 text-xs font-medium">
                View Details →
              </button>
            </div>
          ))
        )}
      </div>
    );
  }

  // Desktop table view
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-700">
            <th className="text-left py-3 px-4 text-slate-300 font-semibold">Team Name</th>
            <th className="text-left py-3 px-4 text-slate-300 font-semibold">Description</th>
            <th className="text-left py-3 px-4 text-slate-300 font-semibold">Action</th>
          </tr>
        </thead>
        <tbody>
          {teams.length === 0 ? (
            <tr>
              <td colSpan={3} className="py-4 px-4 text-center text-slate-400">
                You're not in any teams yet
              </td>
            </tr>
          ) : (
            teams.map((team) => (
              <tr key={team.id} className="border-b border-slate-700 hover:bg-slate-700/50">
                <td className="py-3 px-4 text-white font-medium">{team.name}</td>
                <td className="py-3 px-4 text-slate-300">{team.description || 'No description'}</td>
                <td className="py-3 px-4">
                  <button className="text-blue-400 hover:text-blue-300 text-sm font-medium">
                    View Details
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};
