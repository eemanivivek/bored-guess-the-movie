import { Answers, Movie } from '../models/movie';
import { ANY_ERA, RANDOM_GENRE } from '../models/questions.data';

export function movieEra(year: number): string {
 return year < 2000 ? 'Classic (before 2000)' : year <= 2010 ? '2000-2010' : year <= 2020 ? '2010-2020' : 'Recent';
}
export const matchesEra=(movie:Movie,era?:string)=>!era||era===ANY_ERA||movieEra(movie.year)===era;

export function scoreMovie(movie: Movie, answers: Answers): number {
 let score = 0;
 if(movie.moods.includes(answers['mood'])) score += 3;
 if(answers['genre']!==RANDOM_GENRE && movie.genres.includes(answers['genre'])) score += 3;
 if(movie.company.includes(answers['company'])) score++;
 if(answers['time']==='Under 2 hrs' && movie.runtimeMinutes > 0 && movie.runtimeMinutes < 120 || answers['time']==='2-3 hrs' && movie.runtimeMinutes>=120 && movie.runtimeMinutes<=180) score++;
 return score;
}
export function selectMovie(movies: Movie[], answers: Answers, excludeId?: number, random:()=>number=Math.random): Movie {
 if(!movies.length) throw new Error('The movie catalogue is empty.');
 const eraPool = movies.filter(movie=>matchesEra(movie,answers['era']));
 if(!eraPool.length) throw new Error('No movies are available for this era. Please choose another era.');
 // Another recommendation must stay within the era, even if it has only one film.
 const pool=eraPool.filter(m=>m.id!==excludeId); const available=pool.length?pool:eraPool;
 if(answers['genre']===RANDOM_GENRE) return available[Math.floor(random()*available.length)];
 const best=Math.max(...available.map(m=>scoreMovie(m,answers)));
 const candidates=best>0?available.filter(m=>scoreMovie(m,answers)===best):available;
 return candidates[Math.floor(random()*candidates.length)];
}
