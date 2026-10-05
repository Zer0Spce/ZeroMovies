import {readFile,writeFile,rename,mkdir} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

export async function fetchSeason(id,season) {
  const response=await fetch(`https://bingeflix.tv/api/tv/${id}/season/${season}`,{signal:AbortSignal.timeout(20000),redirect:'error',headers:{Accept:'application/json','User-Agent':'ZeroStreamsCatalog/0.2'}});
  if(response.status===404)return null;
  if(!response.ok)throw new Error(`Season API HTTP ${response.status}`);
  const text=await response.text();if(Buffer.byteLength(text)>2_000_000)throw new Error('Season response too large');
  const data=JSON.parse(text);
  if(!Array.isArray(data.episodes))throw new Error('Invalid season response');return data;
}
export async function syncSeries(catalogPath,outputDir,{getSeason=fetchSeason,maximumSeasons=20,maximumShows=100}={}) {
  const catalog=JSON.parse(await readFile(catalogPath,'utf8'));const shows=catalog.items.filter(item=>/^tmdb-series-\d+$/.test(item.id)).slice(0,maximumShows);await mkdir(outputDir,{recursive:true});
  let updated=0,retained=0,failed=0,cursor=0;
  async function worker(){while(cursor<shows.length){const item=shows[cursor++],id=item.id.slice('tmdb-series-'.length),path=resolve(outputDir,`${id}.json`);let previous=null;
    try{previous=JSON.parse(await readFile(path,'utf8'));if(Date.now()-Date.parse(previous.checkedAt)<24*60*60*1000){retained++;continue;}}catch(err){if(err.code!=='ENOENT'){failed++;continue;}}
    try{const episodes=[];for(let season=1;season<=maximumSeasons;season++){
        const data=await getSeason(id,season);if(data===null)break;
        for(const episode of data.episodes){if(!Number.isInteger(episode.episode_number)||episode.episode_number<1)continue;episodes.push({id:`s${season}e${episode.episode_number}`,season,episode:episode.episode_number,title:episode.name||`Episode ${episode.episode_number}`,description:episode.overview||'',airDate:episode.air_date||'',streams:[]});}
        if(data.episodes.length===0)break;
      }
      if(!episodes.length)throw new Error('No episodes found');
      const result={schemaVersion:1,id:item.id,title:item.title,checkedAt:new Date().toISOString(),episodes};const temp=path+'.tmp';await writeFile(temp,JSON.stringify(result,null,2)+'\n');await rename(temp,path);updated++;
    }catch(err){failed++;console.error(`Series ${id}: retained prior snapshot (${err.message})`);}
  }}
  await Promise.all([worker(),worker(),worker()]);return {updated,retained,failed};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const root=resolve(dirname(fileURLToPath(import.meta.url)),'../public');
  console.log(await syncSeries(resolve(root,'catalog.json'),resolve(root,'series')));
}
