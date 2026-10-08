'use strict';
const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('zeroUpdater',{
  action:action=>ipcRenderer.invoke('update-window-action',action),
  onRelease:callback=>{const handler=(_event,value)=>callback(value);ipcRenderer.on('update-release',handler);return()=>ipcRenderer.removeListener('update-release',handler);},
  onProgress:callback=>{const handler=(_event,value)=>callback(value);ipcRenderer.on('update-progress',handler);return()=>ipcRenderer.removeListener('update-progress',handler);}
});
