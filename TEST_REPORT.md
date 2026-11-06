# Questionnaire outcome validation

Checked: 2026-10-31T09:47:18.449Z

## Exhaustive controlled tests

- 49 test groups passed; zero failures.
- All 1,440 answer combinations (5 moods × 6 genres × 4 company options × 3 runtime options × 4 eras).
- Independent score expectations, strict era, API-only recommendations and another-recommendation exclusion.
- 28,800 game paths: every combination × 1–5 approved photos × wrong guesses / skips / mixed / final-photo win. Attempts equal photo count; no repeated scene within a round; final turn completes the round.
- Every combination also checked against offline, malformed and wrong-era responses, optional reveal and zero approved photos.
- All 72 distinct server filters tested with controlled upstream responses, including the relaxed-filter path and originally Telugu filtering.

## Live API snapshot

- 72/72 queries returned valid API movies within the selected era. Failed requests: 0.
- 10 initial batches had no raw scene candidates; this can still leave a game unavailable after further search.
- 3 batches had no exact genre/runtime match. The existing search can relax these preferences; era remains strict.

| Era | API queries passed | Initial batches with no scenes | Batches with no exact genre/runtime match |
| --- | ---: | ---: | ---: |
| Classic (before 2000) | 18/18 | 8 | 3 |
| 2000-2010 | 18/18 | 2 | 0 |
| 2010-2020 | 18/18 | 0 | 0 |
| Recent | 18/18 | 0 | 0 |

## Interpretation

The deterministic recommendation and game-state checks pass. This does not establish that every live recommendation is playable: actual TMDB scene coverage varies, and OCR may reject all available photos. No-scene handling remains a retry or optional details outcome. Genre/runtime are preferences and may be relaxed, so an API response can be valid without matching both exactly.

The live run checks all distinct API filter combinations, not 1,440 browser click-throughs. Mood and company are ranked locally and were exercised exhaustively in controlled tests. Live images were not exhaustively OCR-scanned or visually reviewed; automatic OCR can miss stylized lettering. OTT links and future upstream availability are not certified by this report.

## Reproduce

```sh
npm test
# With Angular and the actual local API running:
npm run test:live
```

Live details are recorded in `tests/reports/live-options.json`; the script also writes `.angular/live-option-check.json` on each run. These results are a snapshot of one API batch per distinct filter, not every movie in TMDB.

## Local changes checked on 6 November 2026

The current suite passes 65 tests. It covers all 2,100 combinations of the original five questions and 33,600 game paths using two to five checked photos. Genre now includes Doesn't matter, which chooses randomly from eligible API candidates instead of ranking by score. Single-photo games are blocked during candidate preparation, by the playable-scene route rule and when starting prepared game state. Distinct image sizes of one frame do not count as separate photos. The live API snapshot above remains the historical 31 October run; it has not been rerun for these frontend changes.

Hero-specific tests separately cover all nine preset cast filters, custom aliases, actor suggestions, no-preference requests, unmatched names/casts, and game candidate selection. The custom-name space is unbounded and is not an exhaustive permutation claim.

Retry regression checks verify rejected movies are not scanned again, subsequent clicks continue API pagination, exclusions drain each page, and exhaustion stops further retry requests. Era is the final question, immediately after Hero.

The final Era question includes Doesn't matter, tested across recommendations, API date filters, mixed-era scene candidates, and the expanded 105-filter backend matrix.
