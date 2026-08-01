
CREATE TABLE public.learning_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL,
  entity_type text NOT NULL DEFAULT 'unknown',
  entity_id uuid,
  entity_ref text,
  metric text NOT NULL,
  value numeric NOT NULL DEFAULT 0,
  dimensions jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX learning_signals_metric_idx ON public.learning_signals (metric, occurred_at DESC);
CREATE INDEX learning_signals_source_idx ON public.learning_signals (source, occurred_at DESC);
GRANT SELECT, INSERT ON public.learning_signals TO authenticated;
GRANT ALL ON public.learning_signals TO service_role;
ALTER TABLE public.learning_signals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read signals" ON public.learning_signals FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'boss') OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "staff write signals" ON public.learning_signals FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'boss') OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.learning_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dimension text NOT NULL,
  dimension_value text NOT NULL,
  metric text NOT NULL,
  sample_size integer NOT NULL DEFAULT 0,
  score numeric NOT NULL DEFAULT 0,
  lift_pct numeric NOT NULL DEFAULT 0,
  confidence numeric NOT NULL DEFAULT 0,
  window_days integer NOT NULL DEFAULT 90,
  summary text NOT NULL,
  evidence jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'active',
  computed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (dimension, dimension_value, metric, window_days)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.learning_insights TO authenticated;
GRANT ALL ON public.learning_insights TO service_role;
ALTER TABLE public.learning_insights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff manage insights" ON public.learning_insights FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'boss') OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'boss') OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.ai_experiments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  dimension text NOT NULL,
  hypothesis text NOT NULL DEFAULT '',
  variants jsonb NOT NULL DEFAULT '[]'::jsonb,
  metric text NOT NULL DEFAULT 'engagement',
  status text NOT NULL DEFAULT 'running',
  winner text,
  results jsonb NOT NULL DEFAULT '{}'::jsonb,
  started_at timestamptz NOT NULL DEFAULT now(),
  decided_at timestamptz
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_experiments TO authenticated;
GRANT ALL ON public.ai_experiments TO service_role;
ALTER TABLE public.ai_experiments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff manage experiments" ON public.ai_experiments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'boss') OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'boss') OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.ai_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  for_date date NOT NULL DEFAULT (now()::date),
  kind text NOT NULL DEFAULT 'content',
  title text NOT NULL,
  reasoning text NOT NULL,
  action jsonb NOT NULL DEFAULT '{}'::jsonb,
  evidence jsonb NOT NULL DEFAULT '{}'::jsonb,
  priority integer NOT NULL DEFAULT 3,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ai_recommendations_date_idx ON public.ai_recommendations (for_date DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_recommendations TO authenticated;
GRANT ALL ON public.ai_recommendations TO service_role;
ALTER TABLE public.ai_recommendations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff manage recommendations" ON public.ai_recommendations FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'boss') OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'boss') OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.brand_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  rule text NOT NULL,
  weight integer NOT NULL DEFAULT 3,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.brand_rules TO authenticated;
GRANT ALL ON public.brand_rules TO service_role;
ALTER TABLE public.brand_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff manage brand rules" ON public.brand_rules FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'boss') OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'boss') OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.brand_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  generation_id uuid REFERENCES public.ai_generations(id) ON DELETE CASCADE,
  score numeric NOT NULL DEFAULT 0,
  issues jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes text,
  checked_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.brand_checks TO authenticated;
GRANT ALL ON public.brand_checks TO service_role;
ALTER TABLE public.brand_checks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff manage brand checks" ON public.brand_checks FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'boss') OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'boss') OR public.has_role(auth.uid(),'admin'));

INSERT INTO public.brand_rules (category, rule, weight) VALUES
  ('voice','Warm, editorial and expert. Speak like a trusted food magazine editor, never like an ad.',5),
  ('voice','No hype, no exclamation marks, no emojis in body copy, no "unlock/supercharge/game-changer" language.',5),
  ('voice','Always plant-based and high-protein focused; never recommend animal products.',5),
  ('typography','Headlines use the display serif in italic sentence case; body copy stays sans and calm.',3),
  ('image','Ultra-realistic editorial food photography, soft natural window light, cream and forest-green palette, matte linen surfaces. No text, logos or CGI look.',5),
  ('pinterest','Vertical 2:3 pins, clean space in the top third for an overlay, keyword-rich title under 100 characters.',4),
  ('cta','CTAs are calm and benefit-led: "Browse the cookbooks", "Download the free recipe book". Never all-caps or countdown-shouty.',4),
  ('homepage','Editorial bento layout, generous whitespace, large food photography, rounded cards, one clear primary action per section.',3);
