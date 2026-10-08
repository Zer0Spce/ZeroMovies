'use strict';
(()=>{
  const cache=new Map();
  function currentMovieId(){const play=document.querySelector('#detail[open] [data-play]');const value=String(play?.dataset?.play||'');const match=value.match(/^movie:(\d+)$/);return match?match[1]:'';}
  async function rotten(tmdb){
    if(!/^[1-9]\d*$/.test(tmdb))return '';
    if(cache.has(tmdb))return cache.get(tmdb);
    const pending=(async()=>{try{const response=await fetch('../api/rotten?tmdb='+encodeURIComponent(tmdb),{cache:'no-store'});if(!response.ok)return '';const data=await response.json();return /^\d{1,3}%$/.test(String(data?.rating||''))?data.rating:'';}catch{return '';}})();
    cache.set(tmdb,pending);const value=await pending;cache.set(tmdb,value);return value;
  }
  async function decorate(){
    const tmdb=currentMovieId(),badge=document.querySelector('#detail[open] .badges');if(!tmdb||!badge||badge.querySelector('[data-rotten]'))return;
    const value=await rotten(tmdb);if(!value||currentMovieId()!==tmdb)return;
    const span=document.createElement('span');span.className='rating rotten-rating';span.dataset.rotten='1';span.textContent='🍅 '+value+' Rotten Tomatoes';badge.appendChild(span);
  }
  new MutationObserver(decorate).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['open']});decorate();
})();
