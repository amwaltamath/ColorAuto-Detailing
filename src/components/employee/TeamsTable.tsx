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
        const response = await fetch('/api/employee/teams', {
          headers: { 'x-user-id': localStorage.getItem('user_id') || '' },
        });
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
    return (
      <div className="space-y-3 animate-pulse">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="h-4 w-36 bg-gray-200 rounded mb-2" />
            <div className="h-3 w-56 bg-gray-200 rounded mb-3" />
            <div className="h-3 w-20 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    );
  }

  // Mobile card view
  if (isMobile) {
    return (
      <div className="space-y-3">
        {teams.length === 0 ? (
          <div className="text-gray-500 text-center py-4 text-sm">You're not in any teams yet</div>
        ) : (
          teams.map((team) => (
            <div key={team.id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-gray-900 font-semibold mb-2 text-sm">{team.name}</h3>
              <p className="text-gray-600 text-sm mb-3">{team.description || 'No description'}</p>
              <button className="text-blue-600 hover:text-blue-700 text-xs font-medium">
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
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-4 text-gray-600 font-semibold">Team Name</th>
            <th className="text-left py-3 px-4 text-gray-600 font-semibold">Description</th>
            <th className="text-left py-3 px-4 text-gray-600 font-semibold">Action</th>
          </tr>
        </thead>
        <tbody>
          {teams.length === 0 ? (
            <tr>
              <td colSpan={3} className="py-4 px-4 text-center text-gray-500">
                You're not in any teams yet
              </td>
            </tr>
          ) : (
            teams.map((team) => (
              <tr key={team.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4 text-gray-900 font-medium">{team.name}</td>
                <td className="py-3 px-4 text-gray-600">{team.description || 'No description'}</td>
                <td className="py-3 px-4">
                  <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
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
