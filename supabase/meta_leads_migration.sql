-- Meta Instant Form leads (webhook deduplication)
-- Run once in Supabase SQL Editor if your project was created before this column existed.

ALTER TABLE leads ADD COLUMN IF NOT EXISTS external_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_leads_external_id ON leads (external_id) WHERE external_id IS NOT NULL;
