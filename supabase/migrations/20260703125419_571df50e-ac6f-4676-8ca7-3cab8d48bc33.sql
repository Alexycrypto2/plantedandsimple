
create table public.affiliates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  name text not null,
  email text not null unique,
  code text not null unique,
  commission_pct numeric(5,2) not null default 50,
  disabled boolean not null default false,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.affiliates to authenticated;
grant all on public.affiliates to service_role;
alter table public.affiliates enable row level security;
create policy "Affiliate can read own row" on public.affiliates for select to authenticated
using (
  user_id = auth.uid()
  or lower(email) = lower(coalesce((auth.jwt() ->> 'email'), ''))
  or public.has_role(auth.uid(), 'boss')
);

create table public.affiliate_clicks (
  id bigserial primary key,
  code text not null,
  created_at timestamptz not null default now()
);
grant select, insert on public.affiliate_clicks to anon, authenticated;
grant all on public.affiliate_clicks to service_role;
alter table public.affiliate_clicks enable row level security;
create policy "Anyone can log a click" on public.affiliate_clicks for insert to anon, authenticated with check (true);
create policy "Boss can read clicks" on public.affiliate_clicks for select to authenticated using (public.has_role(auth.uid(), 'boss'));

create table public.affiliate_referrals (
  id uuid primary key default gen_random_uuid(),
  affiliate_id uuid not null references public.affiliates(id) on delete cascade,
  transaction_id text not null unique,
  sale_amount numeric(10,2) not null,
  commission_amount numeric(10,2) not null,
  status text not null default 'pending',
  product text,
  purchased_at timestamptz not null default now(),
  paid_at timestamptz
);
grant select, insert, update, delete on public.affiliate_referrals to authenticated;
grant all on public.affiliate_referrals to service_role;
alter table public.affiliate_referrals enable row level security;
create policy "Affiliate can read own referrals" on public.affiliate_referrals for select to authenticated
using (
  public.has_role(auth.uid(), 'boss')
  or exists (
    select 1 from public.affiliates a
    where a.id = affiliate_referrals.affiliate_id
      and (a.user_id = auth.uid()
           or lower(a.email) = lower(coalesce((auth.jwt() ->> 'email'), '')))
  )
);

create index affiliate_clicks_code_idx on public.affiliate_clicks(code);
create index affiliate_referrals_affiliate_idx on public.affiliate_referrals(affiliate_id);
