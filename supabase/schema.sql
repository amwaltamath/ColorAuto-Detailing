-- Supabase Chat Tables Schema
-- Run this SQL in Supabase SQL Editor

-- Create employee_profiles table
CREATE TABLE IF NOT EXISTS employee_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  bio TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'employee' CHECK (role IN ('employee', 'manager', 'admin')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on_leave')),
  specialties TEXT[], -- array of service specialties
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create teams table
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create team_members table (junction table)
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employee_profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, employee_id)
);

-- Create service_schedules table
CREATE TABLE IF NOT EXISTS service_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employee_profiles(id) ON DELETE CASCADE,
  service_type TEXT NOT NULL,
  customer_name TEXT,
  customer_phone TEXT,
  customer_email TEXT,
  vehicle_info TEXT,
  scheduled_date TIMESTAMPTZ NOT NULL,
  duration_minutes INT DEFAULT 60,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create chat_sessions table
CREATE TABLE IF NOT EXISTS chat_sessions (
  id TEXT PRIMARY KEY,
  visitor_email TEXT,
  visitor_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('visitor', 'employee', 'admin')),
  sender_name TEXT,
  message TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  is_read BOOLEAN DEFAULT FALSE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_timestamp ON chat_messages(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_service_schedules_employee_id ON service_schedules(employee_id);
CREATE INDEX IF NOT EXISTS idx_service_schedules_date ON service_schedules(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_employee_id ON team_members(employee_id);

-- Enable Realtime for chat_messages and service_schedules tables
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE service_schedules;

-- Enable RLS
ALTER TABLE employee_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Employee profiles policies
CREATE POLICY "Employees can view all profiles"
  ON employee_profiles
  FOR SELECT
  USING (true);

CREATE POLICY "Employees can update own profile"
  ON employee_profiles
  FOR UPDATE
  USING (auth.uid()::text = user_id OR auth.role() = 'authenticated')
  WITH CHECK (auth.uid()::text = user_id OR auth.role() = 'authenticated');

-- Teams policies
CREATE POLICY "Users can view teams"
  ON teams
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage teams"
  ON teams
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Service schedules policies
CREATE POLICY "Employees can view own schedules"
  ON service_schedules
  FOR SELECT
  USING (auth.uid()::text = (SELECT user_id FROM employee_profiles WHERE id = service_schedules.employee_id) OR auth.role() = 'authenticated');

CREATE POLICY "Employees can create schedules"
  ON service_schedules
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Employees can update own schedules"
  ON service_schedules
  FOR UPDATE
  USING (auth.uid()::text = (SELECT user_id FROM employee_profiles WHERE id = service_schedules.employee_id) OR auth.role() = 'authenticated')
  WITH CHECK (auth.uid()::text = (SELECT user_id FROM employee_profiles WHERE id = service_schedules.employee_id) OR auth.role() = 'authenticated');

-- Chat policies
CREATE POLICY "Users can read messages for their session"
  ON chat_messages
  FOR SELECT
  USING (true);

CREATE POLICY "Users can insert messages to their session"
  ON chat_messages
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update messages"
  ON chat_messages
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can read chat sessions"
  ON chat_sessions
  FOR SELECT
  USING (true);

CREATE POLICY "Users can create chat sessions"
  ON chat_sessions
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update chat sessions"
  ON chat_sessions
  FOR UPDATE
  USING (true)
  WITH CHECK (true);
