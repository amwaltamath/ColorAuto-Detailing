import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { email, password, role: requestedRole } = await request.json();

    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'Email and password are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL ?? process.env.PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY ?? process.env.PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return new Response(JSON.stringify({ error: 'Auth service not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.session) {
      return new Response(JSON.stringify({ error: 'Invalid email or password' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const user = data.user;
    const role = user.user_metadata?.role || 'customer';

    // Block customers from employee login and vice versa
    if (requestedRole === 'employee' && role === 'customer') {
      return new Response(JSON.stringify({ error: 'Access denied. This account does not have employee access.' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({
        token: data.session.access_token,
        user: {
          id: user.id,
          email: user.email,
          name: user.user_metadata?.name || user.email?.split('@')[0] || '',
          role,
        },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
