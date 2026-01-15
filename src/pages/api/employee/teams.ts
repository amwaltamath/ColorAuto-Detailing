import type { APIRoute } from 'astro';
import { supabaseServer } from '../../../utils/supabaseServer';

export const GET: APIRoute = async (context) => {
  if (!supabaseServer) {
    return new Response(JSON.stringify({ teams: [] }), { status: 200 });
  }

  try {
    const userId = context.request.headers.get('x-user-id');
    if (!userId) {
      return new Response(JSON.stringify({ error: 'User ID required' }), { status: 400 });
    }

    // Get employee profile
    const { data: profile, error: profileError } = await supabaseServer
      .from('employee_profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (profileError || !profile) {
      return new Response(JSON.stringify({ teams: [] }), { status: 200 });
    }

    // Get teams for this employee
    const { data: memberData, error: memberError } = await supabaseServer
      .from('team_members')
      .select('team_id')
      .eq('employee_id', profile.id);

    if (memberError) {
      return new Response(JSON.stringify({ teams: [] }), { status: 200 });
    }

    const teamIds = memberData?.map(m => m.team_id) || [];
    
    if (teamIds.length === 0) {
      return new Response(JSON.stringify({ teams: [] }), { status: 200 });
    }

    // Get team details
    const { data: teams, error: teamsError } = await supabaseServer
      .from('teams')
      .select('*')
      .in('id', teamIds);

    if (teamsError) {
      return new Response(JSON.stringify({ teams: [] }), { status: 200 });
    }

    return new Response(JSON.stringify({ teams: teams || [] }), { status: 200 });
  } catch (err) {
    console.error('Error fetching teams:', err);
    return new Response(JSON.stringify({ teams: [] }), { status: 200 });
  }
};
