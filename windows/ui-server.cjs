'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
let config={};try{config=require('./generated-config.json');}catch{}
const ratingCache=new Map(),personCache=new Map();
const tmdbKey=()=>String(config.tmdbKey||process.env.TMDB_API_KEY||'').trim();
const omdbKey=()=>String(config.omdbKey||process.env.OMDB_API_KEY||'').trim();
async function getJson(url,timeout=10000){const response=await fetch(url,{signal:AbortSignal.timeout(timeout),headers:{Accept:'application/json'}});if(!response.ok)throw Error('HTTP '+response.status);return response.json();}
async function imdbForMovie(tmdb){
  const key=tmdbKey();if(!key||!/^[1-9]\d*$/.test(tmdb))return '';
  try{const data=await getJson('https://api.themoviedb.org/3/movie/'+tmdb+'/external_ids?api_key='+encodeURIComponent(key),9000);return /^tt\d+$/.test(String(data?.imdb_id||''))?data.imdb_id:'';}catch{return '';}
}
async function rottenByTmdb(tmdb){
  const omdb=omdbKey();if(!omdb||!/^[1-9]\d*$/.test(tmdb))return '';
  const cached=ratingCache.get(tmdb);if(cached&&cached.until>Date.now())return cached.value;
  const imdb=await imdbForMovie(tmdb);if(!imdb)return '';
  try{const data=await getJson('https://www.omdbapi.com/?apikey='+encodeURIComponent(omdb)+'&i='+encodeURIComponent(imdb)+'&plot=short&r=json',9000),row=Array.isArray(data?.Ratings)?data.Ratings.find(x=>x?.Source==='Rotten Tomatoes'):null;const value=/^\d{1,3}%$/.test(String(row?.Value||''))?row.Value:'';ratingCache.set(tmdb,{value,until:Date.now()+6*60*60*1000});return value;}catch{return '';}
}
async function filmography(name){
  const key=tmdbKey(),clean=String(name||'').trim();if(!key||!clean||clean.length>120)return [];
  const cacheKey=clean.toLowerCase(),cached=personCache.get(cacheKey);if(cached&&cached.until>Date.now())return cached.value;
  try{
    const search=await getJson('https://api.themoviedb.org/3/search/person?api_key='+encodeURIComponent(key)+'&query='+encodeURIComponent(clean)+'&include_adult=false&language=en-US',9000),people=Array.isArray(search?.results)?search.results:[];
    const person=people.find(p=>String(p?.name||'').toLowerCase()===cacheKey)||people[0];if(!person?.id)return [];
    const credits=await getJson('https://api.themoviedb.org/3/person/'+Number(person.id)+'/combined_credits?api_key='+encodeURIComponent(key)+'&language=en-US',9000),seen=new Set(),rows=[];
    for(const raw of credits?.cast||[]){const type=raw?.media_type;if(!['movie','tv'].includes(type)||raw?.adult||!raw?.id||!raw?.poster_path)continue;const id=type+':'+raw.id;if(seen.has(id))continue;seen.add(id);rows.push({id:Number(raw.id),type,title:String(raw.title||raw.name||'Untitled'),poster:'https://image.tmdb.org/t/p/w342'+raw.poster_path,year:String(raw.release_date||raw.first_air_date||'').slice(0,4),pop:Number(raw.popularity)||0,votes:Number(raw.vote_count)||0});}
    rows.sort((a,b)=>(b.pop+b.votes*.03)-(a.pop+a.votes*.03));const value=rows.slice(0,80);personCache.set(cacheKey,{value,until:Date.now()+6*60*60*1000});return value;
  }catch{return [];}
}
function json(res,body,head){res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'});res.end(head?undefined:JSON.stringify(body));}
async function serve(root){
  const token=crypto.randomBytes(24).toString('hex');
  const server=http.createServer(async(req,res)=>{
    let url,name;try{url=new URL(req.url,'http://localhost');name=decodeURIComponent(url.pathname);}catch{res.writeHead(400).end();return;}
    const prefix='/'+token+'/';if(!['GET','HEAD'].includes(req.method)||!name.startsWith(prefix)){res.writeHead(404).end();return;}name=name.slice(prefix.length);
    if(name==='api/rotten'){json(res,{rating:await rottenByTmdb(String(url.searchParams.get('tmdb')||''))},req.method==='HEAD');return;}
    if(name==='api/filmography'){json(res,{results:await filmography(String(url.searchParams.get('name')||''))},req.method==='HEAD');return;}
    if(!/^(ui|assets)\//.test(name)||name.split('/').some(p=>p==='..'||p.includes('\\'))){res.writeHead(404).end();return;}
    const file=path.join(root,name),types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.ico':'image/x-icon'};if(!types[path.extname(file)]){res.writeHead(404).end();return;}
    fs.readFile(file,(error,data)=>{if(error){res.writeHead(404).end();return;}res.writeHead(200,{'Content-Type':types[path.extname(file)],'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin','Content-Security-Policy':"frame-ancestors 'none'"});res.end(req.method==='HEAD'?undefined:data);});
  });
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});server.unref();return {server,url:'http://127.0.0.1:'+server.address().port+'/'+token+'/ui/index.html'};
}
module.exports={serve};
