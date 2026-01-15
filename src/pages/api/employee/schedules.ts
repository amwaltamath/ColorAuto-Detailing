import type { APIRoute } from 'astro';
import { supabaseServer } from '../../../utils/supabaseServer';

export const GET: APIRoute = async (context) => {
  if (!supabaseServer) {
    return new Response(JSON.stringify({ schedules: [] }), { status: 200 });
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
      return new Response(JSON.stringify({ schedules: [] }), { status: 200 });
    }

    // Get schedules for this employee
    const { data: schedules, error: schedulesError } = await supabaseServer
      .from('service_schedules')
      .select('*')
      .eq('employee_id', profile.id)
      .order('scheduled_date', { ascending: true });

    if (schedulesError) {
      return new Response(JSON.stringify({ error: schedulesError.message }), { status: 400 });
    }

    return new Response(JSON.stringify({ schedules: schedules || [] }), { status: 200 });
  } catch (err) {
    console.error('Error fetching schedules:', err);
    return new Response(JSON.stringify({ schedules: [] }), { status: 200 });
  }
};

export const POST: APIRoute = async (context) => {
  if (!supabaseServer) {
    return new Response(JSON.stringify({ error: 'Database not configured' }), { status: 503 });
  }

  try {
    const body = await context.request.json();
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
      return new Response(JSON.stringify({ error: 'Employee profile not found' }), { status: 404 });
    }

    // Create schedule
    const { data: schedule, error: scheduleError } = await supabaseServer
      .from('service_schedules')
      .insert([{ ...body, employee_id: profile.id }])
      .select();

    if (scheduleError) {
      return new Response(JSON.stringify({ error: scheduleError.message }), { status: 400 });
    }

    return new Response(JSON.stringify(schedule[0]), { status: 201 });
  } catch (err) {
    console.error('Error creating schedule:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
};
