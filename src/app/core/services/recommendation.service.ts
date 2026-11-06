import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, timeout } from 'rxjs';
import { Answers, Movie, normalizeTitle } from '../models/movie';
import { matchesEra, movieEra, selectMovie } from './recommendation';
import { validOnlineMovie } from './online-movies';
import { imageKey } from '../models/screened-scenes';
import { MIN_SCENE_PHOTOS } from '../models/game';
import { ANY_ERA, HEROES, RANDOM_GENRE } from '../models/questions.data';
import { SceneProgress, SceneScreen, screenSceneDeck } from './scene-deck';

export class SceneSearchExhaustedError extends Error {
 constructor(){super('No more movies with two checked scene photos were found for this hero and era. Change your preferences, or skip to movie details.');}
}
interface SceneSearch {tried:Set<number>;page:number;exhausted:boolean;}

@Injectable({providedIn:'root'})
export class RecommendationService {
 private readonly http=inject(HttpClient);
 private readonly discovered=signal<Movie[]>([]);
 readonly online=signal(false);
 private config?:Promise<string>;
 private readonly recent:number[]=[];
 private readonly played:number[]=[];
 private readonly searchCache=new Map<string,string[]>();
 private readonly sceneSearches=new Map<string,SceneSearch>();

 private apiUrl():Promise<string>{
  return this.config ??= firstValueFrom(this.http.get<{movieApiUrl?:string}>('assets/app-config.json').pipe(timeout(3000)))
   .then(config=>{
    const value=config.movieApiUrl?.trim().replace(/\/$/,'') ?? '';
    if(value==='/api')return value;
    try{const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password&&!url.search&&!url.hash&&url.pathname.endsWith('/api')?value:'';}catch{return '';}
   }).catch(()=>'');
 }

 private async fetchMovies(answers:Answers,search?:SceneSearch):Promise<Movie[]>{
  const api=await this.apiUrl();
  if(!api)throw new Error('Online recommendations aren’t configured. Start the movie API and try again.');
  const params:Record<string,string>={};
  for(const key of ['era','genre','time'])if(answers[key] && !(key==='genre'&&answers[key]===RANDOM_GENRE) && !(key==='era'&&answers[key]===ANY_ERA))params[key]=answers[key];
  if(answers['hero']?.trim() && !['Other','No preference'].includes(answers['hero']))params['hero']=answers['hero'].trim();
  if(search){params['game']='true';params['page']=String(search.page);const ids=[...search.tried].slice(-200).map(id=>-id);if(ids.length)params['exclude']=ids.join(',');}
  try{
   const response=await firstValueFrom(this.http.get<{movies:unknown[];nextPage?:number;exhausted?:boolean}>(api+'/movies',{params}).pipe(timeout(20000)));
   const movies=(response.movies ?? []).filter(validOnlineMovie)
    .filter(movie=>matchesEra(movie,answers['era']))
    .map(movie=>({...movie,screenedHintImages:undefined}));
   if(!movies.length&&!search)throw new Error('No API matches');
   if(search){search.page=Number.isInteger(response.nextPage)&&response.nextPage!>=search.page?response.nextPage!:search.page+1;search.exhausted=response.exhausted===true;}
   this.discovered.set([...new Map([...this.discovered(),...movies].map(movie=>[movie.id,movie])).values()].slice(-200));
   this.online.set(true);return movies;
  }catch(error){
   this.online.set(false);
   if((error as {status?:number}).status===404)throw new Error('No Telugu movies found for that hero in your chosen era. Try another name or era, or choose No preference.');
   throw new Error('Couldn’t get movies from the API. Check the movie API server and try again.');
  }
 }

 async suggestHeroes(value:string):Promise<string[]>{
  const query=normalizeTitle(value);if(query.length<2)return [];
  const known=HEROES.filter(name=>normalizeTitle(name).includes(query));
  const api=await this.apiUrl();if(!api)return known;
  try{const response=await firstValueFrom(this.http.get<{names:string[]}>(api+'/heroes',{params:{q:value.trim().slice(0,80)}}).pipe(timeout(4000)));return [...new Set([...known,...(response.names??[]).filter(name=>typeof name==='string')])].slice(0,8);}catch{return known;}
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
  const preferences:Answers={...answers,era:answers['era']||movieEra(current.year)};
  const key=JSON.stringify([preferences['era'],normalizeTitle(preferences['hero']??'')]);
  let search=this.sceneSearches.get(key);
  if(!search){if(this.sceneSearches.size>=10)this.sceneSearches.delete(this.sceneSearches.keys().next().value!);search={tried:new Set<number>(),page:1,exhausted:false};this.sceneSearches.set(key,search);}
  const tried=search.tried;
  // Every candidate is an API result. No local catalogue, approved-title pool or text fallback.
  for(let batch=0;batch<3;batch++){
   const all=[...new Map([...this.discovered(),current].filter(movie=>movie.source==='tmdb').map(movie=>[movie.id,movie])).values()];
   for(const movie of all)if(new Set(movie.hintImages.map(imageKey)).size<MIN_SCENE_PHOTOS)tried.add(movie.id);
   let candidates=all.filter(movie=>matchesEra(movie,preferences['era']) && !tried.has(movie.id)
    && (!preferences['hero']||preferences['hero']==='No preference'||normalizeTitle((movie as Movie&{matchedHero?:string}).matchedHero??'')===normalizeTitle(preferences['hero']))
    && new Set(movie.hintImages.map(imageKey)).size>=MIN_SCENE_PHOTOS);
   for(let attempt=0;attempt<3 && candidates.length;attempt++){
    if(signal?.aborted)throw new DOMException('Photo check cancelled','AbortError');
    const fresh=candidates.filter(movie=>!this.played.includes(movie.id));
    const preferred=candidates.find(movie=>movie.id===current.id&&!this.played.includes(movie.id));
    const chosen=preferred ?? selectMovie(fresh.length?fresh:candidates,preferences);
    candidates=candidates.filter(movie=>movie.id!==chosen.id);
    const checked=await screen(chosen.hintImages,[chosen.title,...(chosen.titleAliases ?? [])],progress,signal);
    if(signal?.aborted)throw new DOMException('Photo check cancelled','AbortError');
    const allowed=new Set(chosen.hintImages.map(imageKey));
    const images=[...new Map(checked.filter(url=>allowed.has(imageKey(url))&&imageKey(url)!==imageKey(chosen.posterUrl)).map(url=>[imageKey(url),url])).values()].slice(0,5);
    if(images.length>=MIN_SCENE_PHOTOS){
     this.played.push(chosen.id);if(this.played.length>20)this.played.shift();
     return {...chosen,hintImages:images,screenedHintImages:images};
    }
    tried.add(chosen.id);
   }
   if(!candidates.length&&search.exhausted)throw new SceneSearchExhaustedError();
   if(batch<2&&!search.exhausted){if(signal?.aborted)throw new DOMException('Photo check cancelled','AbortError');progress('Searching new movies in your era, keeping your hero choice…');await this.fetchMovies(preferences,search);}
  }
  throw new Error('At least two scene photos must pass the text check to play. Try more movies, or skip to movie details.');
 }
}
