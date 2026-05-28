create table if not exists public.sms_verifications (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  code text not null,
  purpose text not null default 'reservation',
  verified boolean not null default false,
  attempts integer not null default 0,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  verified_at timestamptz
);

create index if not exists sms_verifications_phone_created_idx
  on public.sms_verifications (phone, created_at desc);

create index if not exists sms_verifications_phone_verified_idx
  on public.sms_verifications (phone, verified, expires_at desc);

alter table public.sms_verifications enable row level security;

drop policy if exists "sms_verifications_no_public_select" on public.sms_verifications;
drop policy if exists "sms_verifications_no_public_insert" on public.sms_verifications;
drop policy if exists "sms_verifications_no_public_update" on public.sms_verifications;
drop policy if exists "sms_verifications_no_public_delete" on public.sms_verifications;

create policy "sms_verifications_no_public_select"
  on public.sms_verifications for select
  using (false);

create policy "sms_verifications_no_public_insert"
  on public.sms_verifications for insert
  with check (false);

create policy "sms_verifications_no_public_update"
  on public.sms_verifications for update
  using (false)
  with check (false);

create policy "sms_verifications_no_public_delete"
  on public.sms_verifications for delete
  using (false);
