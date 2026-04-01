import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/auth/seed-admin
 * Creates an admin user or promotes an existing user to admin/employee role.
 * Requires SUPABASE_SERVICE_ROLE_KEY (server-side only).
 * 
 * Body: { email, password, name?, role? }
 * - role defaults to 'admin'
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const { email, password, name, role = 'admin' } = await request.json();

    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'Email and password are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!['employee', 'admin'].includes(role)) {
      return new Response(JSON.stringify({ error: 'Role must be employee or admin' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL ?? process.env.PUBLIC_SUPABASE_URL;
    const serviceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      return new Response(JSON.stringify({ error: 'Supabase service role key not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    // Check if user already exists by listing users
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find((u) => u.email === email);

    if (existingUser) {
      // Promote existing user to the requested role
      const { data: updated, error: updateError } = await supabase.auth.admin.updateUserById(
        existingUser.id,
        {
          user_metadata: {
            ...existingUser.user_metadata,
            name: name || existingUser.user_metadata?.name || email.split('@')[0],
            role,
          },
        }
      );

      if (updateError) {
        return new Response(JSON.stringify({ error: updateError.message }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return new Response(
        JSON.stringify({
          message: `User ${email} promoted to ${role}`,
          user: {
            id: updated.user.id,
            email: updated.user.email,
            role,
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create new user with admin API (bypasses email confirmation)
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name: name || email.split('@')[0],
        role,
      },
    });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({
        message: `Admin user created: ${email}`,
        user: {
          id: data.user.id,
          email: data.user.email,
          role,
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
