const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('zero',{
  torrentSearchSettings:(action,value)=>ipcRenderer.invoke('torrentSearchSettings',action,value),
  torrentSearch:(item,episode,fresh)=>ipcRenderer.invoke('torrent-search',item,episode,fresh),
  downloadFolder:()=>ipcRenderer.invoke('download-folder'),
  downloads:()=>ipcRenderer.invoke('downloads'),
  rawcast:(action,value)=>ipcRenderer.invoke('rawcast',action,value),
  downloadAdd:(item,episode,options)=>ipcRenderer.invoke('download-add',item,episode,options),
  downloadAction:(id,action,value)=>ipcRenderer.invoke('download-action',id,action,value),
  onDownloads:callback=>{const handler=()=>callback();ipcRenderer.on('downloads-updated',handler);return()=>ipcRenderer.removeListener('downloads-updated',handler);},
  api:(path,params)=>ipcRenderer.invoke('api',path,params),
  sports:force=>ipcRenderer.invoke('sports',force),
  sportsPlay:(id,index)=>ipcRenderer.invoke('sports-play',id,index),
  playlist:(section,force)=>ipcRenderer.invoke('playlist',section,force),
  channelFavorite:(section,index)=>ipcRenderer.invoke('channel-favorite',section,index),
  livePlay:(section,index)=>ipcRenderer.invoke('live-play',section,index),
  surprise:()=>ipcRenderer.invoke('surprise'),
  state:()=>ipcRenderer.invoke('state'),
  change:(action,value)=>ipcRenderer.invoke('change',action,value),
  play:(item,episode)=>ipcRenderer.invoke('play',item,episode),
  external:url=>ipcRenderer.invoke('external',url),
  checkForUpdates:()=>ipcRenderer.invoke('update-check'),
  onRefresh:callback=>{const handler=()=>callback();ipcRenderer.on('refresh',handler);return()=>ipcRenderer.removeListener('refresh',handler);}
});
function loadSettingsStyles(){if(document.querySelector('link[data-zero-settings]'))return;const link=document.createElement('link');link.rel='stylesheet';link.href='settings-groups.css';link.dataset.zeroSettings='1';document.head.appendChild(link);}
function organizeSettings(){
  const body=document.querySelector('#settings .settings-body');if(!body||body.dataset.organized==='1')return;body.dataset.organized='1';
  const saveActions=body.querySelector('[data-action="save-settings"]')?.closest('.actions')||null;
  const aboutStart=body.querySelector('hr');
  const groups=document.createElement('div');groups.className='settings-groups';
  const make=(title,description)=>{const section=document.createElement('section');section.className='settings-section';const h=document.createElement('h3');h.textContent=title;section.appendChild(h);if(description){const p=document.createElement('p');p.className='settings-section-description';p.textContent=description;section.appendChild(p);}groups.appendChild(section);return section;};
  const general=make('General','Core app, account and regional preferences.');
  const home=make('Home','Choose what appears on the ZeroPlay homepage.');
  const appearance=make('Appearance','Layout and theme styling.');
  const experience=make('Experience','Animations, previews and browsing behavior.');
  const playback=make('Playback & Downloads','Streaming source and download provider settings.');
  const player=make('Player','Playback behavior and audio controls.');
  const about=make('About','Version, credits and app information.');
  const node=id=>document.getElementById(id);
  const owner=id=>{const el=node(id);if(!el)return null;return el.closest('fieldset')||el.closest('.rawcast-controls')||el.closest('label')||el;};
  const move=(section,id)=>{const el=owner(id);if(el&&el.parentElement!==section)section.appendChild(el);};
  move(general,'api-key');move(general,'key-state');move(general,'region');
  move(home,'home-panels');
  move(appearance,'ui-layout');move(appearance,'theme');
  move(experience,'preview-settings');
  move(playback,'playback-source');move(playback,'rawcastPlayback');move(playback,'rawcast-controls');move(playback,'torrentSearchSettings-enabled');
  const providers=document.createElement('fieldset');providers.id='live-provider-settings';providers.innerHTML='<legend>Live TV channel providers</legend><p>Cignal and Converge are disabled by default on Windows. Other Live TV channels remain available.</p><label class="panel-toggle"><input type="checkbox" id="live-cignal"> Enable Cignal channels</label><label class="panel-toggle"><input type="checkbox" id="live-converge"> Enable Converge channels</label>';
  const cignal=providers.querySelector('#live-cignal'),converge=providers.querySelector('#live-converge');cignal.checked=localStorage.getItem('zero-live-cignal')==='1';converge.checked=localStorage.getItem('zero-live-converge')==='1';const saveProviders=()=>{localStorage.setItem('zero-live-cignal',cignal.checked?'1':'0');localStorage.setItem('zero-live-converge',converge.checked?'1':'0');filterLiveProviders();};cignal.addEventListener('change',saveProviders);converge.addEventListener('change',saveProviders);playback.appendChild(providers);
  move(player,'gain');
  if(aboutStart){let cursor=aboutStart.nextSibling;while(cursor){const next=cursor.nextSibling;if(cursor!==saveActions)about.appendChild(cursor);cursor=next;}aboutStart.remove();}
  const oldAppearance=[...body.children].find(el=>el.tagName==='H3'&&el.textContent.trim()==='Appearance');if(oldAppearance)oldAppearance.remove();
  const audioNote=[...body.querySelectorAll('p')].find(el=>/Audio boost requires/i.test(el.textContent));if(audioNote)player.appendChild(audioNote);
  body.insertBefore(groups,saveActions||null);
  if(saveActions){saveActions.classList.add('settings-save-actions');body.appendChild(saveActions);}
}
function filterLiveProviders(){
  if(document.documentElement.dataset.section!=='IPTV')return;
  const cignal=localStorage.getItem('zero-live-cignal')==='1',converge=localStorage.getItem('zero-live-converge')==='1';
  for(const card of document.querySelectorAll('.channel-card')){const article=card.closest('article');if(!article)continue;const text=(card.textContent||'').toLowerCase();article.hidden=(text.includes('cignal')&&!cignal)||(text.includes('converge')&&!converge);}
}
function installSurpriseScope(){
  const root=document.documentElement;root.dataset.zeroSurpriseOrigin='0';const style=document.createElement('style');style.textContent=':root:not([data-zero-surprise-origin="1"]) [data-zero-surprise-again]{display:none!important}';document.head.appendChild(style);
  document.addEventListener('click',event=>{if(event.target.closest?.('[data-action="surprise"],[data-zero-surprise-again]'))root.dataset.zeroSurpriseOrigin='1';else if(event.target.closest?.('[data-detail]'))root.dataset.zeroSurpriseOrigin='0';},true);
}
window.addEventListener('DOMContentLoaded',()=>{
  loadSettingsStyles();organizeSettings();filterLiveProviders();installSurpriseScope();new MutationObserver(()=>filterLiveProviders()).observe(document.getElementById('content'),{childList:true,subtree:true});
  const surprise=document.querySelector('[data-action="surprise"]');if(!surprise||document.querySelector('[data-action="check-updates"]'))return;const button=document.createElement('button');button.className='icon';button.dataset.action='check-updates';button.type='button';button.title='Check for updates';button.setAttribute('aria-label','Check for updates');button.textContent='⇩';surprise.insertAdjacentElement('afterend',button);button.addEventListener('click',async()=>{const old=button.textContent;button.disabled=true;button.textContent='…';try{const result=await ipcRenderer.invoke('update-check');if(result?.status==='current'){button.textContent='✓';button.title='ZeroPlay is up to date';setTimeout(()=>{if(button.isConnected){button.textContent=old;button.title='Check for updates';}},2200);}else button.textContent=old;}catch{button.textContent='!';button.title='Could not check for updates';setTimeout(()=>{if(button.isConnected){button.textContent=old;button.title='Check for updates';}},2500);}finally{button.disabled=false;}});
});
