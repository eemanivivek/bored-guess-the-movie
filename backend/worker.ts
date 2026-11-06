import { discoveryParams, ERAS, GENRES, isEligible, mapMovie, TmdbMovie, TmdbSummary } from './tmdb';
import { ANY_ERA } from '../src/app/core/models/questions.data';

export interface Env { TMDB_READ_TOKEN?: string; ALLOWED_ORIGINS?: string; }
type Fetcher = (request: string | URL | Request, init?: RequestInit) => Promise<Response>;
interface SearchResponse { results: TmdbSummary[]; total_pages?: number; }
interface Person {id:number;name:string;known_for_department?:string;adult?:boolean;also_known_as?:string[];}
const personKey=(value:string)=>value.toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');
const actorQuery=(value:string)=>personKey(value)==='jrntr'?'N. T. Rama Rao Jr.':value;
const defaultOrigins = 'http://localhost:4200,http://127.0.0.1:4200,http://127.0.0.1:4202';

/** Bounded cache and fixed endpoints keep this from becoming an arbitrary credentialed proxy. */
export function createApi(fetcher: Fetcher = fetch, random: () => number = Math.random) {
 const cache = new Map<string,{expires:number;value:unknown}>();
 const inFlight = new Map<string,Promise<unknown>>();
 const rates = new Map<string,{start:number;count:number}>();

 async function tmdb<T>(path: string, params: URLSearchParams, token: string): Promise<T> {
  const key = path + '?' + params;
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return hit.value as T;
  if (inFlight.has(key)) return inFlight.get(key) as Promise<T>;
  const work = (async()=>{
   const response = await fetcher(`https://api.themoviedb.org/3/${key}`,{
    headers:{Authorization:`Bearer ${token}`,Accept:'application/json'}, signal:AbortSignal.timeout(5500)
   });
   if (!response.ok) throw new Error('Movie service unavailable');
   const value:unknown = await response.json();
   if(cache.size >= 200) cache.delete(cache.keys().next().value!);
   cache.set(key,{expires:Date.now()+60*60*1000,value});
   return value;
  })();
  inFlight.set(key,work);
  try { return await work as T; } finally { inFlight.delete(key); }
 }

 return async function handle(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const origin = request.headers.get('Origin');
  const allowed = (env.ALLOWED_ORIGINS ?? defaultOrigins).split(',').map(value=>value.trim());
  const headers:Record<string,string> = {'Content-Type':'application/json','Vary':'Origin','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
  const reply = (value:unknown,status=200) => new Response(JSON.stringify(value),{status,headers});
  if(origin && !allowed.includes(origin)) return reply({error:'Origin not allowed'},403);
  if(origin) headers['Access-Control-Allow-Origin'] = origin;
  if(request.method === 'OPTIONS') {
   headers['Access-Control-Allow-Methods']='GET, OPTIONS';
   return new Response(null,{status:204,headers});
  }
  if(request.method !== 'GET') return reply({error:'Method not allowed'},405);
  if(!['/api/movies','/api/search','/api/heroes','/api/health'].includes(url.pathname)) return reply({error:'Not found'},404);
  if(url.pathname === '/api/health') return reply({configured:!!env.TMDB_READ_TOKEN?.trim()});
  const ip = request.headers.get('CF-Connecting-IP') ?? 'local';
  const now = Date.now();
  let rate = rates.get(ip);
  if(!rate || now-rate.start > 60000) { rate={start:now,count:0}; if(rates.size >= 1000) rates.clear(); rates.set(ip,rate); }
  if(++rate.count > 30) { headers['Retry-After']='60'; return reply({error:'Please try again shortly'},429); }
  if(!env.TMDB_READ_TOKEN?.trim()) return reply({error:'Online movie discovery is not configured'},503);
  try {
   if(url.pathname==='/api/heroes'){
    const query=(url.searchParams.get('q')??'').trim();
    if(query.length<2||query.length>80)return reply({error:'Enter between 2 and 80 characters'},400);
    const data=await tmdb<{results:Person[]}>('search/person',new URLSearchParams({query:actorQuery(query),language:'en-US',include_adult:'false'}),env.TMDB_READ_TOKEN);
    return reply({names:[...new Set((data.results??[]).filter(p=>p.adult!==true&&p.known_for_department==='Acting'&&typeof p.name==='string').map(p=>p.name))].slice(0,8)});
   }
   if(url.pathname === '/api/search') {
    const query=(url.searchParams.get('q') ?? '').trim();
    if(query.length < 2 || query.length > 80) return reply({error:'Enter between 2 and 80 characters'},400);
    const data = await tmdb<SearchResponse>('search/movie',new URLSearchParams({query,language:'en-US',include_adult:'false'}),env.TMDB_READ_TOKEN);
    return reply({titles:(data.results ?? []).filter(movie=>isEligible(movie,''))
     .slice(0,10).map(movie=>({title:movie.title,aliases:movie.original_title ? [movie.original_title] : []}))});
   }
   const input=url.searchParams;
   const gameSearch=input.get('game')==='true';
   const requestedPage=Number(input.get('page')??1);
   if(input.has('page')&&(!Number.isInteger(requestedPage)||requestedPage<1||requestedPage>500))return reply({error:'Invalid discovery page'},400);
   const excludedText=input.get('exclude')??'';
   if(excludedText.length>2400||excludedText&&!/^\d+(,\d+)*$/.test(excludedText))return reply({error:'Invalid exclusions'},400);
   const excluded=new Set(excludedText.split(',').filter(Boolean).map(Number));
   if(input.get('era') && input.get('era')!==ANY_ERA && !ERAS[input.get('era')!]) return reply({error:'Unknown era'},400);
   if(input.get('genre') && !GENRES[input.get('genre')!]) return reply({error:'Unknown genre'},400);
   if(input.get('time') && !['Under 2 hrs','2-3 hrs',"Doesn't matter"].includes(input.get('time')!)) return reply({error:'Unknown runtime preference'},400);
   const hero=(input.get('hero')??'').trim();let personId:number|undefined;
   if(hero){
    if(hero.length<2||hero.length>80)return reply({error:'Enter a valid actor name'},400);
    const query=actorQuery(hero);
    const people=await tmdb<{results:Person[]}>('search/person',new URLSearchParams({query,language:'en-US',include_adult:'false'}),env.TMDB_READ_TOKEN);
    const actors=(people.results??[]).filter(p=>p.adult!==true&&p.known_for_department==='Acting'&&Number.isSafeInteger(p.id)&&p.id>0);
    let person=actors.find(p=>personKey(p.name)===personKey(query));
    if(!person){for(const candidate of actors.slice(0,3)){const detail=await tmdb<Person>(`person/${candidate.id}`,new URLSearchParams({language:'en-US'}),env.TMDB_READ_TOKEN);if((detail.also_known_as??[]).some(name=>personKey(name)===personKey(query))){person=candidate;break;}}}
    if(!person)return reply({error:'No matching actor found'},404);personId=person.id;
   }
   // Scene searches can widen genre/runtime, while language, hero and era stay strict.
   let params=discoveryParams(input,gameSearch);
   if(personId)params.set('with_cast',String(personId));
   let discovery=await tmdb<SearchResponse>('discover/movie',params,env.TMDB_READ_TOKEN);
   if(!discovery.results?.length) { params=discoveryParams(input,true);if(personId)params.set('with_cast',String(personId)); discovery=await tmdb<SearchResponse>('discover/movie',params,env.TMDB_READ_TOKEN); }
   const pages=Math.min(discovery.total_pages ?? 1,500);
   if(gameSearch&&requestedPage>pages)return reply({movies:[],exhausted:true});
   const page=gameSearch?requestedPage:1+Math.floor(random()*Math.min(pages,5));
   if(page > 1) {
    params.set('page',String(page));
    const extra=await tmdb<SearchResponse>('discover/movie',params,env.TMDB_READ_TOKEN);
    discovery={...discovery,results:gameSearch?extra.results:[...discovery.results,...(extra.results ?? [])]};
   }
   const summaries=[...new Map((discovery.results ?? []).filter(movie=>!excluded.has(movie.id)&&isEligible(movie,input.get('era') ?? '')).map(movie=>[movie.id,movie])).values()];
   // Sample at most six detail calls, three at a time, within the request budget.
   for(let i=summaries.length-1;i>0;i--) { const j=Math.floor(random()*(i+1)); [summaries[i],summaries[j]]=[summaries[j],summaries[i]]; }
   const movies=[];
   for(let offset=0;offset<Math.min(summaries.length,6);offset+=3) {
    const details=await Promise.allSettled(summaries.slice(offset,offset+3).map(movie=>tmdb<TmdbMovie>(`movie/${movie.id}`,new URLSearchParams({language:'en-US',append_to_response:'credits,images,alternative_titles',include_image_language:'te,null'}),env.TMDB_READ_TOKEN!)));
    for(const result of details) if(result.status==='fulfilled' && isEligible(result.value,input.get('era') ?? '')&&(!personId||result.value.credits?.cast?.some(actor=>actor.id===personId))) movies.push({...mapMovie(result.value),...(personId?{matchedHero:hero}:{})});
   }
   if(!movies.length&&!gameSearch) return reply({error:'No online matches available'},hero?404:503);
   return reply({movies,...(gameSearch?{nextPage:summaries.length>6?page:page+1,exhausted:page>=pages&&summaries.length<=6}:{})});
  } catch { return reply({error:'Online movie discovery is temporarily unavailable'},502); }
 };
}

const handle = createApi();
export default { fetch: (request:Request, env:Env) => handle(request,env) };
