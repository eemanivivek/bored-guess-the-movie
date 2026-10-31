/** Local UI test fixture only: never deploy this file or use it as the real API. */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { createApi } from '../backend/worker';

const root=path.resolve('dist/api-preview/browser');
const fixture={
 id:987654321,title:'API Test Movie',original_title:'పరీక్ష సినిమా',original_language:'te',release_date:'2024-01-12',
 runtime:150,genres:[{id:28,name:'Action'}],poster_path:null,overview:'Test fixture for verifying the API integration. This is not live TMDB movie data.',
 credits:{cast:[{name:'Test Actor'}],crew:[{job:'Director',name:'Test Director'}]},images:{backdrops:[]}
};
for(const [port,configured] of [[4203,false],[4204,true]] as const) {
 const api=createApi(async url=>Response.json(String(url).includes('/movie/987654321') ? fixture : {results:[fixture],total_pages:1}),()=>0);
 createServer(async(req,res)=>{
  try {
   const url=new URL(req.url ?? '/',`http://127.0.0.1:${port}`);
   if(url.pathname.startsWith('/api/')) {
    const response=await api(new Request(url),{TMDB_READ_TOKEN:configured ? 'fake-fixture-token' : undefined});
    response.headers.forEach((value,key)=>res.setHeader(key,value));res.writeHead(response.status);res.end(await response.text());return;
   }
   let file=path.resolve(root,'.'+decodeURIComponent(url.pathname));
   if(file!==root && !file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
   try {if(!(await stat(file)).isFile()) file=path.join(root,'index.html');} catch {file=path.join(root,'index.html');}
   const mime:Record<string,string>={'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.wav':'audio/wav'};
   res.writeHead(200,{'Content-Type':mime[path.extname(file)] ?? 'application/octet-stream','Cache-Control':'no-store'});
   res.end(await readFile(file));
  } catch {res.writeHead(500).end('Preview unavailable. Build dist/api-preview first.');}
 }).listen(port,'127.0.0.1',()=>console.log(`UI test preview http://127.0.0.1:${port}: ${configured?'labelled fake API data':'no-token fallback'}`));
}
