# 🎬 Movie & TV Watchlist

A mobile-friendly personal tracker for movies/shows you want to watch, are
watching, or have watched — plus a view for upcoming releases you're
looking forward to. Titles are pulled in from [OMDb](https://www.omdbapi.com/),
streaming availability from [TMDB](https://www.themoviedb.org/)/JustWatch,
and everything is stored in [Supabase](https://supabase.com/). No login:
it's just for you.

Built with React + TypeScript + Vite + Tailwind CSS, and deployed to GitHub
Pages via GitHub Actions.

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com/) and create a free project.
2. In the dashboard, open **SQL Editor -> New query**, paste in the contents
   of [`supabase/schema.sql`](supabase/schema.sql), and run it. This creates
   the `titles` table.
3. Go to **Project Settings -> API** and copy the **Project URL** and the
   **anon public** key — you'll need both below.

> This app has no login and talks to Supabase directly from the browser
> using the public anon key, so don't put anything sensitive in it. Anyone
> who discovers your Supabase URL could read/write your watchlist — that's
> the tradeoff for keeping this a simple, single-user, backend-free app.

## 2. Get an OMDb API key

Sign up for a free key at [omdbapi.com/apikey.aspx](https://www.omdbapi.com/apikey.aspx)
(1,000 requests/day on the free tier).

## 3. Get a TMDB API key

Used only for the "Where to watch" streaming availability lookup. Create a
free account at [themoviedb.org](https://www.themoviedb.org), then go to
**Settings -> API**, request a key (choose "Developer"), and copy the
**API Key (v3 auth)** value.

## 4. Configure environment variables (local dev)

```bash
cp .env.example .env
```

Fill in `.env` with your Supabase URL/anon key, OMDb API key, and TMDB API key.

## 5. Run locally

```bash
npm install
npm run dev
```

Open the printed local URL. To try it on your phone while developing, run
`npm run dev -- --host` and open `http://<your-computer's-LAN-IP>:5173` on
your phone (same Wi-Fi network).

## 6. Deploy to GitHub Pages

1. Push this repo to GitHub.
2. In the repo, go to **Settings -> Pages** and set **Source** to
   **GitHub Actions**.
3. Go to **Settings -> Secrets and variables -> Actions** and add four
   repository secrets:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_OMDB_API_KEY`
   - `VITE_TMDB_API_KEY`
4. Push to `main` (or run the "Deploy to GitHub Pages" workflow manually
   from the **Actions** tab). The site builds and deploys automatically —
   the URL will be shown on the **Settings -> Pages** screen and in the
   workflow run summary.

Since the built site is static, these keys end up visible in the shipped
JavaScript bundle. That's expected for a backend-free app like this — avoid
putting anything more sensitive than a personal watchlist behind it.

Once deployed, open the site on your phone and use **Share -> Add to Home
Screen** (iOS) or the browser's **Install app** option (Android/Chrome) for
a quick, app-like way to add titles on the go.

## How it works

- **Add**: search OMDb by title, tap **Add** to save it to Supabase with
  status `want_to_watch`.
- **Watchlist**: everything you want to watch or are currently watching,
  for titles that have already been released.
- **Upcoming**: anything with a release date in the future — OMDb has
  entries (and release dates) for many not-yet-released movies/shows, so
  searching for something before it's out still works.
- **Watched**: things you've marked watched, with an optional 1–10 rating.
- **Where to watch**: tap any title to open its details, including streaming/
  rental/purchase availability in the US (via TMDB/JustWatch).

## Project structure

```
src/
  lib/omdb.ts        OMDb API calls
  lib/tmdb.ts          TMDB watch-providers lookup
  lib/supabase.ts     Supabase client
  lib/titles.ts        Supabase reads/writes for the titles table
  context/TitlesContext.tsx  shared app state
  components/          UI (search, lists, cards, bottom nav)
supabase/schema.sql    run once in the Supabase SQL editor
.github/workflows/deploy.yml  GitHub Pages deploy
```
