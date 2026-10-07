'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
let config={};try{config=require('./generated-config.json');}catch{}
const ratingCache=new Map();
async function rotten(imdb){
  const key=String(config.omdbKey||process.env.OMDB_API_KEY||'').trim();if(!key||!/^tt\d+$/.test(imdb))return '';
  const cached=ratingCache.get(imdb);if(cached&&cached.until>Date.now())return cached.value;
  try{const url='https://www.omdbapi.com/?apikey='+encodeURIComponent(key)+'&i='+encodeURIComponent(imdb)+'&plot=short&r=json';const response=await fetch(url,{signal:AbortSignal.timeout(10000)});if(!response.ok)return '';const data=await response.json(),row=Array.isArray(data?.Ratings)?data.Ratings.find(x=>x?.Source==='Rotten Tomatoes'):null;const value=/^\d{1,3}%$/.test(String(row?.Value||''))?row.Value:'';ratingCache.set(imdb,{value,until:Date.now()+6*60*60*1000});return value;}catch{return '';}
}
async function serve(root){
  const token=crypto.randomBytes(24).toString('hex');
  const server=http.createServer(async(req,res)=>{
    let url,name;try{url=new URL(req.url,'http://localhost');name=decodeURIComponent(url.pathname);}catch{res.writeHead(400).end();return;}
    const prefix='/'+token+'/';if(!['GET','HEAD'].includes(req.method)||!name.startsWith(prefix)){res.writeHead(404).end();return;}name=name.slice(prefix.length);
    if(name==='api/rotten'){
      const imdb=String(url.searchParams.get('imdb')||'');const value=await rotten(imdb);res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'});res.end(req.method==='HEAD'?undefined:JSON.stringify({rating:value}));return;
    }
    if(!/^(ui|assets)\//.test(name)||name.split('/').some(p=>p==='..'||p.includes('\\'))){res.writeHead(404).end();return;}
    const file=path.join(root,name),types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.ico':'image/x-icon'};if(!types[path.extname(file)]){res.writeHead(404).end();return;}
    fs.readFile(file,(error,data)=>{if(error){res.writeHead(404).end();return;}res.writeHead(200,{'Content-Type':types[path.extname(file)],'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin','Content-Security-Policy':"frame-ancestors 'none'"});res.end(req.method==='HEAD'?undefined:data);});
  });
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});server.unref();return {server,url:'http://127.0.0.1:'+server.address().port+'/'+token+'/ui/index.html'};
}
module.exports={serve};
