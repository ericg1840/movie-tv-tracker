-- Run this once in the Supabase SQL editor (Project -> SQL Editor -> New query)
-- for your project to create the table this app uses.

create table if not exists public.titles (
  id uuid primary key default gen_random_uuid(),
  imdb_id text not null unique,
  title text not null,
  media_type text not null check (media_type in ('movie', 'series')),
  year text,
  poster_url text,
  plot text,
  genre text,
  runtime text,
  imdb_rating text,
  released_on date,
  status text not null default 'want_to_watch'
    check (status in ('want_to_watch', 'watching', 'watched')),
  my_rating smallint check (my_rating between 1 and 10),
  notes text,
  added_at timestamptz not null default now(),
  watched_at timestamptz
);

create index if not exists titles_status_idx on public.titles (status);
create index if not exists titles_released_on_idx on public.titles (released_on);

alter table public.titles enable row level security;

-- This app has no login (single-user, personal use) and calls Supabase
-- directly from the browser with the public anon key, so the anon role
-- needs full access to this table. Do not put anything sensitive in it,
-- and be aware the anon key + these permissions mean anyone who finds
-- your Supabase URL could read/write this table.
drop policy if exists "anon full access" on public.titles;
create policy "anon full access"
  on public.titles
  for all
  to anon
  using (true)
  with check (true);
