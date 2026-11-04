import { appendOrbisxLeadNote, createOrbisxLead } from './orbisx';
import { getTeamNotifyNumber, toE164Phone } from './quo';
import { supabaseServer } from './supabaseServer';

const ORBISX_ID_PREFIX = 'orbisx_lead_id:';

function last10(phone: string): string {
  return phone.replace(/\D/g, '').slice(-10);
}

function isStaffNotifyNumber(from: string): boolean {
  const notify = getTeamNotifyNumber();
  if (!notify) return false;
  const fromTail = last10(from);
  const notifyTail = last10(notify);
  return fromTail.length === 10 && fromTail === notifyTail;
}

export async function rememberOrbisxLeadId(leadId: string, orbisxId: string | number): Promise<void> {
  if (!supabaseServer) return;
  const { error } = await supabaseServer.from('lead_notes').insert({
    lead_id: leadId,
    author_name: 'orbisx',
    note: `${ORBISX_ID_PREFIX}${orbisxId}`,
  });
  if (error) console.error('[orbisx] Could not store lead id:', error.message);
}

async function findOrbisxId(leadId: string): Promise<string | undefined> {
  if (!supabaseServer) return undefined;
  const { data } = await supabaseServer
    .from('lead_notes')
    .select('note')
    .eq('lead_id', leadId)
    .eq('author_name', 'orbisx')
    .order('created_at', { ascending: false })
    .limit(5);

  for (const row of data || []) {
    if (typeof row.note === 'string' && row.note.startsWith(ORBISX_ID_PREFIX)) {
      return row.note.slice(ORBISX_ID_PREFIX.length);
    }
  }
  return undefined;
}

async function pushSmsToOrbisx(input: {
  appLeadId: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  source?: string | null;
  text: string;
}): Promise<void> {
  const existingId = await findOrbisxId(input.appLeadId);
  const stamp = new Date().toISOString().slice(0, 16).replace('T', ' ');

  if (existingId === 'pending') return;

  if (existingId) {
    const noted = await appendOrbisxLeadNote(existingId, `[Text message ${stamp}] ${input.text}`);
    if (!noted.ok) console.error('[sms-leads] OrbisX note failed:', noted.error);
    return;
  }

  const orbis = await createOrbisxLead({
    name: input.name,
    email: input.email,
    phone: input.phone,
    message: `[Text message]\n${input.text}`,
    source: input.source || 'phone',
    landingPage: 'quo_sms',
  });

  if (!orbis.ok) {
    console.error('[sms-leads] OrbisX create failed:', orbis.error);
    return;
  }

  await rememberOrbisxLeadId(input.appLeadId, orbis.leadId ?? 'pending');
}

/**
 * Save an inbound customer text on a lead and send it to OrbisX.
 * The first text from a number creates the lead. Later texts append to it.
 */
export async function ingestInboundSms(input: {
  from: string;
  text: string;
  contactName?: string | null;
}): Promise<{ ok: boolean; ignored?: boolean; leadId?: string; created?: boolean; error?: string }> {
  if (!supabaseServer) return { ok: false, error: 'Supabase not configured' };

  const text = input.text.trim();
  if (!text || !input.from?.trim()) return { ok: true, ignored: true };
  if (isStaffNotifyNumber(input.from)) return { ok: true, ignored: true };

  const e164 = toE164Phone(input.from) || input.from.trim();
  const externalId = `sms:${e164}`;
  const tail = last10(e164);

  const { data: byExternal } = await supabaseServer
    .from('leads')
    .select('id, name, email, phone, message, source')
    .eq('external_id', externalId)
    .maybeSingle();

  let lead = byExternal;
  if (!lead && tail.length === 10) {
    const { data: recent } = await supabaseServer
      .from('leads')
      .select('id, name, email, phone, message, source')
      .not('phone', 'is', null)
      .order('created_at', { ascending: false })
      .limit(300);
    lead = (recent || []).find((row) => row.phone && last10(row.phone) === tail) ?? null;
  }

  if (!lead) {
    const name = input.contactName?.trim() || `Text ${e164}`;
    const { data: created, error } = await supabaseServer
      .from('leads')
      .insert({
        name,
        phone: e164,
        source: 'phone',
        message: text,
        status: 'new',
        external_id: externalId,
        landing_page: 'quo_sms',
      })
      .select('id, name, email, phone, message, source')
      .single();

    if (error || !created) {
      console.error('[sms-leads] Insert failed:', error?.message);
      return { ok: false, error: error?.message || 'Insert failed' };
    }

    await pushSmsToOrbisx({
      appLeadId: created.id,
      name: created.name,
      phone: created.phone,
      source: 'phone',
      text,
    });

    return { ok: true, leadId: created.id, created: true };
  }

  const stamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
  const previous = lead.message?.trim() ? `${lead.message.trim()}\n\n` : '';
  await supabaseServer
    .from('leads')
    .update({
      message: `${previous}[${stamp}] ${text}`.slice(-8000),
      phone: lead.phone || e164,
      updated_at: new Date().toISOString(),
    })
    .eq('id', lead.id);

  await supabaseServer.from('lead_notes').insert({
    lead_id: lead.id,
    author_name: 'SMS',
    note: text,
  });

  await pushSmsToOrbisx({
    appLeadId: lead.id,
    name: lead.name || input.contactName?.trim() || `Text ${e164}`,
    email: lead.email,
    phone: lead.phone || e164,
    source: lead.source || 'phone',
    text,
  });

  return { ok: true, leadId: lead.id, created: false };
}
