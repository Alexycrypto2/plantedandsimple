ALTER TABLE public.product_categories ADD COLUMN IF NOT EXISTS name text, ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0, ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.product_categories ALTER COLUMN title DROP NOT NULL;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS parent_id uuid, ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0, ADD COLUMN IF NOT EXISTS seo_title text, ADD COLUMN IF NOT EXISTS seo_description text;
ALTER TABLE public.homepage_sections ADD COLUMN IF NOT EXISTS kind text, ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;
ALTER TABLE public.homepage_sections ALTER COLUMN section_key DROP NOT NULL, ALTER COLUMN title DROP NOT NULL;
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS cover_image_url text, ADD COLUMN IF NOT EXISTS cover_image_id uuid,
  ADD COLUMN IF NOT EXISTS gallery_urls text[] NOT NULL DEFAULT '{}', ADD COLUMN IF NOT EXISTS pdf_asset_url text,
  ADD COLUMN IF NOT EXISTS pdf_storage_path text, ADD COLUMN IF NOT EXISTS bonus_files jsonb NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS compare_at_cents integer NOT NULL DEFAULT 0, ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS paddle_price_external_id text, ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_bestseller boolean NOT NULL DEFAULT false, ADD COLUMN IF NOT EXISTS published_at timestamptz,
  ADD COLUMN IF NOT EXISTS seo_title text, ADD COLUMN IF NOT EXISTS seo_description text, ADD COLUMN IF NOT EXISTS pinterest_description text,
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}', ADD COLUMN IF NOT EXISTS benefits jsonb NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS features jsonb NOT NULL DEFAULT '[]';
ALTER TABLE public.recipes
  ADD COLUMN IF NOT EXISTS nutrition jsonb NOT NULL DEFAULT '{}', ADD COLUMN IF NOT EXISTS tips jsonb NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS prep_minutes integer, ADD COLUMN IF NOT EXISTS cook_minutes integer,
  ADD COLUMN IF NOT EXISTS difficulty text NOT NULL DEFAULT 'Easy', ADD COLUMN IF NOT EXISTS pinterest_description text,
  ADD COLUMN IF NOT EXISTS seo_title text, ADD COLUMN IF NOT EXISTS seo_description text,
  ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false;
ALTER TABLE public.recipes ALTER COLUMN servings TYPE text USING servings::text;
ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS read_minutes integer, ADD COLUMN IF NOT EXISTS author_name text;
ALTER TABLE public.media ADD COLUMN IF NOT EXISTS alt text NOT NULL DEFAULT '', ADD COLUMN IF NOT EXISTS public_url text;
ALTER TABLE public.media ALTER COLUMN file_name DROP NOT NULL, ALTER COLUMN byte_size DROP NOT NULL, ALTER COLUMN source DROP NOT NULL, ALTER COLUMN mime_type DROP NOT NULL, ALTER COLUMN storage_path DROP NOT NULL;
GRANT SELECT ON public.recipes, public.blog_posts, public.products, public.product_categories, public.categories, public.homepage_sections, public.site_settings, public.media, public.content_relations TO anon, authenticated;
GRANT ALL ON public.recipes, public.blog_posts, public.products, public.product_categories, public.categories, public.homepage_sections, public.site_settings, public.media, public.content_relations TO service_role;