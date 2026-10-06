const {app,BrowserWindow,WebContentsView,screen,ipcMain,session,shell,safeStorage,Menu,dialog}=require('electron');
const fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
const {PlayerHost}=require('./player-host.cjs');
const playlists=require('./playlist.cjs');let playlistStore,liveSelection;const sportsModule=require('./sports.cjs');let sportsStore,sportsSelection,sportsHtmlServer;

const liveURL=pathToFileURL(path.join(__dirname,'ui/live-player.html')).href;
const sources=require('./playback-sources.cjs');
const core=require('./core.cjs'),{Worker}=require('node:worker_threads');
let config={};try{config=require('./generated-config.json');}catch{}
let sportsSession;
let main,player,toolbar,playerHost,current,scanTimer,cursorTimer,qrWorker,scanning=false,state,file,guard,lastProgress=0;
const uiURL=pathToFileURL(path.join(__dirname,'ui/index.html')).href;
const toolsURL=pathToFileURL(path.join(__dirname,'ui/player-tools.html')).href;
const smoke=process.argv.includes('--smoke-test');
const {cleanLegacySportsCache}=require('./sports-cache.cjs');
const dataRoot=require('./data-directory.cjs').dataDirectory(app.getPath('appData'));fs.mkdirSync(dataRoot,{recursive:true});app.setPath('userData',dataRoot);const sportsCacheFailures=cleanLegacySportsCache(dataRoot);
const homePanelIds=['clock','featured','continue','watchlist','upcoming','providers','recommended','trending','popular','series','now','action','comedy','horror','animation','anime','adventure','crime','documentary','drama','family','fantasy','history','music','mystery','romance','scifi','thriller','war','western','tvmovie'];
const channelKey=(section,c)=>require('node:crypto').createHash('sha256').update(section+'|'+c.name+'|'+c.group).digest('hex');
const defaults=()=>({liveFavorites:[],favorites:[],planned:[],history:[],positions:{},searches:[],collections:{},settings:{region:'PH',gain:1,theme:'dark',source:'vidstuck',homePanels:homePanelIds.slice(0,11)},customKey:''});
function persist(){const temp=file+'.tmp';fs.writeFileSync(temp,JSON.stringify(state));fs.renameSync(temp,file);}
function key(){if(state.customKey&&safeStorage.isEncryptionAvailable())try{return safeStorage.decryptString(Buffer.from(state.customKey,'base64'));}catch{}return config.tmdbKey||process.env.TMDB_API_KEY||'';}
function snapshot(){const {customKey,...publicState}=state;return {...publicState,hasKey:!!key(),version:app.getVersion()};}
function trusted(event){if(event.sender!==main?.webContents||event.senderFrame?.url!==uiURL)throw Error('Untrusted request');}
function playerOrigin(url){return sources.trusted(url);}
async function api(route,params={}){
  if(!core.endpoint(route))throw Error('Unsupported catalog request');
  if(!key())throw Error('Add your TMDB API key in Settings.');
  const url=new URL('https://api.themoviedb.org/3'+route);url.searchParams.set('api_key',key());url.searchParams.set('include_adult','false');
  const allowed=new Set(['query','page','append_to_response','watch_region','with_watch_providers','with_watch_monetization_types','sort_by','with_genres','with_original_language','include_video','primary_release_date.lte','vote_count.gte']);
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
  if(scanning||!player||player.webContents.isDestroyed()||!main.isVisible()||main.isMinimized())return;
  scanning=true;
  try{
    const image=(await player.webContents.capturePage()).resize({width:1280});const size=image.getSize(),raw=image.toBitmap();
    if(!qrWorker){scanning=false;return;}
    const copy=Uint8Array.from(raw);qrWorker.postMessage({raw:copy,width:size.width,height:size.height},[copy.buffer]);
  }catch{scanning=false;}
}
function closePlayer(){
  if(!player)return;const host=playerHost;player=null;toolbar=null;playerHost=null;current=null;liveSelection=null;sportsSelection=null;sportsHtmlServer?.close();sportsHtmlServer=null;
  const endedSession=sportsSession;sportsSession=null;if(endedSession)Promise.allSettled([endedSession.clearCache(),endedSession.clearStorageData()]).catch(()=>{});
  clearInterval(scanTimer);clearInterval(cursorTimer);if(qrWorker)qrWorker.terminate();qrWorker=null;scanning=false;host.close();
  if(main&&!main.isDestroyed()){main.setTitle('ZeroPlay');main.webContents.focus();refresh();}
}
async function openPlayer(value,selected,fixture,prepare=false){
  value=core.cleanItem(value);const saved=state.positions[core.key(value)];let position=selected?core.episode(selected):saved||{};
  if(selected&&saved&&saved.season===position.season&&saved.episode===position.episode)position=saved;
  closePlayer();
  current=value;core.record(state,value,position);persist();refresh();
  guard='window.__zeroTv=false;window.__zeroBlockAds=true;window.__zeroGain='+state.settings.gain+';'+fs.readFileSync(path.join(__dirname,'assets/player-guard.js'),'utf8')+'\n'+fs.readFileSync(path.join(__dirname,'assets/player-exit.js'),'utf8')+"\nif(!window.__zeroDesktopMouse){window.__zeroDesktopMouse=true;let last=0;document.addEventListener('mousemove',()=>{if(Date.now()-last<350)return;last=Date.now();if(window.__zeroRemoteActivity)window.__zeroRemoteActivity();});}";
  player=new WebContentsView({webPreferences:{partition:'persist:player',preload:path.join(__dirname,'player-preload.cjs'),contextIsolation:true,sandbox:true,nodeIntegration:false,webSecurity:true}});
  toolbar=new WebContentsView({webPreferences:{preload:path.join(__dirname,'player-tools.cjs'),contextIsolation:true,sandbox:true,nodeIntegration:false,webSecurity:true}});
  player.setBackgroundColor('#000000');toolbar.setBackgroundColor('#101621');
  const view=player,contents=view.webContents;
  playerHost=new PlayerHost(main,view,toolbar);installPlayerScripts(contents);
  toolbar.webContents.setWindowOpenHandler(()=>({action:'deny'}));toolbar.webContents.on('will-navigate',event=>event.preventDefault());
  await toolbar.webContents.loadFile(path.join(__dirname,'ui/player-tools.html'));toolbar.webContents.send('player-title',value.title);
  main.setTitle(value.title+' — ZeroPlay');
  qrWorker=new Worker(path.join(__dirname,'qr-worker.cjs'));scanning=false;
  qrWorker.on('message',confirmed=>{scanning=false;if(confirmed&&!contents.isDestroyed())for(const frame of contents.mainFrame.framesInSubtree)frame.executeJavaScript('if(window.__zeroDismissQrAd)window.__zeroDismissQrAd();').catch(()=>{});});
  qrWorker.on('error',()=>{scanning=false;});
  contents.setWindowOpenHandler(()=>({action:'deny'}));
  const check=(event,url)=>{if(!playerOrigin(url))event.preventDefault();};contents.on('will-navigate',(event,url)=>{check(event,url);try{const u=new URL(url);if(['vidstuck.xyz','vidsrc.to','vidsrc.sh'].includes(u.hostname)&&!u.pathname.startsWith('/embed/')){event.preventDefault();if(player===view)closePlayer();}}catch{}});contents.on('will-redirect',check);
  let controlsDismissed=false;
  contents.on('before-input-event',async(event,input)=>{
    if(input.type!=='keyDown'||player!==view)return;
    if(input.key==='F11'){event.preventDefault();await playerHost.toggleFullscreen();return;}
    if(input.key==='Escape'||input.key==='BrowserBack'){
      event.preventDefault();if(input.isAutoRepeat)return;
      if(controlsDismissed){closePlayer();return;}controlsDismissed=true;
      playerHost.toolbarVisible=false;playerHost.layout();
      if(main.isFullScreen()||playerHost.htmlFullscreen)await playerHost.exitFullscreen();
      if(player===view)contents.executeJavaScript('if(window.__zeroBackRequest)window.__zeroBackRequest(1);').catch(()=>{});
      return;
    }
    controlsDismissed=false;playerHost?.activity();
  });
  contents.on('render-process-gone',()=>{if(player===view)closePlayer();});
  cursorTimer=setInterval(()=>{if(!playerHost||main.isDestroyed()||!main.isFocused())return;const cursor=screen.getCursorScreenPoint(),bounds=main.getContentBounds();if(cursor.x>=bounds.x&&cursor.x<bounds.x+bounds.width&&cursor.y>=bounds.y&&cursor.y<bounds.y+12)playerHost.activity();},200);
  scanTimer=setInterval(scanAd,3500);
  try{if(fixture&&smoke)await contents.loadFile(fixture);else await contents.loadURL(core.playerUrl(value,position,state.settings.source));contents.focus();}catch(error){if(player===view)closePlayer();throw error;}

}
async function openSports(id,index){
 const event=sportsStore.select(id,index);closePlayer();sportsSelection={id,index};const isolated=session.fromPartition('live-sports-'+require('node:crypto').randomUUID(),{cache:false});sportsSession=isolated;
 // Keep sports isolated while applying the same ad filtering as movie playback.
 isolated.webRequest.onBeforeRequest((details,callback)=>{let cancel=false;try{cancel=core.blocked(new URL(details.url).hostname);}catch{}callback({cancel});});
 isolated.on('will-download',event=>event.preventDefault());
 isolated.setPermissionRequestHandler((contents,permission,callback)=>callback(permission==='fullscreen'&&contents===player?.webContents));
 isolated.setPermissionCheckHandler((contents,permission)=>permission==='fullscreen'&&contents===player?.webContents);
 player=new WebContentsView({webPreferences:{session:isolated,preload:path.join(__dirname,'sports-preload.cjs'),contextIsolation:true,sandbox:true,nodeIntegration:false,webSecurity:true}});
 toolbar=new WebContentsView({webPreferences:{preload:path.join(__dirname,'player-tools.cjs'),contextIsolation:true,sandbox:true,nodeIntegration:false,webSecurity:true}});
 const view=player,contents=view.webContents;view.setBackgroundColor('#000000');playerHost=new PlayerHost(main,view,toolbar,{bottom:true});
 guard='window.__zeroTv=false;window.__zeroBlockAds=true;window.__zeroGain=1;'+fs.readFileSync(path.join(__dirname,'assets/player-guard.js'),'utf8');installPlayerScripts(contents);
 qrWorker=new Worker(path.join(__dirname,'qr-worker.cjs'));qrWorker.on('message',confirmed=>{scanning=false;if(confirmed&&!contents.isDestroyed())for(const frame of contents.mainFrame.framesInSubtree)frame.executeJavaScript('if(window.__zeroDismissQrAd)window.__zeroDismissQrAd();').catch(()=>{});});qrWorker.on('error',()=>{scanning=false;});scanTimer=setInterval(scanAd,3500);
 const stopAdNavigation=(event,url)=>{try{const u=new URL(url);if(!['http:','https:'].includes(u.protocol)||core.blocked(u.hostname))event.preventDefault();}catch{event.preventDefault();}};contents.on('will-navigate',stopAdNavigation);contents.on('will-redirect',stopAdNavigation);
 toolbar.webContents.setWindowOpenHandler(()=>({action:'deny'}));toolbar.webContents.on('will-navigate',event=>event.preventDefault());await toolbar.webContents.loadFile(path.join(__dirname,'ui/player-tools.html'));
 toolbar.webContents.send('sports-mode',{sources:event.sources.map(s=>s.label),index});const update=text=>{if(player===view&&!toolbar.webContents.isDestroyed())toolbar.webContents.send('player-title',event.title+' · '+text);};update('Loading player…');
 contents.setWindowOpenHandler(()=>({action:'deny'}));
 contents.on('did-finish-load',()=>update(event.source.label));contents.on('did-fail-load',(_e,code)=>{if(code!==-3)update('Player unavailable · Retry or choose another source');});contents.on('render-process-gone',()=>update('Player stopped · Retry'));
 contents.on('before-input-event',async(e,input)=>{if(input.type!=='keyDown'||input.isAutoRepeat)return;if(input.key==='F11'){e.preventDefault();await playerHost.toggleFullscreen();}if(input.key==='Escape'||input.key==='BrowserBack'){e.preventDefault();if(main.isFullScreen()||playerHost.htmlFullscreen)await playerHost.exitFullscreen();else if(contents.canGoBack())contents.goBack();else closePlayer();}});
 main.setTitle(event.title+' — Live Sports — ZeroPlay');try{if(event.source.embed.url)await contents.loadURL(event.source.embed.url);else {const token=require('node:crypto').randomBytes(24).toString('hex');const html='<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><base href="'+event.base+'/"><style>html,body{margin:0;height:100%;background:black}iframe{width:100%;height:100%;border:0}</style>'+event.source.embed.html;sportsHtmlServer=require('node:http').createServer((req,res)=>{if(req.url!=='/'+token){res.writeHead(404).end();return;}res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});res.end(html);});await new Promise(resolve=>sportsHtmlServer.listen(0,'127.0.0.1',resolve));sportsHtmlServer.unref();await contents.loadURL('http://127.0.0.1:'+sportsHtmlServer.address().port+'/'+token);}contents.focus();}catch{update('Player unavailable · Retry or choose another source');}
}
function liveTrusted(event){if(event.sender!==player?.webContents||event.senderFrame?.url!==liveURL||!liveSelection)throw Error('Untrusted live control');}
function selectedLive(index){if(liveSelection?.channel.offline){if(index!==0)throw Error('Invalid download');return {...liveSelection.channel,clearKeys:{}};}if(!Number.isSafeInteger(index)||index<0)throw Error('Invalid channel');const channel=playlistStore.select(liveSelection.section,index);liveSelection.index=index;liveSelection.channel=channel;return {name:channel.name,url:channel.url,mime:channel.mime,clearKeys:channel.drmType?playlists.clearKeys(channel.drmKey):{}};}
async function openLive(section,index,offline){
  const channel=offline||playlistStore.select(section,index);closePlayer();liveSelection={section,index,channel};
  const partition='live-'+Date.now();const liveSession=session.fromPartition(partition);
  if(channel.offline)liveSession.webRequest.onBeforeRequest((details,callback)=>callback({cancel:!details.url.startsWith('file:')&&!details.url.startsWith('http://127.0.0.1:')}));
  liveSession.setPermissionRequestHandler((c,p,callback)=>callback(['fullscreen','mediaKeySystem'].includes(p)&&c===player?.webContents&&c.getURL()===liveURL));
  liveSession.setPermissionCheckHandler((c,p)=>['fullscreen','mediaKeySystem'].includes(p)&&c===player?.webContents&&c.getURL()===liveURL);
  // Only the isolated local live player receives playlist stream headers and CORS responses.
  liveSession.webRequest.onBeforeSendHeaders({urls:['http://*/*','https://*/*']},(details,callback)=>{const h=details.requestHeaders;for(const [name,value]of Object.entries(liveSelection?.channel.headers||{})){for(const old of Object.keys(h))if(old.toLowerCase()===name.toLowerCase())delete h[old];h[name]=value;}callback({requestHeaders:h});});
  liveSession.webRequest.onHeadersReceived({urls:['http://*/*','https://*/*']},(details,callback)=>{const h=details.responseHeaders||{};for(const name of Object.keys(h))if(name.toLowerCase().startsWith('access-control-'))delete h[name];h['Access-Control-Allow-Origin']=['*'];h['Access-Control-Allow-Headers']=['*'];h['Access-Control-Allow-Methods']=['GET,HEAD,OPTIONS'];callback({responseHeaders:h});});
  player=new WebContentsView({webPreferences:{partition,preload:path.join(__dirname,'live-preload.cjs'),contextIsolation:true,sandbox:true,nodeIntegration:false,webSecurity:true}});
  toolbar=new WebContentsView({webPreferences:{preload:path.join(__dirname,'player-tools.cjs'),contextIsolation:true,sandbox:true,nodeIntegration:false,webSecurity:true}});
  const view=player;playerHost=new PlayerHost(main,view,toolbar);view.setBackgroundColor('#000');toolbar.setBackgroundColor('#101621');
  for(const contents of [view.webContents,toolbar.webContents]){contents.setWindowOpenHandler(()=>({action:'deny'}));contents.on('will-navigate',event=>event.preventDefault());}
  view.webContents.on('render-process-gone',()=>{if(player===view)closePlayer();});
  await toolbar.webContents.loadFile(path.join(__dirname,'ui/player-tools.html'));toolbar.webContents.send('player-title',channel.name);main.setTitle(channel.name+' — ZeroPlay Live');
  try{await view.webContents.loadFile(path.join(__dirname,'ui/live-player.html'));view.webContents.focus();}catch(error){if(player===view)closePlayer();throw error;}
}
app.whenReady().then(async()=>{
  app.setAppUserModelId('com.zerostreams.windows');Menu.setApplicationMenu(null);
  file=path.join(app.getPath('userData'),smoke?'smoke-state.json':'library.json');state=defaults();
  try{const saved=JSON.parse(fs.readFileSync(file,'utf8'));state={...state,...saved,settings:{...state.settings,...saved.settings}};}catch{}
  for(const name of ['favorites','planned','history','searches'])if(!Array.isArray(state[name]))state[name]=[];
  state.history=state.history.slice(0,100);state.searches=state.searches.slice(0,30);
  for(const name of ['positions','collections'])if(!state[name]||typeof state[name]!=='object'||Array.isArray(state[name]))state[name]={};
  const playerSession=session.fromPartition('persist:player');
  playerSession.setPermissionRequestHandler((contents,permission,callback)=>callback(permission==='fullscreen'&&contents===player?.webContents));playerSession.setPermissionCheckHandler((contents,permission)=>permission==='fullscreen'&&contents===player?.webContents);
  playerSession.webRequest.onBeforeRequest((details,callback)=>{let cancel=false;try{cancel=core.blocked(new URL(details.url).hostname);}catch{}callback({cancel});});
  playerSession.on('will-download',event=>event.preventDefault());
  playlistStore=playlists.createStore(path.join(dataRoot,smoke?'smoke-playlists':'playlists'),smoke?async()=>new Response('#EXTM3U\n#EXTINF:-1 group-title="Sports",Live smoke channel\nhttps://example.com/zero-smoke.m3u8'):fetch);
  sportsStore=sportsModule.createStore(path.join(dataRoot,'sports-catalogue.json'));
  ipcMain.handle('sports',async(event,force)=>{trusted(event);const snapshot=await sportsStore.get(force===true);return {...snapshot,categories:snapshot.categories.map(c=>({...c,events:c.events.map(e=>({...e,sources:e.sources.map(s=>({label:s.label}))}))}))};});
  ipcMain.on('sports-activity',event=>{if(sportsSelection&&event.sender===player?.webContents)playerHost?.activity();});
  ipcMain.handle('sports-play',(event,id,index)=>{trusted(event);return openSports(id,index);});
  ipcMain.handle('playlist',async(event,section,force)=>{trusted(event);const snapshot=await playlistStore.get(section,force===true);return {...snapshot,channels:snapshot.channels.map((c,index)=>({index,name:c.name,group:c.group,logo:c.logo,favorite:(state.liveFavorites||[]).includes(channelKey(section,c))}))};});
  ipcMain.handle('live-play',async(event,section,index)=>{trusted(event);await openLive(section,index);return true;});
  ipcMain.handle('channel-favorite',(event,section,index)=>{trusted(event);const id=channelKey(section,playlistStore.select(section,index));const saved=new Set(state.liveFavorites||[]);if(!saved.add(id)|| (state.liveFavorites||[]).includes(id))saved.delete(id);state.liveFavorites=[...saved];persist();return saved.has(id);});
  ipcMain.handle('live-context',event=>{liveTrusted(event);return {offline:!!liveSelection.channel.offline,index:liveSelection.index,names:liveSelection.channel.offline?[liveSelection.channel.name]:playlistStore.get?Array.from({length:3000},(_,i)=>{try{return playlistStore.select(liveSelection.section,i).name;}catch{return null;}}).filter(Boolean):[]};});
  ipcMain.handle('live-select',(event,index)=>{liveTrusted(event);return selectedLive(index);});
  ipcMain.handle('live-close',event=>{liveTrusted(event);closePlayer();return true;});
  ipcMain.handle('live-fullscreen',event=>{liveTrusted(event);return playerHost.toggleFullscreen();});
  const surprises=require('./discovery.cjs').createSurprise(api,core.item);
  ipcMain.handle('surprise',event=>{trusted(event);return surprises();});
  ipcMain.handle('api',(event,route,params)=>{trusted(event);return api(route,params);});
  ipcMain.handle('player-close',event=>{if(event.sender!==toolbar?.webContents||event.senderFrame?.url!==toolsURL)throw Error('Untrusted player control');closePlayer();return true;});
  ipcMain.handle('sports-control',(event,action,index)=>{if(event.sender!==toolbar?.webContents||event.senderFrame?.url!==toolsURL||!sportsSelection)throw Error('Untrusted sports control');if(action==='retry'||action==='source')return openSports(sportsSelection.id,action==='source'?index:sportsSelection.index);throw Error('Unsupported sports control');});
  ipcMain.handle('player-fullscreen',event=>{if(event.sender!==toolbar?.webContents||event.senderFrame?.url!==toolsURL)throw Error('Untrusted player control');return playerHost.toggleFullscreen();});
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
      if(!value||!['PH','US','GB','CA','AU','IN','JP'].includes(value.region)||![1,1.5,2].includes(Number(value.gain)))throw Error('Invalid settings');if(!['dark','light'].includes(value.theme)||!sources.sources.some(s=>s.id===value.source))throw Error('Invalid appearance or playback source');state.settings={region:value.region,gain:Number(value.gain),theme:value.theme,source:value.source,homePanels:Array.isArray(value.homePanels)?homePanelIds.filter(id=>value.homePanels.includes(id)):(state.settings.homePanels||homePanelIds.slice(0,11))};
      if(value.key===null)state.customKey='';else if(value.key){if(!/^[a-f\d]{32}$/i.test(value.key))throw Error('Enter a valid TMDB v3 API key');if(!safeStorage.isEncryptionAvailable())throw Error('Windows credential encryption unavailable');state.customKey=safeStorage.encryptString(value.key).toString('base64');}
    }else throw Error('Unsupported library action');
    persist();return snapshot();
  });
  ipcMain.on('embedded-player-exit',event=>{if(event.sender===player?.webContents&&event.senderFrame===player.webContents.mainFrame&&playerOrigin(event.senderFrame.url))closePlayer();});
  ipcMain.on('progress',(event,data)=>{
    if(event.sender!==player?.webContents||!playerOrigin(event.senderFrame?.url)||!current||Date.now()-lastProgress<2500)return;
    const position=core.progress(sources.normalize(data),current);if(!position)return;lastProgress=Date.now();core.record(state,current,position);persist();
  });
  main=new BrowserWindow({width:1440,height:920,minWidth:900,minHeight:620,title:'ZeroPlay',backgroundColor:'#090a10',icon:path.join(__dirname,'assets/icon.png'),show:false,autoHideMenuBar:true,webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,sandbox:true,nodeIntegration:false,webSecurity:true}});
  main.webContents.setWindowOpenHandler(()=>({action:'deny'}));main.webContents.on('will-navigate',event=>event.preventDefault());main.webContents.on('will-attach-webview',event=>event.preventDefault());
  main.once('ready-to-show',()=>{main.show();if(sportsCacheFailures.length&&!smoke)dialog.showMessageBox(main,{type:'warning',title:'Old Live Sports cache',message:'Some retired sports cache files could not be removed. Keep Microsoft Defender enabled and remove or quarantine any detected item in Protection History. The new sports player uses a memory-only browser session.'});});main.on('closed',closePlayer);await main.loadFile(path.join(__dirname,'ui/index.html'));
  if(smoke){try{await new Promise(r=>setTimeout(r,2500));const result=await main.webContents.executeJavaScript("({bridge:typeof window.zero?.api,brand:document.querySelector('.brand')?.textContent,tabs:Array.from(document.querySelectorAll('[data-nav]')).map(x=>x.dataset.nav)})");if(result.bridge!=='function'||!result.brand.includes('ZERO')||result.tabs.includes('Live')||result.tabs.includes('Manga'))throw Error('Desktop UI smoke failed');fs.mkdirSync('dist',{recursive:true});fs.writeFileSync('dist/desktop-preview.png',(await main.webContents.capturePage()).toPNG());for(const [section,name] of [['Categories','categories'],['Live Sports','sports']]){await main.webContents.executeJavaScript("document.querySelector('[data-nav=\""+section+"\"]').click()");await new Promise(r=>setTimeout(r,8000));fs.writeFileSync('dist/desktop-'+name+'.png',(await main.webContents.capturePage()).toPNG());}await main.webContents.executeJavaScript("document.querySelector('[data-action=\"settings\"]').click()");await new Promise(r=>setTimeout(r,500));fs.writeFileSync('dist/desktop-settings.png',(await main.webContents.capturePage()).toPNG());await main.webContents.executeJavaScript("document.querySelector('#home-panels').scrollIntoView({block:'center'})");await new Promise(r=>setTimeout(r,200));fs.writeFileSync('dist/desktop-home-panels.png',(await main.webContents.capturePage()).toPNG());await main.webContents.executeJavaScript("document.querySelector('[data-action=\"close-settings\"]').click();document.querySelector('[data-nav=\"Home\"]').click()");await new Promise(r=>setTimeout(r,1500));await main.webContents.executeJavaScript("document.querySelector('#query').value='preserved draft'");
await openPlayer({id:299534,type:'movie',title:'Fullscreen test'},undefined,path.join(__dirname,'test/fullscreen.html'));
if(BrowserWindow.getAllWindows().length!==1)throw Error('Playback created another window');
await player.webContents.executeJavaScript("document.querySelector('#go').click()",true);
for(let i=0;i<30&&!main.isFullScreen();i++)await new Promise(r=>setTimeout(r,100));
if(!main.isFullScreen()||!playerHost.htmlFullscreen)throw Error('Player HTML fullscreen did not fill the app window');
await playerHost.exitFullscreen();await new Promise(r=>setTimeout(r,300));
if(main.isFullScreen()||!player)throw Error('Fullscreen exit should retain playback');
await toolbar.webContents.executeJavaScript("document.querySelector('#back').click()");for(let i=0;i<30&&player;i++)await new Promise(r=>setTimeout(r,100));if(player)throw Error('Player toolbar Back did not return to browsing');if(await main.webContents.executeJavaScript("document.querySelector('#query').value")!=='preserved draft')throw Error('Browsing state lost after playback');
await playlistStore.get('LiveTV',true);await openLive('LiveTV',0);
for(let i=0;i<40;i++){const title=await player.webContents.executeJavaScript("document.querySelector('#title').textContent");if(title==='Live smoke channel')break;await new Promise(r=>setTimeout(r,100));}
if(await player.webContents.executeJavaScript("document.querySelector('#title').textContent")!=='Live smoke channel')throw Error('Live player did not receive its selected channel');
if(BrowserWindow.getAllWindows().length!==1)throw Error('Live playback opened another window');
await player.webContents.executeJavaScript("document.querySelector('#full').click()");for(let i=0;i<30&&!main.isFullScreen();i++)await new Promise(r=>setTimeout(r,100));if(!main.isFullScreen())throw Error('Live fullscreen failed');
await player.webContents.executeJavaScript("document.querySelector('#back').click()");for(let i=0;i<30&&player;i++)await new Promise(r=>setTimeout(r,100));if(player||main.isFullScreen())throw Error('Live Back did not restore browsing');
const fixture=await require('./scripts/live-playback-fixture.cjs').createFixture();
try{
  playlistStore=playlists.createStore(path.join(dataRoot,'media-smoke-'+Date.now()),async()=>new Response(fixture.body));await playlistStore.get('LiveTV',true);
  for(let index=0;index<3;index++){
    await openLive('LiveTV',index);
    await player.webContents.executeJavaScript("window.__zeroPlaybackError=0;player?.addEventListener('error',e=>window.__zeroPlaybackError=e.detail.code)");
    let playing=false,last;
    for(let i=0;i<120;i++){await new Promise(r=>setTimeout(r,200));last=await player.webContents.executeJavaScript("({time:video.currentTime,ready:video.readyState,error:video.error?.code||window.__zeroPlaybackError,status:document.querySelector('#status').textContent})");if(last.time>1.5&&last.ready>=2){playing=true;break;}if(last.error)break;}
    if(!playing)throw Error('Real media playback failed for fixture '+index+': '+JSON.stringify(last));
    if(await player.webContents.executeJavaScript("document.querySelector('#status').textContent.includes('unavailable')"))throw Error('Working playback incorrectly reported unavailable');
    const audio=await player.webContents.executeJavaScript("({tracks:player.getAudioTracks().length,disabled:document.querySelector('#audio').disabled})");if(audio.tracks<1||audio.disabled)throw Error('Audio track selector missing');
    await player.webContents.executeJavaScript("document.querySelector('#audio').dispatchEvent(new Event('change'))");
    console.log('Decoded video/audio advanced for fixture',index,'with audio-track selection');closePlayer();
  }
  const sportsData={success:true,streams:[{category:'Football',streams:[{id:'fixture',name:'Sports fixture',source_tag:'Main fixture',iframe:fixture.base+'/sports',substreams:[{source_tag:'Alternate fixture',iframe:'<iframe src="'+fixture.base+'/sports" allow="autoplay; fullscreen" allowfullscreen></iframe>'}]}]}]};
  sportsStore=sportsModule.createStore(path.join(dataRoot,'sports-smoke-'+Date.now()+'.json'),async url=>new Response(JSON.stringify(url.endsWith('/ping')?{success:true,domains:[]}:sportsData)));await sportsStore.get(true);
  for(let index=0;index<2;index++){await openSports('fixture',index);if(sportsSession.isPersistent())throw Error('Sports browser session must be memory-only');if(playerHost.bottom!==true)throw Error('Sports controls must be a bottom overlay');let decoded=false;for(let attempt=0;attempt<100&&!decoded;attempt++){for(const frame of player.webContents.mainFrame.framesInSubtree){const result=await frame.executeJavaScript("({time:document.querySelector('video')?.currentTime||0,ad:document.getElementById('provider-ad')?.style.display,guard:typeof window.__zeroBlockAds,integration:localStorage.getItem('sports-integration')})").catch(()=>null);if(result?.time>1){if(result.ad!=='none'||result.guard!=='boolean'||result.integration!=='kept')throw Error('Sports filtering or player integration failed');decoded=true;break;}}if(!decoded)await new Promise(r=>setTimeout(r,100));}if(!decoded)throw Error('Sports embedded video failed for source '+index);await toolbar.webContents.executeJavaScript("document.querySelector('#fullscreen').click()");for(let i=0;i<30&&!main.isFullScreen();i++)await new Promise(r=>setTimeout(r,100));if(!main.isFullScreen())throw Error('Sports fullscreen failed');closePlayer();if(main.isFullScreen())throw Error('Sports Back did not restore browsing');console.log('Sports URL/HTML source decoded with ad filtering and storage integration',index);}
}finally{closePlayer();await fixture.close();}
console.log('Single-window movie/live playback, actual fullscreen, Back and preserved browsing smoke checks passed');app.exit(0);}catch(error){console.error(error);app.exit(1);}}
});
app.on('window-all-closed',()=>app.quit());
