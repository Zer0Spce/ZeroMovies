const {ipcRenderer}=require('electron');
const origins=new Set(['https://vidstuck.xyz','https://vidsrc.to','https://vidsrc.sh','https://multiembed.mov','https://streamingnow.mov']);
window.addEventListener('message',event=>{
  if(!origins.has(event.origin))return;
  try{const data=typeof event.data==='string'?JSON.parse(event.data):event.data;
    if(data?.type==='zeromovies-player-exit'&&event.source===window&&window===window.top){ipcRenderer.send('embedded-player-exit');return;}
    if(data&&JSON.stringify(data).length<=4096)ipcRenderer.send('progress',data);
  }catch{}
});
