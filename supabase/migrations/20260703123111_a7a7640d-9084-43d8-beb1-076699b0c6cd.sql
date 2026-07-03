-- Roles
create type public.app_role as enum ('boss', 'admin');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;

alter table public.user_roles enable row level security;

-- Users can read their own role rows.
create policy "Users can read own roles"
  on public.user_roles for select
  to authenticated
  using (auth.uid() = user_id);

-- Security definer role check (avoids recursive RLS).
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  );
$$;

-- Only boss users can insert/update/delete role rows.
create policy "Boss can manage roles"
  on public.user_roles for all
  to authenticated
  using (public.has_role(auth.uid(), 'boss'))
  with check (public.has_role(auth.uid(), 'boss'));

-- Auto-grant boss role to the designated email on signup or verification.
create or replace function public.grant_boss_for_owner_email()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email_confirmed_at is not null
     and lower(new.email) = 'ayubadesina3@gmail.com' then
    insert into public.user_roles (user_id, role)
    values (new.id, 'boss')
    on conflict (user_id, role) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_grant_boss on auth.users;
create trigger on_auth_user_created_grant_boss
after insert on auth.users
for each row execute function public.grant_boss_for_owner_email();

drop trigger if exists on_auth_user_confirmed_grant_boss on auth.users;
create trigger on_auth_user_confirmed_grant_boss
after update of email_confirmed_at on auth.users
for each row
when (old.email_confirmed_at is null and new.email_confirmed_at is not null)
execute function public.grant_boss_for_owner_email();

-- Backfill if the user already exists.
insert into public.user_roles (user_id, role)
select id, 'boss'::public.app_role
from auth.users
where lower(email) = 'ayubadesina3@gmail.com'
  and email_confirmed_at is not null
on conflict (user_id, role) do nothing;