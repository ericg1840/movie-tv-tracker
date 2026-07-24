-- Run this in the Supabase SQL editor if you already ran the original
-- schema.sql and just need to add director/actors columns for the
-- movie/show detail view.

alter table public.titles
  add column if not exists director text,
  add column if not exists actors text;
