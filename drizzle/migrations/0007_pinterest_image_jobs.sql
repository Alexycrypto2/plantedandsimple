CREATE TABLE public.pin_image_jobs (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 created_by uuid NOT NULL,
 prompt text NOT NULL,
 providers jsonb NOT NULL DEFAULT '[]'::jsonb,
 provider_index integer NOT NULL DEFAULT 0,
 provider_job_id text,
 status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','running','complete','failed','cancelled')),
 image_url text,
 storage_path text,
 credits_charged numeric,
 error text,
 attempts jsonb NOT NULL DEFAULT '[]'::jsonb,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.pin_image_jobs TO authenticated;
GRANT ALL ON public.pin_image_jobs TO service_role;
ALTER TABLE public.pin_image_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Boss reads own image jobs" ON public.pin_image_jobs FOR SELECT TO authenticated USING (created_by = auth.uid() AND public.has_role(auth.uid(), 'boss'));
CREATE INDEX pin_image_jobs_owner_idx ON public.pin_image_jobs(created_by, created_at DESC);