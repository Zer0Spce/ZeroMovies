'use strict';
(()=>{
  const cache=new Map();let lastMovie=null;
  const original=window.zero?.api;
  if(typeof original==='function'){
    window.zero.api=async(path,params)=>{
      const data=await original(path,params);
      if(/^\/movie\/\d+$/.test(String(path))){lastMovie={imdb:String(data?.imdb_id||''),title:String(data?.title||'')};queueMicrotask(()=>decorate(lastMovie));}
      return data;
    };
  }
  async function rotten(imdb){
    if(!/^tt\d+$/.test(imdb))return '';
    if(cache.has(imdb))return cache.get(imdb);
    const pending=(async()=>{try{const response=await fetch('../api/rotten?imdb='+encodeURIComponent(imdb),{cache:'no-store'});if(!response.ok)return '';const data=await response.json();return /^\d{1,3}%$/.test(String(data?.rating||''))?data.rating:'';}catch{return '';}})();
    cache.set(imdb,pending);const value=await pending;cache.set(imdb,value);return value;
  }
  async function decorate(movie){
    if(!movie?.imdb)return;const badge=document.querySelector('#detail[open] .badges');if(!badge||badge.querySelector('[data-rotten]'))return;
    const value=await rotten(movie.imdb);if(!value||!document.querySelector('#detail[open]'))return;
    const span=document.createElement('span');span.className='rating rotten-rating';span.dataset.rotten='1';span.textContent='🍅 '+value+' Rotten Tomatoes';badge.appendChild(span);
  }
  const observer=new MutationObserver(()=>{if(lastMovie&&document.querySelector('#detail[open]'))decorate(lastMovie);});observer.observe(document.body,{childList:true,subtree:true});
})();
