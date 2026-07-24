import { supabase } from './supabase';
import { getTitleDetail, parseOmdbDate } from './omdb';
import type { NewTitle, Status, Title } from '../types';

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
    imdb_id: detail.imdbID,
    title: detail.Title,
    media_type: detail.Type === 'series' ? 'series' : 'movie',
    year: detail.Year ?? null,
    poster_url: detail.Poster && detail.Poster !== 'N/A' ? detail.Poster : null,
    plot: detail.Plot && detail.Plot !== 'N/A' ? detail.Plot : null,
    genre: detail.Genre && detail.Genre !== 'N/A' ? detail.Genre : null,
    runtime: detail.Runtime && detail.Runtime !== 'N/A' ? detail.Runtime : null,
    imdb_rating:
      detail.imdbRating && detail.imdbRating !== 'N/A' ? detail.imdbRating : null,
    released_on: parseOmdbDate(detail.Released),
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

export async function removeTitle(id: string): Promise<void> {
  const { error } = await supabase.from('titles').delete().eq('id', id);
  if (error) throw error;
}
