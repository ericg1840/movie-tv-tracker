-- Run this in the Supabase SQL editor if you already ran the earlier
-- migrations and just need the content/parental rating (e.g. "PG-13",
-- "R", "TV-MA") that OMDb returns as `Rated`.

alter table public.titles
  add column if not exists rated text;
