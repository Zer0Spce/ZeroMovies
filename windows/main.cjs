const {app,BrowserWindow,ipcMain,session,shell,safeStorage,Menu}=require('electron');
const fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
const core=require('./core.cjs'),{Worker}=require('node:worker_threads');
let config={};try{config=require('./generated-config.json');}catch{}
let main,player,current,scanTimer,qrWorker,scanning=false,state,file,guard,lastProgress=0;
const uiURL=pathToFileURL(path.join(__dirname,'ui/index.html')).href;
const smoke=process.argv.includes('--smoke-test');
const defaults=()=>({favorites:[],planned:[],history:[],positions:{},searches:[],collections:{},settings:{region:'PH',gain:1},customKey:''});
function persist(){const temp=file+'.tmp';fs.writeFileSync(temp,JSON.stringify(state));fs.renameSync(temp,file);}
function key(){if(state.customKey&&safeStorage.isEncryptionAvailable())try{return safeStorage.decryptString(Buffer.from(state.customKey,'base64'));}catch{}return config.tmdbKey||process.env.TMDB_API_KEY||'';}
function snapshot(){const {customKey,...publicState}=state;return {...publicState,hasKey:!!key(),version:app.getVersion()};}
function trusted(event){if(event.sender!==main?.webContents||event.senderFrame?.url!==uiURL)throw Error('Untrusted request');}
function playerOrigin(url){try{return new URL(url).origin==='https://vidstuck.xyz';}catch{return false;}}
async function api(route,params={}){
  if(!core.endpoint(route))throw Error('Unsupported catalog request');
  if(!key())throw Error('Add your TMDB API key in Settings.');
  const url=new URL('https://api.themoviedb.org/3'+route);url.searchParams.set('api_key',key());url.searchParams.set('include_adult','false');
  const allowed=new Set(['query','page','append_to_response','watch_region','with_watch_providers','with_watch_monetization_types','sort_by']);
  for(const [name,value]of Object.entries(params||{}))if(allowed.has(name)&&typeof value!=='object'&&String(value).length<=300)url.searchParams.set(name,String(value));
  const response=await fetch(url,{signal:AbortSignal.timeout(15000)});
  if(!response.ok)throw Error(response.status===401?'TMDB key rejected. Check Settings.':'TMDB is unavailable. Try again.');return response.json();
}
function refresh(){if(main&&!main.isDestroyed())main.webContents.send('refresh');}
function installPlayerScripts(contents){
  try{contents.debugger.attach('1.3');contents.debugger.sendCommand('Page.enable').then(()=>contents.debugger.sendCommand('Page.addScriptToEvaluateOnNewDocument',{source:guard})).catch(()=>{});}catch{}
  const inject=()=>{for(const frame of contents.mainFrame.framesInSubtree)frame.executeJavaScript(guard).catch(()=>{});};
  contents.on('dom-ready',inject);contents.on('did-frame-finish-load',inject);
}
async function scanAd(){
  if(scanning||!player||player.isDestroyed()||!player.isVisible()||player.isMinimized())return;
  scanning=true;
  try{
    const image=(await player.webContents.capturePage()).resize({width:720});const size=image.getSize(),raw=image.toBitmap();
    if(!qrWorker){scanning=false;return;}
    const copy=Uint8Array.from(raw);qrWorker.postMessage({raw:copy,width:size.width,height:size.height},[copy.buffer]);
  }catch{scanning=false;}
}
async function openPlayer(value,selected){
  value=core.cleanItem(value);const saved=state.positions[core.key(value)];let position=selected?core.episode(selected):saved||{};
  if(selected&&saved&&saved.season===position.season&&saved.episode===position.episode)position=saved;
  if(player&&!player.isDestroyed())player.close();
  current=value;core.record(state,value,position);persist();refresh();
  guard='window.__zeroTv=true;window.__zeroBlockAds=true;window.__zeroGain='+state.settings.gain+';'+fs.readFileSync(path.join(__dirname,'assets/player-guard.js'),'utf8')+"\nif(!window.__zeroDesktopMouse){window.__zeroDesktopMouse=true;let last=0;document.addEventListener('mousemove',()=>{if(Date.now()-last<350)return;last=Date.now();if(window.__zeroRemoteActivity)window.__zeroRemoteActivity();});}";
  player=new BrowserWindow({width:1280,height:760,minWidth:640,minHeight:360,title:value.title+' — ZeroStreams',backgroundColor:'#000000',icon:path.join(__dirname,'assets/icon.png'),autoHideMenuBar:true,webPreferences:{partition:'persist:player',preload:path.join(__dirname,'player-preload.cjs'),contextIsolation:true,sandbox:true,nodeIntegration:false,webSecurity:true}});
  const window=player;installPlayerScripts(window.webContents);
  qrWorker=new Worker(path.join(__dirname,'qr-worker.cjs'));scanning=false;
  qrWorker.on('message',confirmed=>{scanning=false;if(confirmed&&!window.isDestroyed())for(const frame of window.webContents.mainFrame.framesInSubtree)frame.executeJavaScript('if(window.__zeroDismissQrAd)window.__zeroDismissQrAd();').catch(()=>{});});
  qrWorker.on('error',()=>{scanning=false;});
  window.webContents.setWindowOpenHandler(()=>({action:'deny'}));
  const check=(event,url)=>{if(!playerOrigin(url))event.preventDefault();};window.webContents.on('will-navigate',check);window.webContents.on('will-redirect',check);
  let backPending=false;
  window.webContents.on('before-input-event',async(event,input)=>{
    if(input.type!=='keyDown')return;
    if(input.key==='F11'){event.preventDefault();window.setFullScreen(!window.isFullScreen());return;}
    if(input.key==='Escape'||input.key==='BrowserBack'){
      event.preventDefault();if(backPending)return;backPending=true;
      try{const handled=await window.webContents.executeJavaScript("new Promise(resolve=>{if(!window.__zeroBackRequest){resolve(true);return;}window.__zeroBackRequest(1);let tries=0;const poll=setInterval(()=>{if(window.__zeroBackResult){clearInterval(poll);resolve(window.__zeroBackResult.handled);}else if(++tries>15){clearInterval(poll);resolve(true);}},100);})");if(!handled&&!window.isDestroyed())window.close();}catch{}finally{backPending=false;}
    }
  });
  window.on('closed',()=>{if(player===window){player=null;current=null;clearInterval(scanTimer);if(qrWorker)qrWorker.terminate();qrWorker=null;scanning=false;refresh();}});
  scanTimer=setInterval(scanAd,3500);await window.loadURL(core.playerUrl(value,position));window.maximize();
}
app.whenReady().then(async()=>{
  app.setAppUserModelId('com.zerostreams.windows');Menu.setApplicationMenu(null);
  file=path.join(app.getPath('userData'),smoke?'smoke-state.json':'library.json');state=defaults();
  try{const saved=JSON.parse(fs.readFileSync(file,'utf8'));state={...state,...saved,settings:{...state.settings,...saved.settings}};}catch{}
  for(const name of ['favorites','planned','history','searches'])if(!Array.isArray(state[name]))state[name]=[];
  state.history=state.history.slice(0,100);state.searches=state.searches.slice(0,30);
  for(const name of ['positions','collections'])if(!state[name]||typeof state[name]!=='object'||Array.isArray(state[name]))state[name]={};
  const playerSession=session.fromPartition('persist:player');
  playerSession.setPermissionRequestHandler((_contents,_permission,callback)=>callback(false));playerSession.setPermissionCheckHandler(()=>false);
  playerSession.webRequest.onBeforeRequest((details,callback)=>{let cancel=false;try{cancel=core.blocked(new URL(details.url).hostname);}catch{}callback({cancel});});
  playerSession.on('will-download',event=>event.preventDefault());
  ipcMain.handle('api',(event,route,params)=>{trusted(event);return api(route,params);});
  ipcMain.handle('state',event=>{trusted(event);return snapshot();});
  ipcMain.handle('external',(event,url)=>{trusted(event);const u=new URL(url);if(u.protocol!=='https:'||!['www.youtube.com','www.themoviedb.org'].includes(u.hostname))throw Error('Unsupported link');return shell.openExternal(u.href);});
  ipcMain.handle('play',async(event,value,ep)=>{trusted(event);await openPlayer(value,ep);return true;});
  ipcMain.handle('change',(event,action,value)=>{
    trusted(event);
    if(['favorites','planned'].includes(action)){value=core.cleanItem(value);const exists=state[action].some(row=>core.key(row)===core.key(value));state[action]=exists?state[action].filter(row=>core.key(row)!==core.key(value)):[value,...state[action]].slice(0,300);}
    else if(action==='search'){const query=String(value||'').trim().slice(0,200);if(query)state.searches=[query,...state.searches.filter(x=>x.toLowerCase()!==query.toLowerCase())].slice(0,30);}
    else if(action==='clear-searches')state.searches=[];
    else if(action==='remove-search')state.searches=state.searches.filter(x=>x!==String(value));
    else if(action==='clear-history'){state.history=[];state.positions={};}
    else if(action==='remove-history')state.history=state.history.filter(row=>row.historyKey!==String(value));
    else if(action==='collection'){
      const name=String(value?.name||'').trim().slice(0,60);if(!name||['__proto__','constructor','prototype'].includes(name))throw Error('Invalid collection name');
      const title=core.cleanItem(value.item),rows=state.collections[name]||[];if(!Array.isArray(rows))throw Error('Invalid collection');state.collections[name]=rows.some(row=>core.key(row)===core.key(title))?rows.filter(row=>core.key(row)!==core.key(title)):[title,...rows].slice(0,300);
    }else if(action==='settings'){
      if(!value||!['PH','US','GB','CA','AU','IN','JP'].includes(value.region)||![1,1.5,2].includes(Number(value.gain)))throw Error('Invalid settings');state.settings={region:value.region,gain:Number(value.gain)};
      if(value.key===null)state.customKey='';else if(value.key){if(!/^[a-f\d]{32}$/i.test(value.key))throw Error('Enter a valid TMDB v3 API key');if(!safeStorage.isEncryptionAvailable())throw Error('Windows credential encryption unavailable');state.customKey=safeStorage.encryptString(value.key).toString('base64');}
    }else throw Error('Unsupported library action');
    persist();return snapshot();
  });
  ipcMain.on('progress',(event,data)=>{
    if(event.sender!==player?.webContents||!playerOrigin(event.senderFrame?.url)||!current||Date.now()-lastProgress<2500)return;
    const position=core.progress(data,current);if(!position)return;lastProgress=Date.now();core.record(state,current,position);persist();
  });
  main=new BrowserWindow({width:1440,height:920,minWidth:900,minHeight:620,title:'ZeroStreams',backgroundColor:'#090a10',icon:path.join(__dirname,'assets/icon.png'),show:false,autoHideMenuBar:true,webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,sandbox:true,nodeIntegration:false,webSecurity:true}});
  main.webContents.setWindowOpenHandler(()=>({action:'deny'}));main.webContents.on('will-navigate',event=>event.preventDefault());main.webContents.on('will-attach-webview',event=>event.preventDefault());
  main.once('ready-to-show',()=>main.show());main.on('closed',()=>{if(player&&!player.isDestroyed())player.close();});await main.loadFile(path.join(__dirname,'ui/index.html'));
  if(smoke){try{await new Promise(r=>setTimeout(r,2500));const result=await main.webContents.executeJavaScript("({bridge:typeof window.zero?.api,brand:document.querySelector('.brand')?.textContent,tabs:Array.from(document.querySelectorAll('[data-nav]')).map(x=>x.dataset.nav)})");if(result.bridge!=='function'||!result.brand.includes('ZERO')||result.tabs.includes('Live')||result.tabs.includes('Manga'))throw Error('Desktop UI smoke failed');fs.mkdirSync('dist',{recursive:true});fs.writeFileSync('dist/desktop-preview.png',(await main.webContents.capturePage()).toPNG());console.log('Desktop sandbox bridge and UI smoke checks passed');app.exit(0);}catch(error){console.error(error);app.exit(1);}}
});
app.on('window-all-closed',()=>app.quit());
