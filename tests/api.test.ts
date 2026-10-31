import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createApi } from '../backend/worker';
import { discoveryParams, isEligible, mapMovie, preferenceTags, TmdbMovie } from '../backend/tmdb';

const movie: TmdbMovie = {
 id:12345,title:'A Telugu Adventure',original_title:'ఒక సినిమా',original_language:'te',release_date:'2024-01-12',
 runtime:150,genres:[{id:28,name:'Action'},{id:14,name:'Fantasy'}],poster_path:'/poster.jpg',overview:'A story.',
 credits:{cast:[{name:'Lead Actor'}],crew:[{job:'Director',name:'Film Director'}]},
 images:{backdrops:[{file_path:'/frame1.jpg',iso_639_1:null},{file_path:'/frame1.jpg',iso_639_1:null},{file_path:'/frame2.jpg',iso_639_1:null},{file_path:'/poster.jpg',iso_639_1:'hi'}]},
 alternative_titles:{titles:[{title:'Alternate title'}]}
};
const env={TMDB_READ_TOKEN:'test-server-only-token'};
const request=(path:string,origin='http://localhost:4200',method='GET')=>new Request('https://api.example'+path,{method,headers:{Origin:origin}});

test('discovery requests originally Telugu movies, correct era dates, genre and runtime; relaxation retains era',()=>{
 const input=new URLSearchParams({era:'2010-2020',genre:'Action',time:'Under 2 hrs'});
 const params=discoveryParams(input,false,'2026-10-31');
 assert.equal(params.get('with_original_language'),'te');assert.equal(params.get('primary_release_date.gte'),'2011-01-01');
 assert.equal(params.get('primary_release_date.lte'),'2020-12-31');assert.equal(params.get('with_genres'),'28');assert.equal(params.get('with_runtime.lte'),'119');
 const relaxed=discoveryParams(input,true);assert.equal(relaxed.get('primary_release_date.gte'),'2011-01-01');assert.equal(relaxed.has('with_genres'),false);
 assert.equal(discoveryParams(new URLSearchParams({era:'Recent'}),false,'2026-10-31').get('primary_release_date.lte'),'2026-10-31');
});
test('language, era, adult and future release checks apply to API responses too',()=>{
 assert.equal(isEligible(movie,'Recent'),true);
 for(const change of [{original_language:'hi'},{adult:true},{release_date:'2099-01-01'},{release_date:''},{id:NaN}]) assert.equal(isEligible({...movie,...change},'Recent'),false);
 assert.equal(isEligible({...movie,release_date:'2010-12-31'},'2010-2020'),false);
 assert.equal(isEligible({...movie,release_date:'2011-01-01'},'2010-2020'),true);
});
test('mapping uses distinct backdrops, negative IDs, aliases and heuristics without reusing the poster',()=>{
 const mapped=mapMovie(movie);
 assert.equal(mapped.id,-12345);assert.equal(mapped.tmdbId,12345);assert.equal(mapped.source,'tmdb');
 assert.equal(mapped.hintImages.length,2);assert.ok(mapped.hintImages.every(url=>!url.endsWith('/poster.jpg')));
 assert.ok(mapped.titleAliases?.includes('ఒక సినిమా'));assert.equal(mapped.director,'Film Director');assert.equal(mapped.hero,'Lead Actor');
 assert.ok(preferenceTags(['Romance','Family'],1990,2026).moods.includes('Nostalgic'));
 assert.deepEqual(mapMovie({...movie,images:undefined,poster_path:null}).hintImages,[]);
});
test('Telugu/English title artwork and images with unknown language metadata are excluded from candidates',()=>{
 const mapped=mapMovie({...movie,images:{backdrops:[
  {file_path:'/telugu-title.jpg',iso_639_1:'te'}, {file_path:'/english-title.jpg',iso_639_1:'en'},
  {file_path:'/unknown.jpg'}, {file_path:'/poster.jpg',iso_639_1:null}, {file_path:'/neutral.jpg',iso_639_1:null}
 ]}});
 assert.deepEqual(mapped.hintImages,['https://image.tmdb.org/t/p/w1280/neutral.jpg']);
});
test('proxy authenticates only upstream, fixes endpoints, caches responses and never returns its credential',async()=>{
 const calls:URL[]=[];
 const api=createApi(async(url,init)=>{
  const parsed=new URL(String(url));calls.push(parsed);
  assert.equal(parsed.origin,'https://api.themoviedb.org');assert.equal(new Headers(init?.headers).get('Authorization'),'Bearer '+env.TMDB_READ_TOKEN);
  return Response.json(parsed.pathname.endsWith('/discover/movie')?{results:[movie,{...movie,id:77,original_language:'hi'}],total_pages:1}:movie);
 },()=>0);
 const response=await api(request('/api/movies?era=Recent&genre=Action'),env);
 assert.equal(response.status,200);assert.equal(response.headers.get('Access-Control-Allow-Origin'),'http://localhost:4200');
 const body=await response.text();assert.ok(!body.includes(env.TMDB_READ_TOKEN));assert.equal(JSON.parse(body).movies.length,1);
 await api(request('/api/movies?era=Recent&genre=Action'),env);assert.equal(calls.length,2);
 assert.equal((await api(request('/api/proxy?url=https://evil.example'),env)).status,404);
 assert.equal((await api(request('/api/movies?era=anything'),env)).status,400);
 assert.equal((await api(request('/api/movies','https://evil.example'),env)).status,403);
 assert.equal((await api(request('/api/movies','http://localhost:4200','POST'),env)).status,405);
 assert.equal((await api(request('/api/movies'),{})).status,503);
});
test('an upstream error yields a generic error; details from other languages never become recommendations',async()=>{
 const down=createApi(async()=>{throw new Error('secret '+env.TMDB_READ_TOKEN);});
 const error=await down(request('/api/movies'),env);assert.equal(error.status,502);assert.ok(!(await error.text()).includes(env.TMDB_READ_TOKEN));
 const wrongLanguage=createApi(async(url)=>Response.json(String(url).includes('discover/movie')?{results:[movie],total_pages:1}:{...movie,original_language:'hi'}));
 assert.equal((await wrongLanguage(request('/api/movies?era=Recent'),env)).status,503);
});
test('empty filtered discovery relaxes preferences, never era; partial detail failures still return valid candidates',async()=>{
 const queries:URL[]=[];
 const api=createApi(async(url)=>{
  const parsed=new URL(String(url));queries.push(parsed);
  if(parsed.pathname.endsWith('discover/movie')) return Response.json({results:parsed.searchParams.has('with_genres')?[]:[movie,{...movie,id:2}],total_pages:1});
  if(parsed.pathname.endsWith('/2')) return new Response(null,{status:500});
  return Response.json(movie);
 },()=>0);
 const result=await api(request('/api/movies?era=Recent&genre=Action'),env);
 assert.equal(result.status,200);assert.equal((await result.json() as {movies:unknown[]}).movies.length,1);
 assert.ok(queries.filter(url=>url.pathname.endsWith('discover/movie')).every(url=>url.searchParams.get('primary_release_date.gte')==='2021-01-01'));
});
test('autocomplete filters non-Telugu and future films and bounds query length',async()=>{
 const api=createApi(async()=>Response.json({results:[movie,{...movie,title:'Hindi version',original_language:'hi'},{...movie,title:'Future',release_date:'2099-01-01'}]}));
 const response=await api(request('/api/search?q=Adventure'),env);
 assert.equal(response.status,200);assert.deepEqual((await response.json() as {titles:unknown[]}).titles,[{title:movie.title,aliases:['ఒక సినిమా']}]);
 assert.equal((await api(request('/api/search?q=x'),env)).status,400);
 assert.equal((await api(request('/api/search?q='+'x'.repeat(81)),env)).status,400);
});
test('bursts are bounded and preflight returns allowed methods without requiring a credential',async()=>{
 const api=createApi(async()=>Response.json({results:[]}));
 assert.equal((await api(request('/api/movies','http://localhost:4200','OPTIONS'),{})).status,204);
 for(let i=0;i<30;i++) await api(request('/api/search?q=film'),env);
 const response=await api(request('/api/search?q=film'),env);assert.equal(response.status,429);assert.equal(response.headers.get('Retry-After'),'60');
});
