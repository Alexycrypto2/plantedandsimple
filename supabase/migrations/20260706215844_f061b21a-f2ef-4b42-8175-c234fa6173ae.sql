
CREATE TABLE public.pricing_settings (
  id BOOLEAN PRIMARY KEY DEFAULT true,
  price_cents INTEGER NOT NULL DEFAULT 1499,
  compare_at_cents INTEGER NOT NULL DEFAULT 2999,
  currency TEXT NOT NULL DEFAULT 'USD',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT singleton CHECK (id = true)
);

GRANT SELECT ON public.pricing_settings TO anon, authenticated;
GRANT ALL ON public.pricing_settings TO service_role;

ALTER TABLE public.pricing_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read pricing" ON public.pricing_settings
  FOR SELECT USING (true);

INSERT INTO public.pricing_settings (id, price_cents, compare_at_cents, currency)
VALUES (true, 1499, 2999, 'USD')
ON CONFLICT (id) DO NOTHING;
