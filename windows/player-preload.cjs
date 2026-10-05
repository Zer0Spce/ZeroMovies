const {ipcRenderer}=require('electron');
window.addEventListener('message',event=>{
  if(event.origin!=='https://vidstuck.xyz')return;
  try{const data=typeof event.data==='string'?JSON.parse(event.data):event.data;
    if(data&&JSON.stringify(data).length<=4096)ipcRenderer.send('progress',data);
  }catch{}
});
