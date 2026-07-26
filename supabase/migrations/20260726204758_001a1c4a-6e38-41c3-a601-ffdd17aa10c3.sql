
-- 1. Extend products with tags, benefits, features
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS benefits jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS features jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS pdf_storage_path text;

CREATE INDEX IF NOT EXISTS products_tags_gin ON public.products USING gin(tags);

-- 2. Extend subscribers with source column
ALTER TABLE public.subscribers
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'unknown';

-- 3. Blog posts table
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  excerpt text,
  content text NOT NULL DEFAULT '',
  featured_image_url text,
  category text,
  tags text[] NOT NULL DEFAULT '{}',
  seo_title text,
  seo_description text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  author_id uuid,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.blog_posts TO anon;
GRANT SELECT ON public.blog_posts TO authenticated;
GRANT ALL ON public.blog_posts TO service_role;

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read published posts"
  ON public.blog_posts FOR SELECT
  USING (status = 'published');

CREATE POLICY "Boss can read all posts"
  ON public.blog_posts FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'boss'));

CREATE POLICY "Boss can insert posts"
  ON public.blog_posts FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'boss'));

CREATE POLICY "Boss can update posts"
  ON public.blog_posts FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'boss'));

CREATE POLICY "Boss can delete posts"
  ON public.blog_posts FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'boss'));

CREATE INDEX IF NOT EXISTS blog_posts_status_published_at
  ON public.blog_posts(status, published_at DESC);

CREATE OR REPLACE FUNCTION public.tg_blog_posts_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS blog_posts_updated_at ON public.blog_posts;
CREATE TRIGGER blog_posts_updated_at
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.tg_blog_posts_updated_at();

-- 4. Free-guide download log
CREATE TABLE IF NOT EXISTS public.free_guide_downloads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.free_guide_downloads TO anon;
GRANT INSERT ON public.free_guide_downloads TO authenticated;
GRANT SELECT ON public.free_guide_downloads TO authenticated;
GRANT ALL ON public.free_guide_downloads TO service_role;

ALTER TABLE public.free_guide_downloads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can log a free guide download"
  ON public.free_guide_downloads FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Boss can view free guide downloads"
  ON public.free_guide_downloads FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'boss'));
