const fs=require('node:fs'),path=require('node:path');
for(const file of ['index.html','app.js','browser.js','playback-sources.js','style.css','layouts.css','layouts.js','assets/tmdb-logo.svg'])if(!fs.existsSync(path.join(__dirname,'../public',file)))throw Error('Missing website file: '+file);
console.log('ZeroPlay website ready for deployment. Configure TMDB_API_KEY in the hosting platform environment.');
