-- Blog posts persistence for admin Blog Builder
-- Run this in Supabase SQL editor.

CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  publish_date DATE NOT NULL DEFAULT CURRENT_DATE,
  image TEXT NOT NULL,
  image_alt TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('detailing', 'ppf', 'ceramic-coating', 'window-tint', 'color-ppf')),
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  author TEXT NOT NULL DEFAULT 'ColorAuto Team',
  location TEXT NOT NULL DEFAULT 'Grand Junction, CO',
  project_summary TEXT NOT NULL,
  services_performed TEXT[] NOT NULL DEFAULT '{}',
  duration TEXT NOT NULL DEFAULT '2 days',
  material_highlight TEXT NOT NULL DEFAULT 'Premium detailing materials',
  cta_label TEXT NOT NULL DEFAULT 'service options',
  cta_href TEXT NOT NULL DEFAULT '/services',
  phone_number TEXT NOT NULL DEFAULT '970-628-1505',
  gallery JSONB NOT NULL DEFAULT '[]'::jsonb,
  body_markdown TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blog_posts_publish_date ON blog_posts(publish_date DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_featured ON blog_posts(featured);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts(category);

ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read blog posts"
  ON blog_posts
  FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage blog posts"
  ON blog_posts
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Storage bucket for blog images (public read)
INSERT INTO storage.buckets (id, name, public)
VALUES ('blog-images', 'blog-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public can view blog images"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'blog-images');

CREATE POLICY "Service role can manage blog images"
  ON storage.objects
  FOR ALL
  USING (bucket_id = 'blog-images' AND auth.role() = 'service_role')
  WITH CHECK (bucket_id = 'blog-images' AND auth.role() = 'service_role');
