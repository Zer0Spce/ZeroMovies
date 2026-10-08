const test=require('node:test'),assert=require('node:assert/strict');
const handler=require('../../api/live.js');
function res(){return {code:200,headers:{},body:null,setHeader(k,v){this.headers[k]=v;},status(n){this.code=n;return this;},json(v){this.body=v;return this;}};}
test('web live API parses fixed IPTV and PPV playlists without becoming an arbitrary proxy',async()=>{
  const old=global.fetch;const seen=[];
  global.fetch=async url=>{seen.push(String(url));return {ok:true,text:async()=>`#EXTM3U\n#EXTINF:-1 group-title="News" tvg-logo="https://img.example/logo.png",Channel One\nhttps://stream.example/live.m3u8\n#EXTINF:-1,Blocked HTTP\nhttp://bad.example/live.m3u8`};};
  try{for(const kind of ['iptv','ppv']){const out=res();await handler({method:'GET',query:{kind}},out);assert.equal(out.code,200);assert.equal(out.body.channels.length,1);assert.equal(out.body.channels[0].name,'Channel One');assert.equal(new URL(out.body.channels[0].url).protocol,'https:');}assert.ok(seen.every(x=>x.includes('raw.githubusercontent.com/Zer0Spce/ZeroStreams/main/')));}finally{global.fetch=old;}
});
test('web live API normalizes Live Sports iframe URLs',async()=>{
  const old=global.fetch;
  global.fetch=async url=>({ok:true,text:async()=>String(url).endsWith('/api/ping')?JSON.stringify({success:true,domains:[]}):JSON.stringify({success:true,streams:[{category:'Soccer',streams:[{id:7,name:'Match',poster:'https://img.example/poster.jpg',iframe:'<iframe src="https://sports.example/embed/7"></iframe>',substreams:[]}]}]})});
  try{const out=res();await handler({method:'GET',query:{kind:'sports'}},out);assert.equal(out.code,200);assert.equal(out.body.categories[0].events[0].sources[0].url,'https://sports.example/embed/7');}finally{global.fetch=old;}
});
test('web live API rejects unknown sections and non-GET methods',async()=>{let out=res();await handler({method:'GET',query:{kind:'anything'}},out);assert.equal(out.code,400);out=res();await handler({method:'POST',query:{kind:'iptv'}},out);assert.equal(out.code,405);});
