// Fetch image metadata only. Media stays on the source servers.
const fs = require('node:fs');
const pages = ['Mayabazar','Gundamma Katha','Sankarabharanam (1980 film)','Sagara Sangamam','Swayamkrushi','Geethanjali (1989 film)','Jagadeka Veerudu Athiloka Sundari','Aditya 369','Kshana Kshanam','Hello Brother (1994 film)','Tholi Prema (1998 film)','Kushi (2001 film)','Manmadhudu','Okkadu','Athadu','Bommarillu','Godavari (2006 film)','Happy Days (2007 film)','Magadheera','Vedam (film)','Ala Modalaindi','Eega','Attarintiki Daredi','Baahubali: The Beginning','Pelli Choopulu','Rangasthalam','Jersey (2019 film)','Ala Vaikunthapurramuloo','RRR','Hanu-Man'];
async function main() {
 const file = 'src/assets/data/movies.json';
 const movies = JSON.parse(fs.readFileSync(file, 'utf8'));
 let linked = 0;
 for (const movie of movies) {
  if (movie.imageSourceUrl && movie.posterUrl.startsWith('https://')) { linked++; continue; }
  await new Promise(resolve => setTimeout(resolve, 2500));
  const page = pages[movie.id - 1];
  if (!page) continue;
  try {
   const response = await fetch('https://en.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(page.replaceAll(' ', '_')), {headers:{'User-Agent':'BoredGuessMovie/1.0 (local development image metadata lookup)'},signal:AbortSignal.timeout(15000)});
   if (!response.ok) throw new Error('Summary HTTP ' + response.status);
   const summary = await response.json();
   const source = summary.originalimage?.source || summary.thumbnail?.source;
   if (!source || summary.type === 'disambiguation') throw new Error('No film image');
   const url = new URL(source); url.search = '';
   // Use the image URL published by the source API; avoid requesting each image
   // during metadata refresh, which needlessly consumes the image host's quota.
   if (url.hostname !== 'upload.wikimedia.org') throw new Error('Unexpected image host');
   movie.posterUrl = url.href;
   movie.imageSourceUrl = summary.content_urls.desktop.page;
   linked++; console.log('Linked ' + movie.title);
   fs.writeFileSync(file, JSON.stringify(movies, null, 2) + '\n');
  } catch (error) { console.error(movie.title + ': ' + error.message); }
 }
 fs.writeFileSync(file, JSON.stringify(movies, null, 2) + '\n');
 console.log(`Linked ${linked}/${movies.length} online posters from source metadata. No image or audio files downloaded.`);
 if (linked !== movies.length) process.exitCode = 1;
}
main().catch(error => { console.error(error); process.exitCode = 1; });
