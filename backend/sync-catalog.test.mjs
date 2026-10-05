import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, readFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {parsePublicCatalog, syncCatalog} from './sync-catalog.mjs';
function page(rows) {const rsc='a:'+JSON.stringify({movies:rows})+'\n';return `<script>self.__next_f.push(${JSON.stringify([1,rsc])})</script>`;}
const movie={id:7,title:'Movie',poster_path:'/poster.jpg',media_type:'movie',release_date:'2026-10-01'};
test('JSON-only parser extracts catalog and separates movie/series IDs',()=>{
  const rows=parsePublicCatalog(page([movie,{id:7,name:'Series',poster_path:null,media_type:'tv'},movie]));assert.equal(rows.length,2);assert.equal(rows[0].id,'tmdb-movie-7');assert.deepEqual(rows[0].streams,[]);assert.equal(rows[1].type,'series');
  assert.throws(()=>parsePublicCatalog('<script>alert(1)</script>'));
});
test('sync adds new titles, preserves stable IDs and retains cache on upstream failure',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'zero-sync-'));const path=join(dir,'catalog.json');
  try {
    const first=await syncCatalog(path,{fetchPage:async()=>page([movie])});assert.equal(first.count,1);
    const initial=await readFile(path,'utf8');
    assert.equal((await syncCatalog(path,{fetchPage:async()=>page([movie])})).changed,false);assert.equal(await readFile(path,'utf8'),initial);
    await assert.rejects(syncCatalog(path,{fetchPage:async()=>'<html>Blocked</html>'}));assert.equal(await readFile(path,'utf8'),initial);
    await syncCatalog(path,{fetchPage:async()=>page([{...movie,id:8,title:'New movie'}])});const next=JSON.parse(await readFile(path,'utf8'));assert.equal(next.items.length,2);assert.equal(next.items[0].id,'tmdb-movie-7');
  }finally{await rm(dir,{recursive:true});}
});
