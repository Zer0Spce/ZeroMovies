from pathlib import Path
import json, re

ROOT=Path('.')
def read(p): return (ROOT/p).read_text(encoding='utf-8')
def write(p,s):
    p=ROOT/p; p.parent.mkdir(parents=True,exist_ok=True); p.write_text(s,encoding='utf-8')
def replace_once(s,old,new,label):
    n=s.count(old)
    if n!=1: raise RuntimeError(f'{label}: expected 1 match, found {n}')
    return s.replace(old,new,1)
def sub_once(s,pat,repl,label):
    out,n=re.subn(pat,repl,s,count=1,flags=re.S)
    if n!=1: raise RuntimeError(f'{label}: expected 1 match, found {n}')
    return out

# Android version + layout polish.
p='app/build.gradle'; s=read(p)
s=replace_once(s,'versionCode 35','versionCode 36','Android versionCode')
s=replace_once(s,"versionName '1.8.2'","versionName '1.9'",'Android versionName')
write(p,s)

p='app/src/main/java/com/zerostreams/app/MainActivity.java'; s=read(p)
s=replace_once(s,'TextView logo=text("ZEROPLAY",BuildConfig.TV?23:19,INK);','TextView logo=text("ZEROPLAY",googleLayout()?(BuildConfig.TV?25:22):(BuildConfig.TV?23:19),INK);','Android header logo')
s=replace_once(s,'sidebar=column();sidebar.setPadding(dp(8),dp(16),dp(8),dp(12));','sidebar=column();sidebar.setPadding(dp(3),dp(16),dp(3),dp(12));','Clean sidebar padding')
s=replace_once(s,'outer.addView(layoutRailScroll,new LinearLayout.LayoutParams(dp(BuildConfig.TV?72:56),-1));','outer.addView(layoutRailScroll,new LinearLayout.LayoutParams(dp(BuildConfig.TV?60:52),-1));','Clean collapsed sidebar width')
s=replace_once(s,'lp.width=dp(expanded?(BuildConfig.TV?205:185):(BuildConfig.TV?72:56));','lp.width=dp(expanded?(BuildConfig.TV?205:185):(BuildConfig.TV?60:52));','Clean sidebar runtime width')
s=replace_once(s,'b.setText(expanded?entry.getValue():"");b.setGravity(Gravity.CENTER_VERTICAL|(expanded?Gravity.START:Gravity.CENTER_HORIZONTAL));b.setPadding(dp(expanded?12:6),dp(5),dp(expanded?12:6),dp(5));','b.setText(expanded?entry.getValue():"");b.setGravity(Gravity.CENTER_VERTICAL|(expanded?Gravity.START:Gravity.CENTER_HORIZONTAL));b.setCompoundDrawablePadding(dp(expanded?12:0));b.setPadding(dp(expanded?12:0),dp(5),dp(expanded?12:0),dp(5));','Clean sidebar icon alignment')
s=replace_once(s,'TextView brand=text("ZEROPLAY",BuildConfig.TV?16:14,INK);bold(brand);brand.setLetterSpacing(.07f);brand.setPadding(dp(10),0,dp(16),0);','TextView brand=text("ZEROPLAY",BuildConfig.TV?23:20,INK);bold(brand);brand.setLetterSpacing(.07f);brand.setPadding(dp(12),0,dp(22),0);','Modern logo')
old='String tileArt=classicLayout()?item.poster:item.raw.optString("backdrop",item.poster);if(tileArt.isEmpty())tileArt=item.poster;if(!tileArt.isEmpty())picture(tileArt,poster,token);space(card,8);TextView title=text(item.title,14,INK);bold(title);title.setMaxLines(2);title.setMinLines(2);title.setEllipsize(TextUtils.TruncateAt.END);card.addView(title);space(card,4);card.addView(text(item.year>0?String.valueOf(item.year):item.type.toUpperCase(Locale.ROOT),12,MUTED));return card;}'
new='String tileArt=classicLayout()?item.poster:item.raw.optString("backdrop",item.poster);if(tileArt.isEmpty())tileArt=item.poster;if(!tileArt.isEmpty())picture(tileArt,poster,token);LinearLayout thumbCopy=column();thumbCopy.setPadding(dp(10),dp(26),dp(10),dp(8));thumbCopy.setBackground(new GradientDrawable(GradientDrawable.Orientation.TOP_BOTTOM,new int[]{Color.TRANSPARENT,Color.argb(222,0,0,0)}));TextView overlayTitle=text(item.title,BuildConfig.TV?14:13,Color.WHITE);bold(overlayTitle);overlayTitle.setMaxLines(2);overlayTitle.setEllipsize(TextUtils.TruncateAt.END);thumbCopy.addView(overlayTitle);double tileRating=item.raw.optDouble("rating",0);String overlayLine=(item.year>0?String.valueOf(item.year):item.type.toUpperCase(Locale.ROOT))+(tileRating>0?"  ·  ★ "+String.format(Locale.ROOT,"%.1f",tileRating):"");TextView overlayMeta=text(overlayLine,11,tileRating>0?Color.rgb(255,196,77):Color.rgb(220,220,220));thumbCopy.addView(overlayMeta);posterFrame.addView(thumbCopy,new FrameLayout.LayoutParams(-1,-2,Gravity.BOTTOM));if(classicLayout()){space(card,8);TextView title=text(item.title,14,INK);bold(title);title.setMaxLines(2);title.setMinLines(2);title.setEllipsize(TextUtils.TruncateAt.END);card.addView(title);space(card,4);card.addView(text(item.year>0?String.valueOf(item.year):item.type.toUpperCase(Locale.ROOT),12,MUTED));}else space(card,5);return card;}'
s=replace_once(s,old,new,'Android thumbnail titles')
s=replace_once(s,'if(!address.isEmpty())picture(address,art,renderVersion);if(prefs.getBoolean("focusInfo",true)){','if(!address.isEmpty())picture(address,art,renderVersion);View flare=new View(this);flare.setBackground(new GradientDrawable(GradientDrawable.Orientation.TL_BR,new int[]{Color.argb(94,255,112,84),Color.TRANSPARENT,Color.argb(72,101,230,204)}));flare.setAlpha(.34f);panel.addView(flare,new FrameLayout.LayoutParams(-1,-1));if(prefs.getBoolean("focusInfo",true)){','Android preview flare')
s=replace_once(s,'copy.addView(text(meta(item),12,INK));JSONArray genres=','copy.addView(text(item.type.toUpperCase(Locale.ROOT)+(item.year>0?"  ·  "+item.year:""),12,MUTED));double previewRating=item.raw.optDouble("rating",0);if(previewRating>0){TextView stars=text("★ "+String.format(Locale.ROOT,"%.1f",previewRating),13,Color.rgb(255,196,77));bold(stars);copy.addView(stars);}JSONArray genres=','Android preview stars')
write(p,s)

# Windows version/dependency. Video.js is used ONLY by the new offline player.
p='windows/package.json'; pkg=json.loads(read(p)); pkg['version']='1.9.0'; pkg['scripts']['prepare-config']='node scripts/config.cjs && node scripts/live-vendor.cjs && node scripts/offline-vendor.cjs'; pkg['dependencies']['video.js']='8.24.1'; pkg['build']['win']['artifactName']='ZeroPlay-1.9-Windows-x64.${ext}'; write(p,json.dumps(pkg,indent=2)+'\n')

write('windows/scripts/offline-vendor.cjs',"""const fs=require('node:fs'),path=require('node:path');
fs.mkdirSync('ui/vendor',{recursive:true});
const root=path.dirname(require.resolve('video.js/package.json'));
fs.copyFileSync(path.join(root,'dist/video.min.js'),'ui/vendor/video.min.js');
fs.copyFileSync(path.join(root,'dist/video-js.min.css'),'ui/vendor/video-js.min.css');
fs.copyFileSync(path.join(root,'LICENSE'),'ui/vendor/VIDEOJS-LICENSE');
""")

write('windows/offline-media.cjs',r"""'use strict';
const fs=require('node:fs'),path=require('node:path');const SUB=/\.(srt|vtt|ass|ssa)$/i;
function time(value){const parts=String(value||'').trim().replace(',', '.').split(':').map(Number);if(parts.some(Number.isNaN))return null;let h=0,m=0,s=0;if(parts.length===3)[h,m,s]=parts;else if(parts.length===2)[m,s]=parts;else return null;return String(Math.max(0,Math.floor(h))).padStart(2,'0')+':'+String(Math.max(0,Math.floor(m))).padStart(2,'0')+':'+Number(s).toFixed(3).padStart(6,'0');}
function srtToVtt(text){const body=String(text||'').replace(/^\uFEFF/,'').replace(/\r/g,'').replace(/(\d{1,2}:\d{2}:\d{2})[,.](\d{3})/g,'$1.$2');return 'WEBVTT\n\n'+body.replace(/^\s*\d+\s*\n(?=\d{1,2}:\d{2}:\d{2}[.]\d{3}\s+-->)/gm,'');}
function assToVtt(text){const cues=[];for(const line of String(text||'').replace(/^\uFEFF/,'').split(/\r?\n/)){if(!/^Dialogue:/i.test(line))continue;const parts=line.replace(/^Dialogue:\s*/i,'').split(',');if(parts.length<10)continue;const start=time(parts[1]),end=time(parts[2]);if(!start||!end)continue;const caption=parts.slice(9).join(',').replace(/\{[^}]*\}/g,'').replace(/\\N/g,'\n').replace(/\\n/g,'\n').trim();if(caption)cues.push(start+' --> '+end+'\n'+caption);}return 'WEBVTT\n\n'+cues.join('\n\n')+'\n';}
function language(file){const name=path.basename(file).toLowerCase();const m=name.match(/[._ -](en|eng|english|es|spa|spanish|fr|fre|fra|french|de|ger|deu|it|ita|pt|por|ja|jpn|ko|kor|tl|fil)[._ -]/);const code=m?.[1]||'und';return ({eng:'en',english:'en',spa:'es',spanish:'es',fre:'fr',fra:'fr',french:'fr',ger:'de',deu:'de',ita:'it',por:'pt',jpn:'ja',kor:'ko',fil:'tl'})[code]||code;}
function readTrack(file){const stat=fs.statSync(file);if(!stat.isFile()||stat.size>2*1024*1024||!SUB.test(file))throw Error('Choose an SRT, VTT, ASS or SSA subtitle under 2 MB.');const ext=path.extname(file).toLowerCase(),raw=fs.readFileSync(file,'utf8');const vtt=ext==='.vtt'?raw.replace(/^\uFEFF/,''):ext==='.srt'?srtToVtt(raw):assToVtt(raw);if(!/^WEBVTT/m.test(vtt))throw Error('Subtitle file could not be converted.');return {label:path.basename(file),language:language(file),vtt};}
function findTracks(videoFile,root){root=path.resolve(root||path.dirname(videoFile));const videoBase=path.basename(videoFile,path.extname(videoFile)).toLowerCase().replace(/[^a-z0-9]+/g,' ');const rows=[],stack=[[root,0]];let seen=0;while(stack.length&&seen<250){const [dir,depth]=stack.pop();let entries=[];try{entries=fs.readdirSync(dir,{withFileTypes:true});}catch{continue;}for(const e of entries){if(++seen>250)break;const file=path.join(dir,e.name);if(e.isDirectory()&&depth<3){stack.push([file,depth+1]);continue;}if(!e.isFile()||!SUB.test(e.name))continue;const base=path.basename(e.name,path.extname(e.name)).toLowerCase().replace(/[^a-z0-9]+/g,' ');let score=path.dirname(file)===path.dirname(videoFile)?40:0;if(base.includes(videoBase)||videoBase.includes(base))score+=80;if(/\b(en|eng|english)\b/.test(base))score+=15;if(path.extname(file).toLowerCase()==='.srt')score+=8;rows.push({file,score});}}return rows.sort((a,b)=>b.score-a.score).slice(0,8).map(r=>{try{return readTrack(r.file);}catch{return null;}}).filter(Boolean);}
module.exports={srtToVtt,assToVtt,readTrack,findTracks};
""")

write('windows/offline-host.cjs',"""'use strict';
class OfflineHost{
 constructor(main,view){this.main=main;this.view=view;this.closed=false;this.beforeFullscreen=main.isFullScreen();this.manualFullscreen=this.beforeFullscreen;this.htmlFullscreen=false;this.resize=()=>this.layout();this.enter=()=>{this.htmlFullscreen=true;main.setFullScreen(true);this.layout();};this.leave=()=>{this.htmlFullscreen=false;main.setFullScreen(this.manualFullscreen);this.layout();};main.contentView.addChildView(view);for(const event of ['resize','enter-full-screen','leave-full-screen'])main.on(event,this.resize);view.webContents.on('enter-html-full-screen',this.enter);view.webContents.on('leave-html-full-screen',this.leave);this.layout();}
 layout(){if(this.closed||this.main.isDestroyed())return;const [width,height]=this.main.getContentSize();this.view.setBounds({x:0,y:0,width,height});}
 activity(){}
 async exitFullscreen(){this.manualFullscreen=false;this.htmlFullscreen=false;for(const frame of this.view.webContents.mainFrame.framesInSubtree)await frame.executeJavaScript('if(document.fullscreenElement)document.exitFullscreen().catch(()=>{});').catch(()=>{});if(!this.closed){this.main.setFullScreen(false);this.layout();}}
 async toggleFullscreen(){if(this.main.isFullScreen()||this.htmlFullscreen)return this.exitFullscreen();this.manualFullscreen=true;this.main.setFullScreen(true);this.layout();}
 close(){if(this.closed)return;this.closed=true;for(const event of ['resize','enter-full-screen','leave-full-screen'])this.main.removeListener(event,this.resize);this.view.webContents.removeListener('enter-html-full-screen',this.enter);this.view.webContents.removeListener('leave-html-full-screen',this.leave);if(!this.main.isDestroyed()){this.main.contentView.removeChildView(this.view);this.main.setFullScreen(this.beforeFullscreen);}if(!this.view.webContents.isDestroyed())this.view.webContents.close();}
}
module.exports={OfflineHost};
""")

write('windows/offline-preload.cjs',"""const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('offline',{context:()=>ipcRenderer.invoke('offline-context'),loadSubtitle:()=>ipcRenderer.invoke('offline-subtitle'),close:()=>ipcRenderer.invoke('offline-close'),fullscreen:()=>ipcRenderer.invoke('offline-fullscreen')});
""")

write('windows/ui/offline-player.html',"""<!doctype html><html><head><meta charset=\"utf-8\"><meta http-equiv=\"Content-Security-Policy\" content=\"default-src 'self'; script-src 'self'; style-src 'self'; media-src file: data: blob:; connect-src 'none'; img-src 'self' data:; object-src 'none'; base-uri 'none'\"><title>ZeroPlay Offline</title><link rel=\"stylesheet\" href=\"vendor/video-js.min.css\"><link rel=\"stylesheet\" href=\"offline-player.css\"></head><body><video id=\"video\" class=\"video-js vjs-big-play-centered\"></video><header><button id=\"back\">‹ Back</button><div><h1 id=\"title\">ZeroPlay Offline</h1><p id=\"status\">Opening downloaded video…</p></div><b>ZERO • OFFLINE</b></header><div id=\"tools\"><button id=\"subtitle\">＋ Load subtitles</button><button id=\"fit\">Fit / Fill</button><button id=\"full\">Fullscreen</button></div><script src=\"vendor/video.min.js\"></script><script src=\"offline-player.js\"></script></body></html>\n""")

write('windows/ui/offline-player.css',"""*{box-sizing:border-box}html,body{width:100%;height:100%}body{margin:0;background:#000;color:#fff;font:15px 'Segoe UI',sans-serif;overflow:hidden}.video-js{position:absolute!important;inset:0;width:100%!important;height:100%!important;background:#000;font-size:14px}.video-js .vjs-tech{object-fit:contain}.video-js.vjs-fill .vjs-tech{object-fit:cover}header,#tools{position:fixed;left:0;right:0;display:flex;align-items:center;gap:12px;z-index:20;transition:opacity .2s}header{top:0;padding:18px 22px;background:linear-gradient(#000e,#0009,transparent)}header>div{flex:1}h1{font-size:22px;margin:0}p{margin:5px 0 0;color:#65e6cc;font-size:13px}b{font-size:11px;letter-spacing:.12em;color:#65e6cc}#tools{bottom:58px;justify-content:flex-end;padding:34px 22px 10px;background:linear-gradient(transparent,#000b)}button{font:inherit;background:#151a23e8;color:#fff;border:1px solid #46536b;border-radius:10px;padding:10px 14px;cursor:pointer;backdrop-filter:blur(12px)}button:hover{background:#283449}button:focus-visible{outline:2px solid #65e6cc;outline-offset:2px}.hidden header,.hidden #tools{opacity:0;pointer-events:none}.hidden{cursor:none}.video-js .vjs-control-bar{height:4.3em;background:linear-gradient(transparent,#000e);padding-top:.8em}.video-js .vjs-progress-control{position:absolute;left:1.2em;right:1.2em;top:-1.15em;width:auto;height:1.8em}.video-js .vjs-play-progress{background:#65e6cc}.video-js .vjs-slider{background:#ffffff38}.video-js .vjs-menu-button-popup .vjs-menu .vjs-menu-content{background:#151a23f7;border:1px solid #46536b;border-radius:10px;overflow:hidden}.video-js .vjs-big-play-button{border-radius:50%;width:2.3em;height:2.3em;line-height:2.2em;border-color:#65e6cc;background:#111c}.video-js .vjs-text-track-display>div>div>div{background:#000d!important;border-radius:5px;padding:3px 8px!important}@media(max-width:720px){header{padding:12px}header b{display:none}#tools{padding-left:12px;padding-right:12px}}
""")

write('windows/ui/offline-player.js',r"""'use strict';
const video=document.getElementById('video'),status=document.getElementById('status'),title=document.getElementById('title');const urls=[];let idle,fill=false;
function wake(){document.body.classList.remove('hidden');clearTimeout(idle);if(!player.paused())idle=setTimeout(()=>document.body.classList.add('hidden'),4200);}
function track(row,show=false){if(!row?.vtt)return;const src=URL.createObjectURL(new Blob([row.vtt],{type:'text/vtt'}));urls.push(src);const remote=player.addRemoteTextTrack({kind:'subtitles',label:row.label||'Subtitle',srclang:row.language||'und',src,default:show},false);if(show&&remote?.track)remote.track.mode='showing';}
const player=videojs(video,{controls:true,autoplay:true,preload:'auto',playbackRates:[.75,1,1.25,1.5,2],controlBar:{pictureInPictureToggle:true,remainingTimeDisplay:true,subsCapsButton:true}});
for(const event of ['mousemove','pointerdown','keydown'])document.addEventListener(event,wake);
document.getElementById('back').onclick=()=>window.offline.close();document.getElementById('full').onclick=()=>window.offline.fullscreen();document.getElementById('fit').onclick=()=>{fill=!fill;player.el().classList.toggle('vjs-fill',fill);};document.getElementById('subtitle').onclick=async()=>{try{const row=await window.offline.loadSubtitle();if(row){for(const t of player.textTracks())t.mode='disabled';track(row,true);status.textContent='✓ Loaded subtitles · '+row.label;}}catch(e){status.textContent=e.message||'Could not load subtitles';}};
document.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();window.offline.close();}else if(event.key==='F11'){event.preventDefault();window.offline.fullscreen();}else if(event.code==='Space'&&event.target===document.body){event.preventDefault();player.paused()?player.play():player.pause();}else if(event.key==='ArrowRight'){player.currentTime(Math.min(player.duration()||Infinity,player.currentTime()+10));}else if(event.key==='ArrowLeft'){player.currentTime(Math.max(0,player.currentTime()-10));}});
player.on('play',wake);player.on('pause',wake);player.on('error',()=>{status.textContent='This file uses a codec that the Windows media engine cannot decode. Try Open in external player.';wake();});player.on('loadedmetadata',()=>{status.textContent='✓ Ready · '+Math.round((player.duration()||0)/60)+' min';wake();});
(async()=>{try{const context=await window.offline.context();title.textContent=context.title||'Downloaded video';player.src({src:context.url});(context.subtitles||[]).forEach((row,index)=>track(row,index===0));if(context.subtitles?.length)status.textContent='✓ '+context.subtitles.length+' local subtitle'+(context.subtitles.length===1?'':'s')+' found';await player.play().catch(()=>{});wake();}catch(e){status.textContent=e.message||'Could not open downloaded video';}})();
window.addEventListener('beforeunload',()=>{urls.forEach(URL.revokeObjectURL);player.dispose();});
""")

write('windows/test/offline-media.test.cjs',r"""const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');const media=require('../offline-media.cjs');
test('converts SRT and ASS subtitles to WebVTT',()=>{assert.match(media.srtToVtt('1\n00:00:01,200 --> 00:00:03,000\nHello\n'),/^WEBVTT/);assert.match(media.assToVtt('[Events]\nDialogue: 0,0:00:01.20,0:00:03.00,Default,,0,0,0,,Hello\\NWorld'),/Hello\nWorld/);});
test('discovers a matching local subtitle first',()=>{const root=fs.mkdtempSync(path.join(os.tmpdir(),'zero-subs-'));try{const video=path.join(root,'Movie.2026.mkv');fs.writeFileSync(video,'x');fs.writeFileSync(path.join(root,'Movie.2026.en.srt'),'1\n00:00:01,000 --> 00:00:02,000\nHi\n');fs.writeFileSync(path.join(root,'Other.srt'),'1\n00:00:01,000 --> 00:00:02,000\nOther\n');const rows=media.findTracks(video,root);assert.ok(rows.length);assert.equal(rows[0].language,'en');assert.match(rows[0].vtt,/WEBVTT/);}finally{fs.rmSync(root,{recursive:true,force:true});}});
""")

# Windows app: title overlays, larger Clean hero/logo/search, preview color flare.
p='windows/ui/app.js'; s=read(p)
new_card="""function card(item,landscape=false){titles.set(key(item),item);const position=state.positions[key(item)],percent=Number(position?.percent)||0;const img=landscape||state.settings.uiLayout!=='classic'?(item.backdrop||item.poster):item.poster;const rating=item.rating?' · <span class=\"thumb-rating\">★ '+Number(item.rating).toFixed(1)+'</span>':'';return `<button class=\"card ${landscape?'landscape':''}\" data-detail=\"${key(item)}\" aria-label=\"Details for ${escape(item.title)}\"><div class=\"card-art\">${img?`<img loading=\"lazy\" decoding=\"async\" src=\"${escape(img)}\" alt=\"${escape(item.title)}\">`:'<div class=\"poster-empty\">Z</div>'}<div class=\"thumb-copy\"><strong>${escape(item.title)}</strong><small>${item.date?.slice(0,4)||'TBA'} · ${item.type==='tv'?'Series':'Movie'}${rating}</small></div></div>${landscape&&item.date?`<span class=\"badge\">${escape(item.date)}</span>`:''}<span class=\"card-title\">${escape(item.title)}</span><small>${item.date?.slice(0,4)||'TBA'} · ${item.type==='tv'?'Series':'Movie'}${item.rating?' · ★ '+Number(item.rating).toFixed(1):''}</small>${percent>0&&percent<95?`<div class=\"progress\"><i style=\"width:${Math.min(100,percent)}%\"></i></div><small>${Math.round(percent)}% watched${item.type==='tv'?' · S'+position.season+' E'+position.episode:''}</small>`:''}</button>`;}"""
s=sub_once(s,r'function card\(item,landscape=false\)\{.*?\}\nfunction row',new_card+'\nfunction row','Windows thumbnail titles')
write(p,s)

p='windows/ui/layouts.css'; s=read(p); s += r'''

/* 1.9 pre-2.0 polish */
.card-art{position:relative;width:100%;overflow:hidden;border-radius:12px;background:var(--surface)}.card-art>img,.card-art>.poster-empty{border-radius:12px}.thumb-copy{position:absolute;left:0;right:0;bottom:0;padding:38px 11px 9px;background:linear-gradient(transparent,#000e);color:#fff;pointer-events:none}.thumb-copy strong{display:block;font-size:13px;line-height:1.25;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-shadow:0 1px 3px #000}.thumb-copy small{display:block;margin-top:4px;color:#ddd;font-size:10px}.thumb-rating{color:#ffc44d;font-weight:800}:root:not([data-layout="classic"]) .card>.card-title{display:none}
:root[data-layout="youtube"] main>header:before{font-size:18px;min-width:124px;letter-spacing:.055em}:root[data-layout="youtube"] #search-form{height:46px;max-width:640px;border-radius:25px}:root[data-layout="youtube"] #search-form button{height:36px;padding:6px 16px}:root[data-layout="youtube"] .hero{height:clamp(460px,56vh,610px)}:root[data-layout="youtube"] .hero-content{padding:38px 42px;width:min(820px,72%)}:root[data-layout="youtube"] .hero h2{font-size:clamp(38px,4vw,54px);max-height:none}
:root[data-layout="google"] aside .brand{font-size:21px;font-weight:850;letter-spacing:.055em;margin-right:20px}
#movie-preview{border-color:color-mix(in srgb,var(--mint) 75%,#ff9d6c);box-shadow:0 18px 60px #000a,0 0 38px color-mix(in srgb,var(--mint) 18%,transparent)}#movie-preview:after{content:"";position:absolute;inset:0;z-index:2;pointer-events:none;background:radial-gradient(circle at 12% 15%,#ff785638,transparent 34%),radial-gradient(circle at 88% 18%,#65e6cc2b,transparent 32%)}#movie-preview .preview-copy{z-index:3}#movie-preview .rating{color:#ffc44d;font-weight:800}#movie-preview .badge{border-color:#ffffff38;background:#101010b8}
@media(max-width:760px){:root[data-layout="youtube"] .hero{height:440px}:root[data-layout="youtube"] #search-form{height:44px}}
'''; write(p,s)

# Main process: separate offline player. Do not modify live-player.*, live-preload, sports player, or web stream player.
p='windows/main.cjs'; s=read(p)
s=replace_once(s,"const {PlayerHost}=require('./player-host.cjs');","const {PlayerHost}=require('./player-host.cjs');\nconst {OfflineHost}=require('./offline-host.cjs');\nconst offlineMedia=require('./offline-media.cjs');",'Offline imports')
s=replace_once(s,"const liveURL=pathToFileURL(path.join(__dirname,'ui/live-player.html')).href;","const liveURL=pathToFileURL(path.join(__dirname,'ui/live-player.html')).href;\nconst offlineURL=pathToFileURL(path.join(__dirname,'ui/offline-player.html')).href;",'Offline URL')
s=replace_once(s,'let main,player,toolbar,playerHost,current,scanTimer,cursorTimer,qrWorker,scanning=false,state,file,guard,lastProgress=0;','let main,player,toolbar,playerHost,current,scanTimer,cursorTimer,qrWorker,scanning=false,state,file,guard,lastProgress=0,offlineSelection;', 'Offline state')
s=replace_once(s,'playerHost=null;current=null;liveSelection=null;sportsSelection=null;','playerHost=null;current=null;liveSelection=null;offlineSelection=null;sportsSelection=null;','Close offline state')
insert=r'''async function openOffline(job,filePath){
 const resolved=path.resolve(filePath);if(!fs.existsSync(resolved))throw Error('Downloaded video is missing.');closePlayer();
 const title=job?.item?.title||job?.title||path.basename(resolved),root=job?.dir&&fs.existsSync(job.dir)?job.dir:path.dirname(resolved);offlineSelection={title,file:resolved,subtitles:offlineMedia.findTracks(resolved,root)};
 const isolated=session.fromPartition('offline-'+require('node:crypto').randomUUID(),{cache:false});isolated.webRequest.onBeforeRequest((details,callback)=>{let allowed=false;try{allowed=['file:','data:','blob:'].includes(new URL(details.url).protocol);}catch{}callback({cancel:!allowed});});isolated.setPermissionRequestHandler((contents,permission,callback)=>callback(permission==='fullscreen'&&contents===player?.webContents));isolated.setPermissionCheckHandler((contents,permission)=>permission==='fullscreen'&&contents===player?.webContents);
 player=new WebContentsView({webPreferences:{session:isolated,preload:path.join(__dirname,'offline-preload.cjs'),contextIsolation:true,sandbox:true,nodeIntegration:false,webSecurity:true}});toolbar=null;player.setBackgroundColor('#000000');const view=player,contents=view.webContents;playerHost=new OfflineHost(main,view);contents.setWindowOpenHandler(()=>({action:'deny'}));contents.on('will-navigate',(event,url)=>{if(url!==offlineURL)event.preventDefault();});contents.on('render-process-gone',()=>{if(player===view)closePlayer();});contents.on('before-input-event',async(event,input)=>{if(input.type!=='keyDown'||input.isAutoRepeat||player!==view)return;if(input.key==='F11'){event.preventDefault();await playerHost.toggleFullscreen();}else if(input.key==='Escape'||input.key==='BrowserBack'){event.preventDefault();closePlayer();}});main.setTitle(title+' — Offline — ZeroPlay');try{await contents.loadFile(path.join(__dirname,'ui/offline-player.html'));contents.focus();}catch(error){if(player===view)closePlayer();throw error;}
}
function offlineTrusted(event){if(event.sender!==player?.webContents||event.senderFrame?.url!==offlineURL||!offlineSelection)throw Error('Untrusted offline control');}
'''
s=replace_once(s,'function liveTrusted(event){',insert+'function liveTrusted(event){','Insert offline player')
ipc=r'''  ipcMain.handle('offline-context',event=>{offlineTrusted(event);return {title:offlineSelection.title,url:pathToFileURL(offlineSelection.file).href,subtitles:offlineSelection.subtitles};});
  ipcMain.handle('offline-subtitle',async event=>{offlineTrusted(event);const result=await dialog.showOpenDialog(main,{properties:['openFile'],filters:[{name:'Subtitle files',extensions:['srt','vtt','ass','ssa']}]});if(result.canceled||!result.filePaths[0])return null;return offlineMedia.readTrack(result.filePaths[0]);});
  ipcMain.handle('offline-close',event=>{offlineTrusted(event);closePlayer();return true;});
  ipcMain.handle('offline-fullscreen',event=>{offlineTrusted(event);return playerHost.toggleFullscreen();});
'''
s=replace_once(s,"  ipcMain.handle('live-context',event=>{liveTrusted(event);",ipc+"  ipcMain.handle('live-context',event=>{liveTrusted(event);",'Offline IPC')
old="if(action==='open'){const job=downloads.jobs.find(j=>j.id===String(id));await openLive('Downloads',0,{name:job.item.title,url:pathToFileURL(result).href,headers:{},offline:true});}return true;});"
new="if(action==='open'){const job=downloads.jobs.find(j=>j.id===String(id));await openOffline(job,result);}return true;});"
s=replace_once(s,old,new,'Offline download action')
write(p,s)

# Windows guide note.
p='windows/README.md'; s=read(p); s += '\n\n## Offline downloads in 1.9\n\nDownloaded movies use a dedicated **Video.js 8.24.1** offline player with native seek/volume/fullscreen/Picture-in-Picture controls, playback speed, automatic matching local SRT/VTT/ASS/SSA subtitles, and a manual **Load subtitles** action. Live TV, Live Sports, PPV and web streaming players remain separate and unchanged.\n'; write(p,s)

print('ZeroPlay 1.9 guarded source patch applied.')
