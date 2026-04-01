/**
 * Authentication utilities
 * Handles token management, session validation, and user authentication flows
 */

interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: 'customer' | 'employee' | 'admin';
  };
}

export async function loginUser(
  email: string,
  password: string,
  role: string
): Promise<AuthResponse> {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, role }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Authentication failed');
  }

  return data;
}

export function saveAuthToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('authToken', token);
  }
}

export function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('authToken');
  }
  return null;
}

export function clearAuthToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('authToken');
  }
}

export function isAuthenticated(): boolean {
  return getAuthToken() !== null;
}
