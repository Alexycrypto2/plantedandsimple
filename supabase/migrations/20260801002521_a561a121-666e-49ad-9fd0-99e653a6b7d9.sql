-- ============ MEDIA LIBRARY ============
CREATE TABLE public.media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_path text,
  public_url text NOT NULL,
  alt text NOT NULL DEFAULT '',
  title text,
  width integer,
  height integer,
  mime_type text,
  tags text[] NOT NULL DEFAULT '{}',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.media TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.media TO authenticated;
GRANT ALL ON public.media TO service_role;
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "media public read" ON public.media FOR SELECT USING (true);
CREATE POLICY "media staff write" ON public.media FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'boss') OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'boss') OR public.has_role(auth.uid(),'admin'));

-- ============ CATEGORIES ============
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  image_id uuid REFERENCES public.media(id) ON DELETE SET NULL,
  parent_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  sort_order integer NOT NULL DEFAULT 0,
  seo_title text,
  seo_description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories public read" ON public.categories FOR SELECT USING (true);
CREATE POLICY "categories staff write" ON public.categories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'boss') OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'boss') OR public.has_role(auth.uid(),'admin'));

-- ============ COLLECTIONS ============
CREATE TABLE public.collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  image_id uuid REFERENCES public.media(id) ON DELETE SET NULL,
  is_featured boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  seo_title text,
  seo_description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.collections TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.collections TO authenticated;
GRANT ALL ON public.collections TO service_role;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "collections public read" ON public.collections FOR SELECT USING (true);
CREATE POLICY "collections staff write" ON public.collections FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'boss') OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'boss') OR public.has_role(auth.uid(),'admin'));

-- ============ RECIPES ============
CREATE TABLE public.recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  subtitle text,
  description text NOT NULL DEFAULT '',
  hero_image_id uuid REFERENCES public.media(id) ON DELETE SET NULL,
  gallery_ids uuid[] NOT NULL DEFAULT '{}',
  ingredients jsonb NOT NULL DEFAULT '[]'::jsonb,
  instructions jsonb NOT NULL DEFAULT '[]'::jsonb,
  nutrition jsonb NOT NULL DEFAULT '[]'::jsonb,
  tips jsonb NOT NULL DEFAULT '[]'::jsonb,
  prep_minutes integer,
  cook_minutes integer,
  servings text,
  difficulty text NOT NULL DEFAULT 'easy',
  tags text[] NOT NULL DEFAULT '{}',
  pinterest_description text,
  seo_title text,
  seo_description text,
  status text NOT NULL DEFAULT 'draft',
  is_featured boolean NOT NULL DEFAULT false,
  author_id uuid,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.recipes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.recipes TO authenticated;
GRANT ALL ON public.recipes TO service_role;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "recipes public read published" ON public.recipes FOR SELECT USING (status = 'published');
CREATE POLICY "recipes staff read all" ON public.recipes FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'boss') OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "recipes staff write" ON public.recipes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'boss') OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'boss') OR public.has_role(auth.uid(),'admin'));

-- ============ RELATIONSHIP TABLES ============
CREATE TABLE public.content_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type text NOT NULL,
  content_id uuid NOT NULL,
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (content_type, content_id, category_id)
);
GRANT SELECT ON public.content_categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.content_categories TO authenticated;
GRANT ALL ON public.content_categories TO service_role;
ALTER TABLE public.content_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "content_categories public read" ON public.content_categories FOR SELECT USING (true);
CREATE POLICY "content_categories staff write" ON public.content_categories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'boss') OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'boss') OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.content_collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type text NOT NULL,
  content_id uuid NOT NULL,
  collection_id uuid NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (content_type, content_id, collection_id)
);
GRANT SELECT ON public.content_collections TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.content_collections TO authenticated;
GRANT ALL ON public.content_collections TO service_role;
ALTER TABLE public.content_collections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "content_collections public read" ON public.content_collections FOR SELECT USING (true);
CREATE POLICY "content_collections staff write" ON public.content_collections FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'boss') OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'boss') OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.content_relations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_type text NOT NULL,
  from_id uuid NOT NULL,
  to_type text NOT NULL,
  to_id uuid NOT NULL,
  relation text NOT NULL DEFAULT 'related',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (from_type, from_id, to_type, to_id, relation)
);
CREATE INDEX content_relations_from_idx ON public.content_relations (from_type, from_id);
CREATE INDEX content_relations_to_idx ON public.content_relations (to_type, to_id);
GRANT SELECT ON public.content_relations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.content_relations TO authenticated;
GRANT ALL ON public.content_relations TO service_role;
ALTER TABLE public.content_relations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "content_relations public read" ON public.content_relations FOR SELECT USING (true);
CREATE POLICY "content_relations staff write" ON public.content_relations FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'boss') OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'boss') OR public.has_role(auth.uid(),'admin'));

-- ============ HOMEPAGE SECTIONS ============
CREATE TABLE public.homepage_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL,
  title text,
  subtitle text,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  sort_order integer NOT NULL DEFAULT 0,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.homepage_sections TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.homepage_sections TO authenticated;
GRANT ALL ON public.homepage_sections TO service_role;
ALTER TABLE public.homepage_sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "homepage_sections public read" ON public.homepage_sections FOR SELECT USING (true);
CREATE POLICY "homepage_sections staff write" ON public.homepage_sections FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'boss') OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'boss') OR public.has_role(auth.uid(),'admin'));

-- ============ SITE SETTINGS (public, non-secret) ============
CREATE TABLE public.site_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "site_settings public read" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "site_settings staff write" ON public.site_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'boss') OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'boss') OR public.has_role(auth.uid(),'admin'));

-- ============ UPDATED_AT TRIGGERS ============
CREATE OR REPLACE FUNCTION public.tg_library_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER media_updated_at BEFORE UPDATE ON public.media FOR EACH ROW EXECUTE FUNCTION public.tg_library_updated_at();
CREATE TRIGGER categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.tg_library_updated_at();
CREATE TRIGGER collections_updated_at BEFORE UPDATE ON public.collections FOR EACH ROW EXECUTE FUNCTION public.tg_library_updated_at();
CREATE TRIGGER recipes_updated_at BEFORE UPDATE ON public.recipes FOR EACH ROW EXECUTE FUNCTION public.tg_library_updated_at();
CREATE TRIGGER homepage_sections_updated_at BEFORE UPDATE ON public.homepage_sections FOR EACH ROW EXECUTE FUNCTION public.tg_library_updated_at();
CREATE TRIGGER site_settings_updated_at BEFORE UPDATE ON public.site_settings FOR EACH ROW EXECUTE FUNCTION public.tg_library_updated_at();

-- ============ BLOG POSTS: media + reading time ============
ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS hero_image_id uuid REFERENCES public.media(id) ON DELETE SET NULL;
ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS read_minutes integer;
ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS author_name text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS cover_image_id uuid REFERENCES public.media(id) ON DELETE SET NULL;

-- ============ SEED: homepage sections + site settings + starter collections ============
INSERT INTO public.homepage_sections (kind, title, subtitle, sort_order, enabled, config) VALUES
  ('hero', 'Eat Beautifully. Cook Confidently.', 'Premium plant-forward cookbooks, recipes and meal plans — delivered instantly.', 1, true, '{"primary_cta_label":"Browse Cookbooks","primary_cta_href":"/shop","secondary_cta_label":"Download Free Recipe Book","secondary_cta_href":"/free"}'::jsonb),
  ('trust_row', NULL, NULL, 2, true, '{}'::jsonb),
  ('featured_collections', 'Explore the Collections', 'Curated shelves for however you cook this week.', 3, true, '{"limit":6}'::jsonb),
  ('featured_products', 'Featured Cookbooks', 'Beautifully designed, instantly downloadable.', 4, true, '{"limit":3}'::jsonb),
  ('latest_recipes', 'Fresh From The Kitchen', 'New recipes, tested and photographed in-house.', 5, true, '{"limit":3}'::jsonb),
  ('latest_blogs', 'From The Journal', 'Guides, techniques and seasonal inspiration.', 6, true, '{"limit":3}'::jsonb),
  ('why_choose', 'Why PrimeDownloads', 'Everything we publish is made to be used, not just admired.', 7, true, '{}'::jsonb),
  ('newsletter', 'Join the table', 'One thoughtful email a week — new recipes, free guides and early access.', 8, true, '{}'::jsonb);

INSERT INTO public.site_settings (key, value) VALUES
  ('trust_badges', '{"items":[{"icon":"zap","label":"Instant Digital Delivery"},{"icon":"sparkles","label":"Premium Digital Products"},{"icon":"lock","label":"Secure Checkout"},{"icon":"leaf","label":"Carefully Curated Content"},{"icon":"refresh","label":"Updated Regularly"}]}'::jsonb),
  ('why_choose', '{"items":[{"icon":"book","title":"Tested, Not Guessed","body":"Every recipe is cooked, photographed and refined before it reaches you."},{"icon":"download","title":"Yours Forever","body":"Download once, keep it on every device. No subscriptions, no expiry."},{"icon":"leaf","title":"Plant-Forward Nutrition","body":"Balanced, protein-conscious meals built around real whole foods."},{"icon":"heart","title":"60-Day Guarantee","body":"If it is not right for your kitchen, we refund you. No questions."}]}'::jsonb),
  ('footer', '{"tagline":"Simple plant-based meals. Powerful nutrition.","columns":[{"title":"Shop","links":[{"label":"All Cookbooks","href":"/shop"},{"label":"Free Recipe Guide","href":"/free"}]},{"title":"Explore","links":[{"label":"Recipes","href":"/recipes"},{"label":"Journal","href":"/blog"},{"label":"About","href":"/about"},{"label":"Contact","href":"/contact"}]},{"title":"Legal","links":[{"label":"Privacy","href":"/privacy"},{"label":"Terms","href":"/terms"},{"label":"Refunds","href":"/refund"}]}],"socials":[{"label":"Pinterest","href":"https://pinterest.com"},{"label":"Instagram","href":"https://instagram.com"}]}'::jsonb),
  ('nav', '{"items":[{"label":"Shop","href":"/shop"},{"label":"Recipes","href":"/recipes"},{"label":"Journal","href":"/blog"},{"label":"Free Guide","href":"/free"},{"label":"About","href":"/about"}]}'::jsonb);

INSERT INTO public.collections (slug, name, description, is_featured, sort_order) VALUES
  ('cookbooks','Cookbooks','Complete digital cookbooks, ready to download.',true,1),
  ('meal-prep','Meal Prep','Batch-friendly meals that hold beautifully all week.',true,2),
  ('high-protein','High Protein','Plant-based plates built around serious protein.',true,3),
  ('breakfast','Breakfast','Slow mornings and fast weekday starts.',true,4),
  ('desserts','Desserts','Elegant sweets without the fuss.',true,5),
  ('smoothies','Smoothies','Bright, nourishing blends for any hour.',true,6);

INSERT INTO public.categories (slug, name, description, sort_order) VALUES
  ('breakfast','Breakfast',NULL,1),
  ('lunch','Lunch',NULL,2),
  ('dinner','Dinner',NULL,3),
  ('desserts','Desserts',NULL,4),
  ('smoothies','Smoothies',NULL,5),
  ('meal-prep','Meal Prep',NULL,6),
  ('high-protein','High Protein',NULL,7),
  ('seasonal','Seasonal',NULL,8);