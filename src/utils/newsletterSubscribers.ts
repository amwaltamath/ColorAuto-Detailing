import { supabaseServer } from './supabaseServer';

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/** Add or refresh a marketing subscriber when we capture a lead with email. */
export async function upsertNewsletterFromLead(input: {
  name?: string | null;
  email?: string | null;
  source?: string | null;
}): Promise<void> {
  if (!supabaseServer) return;

  const email = input.email?.trim().toLowerCase();
  if (!email || !isValidEmail(email)) return;

  const name = input.name?.trim() || null;
  const source = input.source?.trim() || 'leads';

  const { error } = await supabaseServer.from('newsletter_subscribers').upsert(
    {
      email,
      name,
      email_opt_in: true,
      source,
    },
    { onConflict: 'email' },
  );

  if (error && !error.message.includes('newsletter_subscribers')) {
    console.error('[newsletter] upsert from lead failed:', error.message);
  }
}
