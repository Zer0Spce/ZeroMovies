'use strict';
const PLAYLISTS={ppv:'https://raw.githubusercontent.com/Zer0Spce/ZeroStreams/main/playlist.m3u',iptv:'https://raw.githubusercontent.com/Zer0Spce/ZeroStreams/main/IPTV.m3u'};
const SPORTS_PRIMARY='https://api.ppv.st';

function httpsUrl(value){try{const u=new URL(String(value||''));return u.protocol==='https:'&&!u.username&&!u.password?u.href:'';}catch{return '';}}
function parseM3u(text){
  if(typeof text!=='string'||text.length>5_000_000||!text.replace(/^\uFEFF/,'').trim().startsWith('#EXTM3U'))throw Error('Invalid playlist');
  const rows=[];let current=null;
  for(const raw of text.split(/\r?\n/)){
    const line=raw.trim();
    if(line.startsWith('#EXTINF:')){
      const comma=line.indexOf(',');if(comma<0){current=null;continue;}
      const attrs={};for(const m of line.slice(0,comma).matchAll(/([\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s,]+))/g))attrs[m[1].toLowerCase()]=m[2]??m[3]??m[4];
      current={name:(line.slice(comma+1).trim()||attrs['tvg-name']||'Live channel').slice(0,240),group:(attrs['group-title']||'Channels').slice(0,120),logo:httpsUrl(attrs['tvg-logo']),url:'',mime:'',drm:'',requiresHeaders:false,browserPlayable:true};
    }else if(current&&line.startsWith('#EXTGRP:'))current.group=(line.slice(8).trim()||'Channels').slice(0,120);
    else if(current&&line.startsWith('#EXTVLCOPT:'))current.requiresHeaders=true;
    else if(current&&line.startsWith('#KODIPROP:')){
      const eq=line.indexOf('='),name=line.slice(10,eq).trim().toLowerCase(),value=line.slice(eq+1).trim();
      if(name.endsWith('.manifest_type'))current.mime=value==='mpd'?'application/dash+xml':value==='hls'?'application/x-mpegurl':'';
      else if(name.endsWith('.license_type'))current.drm=value.toLowerCase();
      else if(name.endsWith('.stream_headers')||name.endsWith('.common_headers'))current.requiresHeaders=true;
    }else if(current&&!line.startsWith('#')){
      const rawUrl=line.split('|')[0],url=httpsUrl(rawUrl);if(url){
        current.url=url;if(line.includes('|'))current.requiresHeaders=true;
        if(!current.mime){const p=new URL(url).pathname.toLowerCase();if(p.endsWith('.mpd'))current.mime='application/dash+xml';else if(p.endsWith('.m3u8'))current.mime='application/x-mpegurl';}
        current.browserPlayable=!current.requiresHeaders&&!current.drm;
        rows.push(current);
      }current=null;if(rows.length>=2500)break;
    }
  }
  return rows;
}
async function getText(url,limit=5_000_000){const r=await fetch(url,{signal:AbortSignal.timeout(12000),cache:'no-store',headers:{'User-Agent':'ZeroPlay-Web/2.0'}});if(!r.ok)throw Error('Source unavailable');const text=await r.text();if(text.length>limit)throw Error('Source too large');return text;}
function extractEmbed(value){
  if(typeof value!=='string'||!value.trim()||value.length>100000)return '';
  const text=value.trim();if(!text.startsWith('<'))return httpsUrl(text);
  const match=text.match(/<iframe\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/i);return match?httpsUrl(match[1]):'';
}
function normalizeSports(data){
  if(data?.success!==true||!Array.isArray(data.streams))throw Error('Invalid sports catalogue');
  return data.streams.map(group=>({category:String(group.category||'Sports').slice(0,120),events:(group.streams||[]).flatMap(item=>{
    if(!item||item.id===undefined)return [];const sources=[item,...(Array.isArray(item.substreams)?item.substreams:[])].map((source,index)=>({label:String(source.source_tag||source.tag||`Source ${index+1}`).slice(0,80),url:extractEmbed(source.iframe)})).filter(x=>x.url);
    if(!sources.length)return [];return [{id:String(item.id).slice(0,120),title:String(item.name||'Live event').slice(0,240),poster:httpsUrl(item.poster),start:Number(item.starts_at)||0,end:Number(item.ends_at)||0,alwaysLive:!!Number(item.always_live),sources}];
  })})).filter(group=>group.events.length);
}
async function sports(){
  const bases=[SPORTS_PRIMARY];
  try{const ping=JSON.parse(await getText(SPORTS_PRIMARY+'/api/ping',1_000_000));if(ping?.success===true&&Array.isArray(ping.domains))for(const d of ping.domains){if(typeof d==='string'&&/^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/i.test(d))bases.push('https://api.'+d);}}catch{}
  let last;for(const base of [...new Set(bases)])try{return normalizeSports(JSON.parse(await getText(base+'/api/streams',8_000_000)));}catch(e){last=e;}throw last||Error('Live Sports unavailable');
}
module.exports=async function handler(req,res){
  res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','public, max-age=30, s-maxage=60, stale-while-revalidate=120');
  if(req.method!=='GET')return res.status(405).json({error:'Method not allowed'});
  try{
    const kind=String(req.query?.kind||'');
    if(kind==='sports')return res.status(200).json({kind,categories:await sports()});
    if(!Object.hasOwn(PLAYLISTS,kind))return res.status(400).json({error:'Invalid live section'});
    const channels=parseM3u(await getText(PLAYLISTS[kind]));return res.status(200).json({kind,channels});
  }catch(error){return res.status(502).json({error:error?.message||'Live service unavailable'});}
};
module.exports.parseM3u=parseM3u;
