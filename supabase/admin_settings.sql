-- Supabase schema for daejeon-bread-bus admin date settings.
-- Run this after the reservations table is stable.
-- This file only prepares the table. The app will not use it until the client code is connected.

create table if not exists public.admin_settings (
  id text primary key default 'default',
  capacity_overrides jsonb not null default '{}'::jsonb,
  price_overrides jsonb not null default '{}'::jsonb,
  schedule_status jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint admin_settings_singleton check (id = 'default')
);

insert into public.admin_settings (
  id,
  capacity_overrides,
  price_overrides,
  schedule_status
)
values (
  'default',
  '{}'::jsonb,
  '{}'::jsonb,
  '{}'::jsonb
)
on conflict (id) do nothing;

create or replace function public.set_admin_settings_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists admin_settings_set_updated_at on public.admin_settings;

create trigger admin_settings_set_updated_at
before update on public.admin_settings
for each row
execute function public.set_admin_settings_updated_at();

alter table public.admin_settings enable row level security;

-- Do not enable public access policies until the app client is connected intentionally.
-- The next implementation step will decide whether to use frontend anon access
-- or a server-side API for safer admin-only writes.
