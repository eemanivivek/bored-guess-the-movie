const fs = require('node:fs');
const movieApiUrl = (process.env.MOVIE_API_URL || '').trim().replace(/\/$/, '');
if (movieApiUrl) {
 const url = new URL(movieApiUrl);
 if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) throw new Error('MOVIE_API_URL must be a public HTTPS API base URL, ending in /api.');
 if (!url.pathname.endsWith('/api')) throw new Error('MOVIE_API_URL must end in /api.');
}
fs.writeFileSync('src/assets/app-config.json', JSON.stringify({movieApiUrl}, null, 2) + '\n');
console.log(movieApiUrl ? 'Public movie API endpoint configured.' : 'No public movie API configured. Pages deployment stays disabled until MOVIE_API_URL is set.');
