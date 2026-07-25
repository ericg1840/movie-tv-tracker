# Movie & TV Watchlist

Personal movie/TV tracker. React + TypeScript + Vite + Tailwind, Supabase
backend, deployed to GitHub Pages. Full user-facing setup is in
[README.md](README.md) — this file is operational notes for whoever (human
or Claude) picks this project back up.

## Architecture decisions worth knowing

- **No login, by design.** The `titles` table has a permissive RLS policy
  (`to anon using (true)`) — anyone with the Supabase URL can read/write it.
  This was a deliberate tradeoff for a single-user personal app, confirmed
  explicitly with the user. A multi-user/auth version was built once and
  then reverted at the user's request (see git history around "Skip
  multi-user for now" if it ever comes back up) — don't re-add auth without
  asking first, it's a meaningful architecture change.
- **Two content APIs, different jobs.** OMDb (`lib/omdb.ts`) does search
  and title details. TMDB (`lib/tmdb.ts`) does the things OMDb can't:
  trending/discover, watch-provider (streaming) lookup, and trailers. TMDB
  lookups go through `find-by-imdb_id` first since our data model keys off
  `imdb_id`, not TMDB's own ids.
- **`landing.html` is static, not part of the React app.** It's a
  hand-written file in `public/` with its own inline CSS, deployed
  alongside the SPA but not built by Vite. If you re-theme the app, update
  this file's CSS variables too — it won't pick up Tailwind changes.

## Deploying — read this before pushing multiple commits back to back

GitHub Pages deploys via `.github/workflows/deploy.yml` on push to `main`.
**Pushing several commits in quick succession can wedge it**: GitHub's
Pages deployment API rejects a new deployment while a previous one shows
"in progress," and that state can take ~10 minutes to resolve on its own if
a deploy gets orphaned by a rapid-fire push. This happened once and caused
three consecutive deploys to silently fail while `gh run watch` reported
success on a stale run ID.

The reliable pattern:
1. Push one commit.
2. Poll for the run matching that exact SHA (don't just grab
   `gh run list --limit 1` immediately after pushing — there's a race where
   it can still return the previous run):
   ```bash
   SHA=$(git rev-parse HEAD)
   for i in $(seq 1 15); do
     RUN_ID=$(gh run list --workflow=deploy.yml --limit 5 --json databaseId,headSha \
       --jq ".[] | select(.headSha==\"$SHA\") | .databaseId")
     [ -n "$RUN_ID" ] && break
     sleep 3
   done
   gh run watch "$RUN_ID" --exit-status
   ```
3. Verify the live bundle hash actually matches the local build before
   considering it deployed:
   ```bash
   curl -s https://ericg1840.github.io/movie-tv-tracker/ | grep -o 'assets/index-[^"]*'
   ls dist/assets/
   ```
4. Only then push the next commit.

## Local dev quirks

- The project path contains a colon (`Movie:TV Show Tracker`), which trips
  up `npx` and Vite's dev-server `fs.allow` check. `vite.config.ts` sets
  `server.fs.strict: false` to work around the latter; prefer calling
  `./node_modules/.bin/vite` / `./node_modules/.bin/tsc` directly over
  `npx`/`npm run` if you hit path-related errors.
- `.claude/launch.json` points the dev-server preview straight at the
  `node` binary and `vite.js` rather than `npm run dev`, for the same
  reason — `npm`'s own path resolution was unreliable here.
- Node/npm were installed via `nvm` (not Homebrew — this machine's outdated
  Command Line Tools make Homebrew fall back to building everything from
  source, which is extremely slow). If a fresh shell can't find `node`,
  source `~/.nvm/nvm.sh` first.

## Brand assets

- Icon is hand-built SVG (`public/favicon.svg`), not sourced from a design
  tool — rasterized to PNG via macOS's built-in `qlmanage`/`sips`, no image
  library needed. Regenerate all sizes from that one source if it changes.
- Palette lives in `src/index.css` under `@theme` (`brand-*` teal scale,
  `accent-*` coral scale, `ink-950` navy). Don't gradient teal directly to
  coral — the RGB interpolation passes through a muddy grey-brown midpoint;
  use `brand-*` to `brand-*` gradients and keep coral as a flat spot accent.
