-- =============== ai_generations (universal approval queue) ===============
CREATE TABLE public.ai_generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (kind IN ('blog','image','pinterest_pin','email','product_desc','social')),
  title text NOT NULL,
  topic text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  preview_url text,
  model text,
  seo_score numeric,
  quality_score numeric,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','published')),
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  decided_at timestamptz,
  scheduled_for timestamptz,
  published_ref_id uuid,
  notes text
);
CREATE INDEX ai_generations_kind_status_idx ON public.ai_generations (kind, status, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_generations TO authenticated;
GRANT ALL ON public.ai_generations TO service_role;
ALTER TABLE public.ai_generations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Boss manages ai_generations" ON public.ai_generations FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'boss')) WITH CHECK (public.has_role(auth.uid(),'boss'));

-- =============== ai_topics ===============
CREATE TABLE public.ai_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic text NOT NULL,
  category text,
  search_volume integer,
  competition text,
  trend_score numeric,
  pinterest_score numeric,
  seasonal_score numeric,
  ai_score numeric,
  recommendation text,
  notes text,
  discovered_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (topic)
);
CREATE INDEX ai_topics_score_idx ON public.ai_topics (ai_score DESC NULLS LAST);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_topics TO authenticated;
GRANT ALL ON public.ai_topics TO service_role;
ALTER TABLE public.ai_topics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Boss manages ai_topics" ON public.ai_topics FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'boss')) WITH CHECK (public.has_role(auth.uid(),'boss'));

-- =============== pinterest_accounts ===============
CREATE TABLE public.pinterest_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  pinterest_user_id text,
  username text,
  access_token_ciphertext text NOT NULL,
  refresh_token_ciphertext text,
  expires_at timestamptz,
  scopes text,
  connected_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pinterest_accounts TO authenticated;
GRANT ALL ON public.pinterest_accounts TO service_role;
ALTER TABLE public.pinterest_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Boss manages pinterest_accounts" ON public.pinterest_accounts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'boss')) WITH CHECK (public.has_role(auth.uid(),'boss'));

-- =============== pinterest_pins ===============
CREATE TABLE public.pinterest_pins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  generation_id uuid REFERENCES public.ai_generations(id) ON DELETE SET NULL,
  board_id text,
  pin_id text,
  title text NOT NULL,
  description text,
  image_url text NOT NULL,
  link_url text,
  alt_text text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','scheduled','published','failed')),
  scheduled_for timestamptz,
  published_at timestamptz,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pinterest_pins TO authenticated;
GRANT ALL ON public.pinterest_pins TO service_role;
ALTER TABLE public.pinterest_pins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Boss manages pinterest_pins" ON public.pinterest_pins FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'boss')) WITH CHECK (public.has_role(auth.uid(),'boss'));

-- =============== email_campaigns ===============
CREATE TABLE public.email_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  subject text NOT NULL,
  template text NOT NULL DEFAULT '',
  segment text,
  kind text NOT NULL DEFAULT 'broadcast' CHECK (kind IN ('broadcast','automation','sequence_step')),
  sequence text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','scheduled','sending','sent','paused')),
  scheduled_for timestamptz,
  sent_at timestamptz,
  stats jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_campaigns TO authenticated;
GRANT ALL ON public.email_campaigns TO service_role;
ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Boss manages email_campaigns" ON public.email_campaigns FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'boss')) WITH CHECK (public.has_role(auth.uid(),'boss'));

-- =============== content_schedule ===============
CREATE TABLE public.content_schedule (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (kind IN ('blog','pinterest_pin','email','product_launch')),
  ref_id uuid,
  title text,
  scheduled_for timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','published','cancelled','failed')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX content_schedule_time_idx ON public.content_schedule (scheduled_for);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.content_schedule TO authenticated;
GRANT ALL ON public.content_schedule TO service_role;
ALTER TABLE public.content_schedule ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Boss manages content_schedule" ON public.content_schedule FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'boss')) WITH CHECK (public.has_role(auth.uid(),'boss'));

-- =============== analytics_events ===============
CREATE TABLE public.analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL,
  ref_id uuid,
  ref_slug text,
  session_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX analytics_events_kind_time_idx ON public.analytics_events (kind, occurred_at DESC);
CREATE INDEX analytics_events_ref_idx ON public.analytics_events (ref_slug, occurred_at DESC);
GRANT INSERT ON public.analytics_events TO anon, authenticated;
GRANT SELECT ON public.analytics_events TO authenticated;
GRANT ALL ON public.analytics_events TO service_role;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can log analytics" ON public.analytics_events FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Boss reads analytics" ON public.analytics_events FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'boss'));

-- =============== updated_at triggers ===============
CREATE OR REPLACE FUNCTION public.tg_ai_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path='public' AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER pinterest_accounts_updated_at BEFORE UPDATE ON public.pinterest_accounts FOR EACH ROW EXECUTE FUNCTION public.tg_ai_updated_at();
CREATE TRIGGER email_campaigns_updated_at BEFORE UPDATE ON public.email_campaigns FOR EACH ROW EXECUTE FUNCTION public.tg_ai_updated_at();

-- =============== ai-images storage policies (bucket created separately) ===============
CREATE POLICY "Boss manages ai-images objects" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'ai-images' AND public.has_role(auth.uid(),'boss'))
  WITH CHECK (bucket_id = 'ai-images' AND public.has_role(auth.uid(),'boss'));
CREATE POLICY "Public reads ai-images" ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'ai-images');
