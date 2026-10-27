import { Answers, Movie } from '../models/movie';

export function movieEra(year: number): string {
 return year < 2000 ? 'Classic (before 2000)' : year <= 2010 ? '2000-2010' : year <= 2020 ? '2010-2020' : 'Recent';
}

export function scoreMovie(movie: Movie, answers: Answers): number {
 let score = 0;
 if(movie.moods.includes(answers['mood'])) score += 3;
 if(movie.genres.includes(answers['genre'])) score += 3;
 if(movie.company.includes(answers['company'])) score++;
 if(answers['time']==='Under 2 hrs' && movie.runtimeMinutes < 120 || answers['time']==='2-3 hrs' && movie.runtimeMinutes>=120 && movie.runtimeMinutes<=180) score++;
 return score;
}
export function selectMovie(movies: Movie[], answers: Answers, excludeId?: number): Movie {
 if(!movies.length) throw new Error('The movie catalogue is empty.');
 const eraPool = answers['era'] ? movies.filter(movie => movieEra(movie.year) === answers['era']) : movies;
 if(!eraPool.length) throw new Error('No movies are available for this era. Please choose another era.');
 // Another recommendation must stay within the era, even if it has only one film.
 const pool=eraPool.filter(m=>m.id!==excludeId); const available=pool.length?pool:eraPool;
 const best=Math.max(...available.map(m=>scoreMovie(m,answers)));
 const candidates=best>0?available.filter(m=>scoreMovie(m,answers)===best):available;
 return candidates[Math.floor(Math.random()*candidates.length)];
}
