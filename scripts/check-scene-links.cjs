const fs=require('node:fs');
const scenes=JSON.parse(fs.readFileSync('src/assets/data/scene-images.json','utf8'));
const previous=fs.existsSync('scripts/scene-link-report.json')?JSON.parse(fs.readFileSync('scripts/scene-link-report.json','utf8')):[];
const all=Object.entries(scenes).flatMap(([id,items])=>items.map((item,index)=>({id,index,url:item.url})));
const queue=all.filter(item=>!previous.some(r=>r.url===item.url&&r.ok));
const report=all.filter(item=>previous.some(r=>r.url===item.url&&r.ok)).map(item=>({...item,...previous.find(r=>r.url===item.url&&r.ok)}));
async function worker(){while(queue.length){const item=queue.shift();try{let r=await fetch(item.url,{method:'HEAD',signal:AbortSignal.timeout(15000)});let type=r.headers.get('content-type')||'';if(!r.ok||!type.startsWith('image/')){r=await fetch(item.url,{signal:AbortSignal.timeout(15000)});type=r.headers.get('content-type')||'';await r.body?.cancel();}report.push({...item,status:r.status,type,ok:r.ok&&type.startsWith('image/')});if(!r.ok||!type.startsWith('image/'))console.log(JSON.stringify(report.at(-1)));}catch(e){report.push({...item,ok:false,error:e.message});console.log(JSON.stringify(report.at(-1)));}}}
Promise.all([worker(),worker(),worker()]).then(()=>{fs.writeFileSync('scripts/scene-link-report.json',JSON.stringify(report,null,2)+'\n');console.log(`Reachable image links: ${report.filter(r=>r.ok).length}/${report.length}`);});
