const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('zero',{
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
