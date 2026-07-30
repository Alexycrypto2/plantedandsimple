CREATE TABLE IF NOT EXISTS public.app_settings (
  key text PRIMARY KEY,
  value_ciphertext text NOT NULL,
  is_secret boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.app_settings TO authenticated;
GRANT ALL ON public.app_settings TO service_role;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Boss manages settings" ON public.app_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'boss')) WITH CHECK (public.has_role(auth.uid(), 'boss'));