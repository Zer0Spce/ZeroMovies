'use strict';
const fs=require('node:fs'),fsp=require('node:fs/promises'),path=require('node:path'),{spawn}=require('node:child_process');
function rootDir(){if(process.env.ZERO_LAUNCHER_ROOT)return path.resolve(process.env.ZERO_LAUNCHER_ROOT);const exe=path.resolve(process.execPath),parts=exe.split(path.sep),index=parts.lastIndexOf('versions');if(index>0)return parts.slice(0,index).join(path.sep)||path.parse(exe).root;return path.dirname(exe);}
function pointerPath(){return path.join(rootDir(),'current.json');}
function readPointer(){try{const value=JSON.parse(fs.readFileSync(pointerPath(),'utf8'));return value&&typeof value==='object'?value:null;}catch{return null;}}
function normalizedVersion(value){const parts=String(value||'').trim().replace(/^v/i,'').split('-')[0].split('.').map(x=>Number(x)||0);while(parts.length>1&&parts[parts.length-1]===0)parts.pop();return parts.join('.');}
function sameVersion(a,b){return normalizedVersion(a)===normalizedVersion(b);}
function relativeExe(versionDir){return path.relative(rootDir(),path.join(versionDir,'ZeroPlay.exe'));}
function absoluteSelection(selection){if(!selection?.path)return null;const target=path.resolve(rootDir(),selection.path);if(!target.startsWith(rootDir()+path.sep)&&target!==path.join(rootDir(),'ZeroPlay.exe'))return null;return target;}
function atomicWrite(value){const file=pointerPath(),temp=file+'.tmp-'+process.pid;fs.writeFileSync(temp,JSON.stringify(value,null,2));fs.renameSync(temp,file);}
function baseSelection(version='base'){return {version,path:'ZeroPlay.exe'};}
function currentSelection(localVersion){const pointer=readPointer(),target=absoluteSelection(pointer);if(pointer&&target&&fs.existsSync(target))return {version:pointer.version||localVersion,path:pointer.path};return baseSelection(localVersion);}
function activate(version,versionDir,localVersion){const previous=currentSelection(localVersion);const next={version,path:relativeExe(versionDir),pending:true,previous,activatedAt:new Date().toISOString()};atomicWrite(next);return next;}
function confirmCurrent(version){if(!process.argv.includes('--version-child'))return false;const pointer=readPointer();if(!pointer?.pending||!sameVersion(pointer.version,version))return false;pointer.pending=false;pointer.confirmedAt=new Date().toISOString();atomicWrite(pointer);return true;}
function spawnSelection(selection,extra=[]){const exe=absoluteSelection(selection);if(!exe||!fs.existsSync(exe))throw Error('Selected ZeroPlay version is missing: '+String(selection?.path||''));const child=spawn(exe,['--version-child',...extra],{cwd:path.dirname(exe),env:{...process.env,ZERO_LAUNCHER_ROOT:rootDir()},detached:true,stdio:'ignore',windowsHide:false});return child;}
function rollback(pointer){const previous=pointer?.previous||baseSelection();atomicWrite({...previous,pending:false,rolledBackAt:new Date().toISOString()});return previous;}
function maybeLaunchCurrent(app){if(!app.isPackaged||process.argv.includes('--smoke-test')||process.argv.includes('--version-child'))return false;const pointer=readPointer(),target=absoluteSelection(pointer);if(!pointer||!target||!fs.existsSync(target)||path.resolve(target)===path.resolve(process.execPath))return false;let child;try{child=spawnSelection(pointer);child.unref();}catch{return false;}
  // A confirmed version is already known-good. Start it detached and let the stable launcher exit.
  if(!pointer.pending){setTimeout(()=>app.exit(0),350);return true;}
  let finished=false;const finish=()=>{if(finished)return;finished=true;clearInterval(check);clearTimeout(timeout);app.exit(0);};const recover=()=>{if(finished)return;finished=true;clearInterval(check);clearTimeout(timeout);try{child.kill();}catch{}try{const previous=rollback(pointer),fallback=spawnSelection(previous,['--rollback']);fallback.unref();}catch{}app.exit(0);};
  child.once('exit',()=>{const now=readPointer();if(now?.pending)recover();else finish();});
  const check=setInterval(()=>{const now=readPointer();if(now&&!now.pending&&sameVersion(now.version,pointer.version))finish();},500);
  const timeout=setTimeout(()=>{const now=readPointer();if(now?.pending)recover();else finish();},20000);
  return true;}
function launchRoot(){const exe=path.join(rootDir(),'ZeroPlay.exe');const child=spawn(exe,[],{cwd:rootDir(),env:{...process.env,ZERO_LAUNCHER_ROOT:rootDir()},detached:true,stdio:'ignore',windowsHide:false});child.unref();return child;}
async function ensureVersionsDir(){const dir=path.join(rootDir(),'versions');await fsp.mkdir(dir,{recursive:true});return dir;}
module.exports={rootDir,pointerPath,readPointer,normalizedVersion,sameVersion,currentSelection,activate,confirmCurrent,maybeLaunchCurrent,launchRoot,ensureVersionsDir,absoluteSelection};
