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
 await assert.rejects(api().preparePictureGame({era:'Recent'},remote,async()=>[]),/No scene photos/);
});

test('one to four approved API scenes stay playable without invented photos',async()=>{
 for(let count=1;count<5;count++){
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
 await assert.rejects(api().preparePictureGame({era:'Recent'},remote,async()=>['https://example.com/title.jpg']),/No scene photos/);
});
test('OCR rejects English and Telugu lettering and low-confidence title matches',()=>{
 const word=(text:string,confidence=80)=>({text,confidence,width:100,height:30});
 assert.ok(hasPrintedText([word('MOVIE')]));assert.ok(hasPrintedText([word('సినిమా')]));
 assert.ok(hasPrintedText([word('Adventure',15)],['Adventure']));assert.equal(hasPrintedText([word('~',3)]),false);
 const tsv='level\tpage_num\tblock_num\tpar_num\tline_num\tword_num\tleft\ttop\twidth\theight\tconf\ttext\n5\t1\t1\t1\t1\t1\t0\t0\t100\t30\t85\tTitle';
 assert.equal(parseOcrWords(tsv)[0].text,'Title');assert.ok(hasPrintedText(parseOcrWords(tsv)));
});

