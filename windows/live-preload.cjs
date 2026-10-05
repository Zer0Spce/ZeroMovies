const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('live',{context:()=>ipcRenderer.invoke('live-context'),select:index=>ipcRenderer.invoke('live-select',index),close:()=>ipcRenderer.invoke('live-close'),fullscreen:()=>ipcRenderer.invoke('live-fullscreen')});
