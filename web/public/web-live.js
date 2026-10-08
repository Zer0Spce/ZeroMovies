'use strict';
(() => {
  const $=s=>document.querySelector(s),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const favoriteKey='zeroplay-web-live-favorites-v1';
  let liveSection='',liveData=null,query='',group='All',favorites=new Set(),activeShaka=null;
  try{favorites=new Set(JSON.parse(localStorage.getItem(favoriteKey)||'[]'));}catch{}
  const saveFavorites=()=>localStorage.setItem(favoriteKey,JSON.stringify([...favorites].slice(0,1000)));
  const channelId=c=>`${c.name}|${c.url}`;
  const navMap={'Live TV':'iptv','PPV / Sports':'ppv','Live Sports':'sports'};
  const player=$('#live-player'),stage=$('#live-player-stage'),title=$('#live-player-title');

  function setNav(section){for(const b of document.querySelectorAll('[data-nav],[data-live-nav]'))b.classList.toggle('active',b.dataset.liveNav===section);$('#heading').textContent=section;$('#eyebrow').textContent='ZERO PLAY LIVE';}
  async function fetchLive(kind,fresh=false){const r=await fetch('/api/live?kind='+encodeURIComponent(kind)+(fresh?'&fresh='+Date.now():''),{credentials:'same-origin'});const data=await r.json();if(!r.ok)throw Error(data.error||'Live service unavailable');return data;}
  function channelBadge(c){if(c.drm)return 'DRM · Native only';if(c.requiresHeaders)return 'Headers · Native only';if(c.mime==='application/dash+xml')return 'DASH';if(c.mime==='application/x-mpegurl')return 'HLS';return '';}
  function channelCard(c,index){const id=channelId(c),fav=favorites.has(id),badge=channelBadge(c);return `<article class="live-card" data-live-row="${index}">${c.logo?`<img src="${esc(c.logo)}" alt="" loading="lazy">`:'<div class="live-logo"></div>'}<div><strong>${esc(c.name)}</strong><small>${esc(c.group||'Channels')}</small>${badge?`<br><span class="live-badge">${esc(badge)}</span>`:''}</div><div class="live-actions"><button data-live-play="${index}">▶</button><button data-live-favorite="${index}" class="${fav?'favorite-on':''}" aria-label="Favorite">${fav?'★':'☆'}</button></div></article>`;}
  function renderChannels(){
    const rows=(liveData?.channels||[]).filter(c=>(group==='All'||c.group===group)&&(!query||`${c.name} ${c.group}`.toLowerCase().includes(query.toLowerCase())));
    const groups=['All',...new Set((liveData?.channels||[]).map(c=>c.group||'Channels'))].sort();
    $('#content').innerHTML=`<section class="live-shell"><div class="live-toolbar"><input id="live-search" placeholder="Search ${esc(liveSection)}" value="${esc(query)}"><select id="live-group">${groups.map(g=>`<option ${g===group?'selected':''}>${esc(g)}</option>`).join('')}</select><button data-live-refresh>↻ Refresh</button><button data-live-favorites>★ Favorites</button></div>${rows.length?`<div class="live-grid">${rows.map(c=>channelCard(c,(liveData.channels||[]).indexOf(c))).join('')}</div>`:'<div class="live-empty">No matching live channels.</div>'}</section>`;
    $('#status').textContent=`${rows.length} channels · browser playback enabled for compatible DRM-free streams`;
  }
  function eventTime(e){if(e.alwaysLive)return 'Always live';if(!e.start)return 'Live event';try{return new Date(e.start*1000).toLocaleString();}catch{return 'Live event';}}
  function renderSports(){
    const categories=liveData?.categories||[];
    $('#content').innerHTML=`<section class="live-shell"><div class="live-toolbar"><input id="live-search" placeholder="Search Live Sports" value="${esc(query)}"><button data-live-refresh>↻ Refresh</button></div><div class="sports-groups">${categories.map(cat=>{const events=(cat.events||[]).filter(e=>!query||e.title.toLowerCase().includes(query.toLowerCase()));return events.length?`<section class="sports-group"><h3>${esc(cat.category)}</h3><div class="live-grid">${events.map(e=>`<article class="live-card sports-card">${e.poster?`<img src="${esc(e.poster)}" alt="" loading="lazy">`:'<div class="live-logo"></div>'}<div><strong>${esc(e.title)}</strong><small>${esc(eventTime(e))}</small><div class="live-actions">${e.sources.map((s,i)=>`<button data-sports-play="${esc(e.id)}" data-source-index="${i}">${esc(s.label)}</button>`).join('')}</div></div></article>`).join('')}</div></section>`:'';}).join('')}</div></section>`;
    $('#status').textContent='Live Sports · refreshes from the current sports API';
  }
  function render(){liveSection==='Live Sports'?renderSports():renderChannels();}
  async function openSection(section,fresh=false){
    liveSection=section;query='';group='All';setNav(section);$('#content').innerHTML='<div class="skeleton" aria-label="Loading live channels"></div>';$('#status').textContent='Loading '+section+'…';
    try{liveData=await fetchLive(navMap[section],fresh);render();}catch(e){$('#content').innerHTML=`<div class="empty"><h2>${esc(section)} unavailable</h2><p>${esc(e.message)}</p><button data-live-refresh>Try again</button></div>`;$('#status').textContent=e.message;}
  }
  async function destroyAdaptive(){if(activeShaka){try{await activeShaka.destroy();}catch{}activeShaka=null;}}
  async function closePlayer(fromHistory=false){await destroyAdaptive();stage.replaceChildren();if(player.open)player.close();if(!fromHistory&&history.state?.zeroPlayOverlay==='live-player')history.back();}
  function showPlayer(name){title.textContent=name;if(!player.open){player.showModal();history.pushState({...(history.state||{}),zeroPlayOverlay:'live-player'},'',location.href);}}
  function unavailable(message){stage.innerHTML=`<div class="live-player-note"><h3>Browser playback unavailable</h3><p>${esc(message)}</p></div>`;}
  async function playChannel(index){
    const c=liveData?.channels?.[index];if(!c)return;await destroyAdaptive();stage.replaceChildren();showPlayer(c.name);
    if(c.browserPlayable===false){
      if(c.drm)unavailable('This channel uses DRM-protected playback and is not available in ZeroPlay Web. Try it in the ZeroPlay Android/TV/Windows app.');
      else if(c.requiresHeaders)unavailable('This channel requires request headers that normal browser playback cannot provide. Try it in the ZeroPlay Android/TV/Windows app.');
      else unavailable('This channel is not compatible with browser playback.');
      return;
    }
    const video=document.createElement('video');video.controls=true;video.autoplay=true;video.playsInline=true;stage.appendChild(video);
    const adaptive=c.mime==='application/dash+xml'||c.mime==='application/x-mpegurl'||/\.(mpd|m3u8)(?:$|\?)/i.test(c.url);
    if(adaptive&&window.shaka?.Player){
      try{
        shaka.polyfill.installAll();if(!shaka.Player.isBrowserSupported())throw Error('Adaptive playback is unsupported by this browser');
        activeShaka=new shaka.Player();await activeShaka.attach(video);await activeShaka.load(c.url);await video.play().catch(()=>{});return;
      }catch(error){console.warn('ZeroPlay adaptive playback failed',error);await destroyAdaptive();unavailable('The browser or stream host blocked this DRM-free DASH/HLS stream.');return;}
    }
    video.src=c.url;video.addEventListener('error',()=>unavailable('The browser or stream host blocked this stream.'),{once:true});video.play().catch(()=>{});
  }
  async function playSport(id,index){
    const event=(liveData?.categories||[]).flatMap(c=>c.events||[]).find(e=>e.id===id),source=event?.sources?.[index];if(!event||!source)return;await destroyAdaptive();stage.replaceChildren();const frame=document.createElement('iframe');frame.src=source.url;frame.allow='autoplay; fullscreen; encrypted-media; picture-in-picture';frame.allowFullscreen=true;frame.referrerPolicy='strict-origin-when-cross-origin';stage.appendChild(frame);showPlayer(event.title+' · '+source.label);
  }

  document.addEventListener('click',event=>{
    const liveNav=event.target.closest('[data-live-nav]');if(liveNav){event.preventDefault();event.stopImmediatePropagation();openSection(liveNav.dataset.liveNav);return;}
    if(event.target.closest('[data-nav]'))for(const b of document.querySelectorAll('[data-live-nav]'))b.classList.remove('active');
    const play=event.target.closest('[data-live-play]');if(play){playChannel(Number(play.dataset.livePlay));return;}
    const sport=event.target.closest('[data-sports-play]');if(sport){playSport(sport.dataset.sportsPlay,Number(sport.dataset.sourceIndex));return;}
    const fav=event.target.closest('[data-live-favorite]');if(fav){const c=liveData?.channels?.[Number(fav.dataset.liveFavorite)];if(c){const id=channelId(c);favorites.has(id)?favorites.delete(id):favorites.add(id);saveFavorites();render();}return;}
    if(event.target.closest('[data-live-refresh]')){openSection(liveSection,true);return;}
    if(event.target.closest('[data-live-favorites]')){const all=liveData?.channels||[];liveData={...liveData,channels:all.filter(c=>favorites.has(channelId(c)))};query='';group='All';render();return;}
  },true);
  document.addEventListener('input',event=>{if(event.target.id==='live-search'){query=event.target.value;render();}});
  document.addEventListener('change',event=>{if(event.target.id==='live-group'){group=event.target.value;render();}});
  $('#close-live-player')?.addEventListener('click',()=>closePlayer(false));
  player?.addEventListener('cancel',event=>{event.preventDefault();closePlayer(false);});
  window.addEventListener('popstate',()=>{if(player?.open)closePlayer(true);});
})();
