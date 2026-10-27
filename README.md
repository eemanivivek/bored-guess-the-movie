# Bored? Guess the Movie

A responsive Telugu movie recommender and five-attempt guessing game. Built with Angular 18 standalone components, TypeScript, SCSS, routing and Angular Signals.

Live app: https://eemanivivek.github.io/bored-guess-the-movie/

Repository: https://github.com/eemanivivek/bored-guess-the-movie

## Run locally

Use Node.js 20.11.1+ (or Node 22) and npm.

```sh
npm install
npx ng serve
```

Open http://localhost:4200. `npm start` also runs `ng serve`. If the Angular CLI is installed globally, you can use `ng serve` directly.

```sh
npm run build
npm test
```

Production files are in `dist/bored-guess-the-movie/browser`. Configure your static host to serve `index.html` for unknown routes, so `/questions`, `/game`, and `/result` work on direct navigation. Game state lives in memory: refreshing starts a new session, and guarded routes return to `/start` when no movie is selected.

## GitHub Pages deployment

Pushing to `main` runs `.github/workflows/deploy-pages.yml`: install locked dependencies with Node 22, run the tests, build with the Pages base path, and deploy the output to GitHub Pages. The repository's Settings → Pages publishing source must be **GitHub Actions**.

To prepare the same output locally:

```sh
npm run build -- --base-href /bored-guess-the-movie/
node scripts/prepare-pages.cjs
```

The preparation script adds entry points for `/start`, `/questions`, `/game`, and `/result`, plus a 404 fallback. This supports direct visits and refreshes on Pages without changing the application's clean routes. The deployment job uses GitHub's short-lived workflow token; no personal access token is stored in the project.

## How it works

Five config-driven single-select questions lead to a recommendation. Era is a strict filter: only movies from the selected era can be picked. Within that era, mood and genre matches earn three points each; company and runtime earn one each. There is no favourite-hero question or hero-based scoring. Neutral answers award no points. The service chooses randomly among the top-scoring eligible movies and falls back to a random movie within the selected era when every score is zero. “Get another recommendation” preserves the era and other answers and excludes the previous movie when another movie exists in that era; if only one exists, it repeats that movie rather than selecting outside the era. An era with no movies returns an explicit error.

The game accepts any nonempty title, suggests up to five matching catalogue titles, and compares titles after removing punctuation and spaces and folding case. Duplicate wrong guesses cost no attempts. Each wrong answer unlocks a different scene photo plus a text clue. Five wrong guesses end the game. A correct guess triggers the result and confetti; reduced-motion settings disable animations.

## Add questions

Edit `src/app/core/models/questions.data.ts`. Its typed array determines order, options and progress automatically. To make a new question affect recommendations, add the matching rule in `core/services/recommendation.ts` and any new movie metadata in `core/models/movie.ts`. Era boundaries are before 2000, 2000–2010 inclusive, 2011–2020 inclusive, and 2021 onward.

## Add movies and media

Edit `src/assets/data/movies.json`. Every entry needs a unique numeric `id`, `title`, `year`, `genres`, `moods`, `company`, `runtimeMinutes`, `hero`, `director`, `posterUrl`, five distinct `hintImages`, and `description`. `hintAudioUrl` is optional. Use option values matching the questionnaire exactly. Paths such as `assets/images/my-clue.svg` refer to files under `src/assets/`.

The catalogue uses five different online movie scene photos per film, curated from film galleries, reviews and movie image providers. `src/assets/data/scene-images.json` records each photo URL and its source page. The game shuffles the five photos once per round, shows the full selected photo without zooming or poster cropping, and advances to a new photo after each wrong guess. The full poster appears only on the result screen. Scene source links and the Wikipedia poster source are listed after the reveal. No media files need to be stored in assets. These third-party images retain their original rights; a source link is not a license grant.

Images load directly over HTTPS. If a host is unavailable, offline, rate-limited or blocks embedding, the image component switches to the original local illustrated clue/poster. To change scenes, edit `scene-images.json` and run `node scripts/link-scene-images.cjs`; provide five different direct image URLs for each movie. Image URLs must return image bytes, rather than a search result or web page.

For audio, set `hintAudioUrl` to a direct HTTPS MP3, OGG or WAV URL, or a local clip. YouTube/Spotify page URLs cannot be played by an HTML audio element; they need their respective embedded players. No remote movie audio has been assigned because a verified playable clip is required. On odd-numbered wrong guesses the game switches to a native audio player; on other turns it shows a picture. `assets/audio/placeholder-chime.wav` is an original synthesized test sound, deliberately unassigned because it does not identify a film.

`node scripts/generate-assets.cjs` recreates the sample catalogue, 120 SVGs and test chime. It overwrites sample data, including online URLs. Run `node scripts/link-online-media.cjs` afterward to restore online poster links, then `node scripts/link-scene-images.cjs` to restore the curated scene photos. The poster-linking script never replaces scene hints. The latter retrieves only metadata, reuses already linked entries, and makes requests sequentially with a delay. Hosts may still rate-limit requests; retry later if that happens.

## Layout

```
src/app/core/models         Typed movies, answers, question configuration
src/app/core/services       Scoring, movie catalogue, signal game state
src/app/features/start      Welcome
src/app/features/questionnaire
src/app/features/game
src/app/features/result
src/app/shared/components   Reusable step label
src/assets                  Local data, images and audio
```

Scoring, boundaries, random selection constraints, normalization, catalogue paths and bundled fallback assets are verified by `npm test`. Live third-party availability is not guaranteed by offline tests.

To check remote image availability without saving image files, run `node scripts/check-scene-links.cjs`. It verifies response status and image content type, uses a normal image request if a host rejects HEAD, and caches successful checks in an ignored report. Delete that report to recheck all URLs. Third-party URLs may change or become unavailable later.
