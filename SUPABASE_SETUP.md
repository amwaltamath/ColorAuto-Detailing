# Supabase Setup Guide for ColorAuto Chat

## Environment Variables

Add these to your `.env.local`:

```bash
PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
PUBLIC_SUPABASE_ANON_KEY=sb_publishable_OfCOL2FiIIY2RGYAIPeNlw_QC_DY-UW
SUPABASE_SERVICE_ROLE_KEY=sb_secret_08lkvc6R4pdSYlh38Gv-Lw_MPHBemWT
```

**Important**: `SUPABASE_SERVICE_ROLE_KEY` is server-only (no `PUBLIC_` prefix) — never expose it to the browser.

## Vercel Deployment

Add to **Vercel Project → Settings → Environment Variables**:

- `PUBLIC_SUPABASE_URL` - Your project URL
- `PUBLIC_SUPABASE_ANON_KEY` - Anon/publishable key
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (for server endpoints)

## Database Setup

1. **Create Tables**: 
   - Go to Supabase → SQL Editor
   - Run the SQL from `supabase/schema.sql`
   - This creates:
     - `chat_sessions` - tracks visitor sessions
     - `chat_messages` - stores all messages

2. **Enable Realtime**:
   - Go to Supabase → Realtime
   - Find `chat_messages` table
   - Click to enable if not already enabled
   - This allows real-time message delivery to browsers

3. **Row Level Security (RLS)**:
   - The schema includes basic RLS policies
   - Anonymous users can read/write their own session messages
   - Authenticated users (employees) can update messages

## Testing

Once configured:

```bash
npm run dev
```

Then:
1. Open `http://localhost:4321/` → See chat widget
2. Send a test message from visitor
3. Open `/employee/dashboard` → See session + respond
4. Visitor chat auto-updates when employee responds (real-time)

## Troubleshooting

**Messages not appearing?**
- Check Supabase SQL Editor: `SELECT * FROM chat_messages;`
- Verify `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_ANON_KEY` are set
- Check browser console for errors

**Realtime not working?**
- Go to Supabase → Realtime → verify `chat_messages` is enabled
- Restart dev server (`Ctrl+C`, then `npm run dev`)
- Check RLS policies allow anonymous reads

**Can't connect to Supabase?**
- Verify `PUBLIC_SUPABASE_URL` is correct (should start with `https://`)
- Check API keys are exact matches
- Ensure no extra spaces in `.env.local`

## Production Checklist

- [ ] Added `PUBLIC_SUPABASE_URL` to Vercel
- [ ] Added `PUBLIC_SUPABASE_ANON_KEY` to Vercel
- [ ] Added `SUPABASE_SERVICE_ROLE_KEY` to Vercel (not prefixed with PUBLIC_)
- [ ] Ran SQL schema in Supabase production DB
- [ ] Enabled Realtime on `chat_messages`
- [ ] Tested chat end-to-end on staging
- [ ] Deployed to Vercel

## Next Steps

- Add email notifications when new messages arrive (already coded, just needs to be wired)
- Add customer session history/archive
- Add admin controls (delete sessions, mark resolved)
- Add file uploads to chat
