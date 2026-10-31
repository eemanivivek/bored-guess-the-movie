import type { Movie } from '../src/app/core/models/movie';

export const GENRES: Record<string, number> = { Action: 28, Comedy: 35, Romance: 10749, Family: 10751, Thriller: 53, Fantasy: 14 };
const GENRE_NAMES: Record<number, string> = { 28:'Action',12:'Adventure',16:'Animation',35:'Comedy',80:'Crime',99:'Documentary',18:'Drama',10751:'Family',14:'Fantasy',36:'History',27:'Horror',10402:'Music',9648:'Mystery',10749:'Romance',878:'Science Fiction',10770:'TV Movie',53:'Thriller',10752:'War',37:'Western' };
export const ERAS: Record<string, [string, string]> = {
 'Classic (before 2000)': ['1900-01-01','1999-12-31'],
 '2000-2010': ['2000-01-01','2010-12-31'],
 '2010-2020': ['2011-01-01','2020-12-31'],
 'Recent': ['2021-01-01','9999-12-31']
};

export interface TmdbSummary {
 id: number; title: string; original_title?: string; original_language: string;
 release_date: string; adult?: boolean;
}
export interface TmdbMovie extends TmdbSummary {
 runtime?: number; overview?: string; poster_path?: string | null;
 genres?: {id:number;name:string}[];
 images?: {backdrops?: {file_path:string;iso_639_1?:string|null}[]};
 credits?: {cast?:{name:string}[];crew?:{name:string;job:string}[]};
 alternative_titles?: {titles?:{title:string}[]};
}

export function isEligible(movie: TmdbSummary, era: string, today = new Date().toISOString().slice(0,10)): boolean {
 const bounds = ERAS[era];
 return Number.isSafeInteger(movie.id) && movie.id > 0 && !!movie.title?.trim()
  && movie.original_language === 'te' && movie.adult !== true
  && /^\d{4}-\d{2}-\d{2}$/.test(movie.release_date)
  && movie.release_date <= today
  && (!bounds || movie.release_date >= bounds[0] && movie.release_date <= bounds[1]);
}

export function discoveryParams(input: URLSearchParams, relaxed = false, today = new Date().toISOString().slice(0,10)): URLSearchParams {
 const params = new URLSearchParams({with_original_language:'te',language:'en-US',include_adult:'false',sort_by:'popularity.desc','primary_release_date.lte':today});
 const bounds = ERAS[input.get('era') ?? ''];
 if (bounds) {
  params.set('primary_release_date.gte',bounds[0]);
  params.set('primary_release_date.lte',bounds[1] < today ? bounds[1] : today);
 }
 if (!relaxed) {
  const genre = GENRES[input.get('genre') ?? ''];
  if (genre) params.set('with_genres',String(genre));
  if (input.get('time') === 'Under 2 hrs') params.set('with_runtime.lte','119');
  if (input.get('time') === '2-3 hrs') { params.set('with_runtime.gte','120'); params.set('with_runtime.lte','180'); }
 }
 return params;
}

/** Mood/company are preference heuristics, not metadata supplied by TMDB. */
export function preferenceTags(genres: string[], year: number, currentYear = new Date().getUTCFullYear()) {
 const has = (...values:string[]) => values.some(value=>genres.includes(value));
 const moods = new Set<string>();
 const company = new Set<string>(['Alone']);
 if (has('Comedy','Action','Thriller')) moods.add('Bored');
 if (has('Comedy','Family','Romance')) moods.add('Tired');
 if (has('Action','Adventure','Thriller','Fantasy','Science Fiction')) moods.add('Excited');
 if (has('Romance','Drama','Family')) moods.add('Sad');
 if (year <= currentYear - 15) moods.add('Nostalgic');
 if (has('Action','Comedy','Thriller','Fantasy')) company.add('Friends');
 if (has('Family','Animation')) company.add('Family');
 if (has('Romance','Drama')) company.add('Partner');
 return {moods:[...moods],company:[...company]};
}

const imageUrl = (path: string | null | undefined, size:string) => path && /^\/[a-zA-Z0-9_.-]+$/.test(path) ? `https://image.tmdb.org/t/p/${size}${path}` : '';

export function mapMovie(movie: TmdbMovie): Movie {
 const year = Number(movie.release_date.slice(0,4));
 const genres = (movie.genres ?? []).map(genre=>GENRE_NAMES[genre.id] ?? genre.name);
 const sourceUrl = `https://www.themoviedb.org/movie/${movie.id}`;
 // Null-tagged backdrops are candidates only; the browser screens the actual image pixels.
 const hintImages = [...new Set((movie.images?.backdrops ?? [])
  .filter(image=>image.file_path !== movie.poster_path && image.iso_639_1 === null)
  .map(image=>imageUrl(image.file_path,'w1280')).filter(Boolean))].slice(0,24);
 return {
  id:-movie.id, tmdbId:movie.id, source:'tmdb', title:movie.title.trim(), year,
  genres, ...preferenceTags(genres,year), runtimeMinutes:movie.runtime ?? 0,
  hero:movie.credits?.cast?.[0]?.name ?? 'Cast information unavailable',
  director:movie.credits?.crew?.find(person=>person.job === 'Director')?.name ?? 'Director information unavailable',
  posterUrl:imageUrl(movie.poster_path,'w500'), hintImages, hintImageKind:'scene',
  imageSourceUrl:sourceUrl, hintSourceUrls:hintImages.length ? [sourceUrl] : [],
  description:movie.overview?.trim() || 'A Telugu movie picked for your movie night.',
  titleAliases:[...new Set([movie.original_title, ...(movie.alternative_titles?.titles ?? []).map(item=>item.title)]
   .filter((title):title is string=>!!title?.trim()))]
 };
}
