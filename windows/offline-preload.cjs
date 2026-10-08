const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('offline',{context:()=>ipcRenderer.invoke('offline-context'),loadSubtitle:()=>ipcRenderer.invoke('offline-subtitle'),close:()=>ipcRenderer.invoke('offline-close'),fullscreen:()=>ipcRenderer.invoke('offline-fullscreen')});

// Auto-hide was unreliable across some Windows video/compositor combinations.
// Keep visibility deterministic: the renderer's small manual eye button is the
// only control that hides/shows the Offline Player chrome.
