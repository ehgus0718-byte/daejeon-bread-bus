-- Supabase schema for daejeon-bread-bus reservation storage.
-- Run this in the Supabase SQL editor before enabling VITE_RESERVATION_REPOSITORY_MODE=supabase.

create extension if not exists "pgcrypto";

create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  reservation_date date,
  status text not null default '결제대기',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists reservations_created_at_idx
  on public.reservations (created_at desc);

create index if not exists reservations_reservation_date_idx
  on public.reservations (reservation_date);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists reservations_set_updated_at on public.reservations;

create trigger reservations_set_updated_at
before update on public.reservations
for each row
execute function public.set_updated_at();

alter table public.reservations enable row level security;

-- Development policy: allows the public anon key to read/write reservation rows.
-- Before live operation, replace this with stricter policies or a server-side API.
drop policy if exists "Allow anon reservation reads" on public.reservations;
drop policy if exists "Allow anon reservation inserts" on public.reservations;
drop policy if exists "Allow anon reservation updates" on public.reservations;
drop policy if exists "Allow anon reservation deletes" on public.reservations;

create policy "Allow anon reservation reads"
  on public.reservations
  for select
  to anon
  using (true);

create policy "Allow anon reservation inserts"
  on public.reservations
  for insert
  to anon
  with check (true);

create policy "Allow anon reservation updates"
  on public.reservations
  for update
  to anon
  using (true)
  with check (true);

create policy "Allow anon reservation deletes"
  on public.reservations
  for delete
  to anon
  using (true);
