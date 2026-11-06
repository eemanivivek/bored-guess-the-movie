import '@angular/compiler';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Injector, runInInjectionContext } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { validOnlineMovie } from '../src/app/core/services/online-movies';
import { RecommendationService } from '../src/app/core/services/recommendation.service';
import { movieHint } from '../src/app/core/models/hint';
import { hasFullSceneDeck, hasPlayableScenes, safeRoundImages } from '../src/app/core/models/screened-scenes';
import { hasPrintedText, parseOcrWords } from '../src/app/core/models/image-screening';
import { mapMovie } from '../backend/tmdb';
import { resolveOcrSdk } from '../src/app/core/services/ocr-sdk';
const remote=mapMovie({id:12345,title:'A Telugu Adventure',original_title:'ఒక సినిమా',original_language:'te',release_date:'2024-01-12',runtime:150,genres:[{id:28,name:'Action'}],images:{backdrops:Array.from({length:8},(_,i)=>({file_path:`/frame${i}.jpg`,iso_639_1:null}))}});
const create=(get:(url:string)=>unknown)=>runInInjectionContext(Injector.create({providers:[{provide:HttpClient,useValue:{get}}]}),()=>new RecommendationService());
const api=(movies=[remote])=>create(url=>of(url.includes('app-config')?{movieApiUrl:'/api'}:{movies}));

test('photo checker handles the production CommonJS default wrapper and development named exports',async()=>{
 const sdk={createWorker:()=>{},OEM:{LSTM_ONLY:1},PSM:{AUTO:'3'}};
 assert.equal(resolveOcrSdk({default:sdk}),sdk);assert.equal(resolveOcrSdk(sdk),sdk);
 const actual=resolveOcrSdk(await import('tesseract.js'));
 assert.equal(actual.OEM.LSTM_ONLY,1);assert.equal(typeof actual.createWorker,'function');
 for(const broken of [null,undefined,{}, {default:{}}, {createWorker:()=>{}}])assert.throws(()=>resolveOcrSdk(broken),/photo checker couldn’t start/);
});
test('API identity and image hosts are validated',()=>{
 assert.ok(validOnlineMovie(remote));assert.equal(validOnlineMovie({...remote,id:1}),false);
 assert.equal(validOnlineMovie({...remote,hintImages:['https://evil.example/image']}),false);
});
test('recommendations are API-only, preserve era and avoid recent repeats',async()=>{
 const other={...remote,id:-999,tmdbId:999,title:'Another Telugu Movie'};
 const service=api([remote,other,{...remote,id:-888,tmdbId:888,year:1990}]);
 const first=await service.recommend({era:'Recent'});const second=await service.recommend({era:'Recent'});
 assert.notEqual(first.id,second.id);assert.ok(first.id<0&&second.id<0);assert.equal(service.online(),true);
 assert.deepEqual(await service.suggest('A Telugu'),[remote.title]);
});
test('missing config, malformed results, wrong era and API failure never substitute JSON movies',async()=>{
 for(const mode of ['unconfigured','offline','invalid','era']){
  const service=create(url=>url.includes('app-config')?of({movieApiUrl:mode==='unconfigured'?'':'/api'}):mode==='offline'?throwError(()=>new Error('offline')):of({movies:mode==='era'?[{...remote,year:1990}]:[{id:1}]}));
  await assert.rejects(service.recommend({era:'Recent'}),/API|configured/);assert.equal(service.online(),false);
 }
});
test('unscreened API images never display as hints; no identifying text fallback exists',()=>{
 for(let i=0;i<5;i++)assert.deepEqual(movieHint(remote,i),{kind:'unavailable'});
 assert.deepEqual(safeRoundImages({...remote,source:undefined,screenedHintImages:remote.hintImages}),[]);
});
test('game uses five checked API photos and blocks poster aliases',async()=>{
 const selected=await api().preparePictureGame({era:'Recent'},remote,async urls=>urls.slice(0,5));
 assert.equal(selected.id,remote.id);assert.ok(hasFullSceneDeck(selected));
 assert.equal(new Set(Array.from({length:5},(_,i)=>{const h=movieHint(selected,i);assert.equal(h.kind,'image');return h.kind==='image'?h.src:'';})).size,5);
 assert.equal(safeRoundImages({...selected,posterUrl:selected.hintImages[0].replace('/w1280/','/original/')}).length,4);
});
test('failed photos try another API movie rather than a static game pool',async()=>{
 const other={...remote,id:-999,tmdbId:999,title:'Another Telugu Movie'};const service=api([remote,other]);
 await service.recommend({era:'Recent'});let calls=0;
 const selected=await service.preparePictureGame({era:'Recent'},remote,async urls=>++calls===1?[]:urls.slice(0,5));
 assert.equal(selected.id,other.id);assert.equal(calls,2);
 await assert.rejects(api().preparePictureGame({era:'Recent'},remote,async()=>[]),/At least two scene photos/);
});

test('two to four approved API scenes stay playable without invented photos',async()=>{
 for(let count=2;count<5;count++){
  const candidate={...remote,hintImages:remote.hintImages.slice(0,count)};
  const selected=await api([candidate]).preparePictureGame({era:'Recent'},candidate,async urls=>[...urls]);
  assert.equal(selected.id,candidate.id);assert.equal(selected.hintImages.length,count);assert.ok(hasPlayableScenes(selected));
  assert.equal(hasFullSceneDeck(selected),false);
  for(let turn=0;turn<5;turn++){
   const hint=movieHint(selected,turn);assert.equal(hint.kind,'image');
   if(hint.kind==='image'){assert.equal(hint.index,Math.min(turn,count-1));assert.equal(hint.src,selected.hintImages[Math.min(turn,count-1)]);}
  }
 }
 assert.equal(hasPlayableScenes(remote),false);
});

test('rejected and unrelated image URLs never make even a partial game playable',async()=>{
 await assert.rejects(api().preparePictureGame({era:'Recent'},remote,async()=>['https://example.com/title.jpg']),/At least two scene photos/);
});

test('single-photo movies and duplicate sizes never satisfy the playable-scene guard',async()=>{
 const one=remote.hintImages[0];
 assert.equal(hasPlayableScenes({...remote,hintImages:[one],screenedHintImages:[one]}),false);
 const samePhoto=one.replace('/w1280/','/original/');
 assert.equal(hasPlayableScenes({...remote,hintImages:[one,samePhoto],screenedHintImages:[one,samePhoto]}),false);
 const single={...remote,hintImages:[one]};let checks=0;
 await assert.rejects(api([single]).preparePictureGame({era:'Recent'},single,async()=>{checks++;return [one];}),/At least two scene photos/);
 assert.equal(checks,0,'a movie with only one raw photo is never screened for play');
 await assert.rejects(api().preparePictureGame({era:'Recent'},remote,async()=>[one]),/At least two scene photos/);
});

test('only one surviving checked photo causes another API movie to be tried',async()=>{
 const other={...remote,id:-999,tmdbId:999,title:'Another Telugu Movie'};
 const service=api([remote,other]);await service.recommend({era:'Recent'});let checks=0;
 const movie=await service.preparePictureGame({era:'Recent'},remote,async urls=>urls.slice(0,++checks===1?1:2));
 assert.equal(movie.id,other.id);assert.equal(movie.hintImages.length,2);assert.equal(checks,2);
});
test('OCR rejects English and Telugu lettering and low-confidence title matches',()=>{
 const word=(text:string,confidence=80)=>({text,confidence,width:100,height:30});
 assert.ok(hasPrintedText([word('MOVIE')]));assert.ok(hasPrintedText([word('సినిమా')]));
 assert.ok(hasPrintedText([word('Adventure',15)],['Adventure']));assert.equal(hasPrintedText([word('~',3)]),false);
 const tsv='level\tpage_num\tblock_num\tpar_num\tline_num\tword_num\tleft\ttop\twidth\theight\tconf\ttext\n5\t1\t1\t1\t1\t1\t0\t0\t100\t30\t85\tTitle';
 assert.equal(parseOcrWords(tsv)[0].text,'Title');assert.ok(hasPrintedText(parseOcrWords(tsv)));
});


test('random option belongs only to the genre screen and requests API movies without a genre filter',async()=>{
 const {QUESTIONS}=await import('../src/app/core/models/questions.data');
 assert.equal(QUESTIONS.find(q=>q.id==='mood')!.options.some(o=>o.value==="Doesn't matter"),false);
 assert.equal(QUESTIONS.find(q=>q.id==='genre')!.options.some(o=>o.value==="Doesn't matter"),true);
 const params:Record<string,string>[]=[];
 const service=runInInjectionContext(Injector.create({providers:[{provide:HttpClient,useValue:{get:(url:string,options?:{params:Record<string,string>})=>{
  if(url.includes('app-config'))return of({movieApiUrl:'/api'});
  params.push(options!.params);return of({movies:[remote]});
 }}}]}),()=>new RecommendationService());
 await service.recommend({mood:'Bored',genre:"Doesn't matter",era:'Recent',time:'2-3 hrs'});
 assert.deepEqual(params[0],{era:'Recent',time:'2-3 hrs'});
 await service.recommend({mood:'Bored',genre:'Comedy',era:'Recent',time:'2-3 hrs'});
 assert.deepEqual(params[1],{era:'Recent',genre:'Comedy',time:'2-3 hrs'});
});

test('hero preference reaches the API; No preference does not add a cast filter',async()=>{
 const params:Record<string,string>[]=[];
 const service=runInInjectionContext(Injector.create({providers:[{provide:HttpClient,useValue:{get:(url:string,options?:{params:Record<string,string>})=>{if(url.includes('app-config'))return of({movieApiUrl:'/api'});params.push(options!.params);return of({movies:[remote]});}}}]}),()=>new RecommendationService());
 await service.recommend({hero:'Nani'});await service.recommend({hero:'No preference'});
 assert.deepEqual(params,[{hero:'Nani'},{}]);
});

test('picture game keeps the selected hero when looking through previously discovered movies',async()=>{
 const current={...remote,matchedHero:'Nani',hintImages:remote.hintImages.slice(0,1)};
 const actorMovie={...remote,id:-99991,tmdbId:99991,matchedHero:'Nani'};
 const other={...remote,id:-99992,tmdbId:99992,matchedHero:'Prabhas'};
 const service=runInInjectionContext(Injector.create({providers:[{provide:HttpClient,useValue:{get:(url:string)=>url.includes('app-config')?of({movieApiUrl:'/api'}):of({movies:[other,actorMovie]})}}]}),()=>new RecommendationService());
 await service.recommend({era:'Recent'});
 const checked:number[]=[];
 const prepared=await service.preparePictureGame({hero:' Nani ',era:'Recent'},current,async urls=>{checked.push(urls.length);return urls.slice(0,2);});
 assert.equal(prepared.id,actorMovie.id);assert.equal(checked.length,1);
});

test('retry remembers rejected photos and continues to new API pages without changing hero or era',async()=>{
 const first={...remote,matchedHero:'Nani'};const next={...first,id:-99993,tmdbId:99993,title:'Fresh movie'};
 const requests:Record<string,string>[]=[];const screened:string[]=[];
 const service=runInInjectionContext(Injector.create({providers:[{provide:HttpClient,useValue:{get:(url:string,options?:{params:Record<string,string>})=>{
  if(url.includes('app-config'))return of({movieApiUrl:'/api'});
  const params=options!.params;requests.push(params);const page=Number(params.page);
  return of({movies:page===3?[next]:[],nextPage:page+1,exhausted:page===3});
 }}}]}),()=>new RecommendationService());
 const screen=async(urls:string[],titles:string[])=>{screened.push(titles[0]);return titles[0]===first.title?[]:urls.slice(0,2);};
 await assert.rejects(service.preparePictureGame({hero:'Nani',era:'Recent',genre:'Action'},first,screen),/At least two/);
 const selected=await service.preparePictureGame({hero:'Nani',era:'Recent',genre:'Action'},first,screen);
 assert.equal(selected.id,next.id);assert.deepEqual(screened,[first.title,next.title]);assert.deepEqual(requests.map(p=>p.page),['1','2','3']);
 for(const params of requests){assert.equal(params.exclude,String(first.tmdbId));assert.equal(params.hero,'Nani');assert.equal(params.era,'Recent');assert.equal(params.game,'true');}
});

test('an exhausted scene search never repeats rejected OCR or fetches on another click',async()=>{
 const {SceneSearchExhaustedError}=await import('../src/app/core/services/recommendation.service');let fetches=0,checks=0;
 const service=create(url=>url.includes('app-config')?of({movieApiUrl:'/api'}):(fetches++,of({movies:[],exhausted:true})));
 const screen=async()=>{checks++;return [];};
 await assert.rejects(service.preparePictureGame({era:'Recent'},remote,screen),SceneSearchExhaustedError);
 await assert.rejects(service.preparePictureGame({era:'Recent'},remote,screen),SceneSearchExhaustedError);
 assert.equal(fetches,1);assert.equal(checks,1);
});

test('era is the last question and favourite hero immediately precedes it',async()=>{
 const {QUESTIONS}=await import('../src/app/core/models/questions.data');assert.deepEqual(QUESTIONS.slice(-2).map(q=>q.id),['hero','era']);
});

test('any era omits the API date filter and allows classic and recent game candidates',async()=>{
 const classic={...remote,id:-555,tmdbId:555,year:1995,title:'Classic API movie'};
 const requests:Record<string,string>[]=[];
 const service=runInInjectionContext(Injector.create({providers:[{provide:HttpClient,useValue:{get:(url:string,options?:{params:Record<string,string>})=>{
  if(url.includes('app-config'))return of({movieApiUrl:'/api'});
  requests.push(options!.params);return of({movies:[classic]});
 }}}]}),()=>new RecommendationService());
 const answers={era:"Doesn't matter",genre:"Doesn't matter"};
 assert.equal((await service.recommend(answers)).year,1995);assert.deepEqual(requests[0],{});
 const screened:string[]=[];const prepared=await service.preparePictureGame(answers,remote,async(urls,titles)=>{screened.push(titles[0]);return titles[0]===remote.title?[]:urls.slice(0,2);});
 assert.equal(prepared.id,classic.id);assert.deepEqual(screened,[remote.title,classic.title]);
});
