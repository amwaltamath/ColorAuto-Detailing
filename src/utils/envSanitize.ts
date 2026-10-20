/** Strip whitespace and Windows CR from Vercel/env pasted values (breaks Supabase Realtime if left in API keys). */
export function sanitizeEnv(value: string | undefined): string | undefined {
  if (value == null || value === '') return undefined;
  const cleaned = value.replace(/\r/g, '').trim();
  return cleaned || undefined;
}
