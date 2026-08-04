CREATE TABLE public.pinterest_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  generation_id uuid REFERENCES public.ai_generations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  board_id text,
  board_name text,
  pin_id text,
  slug text NOT NULL UNIQUE,
  destination_url text NOT NULL,
  target_path text,
  title text NOT NULL,
  description text,
  image_url text,
  scheduled_for timestamptz,
  status text NOT NULL DEFAULT 'scheduled',
  error text,
  published_at timestamptz,
  clicks integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX pinterest_posts_status_idx ON public.pinterest_posts (status, scheduled_for);
CREATE INDEX pinterest_posts_generation_idx ON public.pinterest_posts (generation_id);

GRANT ALL ON public.pinterest_posts TO service_role;
ALTER TABLE public.pinterest_posts ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER pinterest_posts_updated_at
BEFORE UPDATE ON public.pinterest_posts
FOR EACH ROW EXECUTE FUNCTION public.tg_ai_updated_at();

CREATE OR REPLACE FUNCTION public.increment_pin_click(_slug text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.pinterest_posts SET clicks = clicks + 1 WHERE slug = _slug;
$$;