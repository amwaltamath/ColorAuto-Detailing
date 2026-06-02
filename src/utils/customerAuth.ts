import { supabaseServer } from './supabaseServer';

type AuthCustomer = {
  authUserId: string;
  authEmail?: string;
  customerId: string | null;
};

function getBearerToken(request: Request): string | null {
  const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
  if (!authHeader) return null;
  const [scheme, token] = authHeader.split(' ');
  if (!scheme || !token) return null;
  if (scheme.toLowerCase() !== 'bearer') return null;
  return token;
}

export async function getAuthenticatedCustomer(request: Request): Promise<AuthCustomer | null> {
  if (!supabaseServer) return null;

  const token = getBearerToken(request);
  if (!token) return null;

  const { data: userData, error: userError } = await supabaseServer.auth.getUser(token);
  const authUser = userData?.user;
  if (userError || !authUser) return null;

  // Primary match: explicit auth link.
  let { data: customer } = await supabaseServer
    .from('crm_customers')
    .select('id, user_id, email')
    .eq('user_id', authUser.id)
    .maybeSingle();

  // Fallback match: email, useful for legacy CRM records created before auth linkage.
  if (!customer && authUser.email) {
    const { data: emailCustomer } = await supabaseServer
      .from('crm_customers')
      .select('id, user_id, email')
      .eq('email', authUser.email)
      .maybeSingle();

    customer = emailCustomer;

    // Auto-link matched legacy customer rows to this authenticated user.
    if (customer && !customer.user_id) {
      await supabaseServer
        .from('crm_customers')
        .update({ user_id: authUser.id })
        .eq('id', customer.id);
    }
  }

  return {
    authUserId: authUser.id,
    authEmail: authUser.email,
    customerId: customer?.id || null,
  };
}