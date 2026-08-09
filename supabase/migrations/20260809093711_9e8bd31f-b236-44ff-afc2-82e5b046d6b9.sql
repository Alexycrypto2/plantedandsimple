CREATE TABLE public.pinterest_oauth_states (
  state_hash text PRIMARY KEY,
  user_id uuid NOT NULL,
  redirect_uri text NOT NULL,
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.pinterest_oauth_states TO authenticated;
GRANT ALL ON public.pinterest_oauth_states TO service_role;

ALTER TABLE public.pinterest_oauth_states ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own Pinterest OAuth states"
ON public.pinterest_oauth_states
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE INDEX pinterest_oauth_states_expiry_idx
ON public.pinterest_oauth_states (expires_at);