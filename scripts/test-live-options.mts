import {mkdir,writeFile} from 'node:fs/promises';
import {QUESTIONS} from '../src/app/core/models/questions.data';
import {validOnlineMovie} from '../src/app/core/services/online-movies';
import {movieEra} from '../src/app/core/services/recommendation';
const options=(id:string)=>QUESTIONS.find(q=>q.id===id)!.options.map(o=>o.value);
const jobs=options('era').flatMap(era=>options('genre').flatMap(genre=>options('time').map(time=>({era,genre,time}))));
const results:any[]=[];let next=0;let nextStart=0;
const delay=(ms:number)=>new Promise(resolve=>setTimeout(resolve,ms));
async function work(){
 while(next<jobs.length){
  const index=next++;const preferences=jobs[index];const reserved=Math.max(Date.now(),nextStart);nextStart=reserved+2700;await delay(Math.max(0,reserved-Date.now()));
  const began=Date.now();
  try{
   const url='http://localhost:4200/api/movies?'+new URLSearchParams(preferences);
   let response=await fetch(url,{signal:AbortSignal.timeout(30000)});
   if(response.status===429){await delay(Math.min(60,Number(response.headers.get('Retry-After'))||60)*1000+1000);response=await fetch(url,{signal:AbortSignal.timeout(30000)});}
   const data=await response.json();const movies=data.movies??[];
   const invalid=movies.filter((m:any)=>!validOnlineMovie(m)||movieEra(m.year)!==preferences.era);
   const softMatches=movies.filter((m:any)=>m.genres?.includes(preferences.genre)&&(preferences.time==="Doesn't matter"||preferences.time==='Under 2 hrs'&&m.runtimeMinutes>0&&m.runtimeMinutes<120||preferences.time==='2-3 hrs'&&m.runtimeMinutes>=120&&m.runtimeMinutes<=180));
   const passed=response.ok&&movies.length>0&&invalid.length===0;
   const row={...preferences,status:response.status,passed,movies:movies.length,exactGenreAndRuntime:softMatches.length,sceneCandidates:movies.filter((m:any)=>m.hintImages?.length>0).length,titles:movies.map((m:any)=>m.title),elapsedMs:Date.now()-began,error:data.error};
   results.push(row);console.log(JSON.stringify({completed:results.length,total:jobs.length,...row}));
  }catch(error){const row={...preferences,passed:false,error:error instanceof Error?error.message:String(error)};results.push(row);console.log(JSON.stringify(row));}
 }
}
await Promise.all([work(),work(),work()]);
const report={checkedAt:new Date().toISOString(),scope:'Live API metadata and raw scene availability; no exhaustive image OCR or browser navigation',total:results.length,passed:results.filter(r=>r.passed).length,failed:results.filter(r=>!r.passed).length,results};
await mkdir('.angular',{recursive:true});await writeFile('.angular/live-option-check.json',JSON.stringify(report,null,2));console.log(JSON.stringify({summary:{total:report.total,passed:report.passed,failed:report.failed}}));process.exitCode=report.failed?1:0;
