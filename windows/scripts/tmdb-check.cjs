const key=process.env.TMDB_API_KEY;
(async()=>{
  if(!key)throw Error('TMDB_API_KEY secret is missing');
  for(const path of ['/trending/all/week','/search/multi?query=The%20Matrix']){
    const url=new URL('https://api.themoviedb.org/3'+path);url.searchParams.set('api_key',key);url.searchParams.set('include_adult','false');
    const response=await fetch(url,{signal:AbortSignal.timeout(20000)});if(!response.ok)throw Error('TMDB request failed: '+response.status);
    const data=await response.json();if(!data.results?.some(row=>row.id&&(row.media_type==='movie'||row.media_type==='tv')))throw Error('Expected movie/TV metadata missing');
  }
  for(const type of ['movie','tv']){
    const genreUrl=new URL('https://api.themoviedb.org/3/genre/'+type+'/list');genreUrl.searchParams.set('api_key',key);
    const genres=await fetch(genreUrl,{signal:AbortSignal.timeout(20000)});if(!genres.ok)throw Error('Genre request failed: '+genres.status);const data=await genres.json();if(!data.genres?.some(x=>Number.isSafeInteger(x.id)&&x.id>0))throw Error('Expected genres missing');
  }
  console.log('Bundled TMDB key, trending discovery and full-catalog search verified');
})().catch(error=>{console.error(error.message);process.exitCode=1;});
