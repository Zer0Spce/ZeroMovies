'use strict';
const fs=require('node:fs'),path=require('node:path');
const active=s=>['metadata','downloading'].includes(s),video=n=>/\.(mp4|mkv|webm|m4v|mov|avi)$/i.test(n)&&!/(^|[ ._-])sample([ ._-]|$)/i.test(n);
class TorrentDownloads {
 constructor(root,notify=()=>{},config=()=>({}),factory){
  this.root=root;this.index=path.join(root,'torrents.json');fs.mkdirSync(root,{recursive:true});this.notify=notify;this.config=config;this.factory=factory;this.handles=new Map();this.client=null;this.closed=false;
  try{this.jobs=JSON.parse(fs.readFileSync(this.index));if(!Array.isArray(this.jobs))throw Error();}catch{this.jobs=[];}
  for(const j of this.jobs)if(active(j.state))j.state='queued';
  // Import completed direct downloads once, preserving their actual files.
  const migrated=path.join(root,'legacy-imported');if(!fs.existsSync(migrated)){for(const source of [path.join(root,'downloads.json'),path.join(root,'index.json')])try{let data=JSON.parse(fs.readFileSync(source));for(const j of Array.isArray(data)?data:data.jobs||[])if(j.state==='completed'&&fs.existsSync(j.file)&&!this.jobs.some(x=>x.id===j.id))this.jobs.push({...j,legacy:true,item:j.item||{title:j.title,type:j.type}});}catch{}this.emit();fs.writeFileSync(migrated,'1');}
  this.timer=setInterval(()=>this.tick(),1000);this.timer.unref();queueMicrotask(()=>this.schedule());
 }
 emit(){const tmp=this.index+'.tmp';try{fs.writeFileSync(tmp,JSON.stringify(this.jobs));fs.renameSync(tmp,this.index);}catch{for(const j of this.jobs)if(active(j.state)||j.state==='queued'){j.state='paused';j.error='Cannot save download history. Check storage.';this.handles.get(j.id)?.pause();}}this.notify();}
 list(){for(const j of this.jobs)if(j.state==='completed'&&!fs.existsSync(j.file))j.state='missing';return this.jobs.map(({torrent,...j})=>({...j,title:j.item?.title||j.title}));}
 async engine(){if(!this.client){if(this.factory)this.client=await this.factory();else{const {default:WebTorrent}=await import('webtorrent');this.client=new WebTorrent({webSeeds:false});}this.client.on('error',()=>{});}return this.client;}
 async add(item,episode,folder,result,torrent){if(!/^[a-f0-9]{40}$/.test(result.id))throw Error('Invalid torrent hash.');const existing=this.jobs.find(j=>j.id===result.id);if(existing)return existing.id;const dir=path.join(folder,'ZeroPlay-'+result.id);fs.mkdirSync(dir,{recursive:true});const j={id:result.id,item,episode,dir,file:'',torrent:typeof torrent==='string'?torrent:Buffer.from(torrent).toString('base64'),binary:typeof torrent!=='string',state:'queued',bytes:0,total:result.sizeBytes||0,speed:0,peers:0,created:Date.now(),resolution:result.resolution,codec:result.codec,error:''};this.jobs.push(j);this.emit();await this.schedule();return j.id;}
 async schedule(){if(this.closed||this.scheduling)return;this.scheduling=true;try{const max=Math.max(1,Math.min(2,this.config().maxActive||2));for(const j of this.jobs){if(this.jobs.filter(x=>active(x.state)).length>=max)break;if(j.state==='queued')await this.start(j);}}finally{this.scheduling=false;}}
 async start(j){j.state='metadata';j.error='';this.emit();try{const client=await this.engine();if(j.state!=='metadata'||this.closed)return;const t=client.add(j.binary?Buffer.from(j.torrent,'base64'):j.torrent,{path:j.dir,deselect:true},()=>{
   if(j.state!=='metadata'){t.pause();return;}for(const f of t.files){const target=path.resolve(j.dir,f.path);if(!target.startsWith(path.resolve(j.dir)+path.sep)){this.fail(j,t,'Unsafe torrent file path.');return;}f.deselect();}
   const ep=j.item.type==='tv'?new RegExp('s'+String(j.episode.season).padStart(2,'0')+'e'+String(j.episode.episode).padStart(2,'0'),'i'):null;const eligible=t.files.filter(f=>video(f.name)&&(!ep||ep.test(f.name))).sort((a,b)=>b.length-a.length);
   if(!eligible.length){this.fail(j,t,'No matching playable video in this torrent.');return;}
   j.files=eligible.map(f=>({path:f.path,size:f.length}));
   if(j.selected&&eligible.some(f=>f.path===j.selected))this.select(j,t,j.selected);else if(eligible.length>1&&eligible[1].length>=eligible[0].length*.5){j.state='selecting';t.pause();this.emit();this.schedule();}else this.select(j,t,eligible[0].path);
  });this.handles.set(j.id,t);t.on('error',()=>this.fail(j,t,'Torrent download failed. Check peers, connection and storage.'));}catch{j.state='failed';j.error='Could not start torrent engine.';this.emit();}}
 select(j,t,name){const f=t.files.find(f=>f.path===name&&video(f.name));if(!f)throw Error('Select a listed video file.');j.selected=name;j.file=path.resolve(j.dir,name);j.total=f.length;j.state='downloading';t.resume();f.select();for(const sub of t.files)if(/\.(srt|vtt|ass)$/i.test(sub.name))sub.select();this.emit();}
 fail(j,t,error){if(['paused','cancelled'].includes(j.state))return;j.state='failed';j.error=error;t?.destroy();this.handles.delete(j.id);this.emit();this.schedule();}
 tick(){let changed=false;for(const j of this.jobs){const t=this.handles.get(j.id);if(!t||j.state!=='downloading')continue;const f=t.files.find(f=>f.path===j.selected);j.bytes=f?.downloaded||0;j.speed=Math.round(.7*(j.speed||0)+.3*t.downloadSpeed);j.peers=t.numPeers;if(f?.progress===1){j.state='completed';j.completed=Date.now();j.speed=0;t.destroy();this.handles.delete(j.id);}changed=true;}if(changed)this.emit();this.schedule();}
 async action(id,action,value){const j=this.jobs.find(j=>j.id===id);if(!j)throw Error('Download not found.');const t=this.handles.get(id);
  if(action==='open'){if(j.state!=='completed'||!fs.existsSync(j.file))throw Error('File unavailable.');return j.file;}
  if(action==='select'){if(j.state!=='selecting'||!t)throw Error('Refresh the download file list.');const name=String(value);if(!(j.files||[]).some(f=>f.path===name))throw Error('Select a listed file.');j.selected=name;await new Promise(r=>t.destroy(r));this.handles.delete(id);j.state='queued';}
  else if(action==='pause'||action==='cancel'){j.state=action==='pause'?'paused':'cancelled';j.speed=0;if(t){await new Promise(r=>t.destroy(r));this.handles.delete(id);}}
  else if(action==='resume'||action==='retry'){if(j.legacy)throw Error('This legacy file cannot be downloaded again.');if(t){t.destroy();this.handles.delete(id);}j.state='queued';}
  else if(action==='delete'||action==='history'){if(active(j.state)||j.state==='queued'||j.state==='selecting')throw Error('Pause or cancel first.');if(action==='delete'){if(j.legacy)await fs.promises.rm(j.file,{force:true});else{if(!j.dir||!path.basename(j.dir).startsWith('ZeroPlay-'))throw Error('Invalid download folder.');await fs.promises.rm(j.dir,{recursive:true,force:true});}}this.jobs=this.jobs.filter(r=>r!==j);}
  else throw Error('Unsupported action.');this.emit();await this.schedule();return true;
 }
 close(){this.closed=true;clearInterval(this.timer);this.emit();this.client?.destroy();}
}
module.exports={TorrentDownloads};
