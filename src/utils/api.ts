/**
 * API client for server-side requests
 * Used in Astro endpoints and server-side operations
 */

const API_BASE = process.env.API_URL || 'http://localhost:3001/api';

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }

  return response.json();
}

export async function getBookings(userId: string, token: string) {
  return apiFetch(`/bookings/${userId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function createBooking(bookingData: any, token: string) {
  return apiFetch('/bookings', {
    method: 'POST',
    body: JSON.stringify(bookingData),
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}
