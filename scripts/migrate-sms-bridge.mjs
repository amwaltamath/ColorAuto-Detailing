const sql = `CREATE TABLE IF NOT EXISTS chat_sms_bridge (
  phone_number TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE chat_sms_bridge ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY sms_bridge_all ON chat_sms_bridge FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;`;

// Try the Supabase Management API
const projectRef = 'brkxnkhjhhukdfeosuvc';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJya3hua2hqaGh1a2RmZW9zdXZjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODM5OTUwOCwiZXhwIjoyMDgzOTc1NTA4fQ.BackJ3y2Ps05RZEkBjnNv3Hd0ciyyd8qvbGZcsE_YaA';

// Approach: use the pg-meta SQL endpoint
fetch(`https://${projectRef}.supabase.co/pg/query`, {
  method: 'POST',
  headers: {
    'apikey': serviceRoleKey,
    'Authorization': `Bearer ${serviceRoleKey}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ query: sql }),
}).then(async (r) => {
  console.log('Status:', r.status);
  const t = await r.text();
  console.log(t);
}).catch((e) => console.error(e));
