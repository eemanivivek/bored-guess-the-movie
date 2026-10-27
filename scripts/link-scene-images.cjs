const fs = require('node:fs');
async function main() {
 const file = 'src/assets/data/scene-images.json';
 const scenes = JSON.parse(fs.readFileSync(file, 'utf8'));
 if (!scenes['12']) {
  const source = 'https://idlebrain.com/movie/photogallery/kushi4k/index.html';
  const response = await fetch(source, {signal:AbortSignal.timeout(20000)});
  if (!response.ok) throw new Error('Kushi gallery HTTP '+response.status);
  const html=await response.text();
  const pages=[...new Set([...html.matchAll(/href=["']([^"']*pages\/image\d+\.html)["']/g)].map(m=>new URL(m[1],source).href))];
  scenes['12']=[];
  // Read actual image links from the gallery pages, rather than guessing filenames.
  for (const page of pages.slice(0,5)) {
   const r=await fetch(page,{signal:AbortSignal.timeout(20000)});
   if(!r.ok) throw new Error('Gallery page HTTP '+r.status);
   const body=await r.text();
   const images=[...body.matchAll(/src=["']([^"']+)["']/gi)].map(m=>new URL(m[1],page).href);
   const url=images.find(u=>u.includes('/kushi4k/images/')&&!u.includes('/th_'));
   if(!url) throw new Error('No scene image on '+page);
   scenes['12'].push({url,source:page,caption:'Kushi movie scene'});
  }
  if(scenes['12'].length!==5) throw new Error('Expected five Kushi scene pages');
  fs.writeFileSync(file,JSON.stringify(scenes,null,2)+'\n');
 }
 // Replace a stale gallery host with the actual still linked by this film page.
 if(scenes['21'][4].url.includes('prokerala.com')) {
  const page='https://www.idlebrain.com/movie/photogallery/alamodalaindi/pages/image013.html';
  const response=await fetch(page,{signal:AbortSignal.timeout(20000)});
  if(!response.ok) throw new Error('Ala Modalaindi gallery HTTP '+response.status);
  const body=await response.text();
  const images=[...body.matchAll(/src=["']([^"']+)["']/gi)].map(m=>new URL(m[1],page).href);
  const url=images.find(u=>u.includes('/alamodalaindi/images/')&&!u.includes('/th_'));
  if(!url) throw new Error('Ala Modalaindi scene not found');
  scenes['21'][4]={url,source:page,caption:'Ala Modalaindi movie scene'};
  fs.writeFileSync(file,JSON.stringify(scenes,null,2)+'\n');
 }
 const moviesFile='src/assets/data/movies.json';
 const movies=JSON.parse(fs.readFileSync(moviesFile,'utf8'));
 for(const movie of movies){
  const selected=scenes[movie.id];
  if(!selected||new Set(selected.map(s=>s.url)).size<5) throw new Error('Need five different scene URLs for '+movie.title);
  movie.hintImages=selected.map(s=>s.url);
  movie.hintSourceUrls=[...new Set(selected.map(s=>s.source))];
  movie.hintImageKind='scene';
 }
 fs.writeFileSync(moviesFile,JSON.stringify(movies,null,2)+'\n');
 console.log(`Linked ${movies.length} movies to ${movies.reduce((sum,m)=>sum+m.hintImages.length,0)} distinct scene photos. No poster URLs used for hints.`);
}
main().catch(e=>{console.error(e);process.exitCode=1;});
