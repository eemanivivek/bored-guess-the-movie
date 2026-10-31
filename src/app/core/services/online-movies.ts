import { Movie } from '../models/movie';

export function validOnlineMovie(value: unknown): value is Movie {
 if(!value || typeof value !== 'object') return false;
 const movie = value as Movie;
 const strings = (values: unknown): values is string[] => Array.isArray(values) && values.every(item=>typeof item === 'string');
 return movie.source === 'tmdb' && Number.isSafeInteger(movie.tmdbId) && movie.tmdbId! > 0 && movie.id === -movie.tmdbId!
  && typeof movie.title === 'string' && !!movie.title.trim() && Number.isInteger(movie.year) && movie.year >= 1900
  && Number.isFinite(movie.runtimeMinutes) && movie.runtimeMinutes >= 0
  && typeof movie.hero === 'string' && typeof movie.director === 'string' && typeof movie.description === 'string'
  && strings(movie.genres) && strings(movie.moods) && strings(movie.company) && strings(movie.hintImages)
  && movie.hintImages.every(url=>/^https:\/\/image\.tmdb\.org\/t\/p\//.test(url))
  && typeof movie.posterUrl === 'string' && (!movie.posterUrl || /^https:\/\/image\.tmdb\.org\/t\/p\//.test(movie.posterUrl))
  && (movie.titleAliases === undefined || strings(movie.titleAliases));
}


