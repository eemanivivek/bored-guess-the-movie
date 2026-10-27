const sources = [
 ['mayabazar','https://cinemachaat.com/2010/07/17/mayabazar/'],
 ['swayamkrushi','https://timesofindia.indiatimes.com/entertainment/telugu/movies/news/chiranjeevis-swayam-krushi-completes-33-years-of-its-release-see-some-rare-pics/articleshow/77906977.cms'],
 ['kushi','https://idlebrain.com/movie/photogallery/kushi4k/index.html']
];
(async()=>{for(const [name,url] of sources){try{const r=await fetch(url,{signal:AbortSignal.timeout(20000)});const html=await r.text();const urls=[...html.matchAll(/(?:src|href|data-src)=["']([^"']+)["']/gi)].map(m=>new URL(m[1].replaceAll('&amp;','&'),url).href).filter(u=>/\.(?:jpg|png|webp|cms)(?:\?|$)/i.test(u));console.log(JSON.stringify({name,status:r.status,images:[...new Set(urls)].filter(u=>name==='kushi'?u.includes('kushi4k'):name==='mayabazar'?u.includes('mayabazar'):u.includes('77906')).slice(0,25)}));}catch(e){console.log(name+': '+e.message)}}})();
