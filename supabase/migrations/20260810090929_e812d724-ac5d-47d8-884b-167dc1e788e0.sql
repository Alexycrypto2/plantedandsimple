ALTER TABLE public.pinterest_oauth_states
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'started',
  ADD COLUMN IF NOT EXISTS diagnostics jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS failure_code text;

ALTER TABLE public.pinterest_accounts
  ADD COLUMN IF NOT EXISTS account_name text,
  ADD COLUMN IF NOT EXISTS token_type text,
  ADD COLUMN IF NOT EXISTS refresh_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS connection_status text NOT NULL DEFAULT 'connected',
  ADD COLUMN IF NOT EXISTS last_error text;

CREATE INDEX IF NOT EXISTS pinterest_oauth_states_user_created_idx
  ON public.pinterest_oauth_states (user_id, created_at DESC);