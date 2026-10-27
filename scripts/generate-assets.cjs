const fs = require('node:fs');
const path = require('node:path');
const rows = [
['Mayabazar',1957,'Fantasy,Family,Comedy','Nostalgic,Bored',184,'N. T. Rama Rao','K. V. Reddy','A magical retelling of a legendary wedding, filled with disguises, mischief and larger-than-life charm.','A magical feast'],
['Gundamma Katha',1962,'Comedy,Family','Nostalgic,Tired',166,'N. T. Rama Rao','Kamalakara Kameswara Rao','Two brothers put a proud matriarch to the test in a warm and witty family classic.','Two brothers and a mansion'],
['Sankarabharanam',1980,'Family','Nostalgic,Sad',143,'J. V. Somayajulu','K. Viswanath','A celebrated classical musician forms an unexpected bond through a shared devotion to music.','A classical musician'],
['Sagara Sangamam',1983,'Romance,Family','Nostalgic,Sad',160,'Kamal Haasan','K. Viswanath','A gifted dancer navigates artistic dreams, friendship and unspoken love.','A dancer’s dream'],
['Swayamkrushi',1987,'Family','Tired,Nostalgic',164,'Chiranjeevi','K. Viswanath','A humble cobbler builds a better life through dignity, hard work and perseverance.','A humble craftsman'],
['Geethanjali',1989,'Romance','Sad,Nostalgic',137,'Nagarjuna','Mani Ratnam','Two young people find love and a renewed joy for living in a misty hill station.','Love in the mist'],
['Jagadeka Veerudu Athiloka Sundari',1990,'Fantasy,Action','Excited,Nostalgic',153,'Chiranjeevi','K. Raghavendra Rao','A celestial visitor and a courageous guide cross paths in a colourful fantasy adventure.','A visitor from the heavens'],
['Aditya 369',1991,'Fantasy,Thriller','Excited,Nostalgic',141,'Balakrishna','Singeetam Srinivasa Rao','An accidental journey through time carries its travellers into a royal past and an uncertain future.','A journey through time'],
['Kshana Kshanam',1991,'Thriller,Comedy','Excited,Bored',158,'Venkatesh','Ram Gopal Varma','An ordinary woman is swept into a frantic chase involving stolen money and an unlikely ally.','A bag of stolen money'],
['Hello Brother',1994,'Comedy,Action','Bored,Nostalgic',152,'Nagarjuna','E. V. V. Satyanarayana','Separated twins with a strange connection stumble into each other’s very different lives.','Twins with a connection'],
['Tholi Prema',1998,'Romance,Comedy','Sad,Nostalgic',146,'Pawan Kalyan','A. Karunakaran','A carefree young man discovers first love and the courage to pursue a future of his own.','A first love'],
['Kushi',2001,'Romance,Comedy','Tired,Nostalgic',178,'Pawan Kalyan','S. J. Suryah','Two college students keep finding their way back to each other despite pride and misunderstandings.','Campus sparks and stubborn hearts'],
['Manmadhudu',2002,'Romance,Comedy','Bored,Tired',142,'Nagarjuna','K. Vijaya Bhaskar','An advertising executive’s guarded view of romance begins to change with an unexpected colleague.','An advertising office'],
['Okkadu',2003,'Action,Romance','Excited,Bored',170,'Mahesh Babu','Gunasekhar','A kabaddi player helps a young woman escape danger and brings the chase to Hyderabad.','A kabaddi player'],
['Athadu',2005,'Action,Thriller','Excited,Bored',172,'Mahesh Babu','Trivikram Srinivas','A fugitive assumes a missing man’s identity and discovers the family life he never had.','A borrowed identity'],
['Bommarillu',2006,'Romance,Family','Sad,Tired',170,'Siddharth','Bhaskar','A young man struggles to express his own choices under the shadow of an affectionate but controlling father.','A father and a son'],
['Godavari',2006,'Romance,Family','Tired,Sad',160,'Sumanth','Sekhar Kammula','A riverboat journey gives two independent people a chance to rethink love and their futures.','A riverboat journey'],
['Happy Days',2007,'Romance,Comedy','Nostalgic,Tired',160,'Varun Sandesh','Sekhar Kammula','A group of engineering students grows through friendship, first love and campus life.','Four years of friendship'],
['Magadheera',2009,'Action,Fantasy,Romance','Excited,Nostalgic',166,'Ram Charan','S. S. Rajamouli','A modern encounter awakens memories of a warrior’s love and an unfinished battle across lifetimes.','A warrior across lifetimes'],
['Vedam',2010,'Family','Sad',135,'Allu Arjun','Krish','Five lives from different worlds converge during one life-changing night in the city.','Five lives, one night'],
['Ala Modalaindi',2011,'Romance,Comedy','Bored,Tired',136,'Nani','Nandini Reddy','A series of badly timed encounters draws two charming strangers into an unpredictable romance.','Love and missed connections'],
['Eega',2012,'Fantasy,Thriller,Action','Excited,Bored',145,'Nani','S. S. Rajamouli','An unlikely tiny hero takes on a powerful rival in a wildly inventive tale of revenge.','A tiny winged hero'],
['Attarintiki Daredi',2013,'Family,Comedy,Action','Tired,Bored',175,'Pawan Kalyan','Trivikram Srinivas','A wealthy heir enters an estranged relative’s household to repair an old family rift.','A family reunion mission'],
['Baahubali: The Beginning',2015,'Fantasy,Action','Excited',159,'Prabhas','S. S. Rajamouli','A young adventurer climbs beyond his village and discovers a kingdom tied to his hidden past.','A waterfall and a kingdom'],
['Pelli Choopulu',2016,'Romance,Comedy','Tired,Bored',118,'Vijay Deverakonda','Tharun Bhascker','An unexpected matchmaking meeting leads two young people to build a food business together.','A food truck dream'],
['Rangasthalam',2018,'Action,Thriller','Excited',179,'Ram Charan','Sukumar','A village resident and his brother challenge the power structure controlling their rural community.','A village finds its voice'],
['Jersey',2019,'Family','Sad,Excited',157,'Nani','Gowtam Tinnanuri','A former cricketer attempts an unlikely comeback to restore his pride and inspire his son.','A cricketer’s comeback'],
['Ala Vaikunthapurramuloo',2020,'Action,Comedy,Family','Bored,Excited',165,'Allu Arjun','Trivikram Srinivas','A young man uncovers a secret about his birth and finds himself protecting an unfamiliar family.','Switched destinies'],
['RRR',2022,'Action','Excited,Bored',182,'Ram Charan','S. S. Rajamouli','Two men on opposing secret missions forge a powerful friendship in a sweeping period adventure.','Fire meets water'],
['Hanu-Man',2024,'Fantasy,Action,Comedy','Excited,Bored',158,'Teja Sajja','Prasanth Varma','A village youngster discovers extraordinary powers and must protect his community from a dangerous ambition.','A village superhero']
];
fs.mkdirSync('src/assets/data',{recursive:true});fs.mkdirSync('src/assets/images',{recursive:true});fs.mkdirSync('src/assets/audio',{recursive:true});
const escape=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const palettes=[['#302847','#b6a0ca','#efbd6e'],['#254b4b','#7cb7a2','#f4cd88'],['#513348','#ce9294','#f4bd73']];
const movies=rows.map((r,i)=>{
 const id=i+1;const [title,year,genres,moods,runtimeMinutes,hero,director,description,clue]=r;
 const [bg,mid,accent]=palettes[i%3];
 const images=[0,1,2].map(n=>{
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="560" viewBox="0 0 1000 560"><rect width="1000" height="560" fill="${bg}"/><circle cx="${720-n*160}" cy="170" r="95" fill="${accent}"/><path d="M0 380 210 180 430 380 650 250 1000 420V560H0Z" fill="${mid}" opacity=".65"/><path d="M0 465 370 300 660 440 860 335 1000 420V560H0Z" fill="${bg}"/><g stroke="${accent}" fill="none" stroke-width="4" opacity=".6"><rect x="100" y="160" width="95" height="85" rx="8"/><circle cx="123" cy="181" r="11"/><circle cx="169" cy="181" r="11"/><path d="m195 185 30-17v60l-30-16"/></g><text x="70" y="405" font-family="Georgia,serif" font-size="36" fill="#fff5df">${escape(n===0?clue:n===1?'The story stars '+hero:'A '+genres.split(',')[0].toLowerCase()+' story from '+year)}</text><text x="70" y="446" font-family="Arial,sans-serif" font-size="12" letter-spacing="4" fill="${accent}">IMAGINE THE SCENE · CLUE ${n+1}</text></svg>`;
 const file=`movie-${id}-hint-${n+1}.svg`;fs.writeFileSync(path.join('src/assets/images',file),svg);return 'assets/images/'+file;
 });
 const poster=`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600"><rect width="400" height="600" fill="${bg}"/><circle cx="200" cy="205" r="115" fill="${accent}"/><path d="M0 400 170 230 400 430V600H0Z" fill="${mid}"/><path d="M0 490 280 310 400 460V600H0Z" fill="${bg}"/><text x="25" y="46" fill="#fff5df" font-family="Arial" font-size="10" letter-spacing="3">THE TELUGU COLLECTION</text><text x="25" y="493" fill="#fff5df" font-family="Georgia" font-size="23">${escape(title.length>27?title.slice(0,26)+'…':title)}</text><text x="25" y="528" fill="${accent}" font-family="Arial" font-size="13">${year} · ${escape(genres.split(',')[0])}</text><text x="25" y="574" fill="#fff5df" font-family="Arial" font-size="8" letter-spacing="2">ORIGINAL PLACEHOLDER POSTER</text></svg>`;
 const posterUrl=`assets/images/movie-${id}-poster.svg`;fs.writeFileSync('src/'+posterUrl,poster);
 return {id,title,year,genres:genres.split(','),moods:moods.split(','),company:genres.includes('Family')?['Family','Partner']:genres.includes('Romance')?['Partner','Alone']:['Alone','Friends'],runtimeMinutes,hero,director,posterUrl,hintImages:images,description};
});
fs.writeFileSync('src/assets/data/movies.json',JSON.stringify(movies,null,2)+'\n');
// A short, original synthesized chime for testing the optional audio-hint path.
const rate=22050,seconds=2;const wav=Buffer.alloc(44+rate*seconds*2);wav.write('RIFF');wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(rate,24);wav.writeUInt32LE(rate*2,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(wav.length-44,40);for(let t=0;t<rate*seconds;t++){const note=[261.63,329.63,392,523.25][Math.min(3,Math.floor(t/rate*2))];wav.writeInt16LE(Math.round(Math.sin(2*Math.PI*note*t/rate)*6000*Math.sin(Math.PI*(t%(rate/2))/(rate/2))),44+t*2);}fs.writeFileSync('src/assets/audio/placeholder-chime.wav',wav);
console.log(`Generated ${movies.length} movies and 120 original SVG assets.`);
