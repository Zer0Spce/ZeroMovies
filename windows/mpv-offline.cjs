'use strict';
const fs=require('node:fs');
const path=require('node:path');
const {spawn}=require('node:child_process');

function bundledMpv(app){
  return app.isPackaged
    ? path.join(process.resourcesPath,'mpv','mpv.exe')
    : path.join(__dirname,'vendor','mpv','mpv.exe');
}

function cleanTitle(value){
  return String(value||'Downloaded video').replace(/[\r\n\t]+/g,' ').trim().slice(0,160)||'Downloaded video';
}

class MpvOfflinePlayer{
  constructor(app,mainWindow){
    this.app=app;
    this.mainWindow=mainWindow;
    this.process=null;
    this.file=null;
  }

  available(){return fs.existsSync(bundledMpv(this.app));}

  close(){
    const child=this.process;
    this.process=null;
    this.file=null;
    if(child&&!child.killed){
      try{child.kill();}catch{}
    }
  }

  open({file,title,subtitleRoot}){
    const resolved=path.resolve(file);
    if(!fs.existsSync(resolved))throw Error('Downloaded video is missing.');
    const exe=bundledMpv(this.app);
    if(!fs.existsSync(exe))throw Error('Bundled ZeroPlay offline playback engine is missing.');
    this.close();

    const displayTitle='ZeroPlay Offline — '+cleanTitle(title||path.basename(resolved));
    const subtitleDir=subtitleRoot&&fs.existsSync(subtitleRoot)?path.resolve(subtitleRoot):path.dirname(resolved);
    const args=[
      resolved,
      '--force-window=yes',
      '--keep-open=yes',
      '--osc=yes',
      '--input-default-bindings=yes',
      '--input-cursor=yes',
      '--border=yes',
      '--hwdec=auto-safe',
      '--vo=gpu-next',
      '--gpu-api=d3d11',
      '--video-sync=display-resample',
      '--audio-client-name=ZeroPlay',
      '--title='+displayTitle,
      '--autofit-larger=90%x90%',
      '--sub-auto=fuzzy',
      '--slang=en,eng,fil,tl',
      '--sub-file-paths='+subtitleDir,
      '--osd-on-seek=msg-bar',
      '--osd-duration=1800',
      '--no-terminal'
    ];

    const child=spawn(exe,args,{cwd:path.dirname(exe),windowsHide:false,stdio:'ignore'});
    this.process=child;
    this.file=resolved;

    child.once('error',error=>{
      if(this.process===child){this.process=null;this.file=null;}
      if(this.mainWindow&&!this.mainWindow.isDestroyed()){
        this.mainWindow.setTitle('ZeroPlay');
        this.mainWindow.webContents.send('offline-mpv-error',error?.message||'Could not start offline playback engine.');
        this.mainWindow.show();
        this.mainWindow.focus();
      }
    });
    child.once('exit',()=>{
      if(this.process!==child)return;
      this.process=null;
      this.file=null;
      if(this.mainWindow&&!this.mainWindow.isDestroyed()){
        this.mainWindow.setTitle('ZeroPlay');
        this.mainWindow.show();
        this.mainWindow.focus();
      }
    });

    if(this.mainWindow&&!this.mainWindow.isDestroyed())this.mainWindow.setTitle(displayTitle);
    return {engine:'mpv',file:resolved};
  }
}

module.exports={MpvOfflinePlayer,bundledMpv};
