import type { APIRoute } from 'astro';
import { supabaseServer } from '../../../utils/supabaseServer';

export const GET: APIRoute = async (context) => {
  if (!supabaseServer) {
    return new Response(JSON.stringify({ error: 'Database not configured' }), { status: 503 });
  }

  try {
    const userId = context.request.headers.get('x-user-id');
    if (!userId) {
      return new Response(JSON.stringify({ error: 'User ID required' }), { status: 400 });
    }

    const { data, error } = await supabaseServer
      .from('employee_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 400 });
    }

    return new Response(JSON.stringify(data), { status: 200 });
  } catch (err) {
    console.error('Error fetching profile:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
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

    // Check if profile exists
    const { data: existing } = await supabaseServer
      .from('employee_profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (existing) {
      // Update existing profile
      const { data, error } = await supabaseServer
        .from('employee_profiles')
        .update(body)
        .eq('user_id', userId)
        .select();

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 400 });
      }

      return new Response(JSON.stringify(data[0]), { status: 200 });
    } else {
      // Create new profile
      const { data, error } = await supabaseServer
        .from('employee_profiles')
        .insert([{ ...body, user_id: userId }])
        .select();

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 400 });
      }

      return new Response(JSON.stringify(data[0]), { status: 201 });
    }
  } catch (err) {
    console.error('Error saving profile:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
};
