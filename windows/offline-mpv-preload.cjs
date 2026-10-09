const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('zeroOfflineMpv',{
  command:(action,value)=>ipcRenderer.invoke('offline-mpv-command',action,value),
  close:()=>ipcRenderer.invoke('offline-mpv-close'),
  chooseSubtitle:()=>ipcRenderer.invoke('offline-mpv-subtitle'),
  fullscreen:()=>ipcRenderer.invoke('offline-mpv-fullscreen'),
  onState:callback=>{
    if(typeof callback!=='function')return;
    ipcRenderer.on('offline-mpv-state',(_event,state)=>callback(state||{}));
  }
});
