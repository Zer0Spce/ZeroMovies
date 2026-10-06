const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('playerTools',{sportsControl:(action,index)=>ipcRenderer.invoke('sports-control',action,index),onSportsMode:callback=>ipcRenderer.on('sports-mode',(_event,value)=>callback(value)),back:()=>ipcRenderer.invoke('player-close'),fullscreen:()=>ipcRenderer.invoke('player-fullscreen'),onTitle:callback=>ipcRenderer.on('player-title',(_event,title)=>callback(title))});

let lastActivity=0;for(const type of ["pointermove","pointerdown","keydown"])window.addEventListener(type,()=>{if(Date.now()-lastActivity>250){lastActivity=Date.now();ipcRenderer.send("player-tools-activity");}},true);
