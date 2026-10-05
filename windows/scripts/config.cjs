const fs=require('node:fs');
fs.writeFileSync('generated-config.json',JSON.stringify({tmdbKey:process.env.TMDB_API_KEY||''}));
console.log(process.env.TMDB_API_KEY?'TMDB key configured':'No bundled key; use Settings');
