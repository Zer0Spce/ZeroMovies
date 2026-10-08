const fs=require('node:fs');
fs.writeFileSync('generated-config.json',JSON.stringify({tmdbKey:process.env.TMDB_API_KEY||'',omdbKey:process.env.OMDB_API_KEY||''}));
console.log(process.env.TMDB_API_KEY?'TMDB key configured':'No bundled TMDB key; use Settings');
console.log(process.env.OMDB_API_KEY?'OMDb ratings configured':'No bundled OMDb key; Rotten Tomatoes ratings disabled');
