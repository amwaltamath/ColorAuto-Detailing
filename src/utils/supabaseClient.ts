import { createClient } from '@supabase/supabase-js';
import { sanitizeEnv } from './envSanitize';

const supabaseUrl = sanitizeEnv(import.meta.env.PUBLIC_SUPABASE_URL as string | undefined);
const supabaseAnonKey = sanitizeEnv(import.meta.env.PUBLIC_SUPABASE_ANON_KEY as string | undefined);

export const supabaseBrowser = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : undefined;

if (!supabaseBrowser) {
  // eslint-disable-next-line no-console
  console.warn('Supabase client not configured: set PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY');
}
