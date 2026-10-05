const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('playerTools',{back:()=>ipcRenderer.invoke('player-close'),fullscreen:()=>ipcRenderer.invoke('player-fullscreen'),onTitle:callback=>ipcRenderer.on('player-title',(_event,title)=>callback(title))});
