CREATE TABLE IF NOT EXISTS public.recipe_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id uuid NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  snapshot jsonb NOT NULL,
  changed_fields text[] NOT NULL DEFAULT '{}',
  source text NOT NULL DEFAULT 'mcp',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.recipe_versions TO authenticated;
GRANT ALL ON public.recipe_versions TO service_role;
ALTER TABLE public.recipe_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Boss can read recipe versions" ON public.recipe_versions FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'boss'));
CREATE INDEX IF NOT EXISTS recipe_versions_recipe_idx ON public.recipe_versions(recipe_id, created_at DESC);
