CREATE TABLE public.post_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  snapshot jsonb NOT NULL,
  changed_fields text[] NOT NULL DEFAULT '{}',
  source text NOT NULL DEFAULT 'mcp',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.post_versions TO authenticated;
GRANT ALL ON public.post_versions TO service_role;
ALTER TABLE public.post_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Boss can read post versions" ON public.post_versions FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'boss'));
CREATE INDEX post_versions_post_idx ON public.post_versions(post_id, created_at DESC);