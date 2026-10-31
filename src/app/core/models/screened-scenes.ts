import { Movie } from './movie';
import { MAX_ATTEMPTS } from './game';

export const imageKey = (value:string):string => value.replace(/^(https:\/\/image\.tmdb\.org\/t\/p\/)\w+\//,'$1original/');

/** Only an API image that passed this session's text check can become a game hint. */
export function safeRoundImages(movie: Movie): string[] {
 if(movie.source !== 'tmdb') return [];
 const checked=new Set((movie.screenedHintImages ?? []).map(imageKey));
 return [...new Map(movie.hintImages.map(url=>[imageKey(url),url])).values()]
  .filter(url=>/^https:\/\/image\.tmdb\.org\/t\/p\//.test(url) && checked.has(imageKey(url)) && imageKey(url)!==imageKey(movie.posterUrl))
  .slice(0,MAX_ATTEMPTS);
}
export function hasFullSceneDeck(movie: Movie): boolean { return safeRoundImages(movie).length === MAX_ATTEMPTS; }
export function hasPlayableScenes(movie: Movie): boolean { return safeRoundImages(movie).length > 0; }
