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
window.addEventListener('DOMContentLoaded',()=>{const surprise=document.querySelector('[data-action="surprise"]');if(!surprise||document.querySelector('[data-action="check-updates"]'))return;const button=document.createElement('button');button.className='icon';button.dataset.action='check-updates';button.type='button';button.title='Check for updates';button.setAttribute('aria-label','Check for updates');button.textContent='⇩';surprise.insertAdjacentElement('afterend',button);button.addEventListener('click',async()=>{const old=button.textContent;button.disabled=true;button.textContent='…';try{const result=await ipcRenderer.invoke('update-check');if(result?.status==='current'){button.textContent='✓';button.title='ZeroPlay is up to date';setTimeout(()=>{if(button.isConnected){button.textContent=old;button.title='Check for updates';}},2200);}else button.textContent=old;}catch{button.textContent='!';button.title='Could not check for updates';setTimeout(()=>{if(button.isConnected){button.textContent=old;button.title='Check for updates';}},2500);}finally{button.disabled=false;}});});
