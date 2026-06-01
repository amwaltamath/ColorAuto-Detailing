-- ============================================================
-- CRM Schema — Color Auto Detailing
-- Apply in Supabase SQL Editor after schema.sql
-- ============================================================

-- Customers (CRM records, can optionally link to auth users via user_id)
CREATE TABLE IF NOT EXISTS crm_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT UNIQUE,                                    -- auth UID when customer registers
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  source TEXT DEFAULT 'website' CHECK (source IN ('website', 'phone', 'walk_in', 'referral', 'google_ads', 'meta_ads', 'other')),
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vehicles linked to a customer
CREATE TABLE IF NOT EXISTS crm_vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES crm_customers(id) ON DELETE CASCADE,
  year TEXT,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  trim TEXT,
  color TEXT,
  vin TEXT,
  license_plate TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Jobs (service orders)
CREATE TABLE IF NOT EXISTS crm_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES crm_customers(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES crm_vehicles(id) ON DELETE SET NULL,
  assigned_employee_id UUID,                             -- references employee_profiles(id); no FK to allow independent schema apply
  service_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'no_show')),
  scheduled_date TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  notes TEXT,                -- notes visible to the customer
  internal_notes TEXT,       -- internal employee-only notes
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Before/after/progress photos per job
CREATE TABLE IF NOT EXISTS crm_job_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES crm_jobs(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  photo_type TEXT NOT NULL DEFAULT 'progress' CHECK (photo_type IN ('before', 'after', 'progress')),
  caption TEXT,
  uploaded_by TEXT,          -- employee user_id
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoices
CREATE TABLE IF NOT EXISTS crm_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES crm_jobs(id) ON DELETE SET NULL,
  customer_id UUID NOT NULL REFERENCES crm_customers(id) ON DELETE CASCADE,
  invoice_number TEXT UNIQUE DEFAULT ('INV-' || to_char(NOW(), 'YYYYMMDD') || '-' || substr(gen_random_uuid()::TEXT, 1, 6)),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'void')),
  line_items JSONB NOT NULL DEFAULT '[]',
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  tax NUMERIC(10,2) NOT NULL DEFAULT 0,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  due_date DATE,
  paid_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Internal customer notes (employee-only, not visible to customer)
CREATE TABLE IF NOT EXISTS crm_customer_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES crm_customers(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  created_by TEXT NOT NULL,  -- employee user_id
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_crm_customers_user_id ON crm_customers(user_id);
CREATE INDEX IF NOT EXISTS idx_crm_customers_email ON crm_customers(email);
CREATE INDEX IF NOT EXISTS idx_crm_vehicles_customer_id ON crm_vehicles(customer_id);
CREATE INDEX IF NOT EXISTS idx_crm_jobs_customer_id ON crm_jobs(customer_id);
CREATE INDEX IF NOT EXISTS idx_crm_jobs_status ON crm_jobs(status);
CREATE INDEX IF NOT EXISTS idx_crm_jobs_scheduled_date ON crm_jobs(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_crm_job_photos_job_id ON crm_job_photos(job_id);
CREATE INDEX IF NOT EXISTS idx_crm_invoices_customer_id ON crm_invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_crm_invoices_job_id ON crm_invoices(job_id);
CREATE INDEX IF NOT EXISTS idx_crm_customer_notes_customer_id ON crm_customer_notes(customer_id);

-- ============================================================
-- Row-Level Security
-- ============================================================
ALTER TABLE crm_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_job_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_customer_notes ENABLE ROW LEVEL SECURITY;

-- Service role (used server-side) can do everything
CREATE POLICY "Service role full access crm_customers"
  ON crm_customers FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access crm_vehicles"
  ON crm_vehicles FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access crm_jobs"
  ON crm_jobs FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access crm_job_photos"
  ON crm_job_photos FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access crm_invoices"
  ON crm_invoices FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access crm_customer_notes"
  ON crm_customer_notes FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- Auto-update updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER crm_customers_updated_at
  BEFORE UPDATE ON crm_customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER crm_vehicles_updated_at
  BEFORE UPDATE ON crm_vehicles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER crm_jobs_updated_at
  BEFORE UPDATE ON crm_jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER crm_invoices_updated_at
  BEFORE UPDATE ON crm_invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
