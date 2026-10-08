'use strict';
const fs=require('node:fs'),path=require('node:path');const SUB=/\.(srt|vtt|ass|ssa)$/i;
const SRT_TIME=/^\s*(\d{1,2}:\d{2}:\d{2}[,.]\d{1,3})\s*-->\s*(\d{1,2}:\d{2}:\d{2}[,.]\d{1,3})(?:\s+.*)?\s*$/;
function time(value){const parts=String(value||'').trim().replace(',', '.').split(':').map(Number);if(parts.some(Number.isNaN))return null;let h=0,m=0,s=0;if(parts.length===3)[h,m,s]=parts;else if(parts.length===2)[m,s]=parts;else return null;return String(Math.max(0,Math.floor(h))).padStart(2,'0')+':'+String(Math.max(0,Math.floor(m))).padStart(2,'0')+':'+Number(s).toFixed(3).padStart(6,'0');}
function srtToVtt(text){
  const lines=String(text||'').replace(/^\uFEFF/,'').replace(/\r/g,'').split('\n'),cues=[];let i=0;
  while(i<lines.length){
    if(/^\s*\d+\s*$/.test(lines[i]||'')&&SRT_TIME.test(lines[i+1]||''))i++;
    const match=(lines[i]||'').match(SRT_TIME);if(!match){i++;continue;}
    const start=time(match[1]),end=time(match[2]);i++;const caption=[];
    while(i<lines.length){
      if(SRT_TIME.test(lines[i]||''))break;
      if(/^\s*\d+\s*$/.test(lines[i]||'')&&SRT_TIME.test(lines[i+1]||'')){i++;break;}
      if(!(lines[i]||'').trim()){
        let next=i+1;while(next<lines.length&&!(lines[next]||'').trim())next++;
        if(SRT_TIME.test(lines[next]||'')||(/^\s*\d+\s*$/.test(lines[next]||'')&&SRT_TIME.test(lines[next+1]||''))){i=next;break;}
      }
      caption.push(lines[i]);i++;
    }
    const body=caption.join('\n').trim();if(start&&end&&body)cues.push(start+' --> '+end+'\n'+body);
  }
  return 'WEBVTT\n\n'+cues.join('\n\n')+(cues.length?'\n':'');
}
function assToVtt(text){const cues=[];for(const line of String(text||'').replace(/^\uFEFF/,'').split(/\r?\n/)){if(!/^Dialogue:/i.test(line))continue;const parts=line.replace(/^Dialogue:\s*/i,'').split(',');if(parts.length<10)continue;const start=time(parts[1]),end=time(parts[2]);if(!start||!end)continue;const caption=parts.slice(9).join(',').replace(/\{[^}]*\}/g,'').replace(/\\N/g,'\n').replace(/\\n/g,'\n').trim();if(caption)cues.push(start+' --> '+end+'\n'+caption);}return 'WEBVTT\n\n'+cues.join('\n\n')+'\n';}
function language(file){const name=path.basename(file).toLowerCase();const m=name.match(/[._ -](en|eng|english|es|spa|spanish|fr|fre|fra|french|de|ger|deu|it|ita|pt|por|ja|jpn|ko|kor|tl|fil)[._ -]/);const code=m?.[1]||'und';return ({eng:'en',english:'en',spa:'es',spanish:'es',fre:'fr',fra:'fr',french:'fr',ger:'de',deu:'de',ita:'it',por:'pt',jpn:'ja',kor:'ko',fil:'tl'})[code]||code;}
function readTrack(file){const stat=fs.statSync(file);if(!stat.isFile()||stat.size>2*1024*1024||!SUB.test(file))throw Error('Choose an SRT, VTT, ASS or SSA subtitle under 2 MB.');const ext=path.extname(file).toLowerCase(),raw=fs.readFileSync(file,'utf8');const vtt=ext==='.vtt'?raw.replace(/^\uFEFF/,''):ext==='.srt'?srtToVtt(raw):assToVtt(raw);if(!/^WEBVTT/m.test(vtt))throw Error('Subtitle file could not be converted.');return {label:path.basename(file),language:language(file),vtt};}
function findTracks(videoFile,root){root=path.resolve(root||path.dirname(videoFile));const videoBase=path.basename(videoFile,path.extname(videoFile)).toLowerCase().replace(/[^a-z0-9]+/g,' ');const rows=[],stack=[[root,0]];let seen=0;while(stack.length&&seen<250){const [dir,depth]=stack.pop();let entries=[];try{entries=fs.readdirSync(dir,{withFileTypes:true});}catch{continue;}for(const e of entries){if(++seen>250)break;const file=path.join(dir,e.name);if(e.isDirectory()&&depth<3){stack.push([file,depth+1]);continue;}if(!e.isFile()||!SUB.test(e.name))continue;const base=path.basename(e.name,path.extname(e.name)).toLowerCase().replace(/[^a-z0-9]+/g,' ');let score=path.dirname(file)===path.dirname(videoFile)?40:0;if(base.includes(videoBase)||videoBase.includes(base))score+=80;if(/\b(en|eng|english)\b/.test(base))score+=15;if(path.extname(file).toLowerCase()==='.srt')score+=8;rows.push({file,score});}}return rows.sort((a,b)=>b.score-a.score).slice(0,8).map(r=>{try{return readTrack(r.file);}catch{return null;}}).filter(Boolean);}
module.exports={srtToVtt,assToVtt,readTrack,findTracks};
