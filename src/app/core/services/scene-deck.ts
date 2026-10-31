import type { Worker } from 'tesseract.js';
import { hasPrintedText, parseOcrWords } from '../models/image-screening';
import { imageKey } from '../models/screened-scenes';
import { resolveOcrSdk } from './ocr-sdk';

export type SceneProgress = (message:string)=>void;
export type SceneScreen = (urls:readonly string[],titles:readonly string[],progress?:SceneProgress,signal?:AbortSignal)=>Promise<string[]>;
let workerPromise:Promise<Worker>|undefined;
let queue:Promise<unknown>=Promise.resolve();
const verdicts=new Map<string,boolean>();
async function bounded<T>(task:Promise<T>,milliseconds:number,message:string):Promise<T>{
 let timer:ReturnType<typeof setTimeout>|undefined;
 try{return await Promise.race([task,new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(new Error(message)),milliseconds);})]);}
 finally{clearTimeout(timer);}
}

async function textWorker(progress:SceneProgress):Promise<Worker>{
 if(!workerPromise){
  progress('Loading the Telugu and English photo checker…');
  workerPromise=import('tesseract.js').then(async module=>{
   const sdk=resolveOcrSdk(module);
   const creation=sdk.createWorker(['eng','tel'],sdk.OEM.LSTM_ONLY);
   let expired=false;
   creation.then(worker=>{if(expired)void worker.terminate();}).catch(()=>{});
   let worker:Worker;
   try{worker=await bounded(creation,90000,'The photo checker couldn’t load. Check your connection and try again.');}
   catch(error){expired=true;throw error;}
   await worker.setParameters({tessedit_pageseg_mode:sdk.PSM.AUTO});
   return worker;
  }).catch(error=>{workerPromise=undefined;throw error;});
 }
 return workerPromise;
}

async function screen(urls:readonly string[],titles:readonly string[],progress:SceneProgress,signal?:AbortSignal):Promise<string[]>{
 if(signal?.aborted)throw new DOMException('Photo check cancelled','AbortError');
 const worker=await textWorker(progress);
 const selected:string[]=[];
 const candidates=[...new Map(urls.filter(url=>/^https:\/\/image\.tmdb\.org\/t\/p\//.test(url)).map(url=>[imageKey(url),url])).values()].slice(0,24);
 for(let index=0;index<candidates.length && selected.length<5;index++){
  if(signal?.aborted)throw new DOMException('Photo check cancelled','AbortError');
  const url=candidates[index];const key=imageKey(url);
  progress(`Checking scene photo ${index+1} of ${candidates.length} · ${selected.length} ready`);
  if(!verdicts.has(key)){
   const controller=new AbortController();const abort=()=>controller.abort();signal?.addEventListener('abort',abort,{once:true});
   const timer=setTimeout(abort,8000);
   try{
    const response=await fetch(url,{signal:controller.signal,referrerPolicy:'no-referrer'});
    if(!response.ok || !response.headers.get('Content-Type')?.startsWith('image/'))continue;
    const blob=await response.blob();
    if(signal?.aborted)throw new DOMException('Photo check cancelled','AbortError');
    let result;
    try{result=await bounded(worker.recognize(blob,{}, {text:true,tsv:true}),15000,'Photo text check timed out. Please try again.');}
    catch(error){void worker.terminate();workerPromise=undefined;throw error;}
    const safe=!hasPrintedText(parseOcrWords(result.data.tsv ?? ''),titles);
    if(verdicts.size>=300)verdicts.delete(verdicts.keys().next().value!);
    verdicts.set(key,safe);
   }catch(error){
    if(signal?.aborted)throw error;
    if(!workerPromise)throw error;
    // Unreadable/unavailable images never pass the check and can be retried later.
    continue;
   }finally{clearTimeout(timer);signal?.removeEventListener('abort',abort);}
  }
  if(verdicts.get(key))selected.push(url);
 }
 return selected;
}

/** One reusable browser worker; actual photo bytes are checked locally, never uploaded. */
export const screenSceneDeck:SceneScreen=(urls,titles,progress=()=>{},signal)=>{
 const task=queue.then(()=>screen(urls,titles,progress,signal));
 queue=task.catch(()=>{});
 return task;
};

