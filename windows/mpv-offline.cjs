'use strict';
const fs=require('node:fs');
const path=require('node:path');
const net=require('node:net');
const crypto=require('node:crypto');
const {spawn}=require('node:child_process');
const {BrowserWindow,ipcMain,dialog}=require('electron');

function bundledMpv(app){
  return app.isPackaged
    ? path.join(process.resourcesPath,'mpv','mpv.exe')
    : path.join(__dirname,'vendor','mpv','mpv.exe');
}
function bundledVideoHost(app){
  return app.isPackaged
    ? path.join(process.resourcesPath,'mpv-host','MpvVideoHost.exe')
    : path.join(__dirname,'MpvVideoHost.exe');
}
function cleanTitle(value){return String(value||'Downloaded video').replace(/[\r\n\t]+/g,' ').trim().slice(0,160)||'Downloaded video';}
function nativeHandle(window){
  const buffer=window.getNativeWindowHandle();
  return process.arch==='x64'||process.arch==='arm64'?buffer.readBigUInt64LE(0).toString():String(buffer.readUInt32LE(0));
}
function waitForVideoHost(child,timeout=8000){
  return new Promise((resolve,reject)=>{
    let buffer='',settled=false;
    const finish=(error,value)=>{if(settled)return;settled=true;clearTimeout(timer);child.stdout?.removeAllListeners('data');child.removeListener('error',onError);child.removeListener('exit',onExit);error?reject(error):resolve(value);};
    const onError=error=>finish(error);
    const onExit=code=>finish(Error('ZeroPlay video surface exited before startup'+(Number.isInteger(code)?` (${code})`:'' )+'.'));
    child.once('error',onError);child.once('exit',onExit);
    child.stdout?.setEncoding('utf8');
    child.stdout?.on('data',chunk=>{buffer+=chunk;const line=buffer.split(/\r?\n/)[0]?.trim();if(!/^\d+$/.test(line||''))return;finish(null,line);});
    const timer=setTimeout(()=>finish(Error('Timed out while creating the ZeroPlay video surface.')),timeout);timer.unref?.();
  });
}

class MpvIpc{
  constructor(pipe){this.pipe=pipe;this.socket=null;this.buffer='';this.nextId=1;this.pending=new Map();this.closed=false;}
  async connect(timeout=8000){
    const started=Date.now();
    while(!this.closed&&Date.now()-started<timeout){
      try{await new Promise((resolve,reject)=>{const socket=net.createConnection(this.pipe);const fail=error=>{socket.destroy();reject(error);};socket.once('error',fail);socket.once('connect',()=>{socket.removeListener('error',fail);this.socket=socket;socket.setEncoding('utf8');socket.on('data',data=>this.onData(data));socket.on('error',()=>this.failAll('Offline playback connection closed.'));socket.on('close',()=>this.failAll('Offline playback connection closed.'));resolve();});});return true;}catch{await new Promise(resolve=>setTimeout(resolve,120));}
    }
    throw Error('Could not connect to the bundled offline playback engine.');
  }
  onData(data){
    this.buffer+=data;
    for(;;){const end=this.buffer.indexOf('\n');if(end<0)break;const line=this.buffer.slice(0,end).trim();this.buffer=this.buffer.slice(end+1);if(!line)continue;let row;try{row=JSON.parse(line);}catch{continue;}if(row.request_id&&this.pending.has(row.request_id)){const pending=this.pending.get(row.request_id);this.pending.delete(row.request_id);if(row.error&&row.error!=='success')pending.reject(Error(row.error));else pending.resolve(row.data);}}
  }
  failAll(message){for(const pending of this.pending.values())pending.reject(Error(message));this.pending.clear();}
  request(command){
    if(!this.socket||this.socket.destroyed)return Promise.reject(Error('Offline playback engine is not connected.'));
    const request_id=this.nextId++;
    return new Promise((resolve,reject)=>{this.pending.set(request_id,{resolve,reject});try{this.socket.write(JSON.stringify({command,request_id})+'\n');}catch(error){this.pending.delete(request_id);reject(error);}setTimeout(()=>{if(this.pending.delete(request_id))reject(Error('Offline playback command timed out.'));},1800).unref?.();});
  }
  close(){this.closed=true;this.failAll('Offline playback closed.');try{this.socket?.destroy();}catch{}this.socket=null;}
}

let active=null;
let handlersReady=false;
function registerHandlers(){
  if(handlersReady)return;handlersReady=true;
  ipcMain.handle('offline-mpv-command',(event,action,value)=>active?.trusted(event)?active.command(action,value):false);
  ipcMain.handle('offline-mpv-close',event=>{if(!active?.trusted(event))return false;active.close();return true;});
  ipcMain.handle('offline-mpv-subtitle',async event=>{if(!active?.trusted(event))return false;return active.chooseSubtitle();});
  ipcMain.handle('offline-mpv-fullscreen',event=>{if(!active?.trusted(event))return false;active.toggleFullscreen();return true;});
}

class MpvOfflinePlayer{
  constructor(app,mainWindow){
    registerHandlers();
    this.app=app;this.mainWindow=mainWindow;this.process=null;this.videoHostProcess=null;this.videoHwnd=null;this.file=null;this.surface=null;this.controls=null;this.ipc=null;this.pipe=null;this.pollTimer=null;this.trackTick=0;this.closed=false;this.boundSync=()=>this.syncBounds();this.wasFullscreen=mainWindow.isFullScreen();
  }
  available(){return fs.existsSync(bundledMpv(this.app))&&fs.existsSync(bundledVideoHost(this.app));}
  trusted(event){return Boolean(this.controls&&!this.controls.isDestroyed()&&event.sender===this.controls.webContents);}
  syncBounds(){
    if(this.closed||this.mainWindow.isDestroyed())return;
    const bounds=this.mainWindow.getContentBounds();
    for(const window of [this.surface,this.controls])if(window&&!window.isDestroyed())try{window.setBounds(bounds,false);}catch{}
    try{this.controls?.moveTop();}catch{}
  }
  createWindows(title){
    const nativeChrome={frame:false,hasShadow:false,thickFrame:false,show:false,skipTaskbar:true,resizable:false,movable:false,minimizable:false,maximizable:false};
    this.surface=new BrowserWindow({...nativeChrome,parent:this.mainWindow,backgroundColor:'#000000',webPreferences:{contextIsolation:true,nodeIntegration:false,sandbox:true}});
    this.surface.setMenuBarVisibility(false);
    this.surface.loadURL('data:text/html,<html style="background:%23000"><body style="margin:0;background:%23000"></body></html>').catch(()=>{});
    this.controls=new BrowserWindow({...nativeChrome,parent:this.surface,transparent:true,backgroundColor:'#00000000',webPreferences:{preload:path.join(__dirname,'offline-mpv-preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true}});
    this.controls.setMenuBarVisibility(false);
    this.controls.setTitle(title);
    this.controls.loadFile(path.join(__dirname,'ui','offline-mpv.html')).catch(()=>{});
    for(const name of ['move','resize','maximize','unmaximize','enter-full-screen','leave-full-screen'])this.mainWindow.on(name,this.boundSync);
    this.syncBounds();
  }
  async createVideoSurface(){
    const host=bundledVideoHost(this.app);if(!fs.existsSync(host))throw Error('ZeroPlay native video surface is missing.');
    const child=spawn(host,[nativeHandle(this.surface)],{windowsHide:true,stdio:['ignore','pipe','ignore']});
    this.videoHostProcess=child;
    const hwnd=await waitForVideoHost(child);
    if(this.closed)throw Error('Offline playback was closed.');
    this.videoHwnd=hwnd;
    return hwnd;
  }
  async open({file,title,subtitleRoot}){
    const resolved=path.resolve(file);if(!fs.existsSync(resolved))throw Error('Downloaded video is missing.');
    const exe=bundledMpv(this.app);if(!fs.existsSync(exe))throw Error('Bundled ZeroPlay offline playback engine is missing.');
    this.close();this.closed=false;active=this;
    const clean=cleanTitle(title||path.basename(resolved));this.file=resolved;this.subtitleRoot=subtitleRoot&&fs.existsSync(subtitleRoot)?path.resolve(subtitleRoot):path.dirname(resolved);this.createWindows(clean);
    await Promise.all([
      new Promise(resolve=>this.surface.webContents.once('did-finish-load',resolve)),
      new Promise(resolve=>this.controls.webContents.once('did-finish-load',resolve))
    ]);
    const videoHwnd=await this.createVideoSurface();
    this.pipe='\\\\.\\pipe\\zeroplay-offline-'+process.pid+'-'+crypto.randomBytes(8).toString('hex');
    const args=[resolved,'--force-window=yes','--keep-open=yes','--osc=no','--input-default-bindings=no','--input-cursor=no','--border=no','--hwdec=auto-safe','--vo=gpu-next','--gpu-api=d3d11','--video-sync=display-resample','--audio-client-name=ZeroPlay','--sub-auto=fuzzy','--slang=en,eng,fil,tl','--sub-file-paths='+this.subtitleRoot,'--osd-level=0','--no-terminal','--wid='+videoHwnd,'--input-ipc-server='+this.pipe];
    const child=spawn(exe,args,{cwd:path.dirname(exe),windowsHide:true,stdio:'ignore'});this.process=child;
    child.once('error',error=>this.fail(error?.message||'Could not start offline playback engine.'));
    child.once('exit',()=>{if(!this.closed&&this.process===child)this.close();});
    this.ipc=new MpvIpc(this.pipe);
    try{await this.ipc.connect();}catch(error){this.close();throw error;}
    if(this.closed)return;
    await this.ipc.request(['set_property','pause',false]).catch(()=>{});
    this.surface.show();this.controls.show();this.syncBounds();this.controls.focus();
    this.mainWindow.setTitle(clean+' — ZeroPlay Offline');
    this.sendState({title:clean,status:'Ready',connected:true});
    this.pollTimer=setInterval(()=>this.poll(),250);this.pollTimer.unref?.();
    this.poll();
    return {engine:'mpv-native-surface',file:resolved};
  }
  sendState(state){if(this.controls&&!this.controls.isDestroyed())this.controls.webContents.send('offline-mpv-state',state);}
  async poll(){
    if(this.closed||!this.ipc)return;
    try{
      const [position,duration,paused,volume,muted,speed,panscan]=await Promise.all([
        this.ipc.request(['get_property','time-pos']).catch(()=>0),this.ipc.request(['get_property','duration']).catch(()=>0),this.ipc.request(['get_property','pause']).catch(()=>false),this.ipc.request(['get_property','volume']).catch(()=>100),this.ipc.request(['get_property','mute']).catch(()=>false),this.ipc.request(['get_property','speed']).catch(()=>1),this.ipc.request(['get_property','panscan']).catch(()=>0)
      ]);
      let tracks;
      if(++this.trackTick%8===1)tracks=await this.ipc.request(['get_property','track-list']).catch(()=>[]);
      this.sendState({position:Number(position)||0,duration:Number(duration)||0,paused:Boolean(paused),volume:Number(volume)||0,muted:Boolean(muted),speed:Number(speed)||1,panscan:Number(panscan)||0,tracks,connected:true,fullscreen:this.mainWindow.isFullScreen()});
    }catch{}
  }
  async command(action,value){
    if(this.closed||!this.ipc)return false;
    const number=Number(value);
    switch(action){
      case 'toggle':await this.ipc.request(['cycle','pause']);break;
      case 'seek-relative':await this.ipc.request(['seek',Math.max(-120,Math.min(120,number||0)),'relative','exact']);break;
      case 'seek-percent':await this.ipc.request(['seek',Math.max(0,Math.min(100,number||0)),'absolute-percent','exact']);break;
      case 'volume':await this.ipc.request(['set_property','volume',Math.max(0,Math.min(100,number||0))]);break;
      case 'mute':await this.ipc.request(['cycle','mute']);break;
      case 'speed':await this.ipc.request(['set_property','speed',[0.5,0.75,1,1.25,1.5,1.75,2].includes(number)?number:1]);break;
      case 'fit':{const current=await this.ipc.request(['get_property','panscan']).catch(()=>0);await this.ipc.request(['set_property','panscan',Number(current)>0?0:1]);break;}
      case 'subtitle-toggle':await this.ipc.request(['cycle','sub-visibility']);break;
      case 'subtitle-track':await this.ipc.request(['set_property','sid',String(value||'no')]);break;
      case 'audio-track':await this.ipc.request(['set_property','aid',String(value||'auto')]);break;
      default:return false;
    }
    setTimeout(()=>this.poll(),30);return true;
  }
  async chooseSubtitle(){
    if(this.closed||!this.ipc)return false;
    const result=await dialog.showOpenDialog(this.mainWindow,{properties:['openFile'],filters:[{name:'Subtitle files',extensions:['srt','vtt','ass','ssa']}]});
    if(result.canceled||!result.filePaths[0])return false;
    await this.ipc.request(['sub-add',path.resolve(result.filePaths[0]),'select']);this.sendState({toast:'Subtitle loaded'});return true;
  }
  toggleFullscreen(){if(this.mainWindow.isDestroyed())return;this.mainWindow.setFullScreen(!this.mainWindow.isFullScreen());setTimeout(()=>this.syncBounds(),50);}
  fail(message){this.sendState({connected:false,error:message});setTimeout(()=>this.close(),500);}
  close(){
    if(this.closed)return;this.closed=true;if(active===this)active=null;
    clearInterval(this.pollTimer);this.pollTimer=null;
    for(const name of ['move','resize','maximize','unmaximize','enter-full-screen','leave-full-screen'])try{this.mainWindow.removeListener(name,this.boundSync);}catch{}
    try{this.ipc?.request(['quit']);}catch{}try{this.ipc?.close();}catch{}this.ipc=null;
    const child=this.process;this.process=null;if(child&&!child.killed)try{child.kill();}catch{}
    const videoHost=this.videoHostProcess;this.videoHostProcess=null;if(videoHost&&!videoHost.killed)try{videoHost.kill();}catch{}this.videoHwnd=null;
    for(const window of [this.controls,this.surface])if(window&&!window.isDestroyed())try{window.destroy();}catch{}
    this.controls=null;this.surface=null;this.file=null;
    if(!this.mainWindow.isDestroyed()){if(this.mainWindow.isFullScreen()!==this.wasFullscreen)this.mainWindow.setFullScreen(this.wasFullscreen);this.mainWindow.setTitle('ZeroPlay');this.mainWindow.show();this.mainWindow.focus();}
  }
}
module.exports={MpvOfflinePlayer,bundledMpv,bundledVideoHost};
