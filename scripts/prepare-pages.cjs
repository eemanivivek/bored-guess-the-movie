const fs = require('node:fs');
const path = require('node:path');

const output = path.resolve('dist/bored-guess-the-movie/browser');
const index = path.join(output, 'index.html');
if (!fs.existsSync(index)) throw new Error('Build the Angular app before preparing Pages.');

// Pages has no SPA rewrite rule. These entry points keep the clean Angular URLs
// working on direct visits and refreshes; the base href resolves JS and assets.
for (const route of ['start', 'questions', 'recommendation', 'game', 'result']) {
 const directory = path.join(output, route);
 fs.mkdirSync(directory, {recursive: true});
 fs.copyFileSync(index, path.join(directory, 'index.html'));
}
fs.copyFileSync(index, path.join(output, '404.html'));
fs.writeFileSync(path.join(output, '.nojekyll'), '');
console.log('Prepared GitHub Pages route entry points and fallback.');
