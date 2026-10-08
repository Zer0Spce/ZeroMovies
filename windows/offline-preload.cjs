const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('offline',{context:()=>ipcRenderer.invoke('offline-context'),loadSubtitle:()=>ipcRenderer.invoke('offline-subtitle'),close:()=>ipcRenderer.invoke('offline-close'),fullscreen:()=>ipcRenderer.invoke('offline-fullscreen')});

// Keep the compositor-safe Offline Player controls, but restore normal player auto-hide.
// This runs in the isolated preload world so file-specific video decode/compositor behavior
// cannot replace or interfere with the controls themselves.
window.addEventListener('DOMContentLoaded',()=>{
  const video=document.getElementById('video');
  const speedMenu=document.getElementById('speed-menu');
  if(!video)return;

  const style=document.createElement('style');
  style.textContent=`
    body.hidden-ui #topbar,body.hidden-ui #controls{opacity:0!important;visibility:hidden!important;pointer-events:none!important}
    body.hidden-ui{cursor:none!important}
    body.hidden-ui #subtitle-overlay{opacity:1!important;visibility:visible!important}
  `;
  document.head.appendChild(style);

  let timer;
  const delay=3000;
  const canHide=()=>!video.paused&&!video.ended&&!(speedMenu&&!speedMenu.hidden)&&!document.querySelector('input[type="range"]:active');
  const hide=()=>{
    clearTimeout(timer);
    if(!canHide()){schedule();return;}
    document.body.classList.add('hidden-ui');
    document.documentElement.style.cursor='none';
  };
  const schedule=()=>{
    clearTimeout(timer);
    if(!video.paused&&!video.ended)timer=setTimeout(hide,delay);
  };
  const wake=()=>{
    document.body.classList.remove('hidden-ui');
    document.documentElement.style.cursor='';
    schedule();
  };

  for(const name of ['mousemove','pointermove','pointerdown','mousedown','wheel','touchstart','keydown'])
    document.addEventListener(name,wake,{capture:true,passive:name!=='keydown'});
  video.addEventListener('play',wake);
  video.addEventListener('playing',wake);
  video.addEventListener('pause',()=>{clearTimeout(timer);wake();});
  video.addEventListener('ended',()=>{clearTimeout(timer);wake();});
  window.addEventListener('focus',wake);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)wake();});
  document.addEventListener('fullscreenchange',wake);
  wake();
});
