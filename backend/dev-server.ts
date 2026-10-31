import { createServer } from 'node:http';
import worker from './worker';

// Run with Node's --env-file so the read token never enters Angular's build.
createServer(async (req,res)=>{
 try {
  const headers = new Headers();
  for(const [key,value] of Object.entries(req.headers)) if(value) headers.set(key,Array.isArray(value)?value.join(','):value);
  const request=new Request(new URL(req.url ?? '/','http://127.0.0.1:8787'),{method:req.method,headers});
  const response=await worker.fetch(request,{TMDB_READ_TOKEN:process.env['TMDB_READ_TOKEN'],ALLOWED_ORIGINS:process.env['ALLOWED_ORIGINS']});
  response.headers.forEach((value,key)=>res.setHeader(key,value));
  res.writeHead(response.status);
  res.end(Buffer.from(await response.arrayBuffer()));
 } catch { res.writeHead(500,{'Content-Type':'application/json'}); res.end('{"error":"Movie service unavailable"}'); }
}).listen(8787,'127.0.0.1',()=>console.log('Movie API listening at http://127.0.0.1:8787 (token stays on server)'));
