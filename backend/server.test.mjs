import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, writeFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {makeServer, validateCatalog} from './server.mjs';
const catalog = {schemaVersion:1,items:[{id:'one',title:'First Film',type:'movie',streams:[{label:'Main',url:'https://example.com/movie.mp4'}]},{id:'two',title:'Live Sport',type:'live',streams:[]}]};
test('reject duplicate IDs and insecure playback sources',()=>{
  assert.throws(()=>validateCatalog({...catalog,items:[catalog.items[0],catalog.items[0]]}));
  assert.throws(()=>validateCatalog({schemaVersion:1,items:[{...catalog.items[0],streams:[{label:'Main',url:'http://example.com/video'}]}]}));
});
test('series requires valid episodes',()=>{
  assert.throws(()=>validateCatalog({schemaVersion:1,items:[{id:'series',title:'Series',type:'series',episodes:[{id:'e1',season:0,episode:1,streams:[]}]}]}));
});
test('API filters titles, reloads catalog, and handles invalid files',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'zero-')); const file=join(dir,'catalog.json');await writeFile(file,JSON.stringify(catalog));
  const server=makeServer(file);await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base=`http://127.0.0.1:${server.address().port}`;
  try {
    assert.equal((await (await fetch(base+'/v1/catalog?type=movie&q=first')).json()).items.length,1);
    assert.equal((await (await fetch(base+'/v1/catalog?q=missing')).json()).items.length,0);
    assert.equal((await fetch(base+'/other')).status,404);
    assert.equal((await fetch(base+'/v1/catalog',{method:'POST'})).status,405);
    await writeFile(file,JSON.stringify({schemaVersion:1,items:[]}));
    assert.equal((await (await fetch(base+'/v1/catalog')).json()).items.length,0);
    await writeFile(file,'broken');assert.equal((await fetch(base+'/v1/catalog')).status,503);
  } finally {await new Promise(resolve=>server.close(resolve));await rm(dir,{recursive:true});}
});
