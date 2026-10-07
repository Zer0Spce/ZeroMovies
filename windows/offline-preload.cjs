const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('offline',{context:()=>ipcRenderer.invoke('offline-context'),loadSubtitle:()=>ipcRenderer.invoke('offline-subtitle'),close:()=>ipcRenderer.invoke('offline-close'),fullscreen:()=>ipcRenderer.invoke('offline-fullscreen')});
