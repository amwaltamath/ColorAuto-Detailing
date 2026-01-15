import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL as string | undefined;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string | undefined;

export const supabaseServer = supabaseUrl && serviceKey
  ? createClient(supabaseUrl, serviceKey)
  : undefined;

if (!supabaseServer) {
  // eslint-disable-next-line no-console
  console.warn('Supabase server not configured: set PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
}
