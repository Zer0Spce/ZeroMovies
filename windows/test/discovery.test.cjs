const test=require('node:test'),assert=require('node:assert/strict'),{createSurprise}=require('../discovery.cjs'),core=require('../core.cjs');
const row=id=>({id,title:'Movie '+id,release_date:'2020-01-01',vote_count:50});
test('Surprise discovers beyond the homepage and caps TMDB pages',async()=>{
 const calls=[],pick=createSurprise(async(path,p)=>{calls.push([path,p]);return {total_pages:900,results:[row(p.page)]};},core.item,{random:()=>.999,today:()=> '2026-10-05'});
 assert.equal((await pick()).id,500);assert.equal(calls.length,2);assert.equal(calls[1][1].page,500);assert.equal(calls[0][1]['vote_count.gte'],20);assert.equal(calls[0][1]['primary_release_date.lte'],'2026-10-05');
});
test('Surprise filters adults, invalid IDs, future releases and missing titles and avoids repeats',async()=>{
 const pick=createSurprise(async()=>({total_pages:1,results:[row(1),row(2),{...row(3),adult:true},{...row(4),release_date:'2099-01-01'},{...row(5),title:''},{...row(6),id:0}]}),core.item,{random:()=>0});
 assert.equal((await pick()).id,1);assert.equal((await pick()).id,2);
});
test('Surprise falls back to the first page when sampled results are empty',async()=>{
 const pick=createSurprise(async(_,p)=>({total_pages:2,results:p.page===1?[row(99)]:[]}),core.item,{random:()=>.9});assert.equal((await pick()).id,99);
});
test('Genre routes remain bounded to movie and TV lists',()=>{assert.ok(core.endpoint('/genre/movie/list'));assert.ok(core.endpoint('/genre/tv/list'));assert.equal(core.endpoint('/genre/person/list'),false);assert.equal(core.endpoint('/genre/movie/list/extra'),false);});
