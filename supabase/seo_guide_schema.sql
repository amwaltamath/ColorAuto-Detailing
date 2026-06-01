-- SEO Guide Tool tables
-- Apply these statements in Supabase SQL editor when ready.

create table if not exists seo_projects (
  id uuid primary key default gen_random_uuid(),
  business_name text not null,
  service_type text not null,
  primary_city text not null,
  nearby_cities text[] default '{}',
  budget_level text not null check (budget_level in ('starter', 'growth', 'aggressive')),
  goal_type text not null check (goal_type in ('calls', 'form-leads', 'maps-visibility')),
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists seo_keywords (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references seo_projects(id) on delete cascade,
  cluster_intent text not null,
  keyword text not null,
  priority smallint not null default 3,
  created_at timestamptz not null default now()
);

create table if not exists seo_pages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references seo_projects(id) on delete cascade,
  page_type text not null,
  title text not null,
  slug text not null,
  h1 text not null,
  meta_description text,
  faq jsonb default '[]'::jsonb,
  internal_links jsonb default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists seo_tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references seo_projects(id) on delete cascade,
  task_type text not null,
  title text not null,
  details text,
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'done')),
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists seo_scores (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references seo_projects(id) on delete cascade,
  total_score integer not null check (total_score between 0 and 100),
  on_page_score integer not null,
  local_signals_score integer not null,
  content_depth_score integer not null,
  technical_score integer not null,
  authority_score integer not null,
  snapshot_date date not null default current_date,
  created_at timestamptz not null default now()
);

create table if not exists seo_guide_snapshots (
  id uuid primary key default gen_random_uuid(),
  business_name text not null,
  service_type text not null,
  primary_city text not null,
  nearby_cities text[] default '{}',
  competitors text[] default '{}',
  budget_level text not null check (budget_level in ('starter', 'growth', 'aggressive')),
  goal_type text not null check (goal_type in ('calls', 'form-leads', 'maps-visibility')),
  score_total integer not null check (score_total between 0 and 100),
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_seo_keywords_project_id on seo_keywords(project_id);
create index if not exists idx_seo_pages_project_id on seo_pages(project_id);
create index if not exists idx_seo_tasks_project_id on seo_tasks(project_id);
create index if not exists idx_seo_scores_project_id on seo_scores(project_id);
create index if not exists idx_seo_guide_snapshots_created_at on seo_guide_snapshots(created_at desc);
