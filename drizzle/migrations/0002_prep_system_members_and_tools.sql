create table public.prep_members (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  status text not null default 'active' check (status in ('active','revoked')),
  source text not null default 'manual',
  note text,
  granted_by uuid,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant all on public.prep_members to service_role;
alter table public.prep_members enable row level security;
create policy "Admins manage prep members" on public.prep_members for all to authenticated
  using (public.has_role(auth.uid(),'boss') or public.has_role(auth.uid(),'admin'))
  with check (public.has_role(auth.uid(),'boss') or public.has_role(auth.uid(),'admin'));
grant select, insert, update, delete on public.prep_members to authenticated;

create table public.prep_profiles (
  id uuid primary key,
  display_name text,
  goal text default 'high-protein',
  servings int not null default 2,
  dislikes text[] not null default '{}',
  allergies text[] not null default '{}',
  prep_day text default 'Sunday',
  budget text default 'moderate',
  protein_target int not null default 100,
  onboarded boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.prep_profiles to authenticated;
grant all on public.prep_profiles to service_role;
alter table public.prep_profiles enable row level security;
create policy "Own prep profile select" on public.prep_profiles for select to authenticated using (auth.uid() = id);
create policy "Own prep profile insert" on public.prep_profiles for insert to authenticated with check (auth.uid() = id);
create policy "Own prep profile update" on public.prep_profiles for update to authenticated using (auth.uid() = id);

create table public.prep_favorites (
  user_id uuid not null,
  recipe_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, recipe_id)
);
grant select, insert, delete on public.prep_favorites to authenticated;
grant all on public.prep_favorites to service_role;
alter table public.prep_favorites enable row level security;
create policy "Own prep favorites" on public.prep_favorites for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.prep_meal_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null default 'My week',
  source text,
  is_current boolean not null default false,
  slots jsonb not null default '{}'::jsonb,
  grocery_checked text[] not null default '{}',
  prep_done text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.prep_meal_plans (user_id);
grant select, insert, update, delete on public.prep_meal_plans to authenticated;
grant all on public.prep_meal_plans to service_role;
alter table public.prep_meal_plans enable row level security;
create policy "Own prep plans" on public.prep_meal_plans for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.prep_pantry_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);
grant select, insert, delete on public.prep_pantry_items to authenticated;
grant all on public.prep_pantry_items to service_role;
alter table public.prep_pantry_items enable row level security;
create policy "Own prep pantry" on public.prep_pantry_items for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create trigger prep_members_touch before update on public.prep_members for each row execute function public.tg_ai_updated_at();
create trigger prep_profiles_touch before update on public.prep_profiles for each row execute function public.tg_ai_updated_at();
create trigger prep_plans_touch before update on public.prep_meal_plans for each row execute function public.tg_ai_updated_at();