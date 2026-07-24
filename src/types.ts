export type MediaType = 'movie' | 'series';

export type Status = 'want_to_watch' | 'watching' | 'watched';

export interface Title {
  id: string;
  imdb_id: string;
  title: string;
  media_type: MediaType;
  year: string | null;
  poster_url: string | null;
  plot: string | null;
  director: string | null;
  actors: string | null;
  genre: string | null;
  runtime: string | null;
  imdb_rating: string | null;
  released_on: string | null;
  status: Status;
  my_rating: number | null;
  notes: string | null;
  added_at: string;
  watched_at: string | null;
}

export type NewTitle = Omit<Title, 'id' | 'added_at'>;

export interface OmdbSearchItem {
  imdbID: string;
  Title: string;
  Year: string;
  Type: string;
  Poster: string;
}

export interface OmdbDetail {
  imdbID: string;
  Title: string;
  Year: string;
  Type: string;
  Poster: string;
  Plot: string;
  Director: string;
  Actors: string;
  Genre: string;
  Runtime: string;
  imdbRating: string;
  Released: string;
  Response: 'True' | 'False';
  Error?: string;
}
