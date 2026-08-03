-- Run this in the Supabase SQL editor if you already ran the earlier
-- migrations and just need per-season/episode watch tracking for series.
--
-- Stored as { "<season_number>": [<watched episode numbers>] }, e.g.
-- {"1": [1,2,3], "2": [1]} means season 1 episodes 1-3 and season 2
-- episode 1 are watched. Movies never populate this.

alter table public.titles
  add column if not exists watched_episodes jsonb not null default '{}'::jsonb;
