-- Email marketing (employee dashboard campaigns — run once in Supabase SQL editor)

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  email_opt_in BOOLEAN NOT NULL DEFAULT true,
  source TEXT DEFAULT 'import',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_email ON newsletter_subscribers (LOWER(email));
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_opt_in ON newsletter_subscribers (email_opt_in) WHERE email_opt_in = true;

CREATE TABLE IF NOT EXISTS email_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  sent_count INT NOT NULL DEFAULT 0,
  failed_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  created_by UUID
);

ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS; policies allow authenticated staff if you query from the client later.
DROP POLICY IF EXISTS "Authenticated read newsletter_subscribers" ON newsletter_subscribers;
CREATE POLICY "Authenticated read newsletter_subscribers" ON newsletter_subscribers
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated manage newsletter_subscribers" ON newsletter_subscribers;
CREATE POLICY "Authenticated manage newsletter_subscribers" ON newsletter_subscribers
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated manage email_campaigns" ON email_campaigns;
CREATE POLICY "Authenticated manage email_campaigns" ON email_campaigns
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
