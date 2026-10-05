import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {syncSeries} from './sync-series.mjs';
test('season import persists stable episode identifiers and stops at missing season',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'zero-series-'));const path=join(dir,'catalog.json');await writeFile(path,JSON.stringify({items:[{id:'tmdb-series-1396',title:'Series'}]}));
 try{const result=await syncSeries(path,join(dir,'series'),{getSeason:async(id,season)=>season===1?{episodes:[{episode_number:1,name:'Pilot'}]}:null});assert.equal(result.updated,1);const file=JSON.parse(await readFile(join(dir,'series','1396.json'),'utf8'));assert.equal(file.episodes[0].id,'s1e1');
 const cached=await syncSeries(path,join(dir,'series'),{getSeason:async()=>{throw Error('Must not request cached series');}});assert.equal(cached.retained,1);
 }finally{await rm(dir,{recursive:true});}
});
test('a later season failure still publishes confirmed episodes',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'zero-partial-'));const path=join(dir,'catalog.json');await writeFile(path,JSON.stringify({items:[{id:'tmdb-series-42',title:'Series'}]}));
 try{const result=await syncSeries(path,join(dir,'series'),{getSeason:async(id,season)=>{if(season===1)return {episodes:[{episode_number:1,name:'Pilot'}]};throw Error('Upstream 502');}});assert.equal(result.updated,1);const item=JSON.parse(await readFile(join(dir,'series','42.json'),'utf8'));assert.equal(item.partial,true);assert.equal(item.episodes.length,1);
 }finally{await rm(dir,{recursive:true});}
});
