const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('zero',{
  downloads:()=>ipcRenderer.invoke('downloads'),
  rawcast:(action,value)=>ipcRenderer.invoke('rawcast',action,value),
  downloadAdd:(item,episode,options)=>ipcRenderer.invoke('download-add',item,episode,options),
  downloadAction:(id,action)=>ipcRenderer.invoke('download-action',id,action),
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
  onRefresh:callback=>{const handler=()=>callback();ipcRenderer.on('refresh',handler);return()=>ipcRenderer.removeListener('refresh',handler);}
});
