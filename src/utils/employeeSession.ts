/** Supabase Auth user id for employee API headers (x-user-id). */
export function getEmployeeUserId(): string {
  if (typeof window === 'undefined') return '';

  const stored = (localStorage.getItem('user_id') || '').replace(/\r/g, '').trim();
  if (stored) return stored;

  const token = (localStorage.getItem('authToken') || '').replace(/\r/g, '').trim();
  if (!token) return '';

  try {
    const payload = JSON.parse(atob(token.split('.')[1] || '')) as { sub?: string };
    const sub = payload.sub?.trim();
    if (sub) {
      localStorage.setItem('user_id', sub);
      return sub;
    }
  } catch {
    // ignore invalid token
  }

  return '';
}

export function persistUserSession(user: { id: string; role: string }): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('user_id', user.id);
  localStorage.setItem('userRole', user.role);
}

export function clearUserSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('user_id');
  localStorage.removeItem('userRole');
}
