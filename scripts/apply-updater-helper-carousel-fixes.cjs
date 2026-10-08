'use strict';
const fs=require('fs');
function mustReplace(file,from,to,label){let s=fs.readFileSync(file,'utf8');if(!s.includes(from))throw new Error(`Missing ${label} in ${file}`);s=s.replace(from,to);fs.writeFileSync(file,s);}

// Windows: trailer must follow the actual active carousel dataset.
mustReplace('windows/ui/experience.js',
"async function hero(){if(!state||!$('#hero')||$('#hero').getBoundingClientRect().bottom<=0||state.settings.homepageTrailer===false||category!=='Home'||document.hidden||$('#detail').open||$('#settings').open||$('#source-picker').open)return;stop();const token=sequence,item=(homeData.trending||[]).filter(i=>i.backdrop).slice(0,6)[heroIndex];if(!item)return;",
"async function hero(){if(!state||!$('#hero')||$('#hero').getBoundingClientRect().bottom<=0||state.settings.homepageTrailer===false||category!=='Home'||document.hidden||$('#detail').open||$('#settings').open||$('#source-picker').open)return;stop();const token=sequence,picks=typeof heroPicks==='function'?heroPicks():[],item=picks.length?picks[((heroIndex%picks.length)+picks.length)%picks.length]:null;if(!item)return;",
'Windows hero trailer source');

// Android/Mobile/TV: changing source should visibly rebuild from that source, never silently fall back to Top Picks.
mustReplace('app/src/main/java/com/zerostreams/app/MainActivity.java',
"prefs.edit().putString(\"carouselSource\",ids[which]).apply();anchor.setText(\"Homepage carousel · \"+labels[which]+\"  ▾\");dialog.dismiss();if(category.equals(\"Home\"))render();",
"prefs.edit().putString(\"carouselSource\",ids[which]).apply();heroIndex=0;stopPreview();anchor.setText(\"Homepage carousel · \"+labels[which]+\"  ▾\");dialog.dismiss();if(category.equals(\"Home\")){scroll.scrollTo(0,0);load();}",
'Android carousel source picker refresh');
mustReplace('app/src/main/java/com/zerostreams/app/MainActivity.java',
"if(source.isEmpty()&&!mode.equals(\"top\"))for(Catalog.Item item:all)if(item.raw.optBoolean(\"trending\")&&!item.raw.optBoolean(\"upcoming\"))source.add(item);if(source.isEmpty())source.addAll(all);LinkedHashMap<String,Catalog.Item> unique=new LinkedHashMap<>();",
"if(source.isEmpty()&&mode.equals(\"top\"))source.addAll(all);LinkedHashMap<String,Catalog.Item> unique=new LinkedHashMap<>();",
'Android carousel fallback');

// Windows updater: app only downloads/verifies; standalone helper owns extraction, activation and relaunch.
let updater=fs.readFileSync('windows/updater.cjs','utf8');
const begin=updater.indexOf('async function locatePortableRoot');
const end=updater.indexOf('function bindMain',begin);
if(begin<0||end<0)throw new Error('Could not locate old updater installation block');
const replacement=`async function installVersion(release){if(downloadBusy)throw Error('An update is already downloading.');downloadBusy=true;let work;try{const info=releaseView(release),root=versions.rootDir(),versionsDir=await versions.ensureVersionsDir();work=path.join(versionsDir,'.download-'+info.version+'-'+Date.now());const zip=path.join(work,'ZeroPlay-'+info.version+'-Windows-x64.zip');await fsp.mkdir(work,{recursive:true});const expected=await expectedSha256(release);if(!expected)throw Error('The update package has no trusted SHA-256 checksum. Installation was stopped.');const response=await fetch(release.asset.browser_download_url,{headers:{'User-Agent':'ZeroPlay-Windows-Updater'},redirect:'follow',signal:AbortSignal.timeout(1800000)});if(!response.ok||!response.body)throw Error('Update download failed ('+response.status+').');const total=Number(response.headers.get('content-length'))||Number(release.asset.size)||0;let received=0;const source=Readable.fromWeb(response.body);source.on('data',chunk=>{received+=chunk.length;if(updateWindow&&!updateWindow.isDestroyed())updateWindow.webContents.send('update-progress',{received,total,percent:total?Math.min(100,received/total*100):0});});await pipeline(source,fs.createWriteStream(zip,{flags:'wx'}));const digest=await sha256(zip);if(digest!==expected)throw Error('Downloaded update failed SHA-256 verification.');const helper=path.join(root,'ZeroPlayUpdater.exe');await fsp.access(helper);const child=spawn(helper,['--root',root,'--zip',zip,'--version',info.version,'--sha256',expected,'--wait-pid',String(process.pid)],{cwd:root,detached:true,stdio:'ignore',windowsHide:true});child.unref();work=null;return {ok:true,version:info.version,helper:true};}catch(error){if(work)await fsp.rm(work,{recursive:true,force:true}).catch(()=>{});throw error;}finally{downloadBusy=false;}}
async function startInstall(event){trustedUpdate(event);if(!currentRelease)throw Error('No update is selected.');const result=await installVersion(currentRelease);closeUpdate();setTimeout(()=>{try{app.exit(0);}catch{process.exit(0);}},250);return result;}
`;
updater=updater.slice(0,begin)+replacement+updater.slice(end);
updater=updater.replace("module.exports={install,newer,cleanVersion,releaseView,expectedSha256,testRelease,locatePortableRoot,extractZip};","module.exports={install,newer,cleanVersion,releaseView,expectedSha256,testRelease};");
fs.writeFileSync('windows/updater.cjs',updater);

// Include the real helper beside ZeroPlay.exe in every Windows portable ZIP.
const pkg=JSON.parse(fs.readFileSync('windows/package.json','utf8'));
pkg.build=pkg.build||{};
pkg.build.extraFiles=[...(pkg.build.extraFiles||[]).filter(x=>x&&x.to!=='ZeroPlayUpdater.exe'),{from:'ZeroPlayUpdater.exe',to:'ZeroPlayUpdater.exe'}];
fs.writeFileSync('windows/package.json',JSON.stringify(pkg,null,2)+'\n');

// Regression tests document the architecture and the carousel/trailer binding.
fs.writeFileSync('windows/test/updater.test.cjs',`const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');\nconst updater=require('../updater.cjs'),versions=require('../version-manager.cjs');\ntest('update version comparison handles tags and patch versions',()=>{assert.deepEqual(updater.cleanVersion('v2.1.0'),[2,1,0]);assert.equal(updater.newer('2.1','2.0.3'),true);assert.equal(updater.newer('2.1.0','2.1'),false);});\ntest('versioned launcher treats release tags with trailing zeroes as the same app version',()=>{assert.equal(versions.sameVersion('2.2','2.2.0'),true);assert.equal(versions.sameVersion('v2.2.0','2.2'),true);assert.equal(versions.sameVersion('2.2.1','2.2'),false);});\ntest('updater ignores demo releases',()=>{assert.equal(updater.testRelease({tag_name:'v9.9.9-TEST'}),true);assert.equal(updater.testRelease({tag_name:'v2.1-DEMO'}),true);assert.equal(updater.testRelease({tag_name:'v2.1'}),false);});\ntest('Windows updater delegates installation to ZeroPlayUpdater.exe',()=>{const source=fs.readFileSync(path.join(__dirname,'..','updater.cjs'),'utf8');assert.match(source,/ZeroPlayUpdater\\.exe/);assert.match(source,/--wait-pid/);assert.doesNotMatch(source,/tar\\.exe/);assert.doesNotMatch(source,/Expand-Archive/);assert.doesNotMatch(source,/robocopy\\.exe/);});\ntest('standalone helper owns ZIP extraction and version activation',()=>{const source=fs.readFileSync(path.join(__dirname,'..','updater-helper','Program.cs'),'utf8');assert.match(source,/ZipFile\\.ExtractToDirectory/);assert.match(source,/current\\.json/);assert.match(source,/ZeroPlayUpdater-error\\.txt/);});\ntest('stable launcher has confirmation and rollback handshake',()=>{const source=fs.readFileSync(path.join(__dirname,'..','version-manager.cjs'),'utf8');assert.match(source,/pending:true/);assert.match(source,/confirmCurrent/);assert.match(source,/sameVersion/);assert.match(source,/rollback/);assert.match(source,/current\\.json/);});\ntest('Windows hero trailer follows heroPicks rather than trending',()=>{const source=fs.readFileSync(path.join(__dirname,'..','ui','experience.js'),'utf8');assert.match(source,/heroPicks\\(\\)/);assert.doesNotMatch(source,/homeData\\.trending\\|\\|\\[\\]\\)\\.filter\\(i=>i\\.backdrop\\)\\.slice\\(0,6\\)\\[heroIndex\\]/);});\n`);

console.log('Applied standalone updater helper + cross-platform carousel source/trailer fixes.');
