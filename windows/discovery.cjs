'use strict';
const SORTS=['popularity.desc','vote_count.desc','primary_release_date.desc','primary_release_date.asc'];
function createSurprise(api,normalize,{random=Math.random,today=()=>new Date().toISOString().slice(0,10)}={}){
  const recent=[];
  return async function surprise(){
    const date=today(),params={include_video:false,sort_by:SORTS[Math.floor(random()*SORTS.length)],'primary_release_date.lte':date,'vote_count.gte':20};
    const first=await api('/discover/movie',{...params,page:1});
    const pages=Math.max(1,Math.min(500,Number(first.total_pages)||1));
    const page=1+Math.floor(random()*pages);
    const sampled=page===1?first:await api('/discover/movie',{...params,page});
    const candidates=data=>(data.results||[]).filter(x=>!x.adult&&Number.isSafeInteger(x.id)&&x.id>0&&typeof x.title==='string'&&x.title.trim()&&/^\d{4}-\d{2}-\d{2}$/.test(x.release_date||'')&&x.release_date<=date).map(x=>normalize(x,'movie')).filter(Boolean);
    let picks=candidates(sampled);if(!picks.length)picks=candidates(first);
    if(!picks.length)throw Error('No released movies found. Please try again.');
    const fresh=picks.filter(x=>!recent.includes(x.id));if(fresh.length)picks=fresh;
    const item=picks[Math.floor(random()*picks.length)];recent.push(item.id);if(recent.length>20)recent.shift();return item;
  };
}
module.exports={createSurprise};
