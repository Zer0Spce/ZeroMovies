'use strict';
(()=>{
  const KEY='zero-omdb-api-key';
  const cache=new Map();
  let lastMovie=null;
  const original=window.zero?.api;
  if(typeof original==='function'){
    window.zero.api=async(path,params)=>{
      const data=await original(path,params);
      if(/^\/movie\/\d+$/.test(String(path))){
        lastMovie={id:String(path).split('/').pop(),imdb:String(data?.imdb_id||''),title:String(data?.title||'')};
        queueMicrotask(()=>decorateDetail(lastMovie));
      }
      return data;
    };
  }

  function key(){return String(localStorage.getItem(KEY)||'').trim();}
  function validKey(value){return /^[A-Za-z0-9]{6,64}$/.test(String(value||'').trim());}
  async function rotten(imdb){
    const apiKey=key();if(!apiKey||!/^tt\d+$/.test(imdb))return '';
    if(cache.has(imdb))return cache.get(imdb);
    const pending=(async()=>{try{
      const url='https://www.omdbapi.com/?apikey='+encodeURIComponent(apiKey)+'&i='+encodeURIComponent(imdb)+'&plot=short&r=json';
      const response=await fetch(url,{cache:'no-store'});if(!response.ok)return '';
      const data=await response.json();const row=Array.isArray(data?.Ratings)?data.Ratings.find(x=>x?.Source==='Rotten Tomatoes'):null;
      return /^\d{1,3}%$/.test(String(row?.Value||''))?row.Value:'';
    }catch{return '';}})();cache.set(imdb,pending);const value=await pending;cache.set(imdb,value);return value;
  }
  async function decorateDetail(movie){
    if(!movie?.imdb)return;const badge=document.querySelector('#detail[open] .badges');if(!badge||badge.querySelector('[data-rotten]'))return;
    const value=await rotten(movie.imdb);if(!value||!document.querySelector('#detail[open]'))return;
    const span=document.createElement('span');span.className='rating rotten-rating';span.dataset.rotten='1';span.textContent='🍅 '+value+' Rotten Tomatoes';badge.appendChild(span);
  }
  function settingsField(){
    const body=document.querySelector('#settings .settings-body');if(!body||body.querySelector('#omdb-key'))return;
    const anchor=document.querySelector('#key-state')||body.querySelector('#api-key')?.closest('label');if(!anchor)return;
    const label=document.createElement('label');label.innerHTML='OMDb API key · optional for Rotten Tomatoes<input id="omdb-key" type="password" autocomplete="off" placeholder="Leave blank to keep saved key"><small style="display:block;margin-top:7px;color:var(--muted)">TMDB remains the primary source. OMDb is used only to add Rotten Tomatoes ratings when available.</small>';
    anchor.insertAdjacentElement('afterend',label);
    const state=document.createElement('p');state.id='omdb-key-state';state.textContent=key()?'An OMDb key is saved on this computer.':'No OMDb key saved · Rotten Tomatoes ratings are hidden.';label.insertAdjacentElement('afterend',state);
  }
  document.addEventListener('click',event=>{
    const action=event.target.closest?.('[data-action]')?.dataset.action;
    if(action==='save-settings'){
      const input=document.querySelector('#omdb-key');const value=String(input?.value||'').trim();
      if(value){if(validKey(value)){localStorage.setItem(KEY,value);cache.clear();}else{event.preventDefault();event.stopImmediatePropagation();const s=document.querySelector('#settings-status');if(s)s.textContent='Enter a valid OMDb API key.';}}
    }
  },true);
  const observer=new MutationObserver(()=>{settingsField();if(lastMovie&&document.querySelector('#detail[open]'))decorateDetail(lastMovie);});
  observer.observe(document.body,{childList:true,subtree:true});settingsField();
})();
