const fs=require('node:fs'),path=require('node:path');
for(const file of ['index.html','app.js','browser.js','playback-sources.js','style.css','assets/tmdb-logo.svg'])if(!fs.existsSync(path.join(__dirname,'../public',file)))throw Error('Missing website file: '+file);
console.log('ZeroMovies website ready for Netlify. TMDB_API_KEY must be configured for Functions.');
