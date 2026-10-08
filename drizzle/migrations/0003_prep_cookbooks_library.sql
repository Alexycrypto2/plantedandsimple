CREATE TABLE public.prep_cookbooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text,
  cover_url text,
  is_builtin boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  sort integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.prep_recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cookbook_id uuid NOT NULL REFERENCES public.prep_cookbooks(id) ON DELETE CASCADE,
  slug text NOT NULL UNIQUE,
  data jsonb NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX prep_recipes_cookbook_idx ON public.prep_recipes(cookbook_id);
GRANT ALL ON public.prep_cookbooks TO service_role;
GRANT ALL ON public.prep_recipes TO service_role;
ALTER TABLE public.prep_cookbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prep_recipes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service role manages cookbooks" ON public.prep_cookbooks FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service role manages prep recipes" ON public.prep_recipes FOR ALL TO service_role USING (true) WITH CHECK (true);