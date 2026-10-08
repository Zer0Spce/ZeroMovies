const test=require('node:test'),assert=require('node:assert/strict'),core=require('../core.cjs');
const movie={id:299534,type:'movie',title:'Avengers: Endgame',poster:'https://image.tmdb.org/t/p/w500/test.jpg',backdrop:'https://image.tmdb.org/t/p/w1280/test.jpg',date:'2019-04-24',rating:8};
test('VidStuck movie/TV URLs use TMDB IDs and valid resume positions',()=>{
  const url=new URL(core.playerUrl(movie,{timestamp:120,percent:10}));assert.equal(url.pathname,'/embed/movie/299534');assert.equal(url.searchParams.get('branding'),'ZeroPlay');assert.equal(url.searchParams.get('progress'),'120');
  const tv=new URL(core.playerUrl({...movie,type:'tv',id:1399},{season:0,episode:2,timestamp:80,percent:97}));assert.equal(tv.pathname,'/embed/tv/1399/0/2');assert.equal(tv.searchParams.has('progress'),false);assert.equal(tv.searchParams.get('episodeSelector'),'true');
});
test('QR ad rules use a versioned allowlist plus exact learned quarantine',()=>{
  assert.match(core.RULESET_VERSION,/^2\.0-known-good/);
  assert.equal(core.blocked('UNSWUNG.gurlleviter.cyou.'),true);assert.equal(core.blocked('gurlleviter.cyou.attacker.example'),false);assert.equal(core.blocked('notdoubleclick.net'),false);
  assert.equal(core.providerAllowed('vidstuck.xyz'),true);assert.equal(core.providerAllowed('media.vidstuck.xyz'),true);assert.equal(core.providerAllowed('cdn.cloudflarestream.com'),true);assert.equal(core.blocked('cdn.cloudflarestream.com'),false);
  assert.equal(core.adQr('https://unswung.gurlleviter.cyou/ri/123?uuid=01234567-89ab-cdef-0123-456789abcdef'),true);assert.equal(core.adQr('https://challenges.cloudflare.com/check'),false);
  assert.equal(core.learnAdHost('fresh-ad.example','test-confirmed'),true);assert.equal(core.blocked('fresh-ad.example'),true);assert.equal(core.blocked('sub.fresh-ad.example'),false);
});
test('Progress validates current content, duration and episode boundaries',()=>{
  const data={id:movie.id,type:'movie',timestamp:180,duration:1200};assert.equal(core.progress(data,movie).percent,15);
  for(const invalid of [{...data,id:42},{...data,type:'tv'},{...data,timestamp:Infinity},{...data,timestamp:-1},{...data,duration:0},{...data,duration:700000},{...data,timestamp:1300}])assert.equal(core.progress(invalid,movie),null);
  assert.equal(core.progress({...data,type:'tv',season:-1,episode:1},{...movie,type:'tv'}),null);
});
test('History retains started episodes, deduplicates and resets completed titles',()=>{
  const state={history:[],positions:{}};core.record(state,{...movie,type:'tv'},{season:3,episode:5});assert.equal(state.positions['tv:299534'].episode,5);
  core.record(state,movie,{timestamp:100,duration:1200,percent:8});core.record(state,movie);assert.equal(state.positions['movie:299534'].timestamp,100);assert.equal(state.history.length,2);
  core.record(state,movie,{timestamp:1200,duration:1200,percent:100});core.record(state,movie);assert.equal(state.positions['movie:299534'].timestamp,0);
  for(let id=1;id<130;id++)core.record(state,{...movie,id});assert.equal(state.history.length,100);
});
test('Remote catalog routes and artwork cannot become arbitrary requests',()=>{
  assert.equal(core.endpoint('/search/multi'),true);assert.equal(core.endpoint('/tv/1399/season/0'),true);assert.equal(core.endpoint('https://attacker.example/'),false);assert.equal(core.endpoint('/movie/../configuration'),false);
  assert.equal(core.art('//attacker.example/image'), '');assert.equal(core.item({id:1,title:'Adult',adult:true},'movie'),null);assert.equal(core.cleanItem({...movie,poster:'file:///private'}).poster,'');
});
