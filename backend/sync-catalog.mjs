import {readFile, writeFile, rename, mkdir} from 'node:fs/promises';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {validateCatalog} from './server.mjs';

const SOURCE = 'https://bingeflix.tv/';
export function parsePublicCatalog(html) {
  const chunks=[];
  // Decode Next's public serialized data as JSON only. Never execute website scripts.
  const scripts=html.matchAll(/self\.__next_f\.push\((\[[\s\S]*?\])\)<\/script>/g);
  for(const match of scripts) {
    try {const value=JSON.parse(match[1]); if(value[0]===1 && typeof value[1]==='string') chunks.push(value[1]);} catch {}
  }
  const records = new Map();
  function walk(value) {
    if(Array.isArray(value)) {for(const child of value)walk(child); return;}
    if(!value || typeof value!=='object')return;
    const title=value.title || value.name;
    if(Number.isSafeInteger(value.id) && value.id>0 && typeof title==='string' && title.trim() && Object.hasOwn(value,'poster_path')) {
      const type=value.media_type==='tv' || (!value.title && value.name) ? 'series' : 'movie';
      const id=`tmdb-${type}-${value.id}`;
      const date=value.release_date || value.first_air_date || '';
      const year=/^\d{4}-/.test(date)?Number(date.slice(0,4)):0;
      const poster=typeof value.poster_path==='string' && /^\/[A-Za-z0-9_.-]+$/.test(value.poster_path) ? `https://image.tmdb.org/t/p/w500${value.poster_path}` : '';
      records.set(id,{id,title:title.trim(),type,year,description:value.overview || '',poster,
        sourceUrl:`https://bingeflix.tv/${type==='movie'?'movie':'tv'}/${value.id}`,
        playbackAvailable:false,...(type==='series'?{episodes:[]}:{streams:[]})});
    }
    for(const child of Object.values(value))walk(child);
  }
  for(const line of chunks.join('').split('\n')) {
    const colon=line.indexOf(':');if(colon<0)continue;
    try {walk(JSON.parse(line.slice(colon+1)));}catch {}
  }
  if(!records.size)throw new Error('No catalog records found; upstream may be blocked or changed. Keeping previous catalog.');
  return [...records.values()];
}

export async function syncCatalog(path, {fetchPage=async()=>{
  const response=await fetch(SOURCE,{signal:AbortSignal.timeout(25000),redirect:'error',headers:{'Accept':'text/html','User-Agent':'ZeroStreamsCatalog/0.1'}});
  if(!response.ok)throw new Error(`Catalog source HTTP ${response.status}`);
  if(!response.body)throw new Error('Missing upstream body');
  const reader=response.body.getReader();const parts=[];let total=0;
  try {while(true){const {done,value}=await reader.read();if(done)break;total+=value.length;if(total>5_000_000)throw new Error('Upstream response too large');parts.push(Buffer.from(value));}}
  finally {await reader.cancel();}
  return Buffer.concat(parts).toString('utf8');
}}={}) {
  const imported=parsePublicCatalog(await fetchPage());
  let previous={schemaVersion:1,items:[]};
  try{previous=validateCatalog(JSON.parse(await readFile(path,'utf8')));}catch(err){if(err.code!=='ENOENT')throw err;}
  const records=new Map(previous.items.map(item=>[item.id,item]));
  for(const item of imported) {
    const old=records.get(item.id);
    if(old) {
      if(item.type==='series')item.episodes=old.episodes || [];
      else item.streams=old.streams || [];
      item.playbackAvailable=item.type==='series'?item.episodes.some(ep=>ep.streams?.length>0):item.streams.length>0;
    }
    records.set(item.id,item);
  }
  const items=[...records.values()];
  // A no-change sync doesn't create repetitive GitHub commits or change timestamps.
  if(JSON.stringify(previous.items)===JSON.stringify(items))return {changed:false,count:items.length};
  const catalog=validateCatalog({schemaVersion:1,updatedAt:new Date().toISOString(),source:'public-browse-catalog',items});
  const json=JSON.stringify(catalog,null,2)+'\n';if(Buffer.byteLength(json)>5_000_000)throw new Error('Merged catalog too large');
  await mkdir(dirname(path),{recursive:true});const temp=`${path}.${process.pid}.tmp`;
  await writeFile(temp,json);await rename(temp,path);
  return {changed:true,count:items.length};
}

export function startCatalogSync(path, intervalMs=60*60*1000) {
  let running=false;
  const run=async()=>{if(running)return;running=true;try{const result=await syncCatalog(path);console.log('Catalog sync:',result);}catch(err){console.error('Catalog sync failed; retained prior catalog:',err.message);}finally{running=false;}};
  void run();const timer=setInterval(run,intervalMs);timer.unref();return ()=>clearInterval(timer);
}
if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const path=process.env.CATALOG_PATH || resolve(dirname(fileURLToPath(import.meta.url)),'../public/catalog.json');
  try{console.log(await syncCatalog(path));}catch(err){console.error(err.message);process.exitCode=1;}
}
