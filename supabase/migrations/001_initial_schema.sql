-- ============================================================
-- 001_initial_schema.sql
-- Güorld Coin — initial database schema
-- ============================================================


-- ============================================================
-- TABLES
-- Order matters: keepers before entries/coin_keepers (FK deps)
-- ============================================================

create table keepers (
  id             uuid primary key default gen_random_uuid(),
  display_name   text,
  instagram      text,
  email          text,
  total_km       numeric default 0,
  created_at     timestamptz default now()
);

create table coins (
  id                       uuid primary key default gen_random_uuid(),
  slug                     text unique not null,
  name                     text,
  created_at               timestamptz default now(),
  total_km                 numeric default 0,
  is_active                boolean default true,
  story_so_far             text,
  story_so_far_updated_at  timestamptz
);

create table entries (
  id             uuid primary key default gen_random_uuid(),
  coin_id        uuid references coins(id) on delete cascade,
  keeper_id      uuid references keepers(id),
  story          text,
  photo_url      text,
  lat            numeric,
  lng            numeric,
  location_name  text,
  days_held      integer,
  created_at     timestamptz default now()
);

create table coin_keepers (
  id           uuid primary key default gen_random_uuid(),
  coin_id      uuid references coins(id),
  keeper_id    uuid references keepers(id),
  received_at  timestamptz default now(),
  passed_at    timestamptz,
  days_held    integer
);

create table entries_translations (
  id         uuid primary key default gen_random_uuid(),
  entry_id   uuid references entries(id) on delete cascade,
  language   text not null,
  story      text,
  created_at timestamptz default now(),
  unique (entry_id, language)
);


-- ============================================================
-- INDEXES
-- ============================================================

create index on entries (coin_id, created_at);
create index on entries (keeper_id);
create index on coin_keepers (coin_id, passed_at);
create index on coin_keepers (keeper_id);
create index on entries_translations (entry_id, language);


-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table coins               enable row level security;
alter table keepers             enable row level security;
alter table entries             enable row level security;
alter table coin_keepers        enable row level security;
alter table entries_translations enable row level security;

-- coins: public read only
create policy "coins_select" on coins
  for select using (true);

-- entries: public read only
-- NOTE: inserts go through a server-side edge function (service role)
-- so that km calculations and story_so_far generation run atomically.
create policy "entries_select" on entries
  for select using (true);

-- entries_translations: public read only
-- Populated by the AI translation edge function (service role).
create policy "entries_translations_select" on entries_translations
  for select using (true);

-- keepers: public read + insert (anyone can register as a keeper)
create policy "keepers_select" on keepers
  for select using (true);

create policy "keepers_insert" on keepers
  for insert with check (true);

-- coin_keepers: public read + insert
create policy "coin_keepers_select" on coin_keepers
  for select using (true);

create policy "coin_keepers_insert" on coin_keepers
  for insert with check (true);


-- ============================================================
-- STORAGE — entry-photos bucket
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'entry-photos',
  'entry-photos',
  true,
  5242880,  -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp']
);

-- Public read (bucket is public, but explicit policy for objects)
create policy "entry_photos_select" on storage.objects
  for select using (bucket_id = 'entry-photos');

-- Anyone can upload (keeper submitting their story)
create policy "entry_photos_insert" on storage.objects
  for insert with check (bucket_id = 'entry-photos');
