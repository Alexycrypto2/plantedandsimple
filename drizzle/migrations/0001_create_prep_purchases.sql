create table public.prep_purchases (
  id uuid primary key default gen_random_uuid(),
  transaction_id text not null unique,
  email text,
  environment text not null default 'sandbox',
  created_at timestamptz not null default now()
);

grant all on public.prep_purchases to service_role;

alter table public.prep_purchases enable row level security;

create policy "Service role manages prep purchases"
  on public.prep_purchases
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
