import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, timeout } from 'rxjs';
import { Answers, Movie, normalizeTitle } from '../models/movie';
import { movieEra, selectMovie } from './recommendation';
import { validOnlineMovie } from './online-movies';
import { imageKey } from '../models/screened-scenes';
import { SceneProgress, SceneScreen, screenSceneDeck } from './scene-deck';

@Injectable({providedIn:'root'})
export class RecommendationService {
 private readonly http=inject(HttpClient);
 private readonly discovered=signal<Movie[]>([]);
 readonly online=signal(false);
 private config?:Promise<string>;
 private readonly recent:number[]=[];
 private readonly played:number[]=[];
 private readonly searchCache=new Map<string,string[]>();

 private apiUrl():Promise<string>{
  return this.config ??= firstValueFrom(this.http.get<{movieApiUrl?:string}>('assets/app-config.json').pipe(timeout(3000)))
   .then(config=>{
    const value=config.movieApiUrl?.trim().replace(/\/$/,'') ?? '';
    if(value==='/api')return value;
    try{const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password&&!url.search&&!url.hash&&url.pathname.endsWith('/api')?value:'';}catch{return '';}
   }).catch(()=>'');
 }

 private async fetchMovies(answers:Answers):Promise<Movie[]>{
  const api=await this.apiUrl();
  if(!api)throw new Error('Online recommendations aren’t configured. Start the movie API and try again.');
  const params:Record<string,string>={};
  for(const key of ['era','genre','time'])if(answers[key])params[key]=answers[key];
  try{
   const response=await firstValueFrom(this.http.get<{movies:unknown[]}>(api+'/movies',{params}).pipe(timeout(20000)));
   const movies=(response.movies ?? []).filter(validOnlineMovie)
    .filter(movie=>!answers['era']||movieEra(movie.year)===answers['era'])
    .map(movie=>({...movie,screenedHintImages:undefined}));
   if(!movies.length)throw new Error('No API matches');
   this.discovered.set([...new Map([...this.discovered(),...movies].map(movie=>[movie.id,movie])).values()].slice(-200));
   this.online.set(true);return movies;
  }catch{
   this.online.set(false);
   throw new Error('Couldn’t get movies from the API. Check the movie API server and try again.');
  }
 }

 async recommend(answers:Answers,excludeId?:number):Promise<Movie>{
  const movies=await this.fetchMovies(answers);
  const available=movies.filter(movie=>movie.id!==excludeId);
  const eligible=available.length?available:movies;
  const fresh=eligible.filter(movie=>!this.recent.includes(movie.id));
  const chosen=selectMovie(fresh.length?fresh:eligible,answers);
  this.recent.push(chosen.id);if(this.recent.length>20)this.recent.shift();
  return chosen;
 }

 async suggest(value:string):Promise<string[]>{
  const query=normalizeTitle(value);
  if(!query)return [];
  const known=this.discovered().filter(movie=>[movie.title,...(movie.titleAliases ?? [])].some(title=>normalizeTitle(title).includes(query))).map(movie=>movie.title);
  const combine=(titles:string[])=>[...new Set([...known,...titles])].slice(0,5);
  if(query.length<2)return combine([]);
  if(this.searchCache.has(query))return combine(this.searchCache.get(query)!);
  const api=await this.apiUrl();if(!api)return combine([]);
  try{
   const response=await firstValueFrom(this.http.get<{titles:{title:string;aliases?:string[]}[]}>(api+'/search',{params:{q:value.trim().slice(0,80)}}).pipe(timeout(4000)));
   const titles=(response.titles ?? []).filter(item=>typeof item.title==='string')
    .filter(item=>[item.title,...(item.aliases ?? [])].some(title=>normalizeTitle(title).includes(query))).map(item=>item.title);
   if(this.searchCache.size>=50)this.searchCache.delete(this.searchCache.keys().next().value!);
   this.searchCache.set(query,titles);return combine(titles);
  }catch{return combine([]);}
 }

 async preparePictureGame(answers:Answers,current:Movie,screen:SceneScreen=screenSceneDeck,progress:SceneProgress=()=>{},signal?:AbortSignal):Promise<Movie>{
  const preferences={...answers,era:answers['era']||movieEra(current.year)};
  const tried=new Set<number>();
  // Every candidate is an API result. No local catalogue, approved-title pool or text fallback.
  for(let batch=0;batch<3;batch++){
   const all=[...new Map([...this.discovered(),current].filter(movie=>movie.source==='tmdb').map(movie=>[movie.id,movie])).values()];
   let candidates=all.filter(movie=>movieEra(movie.year)===preferences.era && !tried.has(movie.id)
    && movie.hintImages.length>0);
   for(let attempt=0;attempt<3 && candidates.length;attempt++){
    if(signal?.aborted)throw new DOMException('Photo check cancelled','AbortError');
    const fresh=candidates.filter(movie=>!this.played.includes(movie.id));
    const preferred=candidates.find(movie=>movie.id===current.id&&!this.played.includes(movie.id));
    const chosen=preferred ?? selectMovie(fresh.length?fresh:candidates,preferences);
    tried.add(chosen.id);candidates=candidates.filter(movie=>movie.id!==chosen.id);
    const checked=await screen(chosen.hintImages,[chosen.title,...(chosen.titleAliases ?? [])],progress,signal);
    const allowed=new Set(chosen.hintImages.map(imageKey));
    const images=[...new Map(checked.filter(url=>allowed.has(imageKey(url))&&imageKey(url)!==imageKey(chosen.posterUrl)).map(url=>[imageKey(url),url])).values()].slice(0,5);
    if(images.length>0){
     this.played.push(chosen.id);if(this.played.length>20)this.played.shift();
     return {...chosen,hintImages:images,screenedHintImages:images};
    }
   }
   if(batch<2){progress('Finding more API movies with scene photos…');await this.fetchMovies(preferences);}
  }
  throw new Error('No scene photos passed the text check for these API movies. Try again for more movies, or skip to movie details.');
 }
}
