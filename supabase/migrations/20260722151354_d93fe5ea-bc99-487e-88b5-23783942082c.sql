
-- ============ CATEGORIES ============
CREATE TABLE public.product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.product_categories TO anon, authenticated;
GRANT ALL ON public.product_categories TO service_role;

ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categories are readable by anyone"
  ON public.product_categories FOR SELECT
  USING (true);

CREATE POLICY "Boss can manage categories"
  ON public.product_categories FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'boss'))
  WITH CHECK (public.has_role(auth.uid(), 'boss'));

-- ============ PRODUCTS ============
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT NOT NULL DEFAULT '',
  category_id UUID REFERENCES public.product_categories(id) ON DELETE SET NULL,
  cover_image_url TEXT,
  gallery_urls TEXT[] NOT NULL DEFAULT '{}',
  pdf_asset_url TEXT,
  bonus_files JSONB NOT NULL DEFAULT '[]'::jsonb,
  price_cents INTEGER NOT NULL DEFAULT 0,
  compare_at_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  paddle_price_external_id TEXT UNIQUE,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_bestseller BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  published_at TIMESTAMPTZ,
  seo_title TEXT,
  seo_description TEXT,
  pinterest_description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_products_status ON public.products(status);
CREATE INDEX idx_products_category ON public.products(category_id);
CREATE INDEX idx_products_featured ON public.products(is_featured) WHERE is_featured;
CREATE INDEX idx_products_bestseller ON public.products(is_bestseller) WHERE is_bestseller;

GRANT SELECT ON public.products TO anon, authenticated;
GRANT ALL ON public.products TO service_role;

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published products readable by anyone"
  ON public.products FOR SELECT
  USING (status = 'published');

CREATE POLICY "Boss can read all products"
  ON public.products FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'boss'));

CREATE POLICY "Boss can insert products"
  ON public.products FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'boss'));

CREATE POLICY "Boss can update products"
  ON public.products FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'boss'))
  WITH CHECK (public.has_role(auth.uid(), 'boss'));

CREATE POLICY "Boss can delete products"
  ON public.products FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'boss'));

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.tg_products_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER products_set_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.tg_products_updated_at();
CREATE TRIGGER categories_set_updated_at BEFORE UPDATE ON public.product_categories
  FOR EACH ROW EXECUTE FUNCTION public.tg_products_updated_at();

-- ============ REVIEWS: link to product (optional) ============
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES public.products(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_reviews_product ON public.reviews(product_id);

-- ============ SEED: categories + the existing cookbook ============
INSERT INTO public.product_categories (slug, name, description, sort_order) VALUES
  ('high-protein', 'High Protein', 'Recipes & guides focused on protein-rich plant-based meals.', 1),
  ('meal-prep',    'Meal Prep',    'Batch-friendly guides for the week ahead.', 2),
  ('smoothies',    'Smoothies',    'Blends, bowls, and quick nutrition drinks.', 3),
  ('breakfast',    'Breakfast',    'Fast, satisfying mornings.', 4),
  ('dinner',       'Dinner',       'Warm, filling evening meals.', 5),
  ('desserts',     'Desserts',     'Sweet treats — plant-based.', 6),
  ('budget',       'Budget Meals', 'Delicious food that respects your grocery bill.', 7)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (
  slug, title, subtitle, description,
  category_id, cover_image_url, pdf_asset_url,
  price_cents, compare_at_cents, currency,
  paddle_price_external_id,
  is_featured, is_bestseller, status, published_at,
  seo_title, seo_description
)
SELECT
  'high-protein-cookbook',
  '30 High-Protein Plant-Based Meals',
  'The premium digital cookbook — 30 recipes, 6 bonus guides.',
  'A premium digital cookbook packed with 30 high-protein vegan recipes plus 6 bonus guides. Instant PDF download.',
  (SELECT id FROM public.product_categories WHERE slug = 'high-protein'),
  NULL,
  '/__l5e/assets-v1/da3115d8-0e13-4f93-85a4-e6366fa3875b/30-high-protein-plant-based-meals.pdf',
  COALESCE((SELECT price_cents FROM public.pricing_settings WHERE id = true), 1499),
  COALESCE((SELECT compare_at_cents FROM public.pricing_settings WHERE id = true), 2999),
  COALESCE((SELECT currency FROM public.pricing_settings WHERE id = true), 'USD'),
  'high_protein_cookbook_onetime',
  true, true, 'published', now(),
  '30 High-Protein Plant-Based Meals — PlantedAndSimple',
  'Instant PDF cookbook: 30 high-protein vegan recipes, 4 weekly meal plans, and 6 bonuses.'
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE slug = 'high-protein-cookbook');

-- Attach existing approved reviews to the seeded cookbook.
UPDATE public.reviews
SET product_id = (SELECT id FROM public.products WHERE slug = 'high-protein-cookbook')
WHERE product_id IS NULL;
