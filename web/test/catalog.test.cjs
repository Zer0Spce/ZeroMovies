const test=require('node:test'),assert=require('node:assert/strict');
const {query}=require('../lib/catalog.cjs'),{handler}=require('../functions/tmdb.js');
test('TMDB route and query validation cannot become an arbitrary proxy',()=>{
  assert.equal(query({path:'/search/multi',query:'My own movie',page:'2'}).get('query'),'My own movie');assert.equal(query({path:'/tv/1399/season/0'}).get('include_adult'),'false');
  for(const params of [{path:'https://attacker.example'},{path:'/movie/../configuration'},{path:'/movie/299534',api_key:'replacement'},{path:'/search/multi',include_adult:'true'},{path:'/movie/popular',page:'501'},{path:'/movie/popular',page:'-1'},{path:'/watch/providers/movie',watch_region:'../US'},{path:'/movie/299534',append_to_response:'account'}])assert.throws(()=>query(params));
});
test('Function enforces GET, handles missing key, and does not return upstream secrets',async()=>{
  const oldKey=process.env.TMDB_API_KEY,oldFetch=global.fetch;
  try{
    delete process.env.TMDB_API_KEY;assert.equal((await handler({httpMethod:'POST'})).statusCode,405);
    assert.equal((await handler({httpMethod:'GET',queryStringParameters:{path:'https://attacker.example'}})).statusCode,400);
    assert.equal((await handler({httpMethod:'GET',queryStringParameters:{path:'/movie/popular'}})).statusCode,503);
    process.env.TMDB_API_KEY='test-server-secret';let requested;
    global.fetch=async(url)=>{requested=new URL(url);return {ok:true,json:async()=>({results:[{id:299534,title:'A movie'}]})};};
    const response=await handler({httpMethod:'GET',queryStringParameters:{path:'/search/multi',query:'A movie',page:'1'}});
    assert.equal(response.statusCode,200);assert.equal(requested.hostname,'api.themoviedb.org');assert.equal(requested.searchParams.get('api_key'),'test-server-secret');assert.ok(!response.body.includes('test-server-secret'));assert.equal(response.headers['Cache-Control'],'private, max-age=60');
    global.fetch=async()=>({ok:false,status:401,json:async()=>({error:'test-server-secret'})});const rejected=await handler({httpMethod:'GET',queryStringParameters:{path:'/movie/popular'}});assert.equal(rejected.statusCode,502);assert.ok(!rejected.body.includes('test-server-secret'));
    global.fetch=async()=>{throw Error('test-server-secret');};assert.ok(!(await handler({httpMethod:'GET',queryStringParameters:{path:'/movie/popular'}})).body.includes('test-server-secret'));
  }finally{global.fetch=oldFetch;if(oldKey===undefined)delete process.env.TMDB_API_KEY;else process.env.TMDB_API_KEY=oldKey;}
});
