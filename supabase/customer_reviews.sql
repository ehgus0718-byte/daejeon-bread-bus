-- Supabase schema for daejeon-bread-bus customer review slider.
-- Applied to production on 2026-07-13 (migration: create_customer_reviews).

create table if not exists public.customer_reviews (
  id uuid primary key default gen_random_uuid(),
  author_name text not null,
  content text not null,
  rating integer not null default 5 check (rating between 1 and 5),
  photo_url text,
  profile_url text,
  is_visible boolean not null default true,
  is_featured boolean not null default false,
  sort_order integer not null default 0,
  likes_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists customer_reviews_sort_idx on public.customer_reviews (is_featured desc, sort_order asc, created_at desc);

create table if not exists public.review_settings (
  id text primary key default 'default',
  autoplay boolean not null default true,
  autoplay_speed_ms integer not null default 4000 check (autoplay_speed_ms between 1500 and 20000),
  slide_gap_px integer not null default 24 check (slide_gap_px between 0 and 64),
  cards_desktop integer not null default 3 check (cards_desktop between 1 and 4),
  sort_mode text not null default 'order' check (sort_mode in ('order','latest','popular','random')),
  theme text not null default 'light' check (theme in ('light','warm','dark')),
  updated_at timestamptz not null default now(),
  constraint review_settings_singleton check (id = 'default')
);

insert into public.review_settings (id) values ('default') on conflict (id) do nothing;

create or replace function public.set_customer_reviews_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists customer_reviews_set_updated_at on public.customer_reviews;
create trigger customer_reviews_set_updated_at
before update on public.customer_reviews
for each row execute function public.set_customer_reviews_updated_at();

drop trigger if exists review_settings_set_updated_at on public.review_settings;
create trigger review_settings_set_updated_at
before update on public.review_settings
for each row execute function public.set_customer_reviews_updated_at();

alter table public.customer_reviews enable row level security;
alter table public.review_settings enable row level security;

create policy "Allow anon select reviews" on public.customer_reviews for select to anon using (true);
create policy "Allow anon insert reviews" on public.customer_reviews for insert to anon with check (char_length(author_name) between 1 and 40 and char_length(content) between 1 and 2000);
create policy "Allow anon update reviews" on public.customer_reviews for update to anon using (true) with check (true);
create policy "Allow anon delete reviews" on public.customer_reviews for delete to anon using (true);

create policy "Allow anon select review settings" on public.review_settings for select to anon using (id = 'default');
create policy "Allow anon insert review settings" on public.review_settings for insert to anon with check (id = 'default');
create policy "Allow anon update review settings" on public.review_settings for update to anon using (id = 'default') with check (id = 'default');
