import { supabase } from './supabase';
import { getTitleDetail, parseOmdbDate } from './omdb';
import type { NewTitle, OmdbDetail, Status, Title } from '../types';

const clean = (value: string | undefined) => (value && value !== 'N/A' ? value : null);

function detailToFields(detail: OmdbDetail) {
  return {
    imdb_id: detail.imdbID,
    title: detail.Title,
    media_type: (detail.Type === 'series' ? 'series' : 'movie') as Title['media_type'],
    year: clean(detail.Year),
    poster_url: clean(detail.Poster),
    plot: clean(detail.Plot),
    director: clean(detail.Director),
    actors: clean(detail.Actors),
    genre: clean(detail.Genre),
    runtime: clean(detail.Runtime),
    imdb_rating: clean(detail.imdbRating),
    released_on: parseOmdbDate(detail.Released),
  };
}

export async function fetchTitles(): Promise<Title[]> {
  const { data, error } = await supabase
    .from('titles')
    .select('*')
    .order('added_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function addTitleByImdbId(imdbId: string): Promise<Title> {
  const detail = await getTitleDetail(imdbId);

  const newTitle: NewTitle = {
    ...detailToFields(detail),
    status: 'want_to_watch',
    my_rating: null,
    notes: null,
    watched_at: null,
  };

  const { data, error } = await supabase
    .from('titles')
    .insert(newTitle)
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('Already in your list');
    }
    throw error;
  }
  return data;
}

export async function refreshTitleDetails(id: string, imdbId: string): Promise<Title> {
  const detail = await getTitleDetail(imdbId);
  const { data, error } = await supabase
    .from('titles')
    .update(detailToFields(detail))
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateTitleStatus(id: string, status: Status): Promise<Title> {
  const patch: Partial<Title> = { status };
  if (status === 'watched') patch.watched_at = new Date().toISOString();
  if (status === 'want_to_watch') patch.watched_at = null;

  const { data, error } = await supabase
    .from('titles')
    .update(patch)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateTitleRating(id: string, myRating: number | null): Promise<Title> {
  const { data, error } = await supabase
    .from('titles')
    .update({ my_rating: myRating })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateTitleNotes(id: string, notes: string | null): Promise<Title> {
  const { data, error } = await supabase
    .from('titles')
    .update({ notes })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function removeTitle(id: string): Promise<void> {
  const { error } = await supabase.from('titles').delete().eq('id', id);
  if (error) throw error;
}
