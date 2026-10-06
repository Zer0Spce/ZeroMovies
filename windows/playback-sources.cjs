(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.playbackSources=factory();})(typeof globalThis==='object'?globalThis:this,()=>{
  const sources=[{id:'vidstuck',name:'VidStuck'},{id:'vidsrc-sh',name:'VidSrc.sh'},{id:'rawcast',name:'RawCast · Limited API quota'}];
  const hosts=['vidstuck.xyz','vidsrc.sh'];
  function source(id){return sources.find(row=>row.id===id)||sources[0];}
  function trusted(value){try{const u=new URL(value);return u.protocol==='https:'&&!u.port&&hosts.includes(u.hostname);}catch{return false;}}
  function url(item,position={},provider='vidstuck'){
    if(!['movie','tv'].includes(item?.type)||!Number.isSafeInteger(item.id)||item.id<1)throw Error('Invalid title');
    const season=Number.isInteger(position.season)&&position.season>=0?position.season:1,episode=Number.isInteger(position.episode)&&position.episode>0?position.episode:1;
    const suffix=`${item.type}/${item.id}`+(item.type==='tv'?`/${season}/${episode}`:'');const id=source(provider).id;
    if(id==='rawcast')throw Error('RawCast requires secure API resolution.');const u=new URL(`https://${id==='vidsrc-sh'?'vidsrc.sh':'vidstuck.xyz'}/embed/${suffix}`);
    if(id==='vidstuck'){for(const [k,v]of Object.entries({branding:'ZeroPlay',color:'65E6CC',subtitle:'english',overlay:'true'}))u.searchParams.set(k,v);if(item.type==='tv')for(const k of ['nextEpisode','episodeSelector','autoplayNextEpisode'])u.searchParams.set(k,'true');}
    if(id==='vidsrc-sh'){u.searchParams.set('ds_lang','en');if(item.type==='tv')u.searchParams.set('autonext','1');}
    if(Number.isFinite(position.timestamp)&&position.timestamp>30&&Number(position.percent)<95){if(id==='vidstuck')u.searchParams.set('progress',String(Math.floor(position.timestamp)));if(id==='vidsrc-sh')u.searchParams.set('startAt',String(Math.floor(position.timestamp)));}
    return u.href;
  }
  function normalize(data){if(data?.type!=='PLAYER_EVENT')return data;const p=data.data,info=p?.player_info;if(!info?.tmdb)return null;return {id:info.tmdb,type:info.mediaType,timestamp:p.player_progress,duration:p.player_duration,season:info.season,episode:info.episode};}
  return {sources,source,trusted,url,normalize};
});
