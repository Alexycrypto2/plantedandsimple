ALTER TABLE public.recipes
  ADD COLUMN IF NOT EXISTS link_category text,
  ADD COLUMN IF NOT EXISTS occasions text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS main_ingredients text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS diet_tags text[] NOT NULL DEFAULT '{}';
ALTER TABLE public.blog_posts
  ADD COLUMN IF NOT EXISTS link_category text,
  ADD COLUMN IF NOT EXISTS occasions text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS main_ingredients text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS diet_tags text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS roundup_tag text;
INSERT INTO public.site_settings (key, value)
VALUES ('internal_linking', '{"live": false, "hubs": ["Thanksgiving"]}'::jsonb)
ON CONFLICT (key) DO NOTHING;