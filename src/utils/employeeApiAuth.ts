import { supabaseServer } from './supabaseServer';

function getBearerToken(request: Request): string | null {
  const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
  if (!authHeader) return null;
  const [scheme, token] = authHeader.split(' ');
  if (!scheme || !token || scheme.toLowerCase() !== 'bearer') return null;
  return token;
}

export async function getAuthenticatedEmployee(
  request: Request,
): Promise<{ id: string; email?: string } | null> {
  if (!supabaseServer) return null;

  const token = getBearerToken(request);
  if (!token) return null;

  const { data: userData, error } = await supabaseServer.auth.getUser(token);
  const user = userData?.user;
  if (error || !user) return null;

  const role = (user.user_metadata?.role as string | undefined) || 'customer';
  if (role !== 'employee' && role !== 'admin') return null;

  return { id: user.id, email: user.email };
}

export function employeeAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('authToken');
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}
