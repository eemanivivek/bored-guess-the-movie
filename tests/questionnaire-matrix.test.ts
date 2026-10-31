import '@angular/compiler';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Injector, runInInjectionContext } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { QUESTIONS } from '../src/app/core/models/questions.data';
import { Answers, Movie } from '../src/app/core/models/movie';
import { RecommendationService } from '../src/app/core/services/recommendation.service';
import { GameStateService } from '../src/app/core/services/game-state.service';
import { scoreMovie, selectMovie } from '../src/app/core/services/recommendation';
import { movieHint } from '../src/app/core/models/hint';
import { safeRoundImages } from '../src/app/core/models/screened-scenes';
import { createApi } from '../backend/worker';
import { GENRES, TmdbMovie } from '../backend/tmdb';

const combinations=QUESTIONS.reduce<Answers[]>((rows,question)=>rows.flatMap(row=>question.options.map(option=>({...row,[question.id]:option.value}))),[{}]);
const values=(id:string)=>QUESTIONS.find(question=>question.id===id)!.options.map(option=>option.value);
// Independent expectations: do not call the production era or scoring helper.
const years=[1995,2005,2015,2024];
const inEra=(movie:Movie,answers:Answers)=>movie.year===years[values('era').indexOf(answers.era)];
const expectedScore=(movie:Movie,a:Answers)=>
 (movie.moods.includes(a.mood)?3:0)+(movie.genres.includes(a.genre)?3:0)+(movie.company.includes(a.company)?1:0)
 +(a.time==='Under 2 hrs'&&movie.runtimeMinutes>0&&movie.runtimeMinutes<120 || a.time==='2-3 hrs'&&movie.runtimeMinutes>=120&&movie.runtimeMinutes<=180?1:0);
const fixtures:Movie[]=years.flatMap((year,e)=>values('genre').flatMap((genre,g)=>values('mood').map((mood,m)=>{
 const id=1+e*100+g*10+m;
 return {id:-id,tmdbId:id,source:'tmdb',title:`API fixture ${id}`,year,genres:[genre],moods:[mood],company:[values('company')[(g+m)%4]],runtimeMinutes:[110,150,190][(g+m)%3],hero:'Fixture actor',director:'Fixture director',description:'Controlled API test data.',posterUrl:`https://image.tmdb.org/t/p/w500/poster${id}.jpg`,hintImages:Array.from({length:5},(_,i)=>`https://image.tmdb.org/t/p/w1280/frame${id}-${i}.jpg`)};
})));
const service=(get:(url:string,options?:{params?:Record<string,string>})=>unknown)=>runInInjectionContext(Injector.create({providers:[{provide:HttpClient,useValue:{get}}]}),()=>new RecommendationService());

test('all 1,440 configured answer combinations score correctly, stay in era, and avoid repeating the last recommendation',async()=>{
 assert.equal(combinations.length,1440);
 for(const answers of combinations){
  const context=JSON.stringify(answers);
  const eligible=fixtures.filter(movie=>inEra(movie,answers));
  for(const movie of fixtures)assert.equal(scoreMovie(movie,answers),expectedScore(movie,answers),context);
  const best=Math.max(...eligible.map(movie=>expectedScore(movie,answers)));
  const direct=selectMovie(fixtures,answers);assert.ok(inEra(direct,answers),context);assert.equal(expectedScore(direct,answers),best,context);
  const recommendations=service((url,options)=>{
   if(url.includes('app-config'))return of({movieApiUrl:'/api'});
   assert.deepEqual(options?.params,{era:answers.era,genre:answers.genre,time:answers.time},context);
   return of({movies:fixtures});
  });
  const chosen=await recommendations.recommend(answers);
  assert.equal(chosen.source,'tmdb',context);assert.ok(chosen.id<0&&inEra(chosen,answers),context);assert.equal(expectedScore(chosen,answers),best,context);
  const another=await recommendations.recommend(answers,chosen.id);
  const alternatives=eligible.filter(movie=>movie.id!==chosen.id);
  assert.notEqual(another.id,chosen.id,context);assert.ok(inEra(another,answers),context);
  assert.equal(expectedScore(another,answers),Math.max(...alternatives.map(movie=>expectedScore(movie,answers))),context);
 }
});

test('all 1,440 combinations with 1–5 approved photos complete on the final photo: 28,800 game paths',async()=>{
 for(const answers of combinations){
  const current=fixtures.find(movie=>inEra(movie,answers)&&movie.genres.includes(answers.genre))!;
  for(let count=1;count<=5;count++){
   const recommendations=service(()=>of({movieApiUrl:'/api'}));
   const prepared=await recommendations.preparePictureGame(answers,current,async urls=>urls.slice(0,count));
   assert.equal(prepared.id,current.id);assert.equal(safeRoundImages(prepared).length,count);
   for(const ending of ['wrong','skip','mixed','win'] as const){
    const state=new GameStateService();for(const [key,value] of Object.entries(answers))state.answer(key,value);state.start(prepared);
    assert.equal(state.maxAttempts(),count);assert.equal(state.attempts(),count);
    const seen=new Set<string>();
    for(let turn=0;turn<count;turn++){
     const hint=movieHint(state.movie()!,state.turns().length);assert.equal(hint.kind,'image');
     if(hint.kind==='image'){assert.equal(hint.index,turn);assert.ok(!seen.has(hint.src));seen.add(hint.src);}
     if(ending==='win'&&turn===count-1){assert.equal(state.guess(current.title),'correct');assert.ok(state.won());}
     else if(ending==='skip'||ending==='mixed'&&turn%2===0)assert.equal(state.skip(),true);
     else {
      assert.equal(state.guess('Unknown test title '+turn),'wrong');
      if(turn<count-1){const remaining=state.attempts();assert.equal(state.guess('Unknown-test-title '+turn),'duplicate');assert.equal(state.attempts(),remaining);}
     }
     assert.equal(state.finished(),turn===count-1);
    }
    assert.equal(state.skip(),false);assert.equal(state.guess('Extra'),'empty');assert.deepEqual(state.answers(),answers);
   }
  }
 }
});

test('all 1,440 combinations allow optional reveal and reject games with no approved photos',async()=>{
 for(const answers of combinations){
  const current=fixtures.find(movie=>inEra(movie,answers))!;
  const state=new GameStateService();state.start(current);assert.equal(state.reveal(),true);
  assert.equal(state.finished(),true);assert.equal(state.revealed(),true);assert.equal(state.won(),false);assert.equal(state.turns().length,0);
  const recommendations=service(url=>of(url.includes('app-config')?{movieApiUrl:'/api'}:{movies:[current]}));
  await assert.rejects(recommendations.preparePictureGame(answers,current,async()=>[]),/No scene photos/);
 }
});

test('all 1,440 combinations handle offline, malformed and wrong-era API data without JSON substitution',async()=>{
 for(const answers of combinations){
  for(const mode of ['offline','malformed','wrong-era']){
   const recommendations=service(url=>url.includes('app-config')?of({movieApiUrl:'/api'}):mode==='offline'?throwError(()=>new Error('offline')):of({movies:mode==='malformed'?[{id:1}]:fixtures.filter(movie=>!inEra(movie,answers))}));
   await assert.rejects(recommendations.recommend(answers),/Couldn’t get movies from the API/);assert.equal(recommendations.online(),false);
  }
 }
});

test('all 72 distinct backend filters preserve Telugu/era and request exact genre/runtime; relaxation only removes soft filters',async()=>{
 let total=0;
 for(const era of values('era'))for(const genre of values('genre'))for(const time of values('time')){
  total++;
  for(const relax of [false,true]){
   let discoveryCalls=0;
   const year=years[values('era').indexOf(era)];
   const fixture:TmdbMovie={id:765,title:'API test movie',original_language:'te',release_date:`${year}-01-01`,runtime:time==='Under 2 hrs'?110:150,genres:[{id:GENRES[genre],name:genre}]};
   const api=createApi(async request=>{
    const url=new URL(String(request));
    if(!url.pathname.endsWith('discover/movie'))return Response.json(fixture);
    discoveryCalls++;
    assert.equal(url.searchParams.get('with_original_language'),'te');assert.equal(url.searchParams.get('include_adult'),'false');
    assert.equal(url.searchParams.get('primary_release_date.gte'),['1900-01-01','2000-01-01','2011-01-01','2021-01-01'][values('era').indexOf(era)]);
    assert.equal(url.searchParams.get('primary_release_date.lte'),['1999-12-31','2010-12-31','2020-12-31',new Date().toISOString().slice(0,10)][values('era').indexOf(era)]);
    if(discoveryCalls===1){assert.equal(url.searchParams.get('with_genres'),String(GENRES[genre]));
     assert.equal(url.searchParams.get('with_runtime.lte'),time==='Under 2 hrs'?'119':time==='2-3 hrs'?'180':null);
     assert.equal(url.searchParams.get('with_runtime.gte'),time==='2-3 hrs'?'120':null);
    }else{assert.equal(url.searchParams.has('with_genres'),false);assert.equal(url.searchParams.has('with_runtime.lte'),false);}
    return Response.json({results:relax&&discoveryCalls===1?[]:[fixture,{...fixture,id:766,original_language:'hi'},{...fixture,id:767,release_date:'2099-01-01'}],total_pages:1});
   },()=>0);
   const response=await api(new Request('https://example.test/api/movies?'+new URLSearchParams({era,genre,time})),{TMDB_READ_TOKEN:'test-only-not-a-real-token'});
   assert.equal(response.status,200);const data=await response.json();assert.equal(data.movies.length,1);assert.equal(data.movies[0].year,year);assert.equal(data.movies[0].id,-765);
   assert.equal(discoveryCalls,relax?2:1);
  }
 }
 assert.equal(total,72);
});
