import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import movies from '../src/assets/data/movies.json';
import links from '../src/assets/data/watch-links.json';
import { isTeluguWatchLink, WATCH_PLATFORMS, WatchLink } from '../src/app/core/models/watch-link';

test('watch catalogue references real movies, Telugu audio, official title pages and local icons', () => {
 const seen = new Set<string>();
 for (const link of links as WatchLink[]) {
  assert.ok(movies.some(movie => movie.id === link.movieId));
  assert.ok(isTeluguWatchLink(link), link.url);
  assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(link.checkedAt));
  assert.equal(new URL(link.sourceUrl).protocol, 'https:');
  assert.ok(existsSync('src/assets/platforms/' + WATCH_PLATFORMS[link.platform].icon + '.svg'));
  const key = link.movieId + ':' + link.platform;
  assert.ok(!seen.has(key), 'duplicate platform for a movie');
  seen.add(key);
 }
});

test('other audio languages, unreviewed links, search pages and mismatched hosts cannot be displayed', () => {
 const base = links[0] as WatchLink;
 for (const change of [
  { language: 'Hindi' }, { language: 'Tamil' }, { language: '' }, { checkedAt: '' }, { sourceUrl: '' },
  { url: 'javascript:alert(1)' }, { url: 'https://www.youtube.com.evil.example/watch?v=tas_30CdOss' },
  { url: 'https://www.youtube.com/results?search_query=movie' },
  { platform: 'prime', url: 'https://www.youtube.com/watch?v=tas_30CdOss' },
  { url: 'https://www.youtube.com/watch?v=invalid' }, { platform: 'unknown' }
 ]) assert.equal(isTeluguWatchLink({ ...base, ...change } as WatchLink), false);
});

test('RRR links to its Telugu ZEE5 listing; missing titles have no invented platform link', () => {
 const rrr = links.filter(link => link.movieId === 29);
 assert.deepEqual(rrr.map(link => link.platform), ['zee5']);
 assert.ok(rrr[0].url.endsWith('0-0-1z5145092'));
 assert.equal(links.filter(link => link.movieId === 24).length, 0);
});
