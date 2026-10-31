# Bored? Guess the Movie

Angular 18 standalone Telugu movie recommender with an optional photo guessing game.

## Run locally

Use Node 22+ (or Node 20.11.1+ for Angular).

```sh
npm install
```

Copy `.env.example` to `.env`, set `TMDB_READ_TOKEN` to your TMDB API Read Access Token, and keep this ignored file private. Run these in separate terminals:

```sh
npm run api:start
npm start
```

Open http://localhost:4200. The Angular proxy forwards `/api` to port 8787. Restart the API after editing `.env` or backend code. `/api/health` reports token presence only; obtaining a recommendation verifies upstream access.

```sh
npm test
npm run api:check
npm run build
```

## Recommendations and photos

Recommendations come exclusively from TMDB, with `with_original_language=te`. There is no saved-JSON recommendation fallback or fixed game-title pool. API failures display a retryable error. Era is a strict filter: before 2000, 2000–2010, 2011–2020, or 2021 onward. Genre and mood score three points each; company and runtime score one. Mood/company are genre-based heuristics. Random ties and a recent-history filter improve variety among sampled API candidates.

Choosing Play checks up to 24 distinct backdrops per candidate. Language-tagged artwork and the poster are excluded first. A lazy Tesseract.js worker reads actual photo pixels using English and Telugu models, rejecting detected lettering. Metadata alone is not proof of a text-free image. Automatic OCR can miss stylized or faint lettering; it is not a guarantee. Models download on first play and are browser-cached. Photos are processed locally and are not uploaded to an OCR service.

A game uses one to five distinct photos that pass screening; the number of attempts and hearts equals the approved photo count. The selected API movie is retained when it has at least one approved scene. If it has none, other API movies in the same era are tried. No old JSON movie is substituted. If none pass, the app offers Try more movies or movie details. Each wrong guess or Skip hint consumes one attempt and advances to the next photo. The final wrong guess or skip opens the result immediately. The UI shows the actual photo count. There are no year, actor, genre, plot, audio or poster clues. Punctuation/spaces/case are ignored for guesses, including alternative titles. Duplicate wrong guesses cost nothing.

After the questionnaire, **Do you wanna guess the movie?** offers Play and Skip. Skip reveals the selected recommendation. Results show the poster, details and verified Telugu streaming links, when available. Missing links show an explanatory message.

## Questions and OTT links

Edit `src/app/core/models/questions.data.ts` to change the typed questionnaire. Add scoring rules in `core/services/recommendation.ts` for new attributes.

`src/assets/data/movies.json` remains only as a legacy title/year lookup for manually verified OTT entries, and for legacy asset tooling/tests. It never selects a recommendation or supplies game photos. New movies are discovered automatically from TMDB.

Maintain verified Telugu links in `src/assets/data/watch-links.json`. Each entry contains `movieId`, `platform`, `language`, `url`, `sourceUrl`, `checkedAt` and optional `note`. Legacy catalogue IDs map only to an exact movie title and year. Check Telugu audio on the provider's actual full-movie page before adding a link. Do not infer audio language from TMDB provider listings. Supported platforms: YouTube, Netflix, Prime, JioHotstar, ZEE5, aha and Sun NXT. These manually checked links are a snapshot and may change.

## Hosting

GitHub Pages can host the Angular files, but cannot run the secret-bearing API. Deploy `backend/worker.ts` to Cloudflare Workers using `npm run api:deploy`, store `TMDB_READ_TOKEN` using Wrangler secrets, and configure `ALLOWED_ORIGINS`. Set the GitHub Actions variable `MOVIE_API_URL` to the public Worker HTTPS URL ending in `/api`. Never put the token in frontend assets or GitHub Pages variables. Without an API URL, recommendations display a configuration error.

Pushing main triggers `.github/workflows/deploy-pages.yml`. Tests and builds run, but the deployment job is skipped until the `MOVIE_API_URL` repository Actions variable is set. This keeps the existing hosted version available while the API is prepared. After setting the URL, rerun the workflow to publish the API-backed version. To prepare Pages output locally:

```sh
npm run build -- --base-href /bored-guess-the-movie/
node scripts/prepare-pages.cjs
```

Direct routes are prepared for `/start`, `/questions`, `/recommendation`, `/game`, and `/result`. State lives in memory; refreshing returns to Start. The footer includes the official TMDB primary long logo from its [attribution page](https://www.themoviedb.org/about/logos-attribution), stored locally in `src/assets/images/tmdb-logo.svg`, alongside the attribution notice. Third-party media retain their original rights.

## Structure

- `src/app/core/models`: typed data, hint and OCR policies
- `src/app/core/services`: API recommendations, scene screening, signals and OTT links
- `src/app/features`: start, questionnaire, recommendation, game and result
- `src/app/shared/components`: reusable UI and media components
- `backend`: server-only TMDB proxy and local adapter

Unit tests use fake upstream responses to verify filtering, API-only behavior, repeat avoidance, photo gating, OCR decisions and game state. They do not establish live availability or perfect OCR accuracy.

## Exhaustive option checks

`npm test` includes `tests/questionnaire-matrix.test.ts`. It derives all 1,440 answer combinations from the actual question configuration, verifies independent scoring and era expectations, and exercises 28,800 controlled game paths (1–5 approved photos, wrong guesses, skips, mixed turns and final-photo wins). It also checks API failures, missing images and optional reveal. These use controlled responses and do not certify real-world image availability or OCR accuracy.

With Angular and the real API running locally, `npm run test:live` requests all 72 distinct era/genre/runtime filter combinations. Requests are paced below the local API limit. Its ignored `.angular/live-option-check.json` records status, era validation, exact genre/runtime matches and raw scene availability. Mood and company do not add API query combinations; their local scoring is covered exhaustively by the matrix tests. Live results are a snapshot, not a guarantee about future TMDB data or every browser.

Public movie API: https://bored-guess-the-movie-api.bored-guess-the-movie.workers.dev/api. Its TMDB credential is stored as a Cloudflare Worker secret. GitHub Actions uses the public MOVIE_API_URL variable to connect the frontend.
