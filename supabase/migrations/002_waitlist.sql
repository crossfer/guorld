-- ============================================================
-- 002_waitlist.sql
-- Waitlist table for people who want their own Güorld Coin
-- ============================================================

create table waitlist (
  id         uuid primary key default gen_random_uuid(),
  email      text not null,
  created_at timestamptz default now(),
  unique (email)
);

alter table waitlist enable row level security;

-- Anyone can join the waitlist
create policy "waitlist_insert" on waitlist
  for insert with check (true);
