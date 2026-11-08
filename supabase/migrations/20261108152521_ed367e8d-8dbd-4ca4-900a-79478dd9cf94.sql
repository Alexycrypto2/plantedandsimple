DROP TABLE IF EXISTS public.prep_recipes, public.prep_cookbooks, public.prep_members, public.prep_purchases, public.prep_profiles, public.prep_meal_plans, public.prep_favorites, public.prep_pantry_items CASCADE;

CREATE TABLE public.prep_cookbooks (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), slug text NOT NULL UNIQUE, title text NOT NULL, description text, cover_url text, is_builtin boolean NOT NULL DEFAULT false, active boolean NOT NULL DEFAULT true, sort integer NOT NULL DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.prep_recipes (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), cookbook_id uuid NOT NULL REFERENCES public.prep_cookbooks(id) ON DELETE CASCADE, slug text NOT NULL UNIQUE, data jsonb NOT NULL, active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.prep_members (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), email text NOT NULL UNIQUE, status text NOT NULL DEFAULT 'active', source text NOT NULL DEFAULT 'manual', note text, granted_by uuid, last_seen_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.prep_purchases (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), transaction_id text NOT NULL UNIQUE, email text, environment text NOT NULL DEFAULT 'live', created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.prep_profiles (id uuid PRIMARY KEY, display_name text, goal text, servings integer NOT NULL DEFAULT 2, dislikes text[] NOT NULL DEFAULT '{}', allergies text[] NOT NULL DEFAULT '{}', prep_day text, budget text, protein_target integer, onboarded boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.prep_meal_plans (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, name text NOT NULL DEFAULT 'My week', source text NOT NULL DEFAULT 'manual', is_current boolean NOT NULL DEFAULT false, slots jsonb NOT NULL DEFAULT '{}', grocery_checked jsonb NOT NULL DEFAULT '[]', prep_done jsonb NOT NULL DEFAULT '[]', created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.prep_favorites (user_id uuid NOT NULL, recipe_id text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY (user_id, recipe_id));
CREATE TABLE public.prep_pantry_items (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, name text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE (user_id, name));

GRANT ALL ON public.prep_cookbooks, public.prep_recipes, public.prep_members, public.prep_purchases, public.prep_profiles, public.prep_meal_plans, public.prep_favorites, public.prep_pantry_items TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.prep_profiles, public.prep_meal_plans, public.prep_favorites, public.prep_pantry_items TO authenticated;

ALTER TABLE public.prep_cookbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prep_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prep_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prep_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prep_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prep_meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prep_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prep_pantry_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own profile" ON public.prep_profiles FOR ALL TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "own plans" ON public.prep_meal_plans FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "own favorites" ON public.prep_favorites FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "own pantry" ON public.prep_pantry_items FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

INSERT INTO public.prep_cookbooks (id, slug, title, description, is_builtin, active, sort, created_at) VALUES ('2aeb7fc1-0bd7-47f9-bc6b-981a373236fc','core','30 High-Protein Plant-Based Meals','The original Planted & Simple cookbook — 30 recipes.',true,true,0,'2026-10-08 18:05:48+00');
INSERT INTO public.prep_members (email, status, source) VALUES ('ayubadesina3@gmail.com','active','manual');