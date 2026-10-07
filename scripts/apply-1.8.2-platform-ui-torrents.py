from pathlib import Path


def read(path):
    return Path(path).read_text(encoding='utf-8')


def write(path, text):
    Path(path).write_text(text, encoding='utf-8')


def once(path, old, new):
    text=read(path); count=text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected one match, got {count}: {old[:120]!r}')
    write(path,text.replace(old,new,1))


def all_(path, old, new, expected=None):
    text=read(path); count=text.count(old)
    if expected is not None and count != expected:
        raise SystemExit(f'{path}: expected {expected} matches, got {count}: {old!r}')
    if count < 1:
        raise SystemExit(f'{path}: no matches: {old!r}')
    write(path,text.replace(old,new))


def between(path, start, end, replacement):
    text=read(path); a=text.find(start); b=text.find(end,a+len(start))
    if a < 0 or b < 0:
        raise SystemExit(f'{path}: replacement markers not found: {start!r} / {end!r}')
    write(path,text[:a]+replacement+text[b:])

main='app/src/main/java/com/zerostreams/app/MainActivity.java'
provider='app/src/main/java/com/zerostreams/app/TspSearchProvider.java'

# Platform defaults while preserving an explicitly saved preference.
once(main,
     'String layoutDisplay(String id){return id.equals("youtube")?"Clean UI · Default":id.equals("google")?"Modern UI":"Classic · Original";}',
     'String layoutDisplay(String id){return id.equals("youtube")?"Clean UI":id.equals("google")?"Modern UI":"Native / Original UI";}')
once(main,
     'void layoutPicker(Button field){String[] ids={"youtube","google","classic"};String[] labels={"Clean UI · Default","Modern UI","Classic · Original"};',
     'void layoutPicker(Button field){String[] ids={"youtube","google","classic"};String[] labels={"Clean UI","Modern UI","Native / Original UI"};')
once(main,
     'String layoutStyle(){String name=prefs.getString("uiLayout","youtube");return Arrays.asList("youtube","google","classic").contains(name)?name:"youtube";}',
     'String layoutStyle(){String fallback=BuildConfig.TV?"classic":"google";String name=prefs.getString("uiLayout",fallback);return Arrays.asList("youtube","google","classic").contains(name)?name:fallback;}')
once(main,
     'panel.addView(text("Clean UI is the default. Modern UI uses an immersive glass top navigation. Layout is separate from your theme.",12,MUTED));',
     'panel.addView(text(BuildConfig.TV?"Default on Android TV: Native / Original UI. Modern UI uses immersive glass navigation.":"Default on Android phone/tablet: Modern UI. Clean UI uses a compact YouTube-inspired layout.",12,MUTED));')

# Clean UI: YouTube-like dark chrome while still allowing non-default theme palettes.
once(main,'LinearLayout outer=new LinearLayout(this);outer.setBackgroundColor(BG);',
     'LinearLayout outer=new LinearLayout(this);outer.setBackgroundColor(youtubeLayout()&&!lightTheme?Color.rgb(15,15,15):BG);')
once(main,'sidebar.setBackgroundColor(BG);layoutMenu=button("☰",()->setRailExpanded(!railExpanded));',
     'sidebar.setBackgroundColor(youtubeLayout()&&!lightTheme?Color.rgb(15,15,15):BG);layoutMenu=button("☰",()->setRailExpanded(!railExpanded));if(youtubeLayout()&&!lightTheme){layoutMenu.setBackground(pill(Color.rgb(15,15,15),0));layoutMenu.setOnFocusChangeListener((v,f)->layoutMenu.setBackground(pill(f?Color.rgb(39,39,39):Color.rgb(15,15,15),f?Color.WHITE:0)));}')
# Search field gets the compact dark pill and visible focus from the reference.
once(main,'search.setSingleLine(true);search.setTextColor(INK);search.setHintTextColor(MUTED);search.setTextSize(15);',
     'search.setSingleLine(true);search.setTextColor(youtubeLayout()&&!lightTheme?Color.WHITE:INK);search.setHintTextColor(youtubeLayout()&&!lightTheme?Color.rgb(170,170,170):MUTED);search.setTextSize(15);')
once(main,'search.setBackground(shape(SURFACE,0));search.setPadding(dp(16),dp(8),dp(16),dp(8));search.setContentDescription("Search titles");',
     'search.setBackground(youtubeLayout()&&!lightTheme?pill(Color.rgb(39,39,39),0):shape(SURFACE,0));search.setPadding(dp(16),dp(8),dp(16),dp(8));search.setContentDescription("Search titles");if(youtubeLayout()&&!lightTheme)search.setOnFocusChangeListener((v,f)->search.setBackground(pill(f?Color.rgb(47,47,47):Color.rgb(39,39,39),f?Color.WHITE:0)));')
once(main,'Button submit=button("Search",this::submitSearch);submit.setContentDescription("Search submitted text");',
     'Button submit=button("Search",this::submitSearch);submit.setContentDescription("Search submitted text");if(youtubeLayout()&&!lightTheme){submit.setTextColor(Color.WHITE);submit.setBackground(pill(Color.rgb(39,39,39),0));submit.setOnFocusChangeListener((v,f)->submit.setBackground(pill(f?Color.rgb(55,55,55):Color.rgb(39,39,39),f?Color.WHITE:0)));}')
once(main,'card.setBackground(shape(BG,0));card.setFocusable(true);',
     'int cleanBase=youtubeLayout()&&!lightTheme?Color.rgb(15,15,15):BG,cleanFocus=youtubeLayout()&&!lightTheme?Color.rgb(39,39,39):SURFACE,cleanBorder=youtubeLayout()&&!lightTheme?Color.WHITE:ACCENT;card.setBackground(shape(cleanBase,0));card.setFocusable(true);')
once(main,'card.setOnFocusChangeListener((v,f)->{v.setBackground(shape(f?SURFACE:BG,f?ACCENT:0));',
     'card.setOnFocusChangeListener((v,f)->{v.setBackground(shape(f?cleanFocus:cleanBase,f?cleanBorder:0));')

# Android torrent results: keep v1.8 provider behavior, only raise the healthy-result cap.
all_(provider,'Math.min(10,list.size())','Math.min(20,list.size())',1)
all_(provider,'if(out.length()>=10)break','if(out.length()>=20)break',1)
all_(provider,'out.length()<10','out.length()<20',1)

new_torrent_methods=r'''    int torrentHealthColor(int score){return score>=85?Color.rgb(68,190,120):score>=70?Color.rgb(231,179,55):Color.rgb(205,90,96);}
    void confirmTorrentDownload(Catalog.Item item,int season,int episode,JSONObject result){
        LinearLayout panel=column();panel.setPadding(dp(22),dp(20),dp(22),dp(18));
        TextView eyebrow=text("READY TO DOWNLOAD",11,ACCENT);bold(eyebrow);panel.addView(eyebrow);space(panel,8);
        TextView name=text(result.optString("title"),BuildConfig.TV?20:18,INK);bold(name);name.setMaxLines(3);panel.addView(name);space(panel,10);
        panel.addView(text(result.optString("resolution")+"  ·  "+result.optString("codec")+"  ·  "+downloadSize(result.optLong("size_bytes")),14,MUTED));space(panel,8);
        int health=result.optInt("healthScore");TextView stats=text("Seeds "+result.optInt("seeders")+"   ·   Leechers "+(result.has("leechers")?result.optInt("leechers"):"Unknown")+"   ·   Health "+health+"/100",13,INK);panel.addView(stats);space(panel,10);
        ProgressBar bar=new ProgressBar(this,null,android.R.attr.progressBarStyleHorizontal);bar.setMax(100);bar.setProgress(health);bar.setProgressTintList(android.content.res.ColorStateList.valueOf(torrentHealthColor(health)));panel.addView(bar,new LinearLayout.LayoutParams(-1,dp(7)));space(panel,18);
        LinearLayout actions=new LinearLayout(this);actions.setGravity(Gravity.END);final AlertDialog[] dialog=new AlertDialog[1];Button cancel=button("Cancel",()->{if(dialog[0]!=null)dialog[0].dismiss();});actions.addView(cancel);Button download=button("Download",()->{if(dialog[0]!=null)dialog[0].dismiss();try{DirectDownloads.get(this).add(item,season,episode,result,null);message("Download queued. Open Downloads.");}catch(Exception e){message("Could not queue download. Check storage.");}});download.setTextColor(BG);download.setBackground(pill(ACCENT,0));LinearLayout.LayoutParams bp=new LinearLayout.LayoutParams(-2,dp(44));bp.setMargins(dp(10),0,0,0);actions.addView(download,bp);panel.addView(actions);
        dialog[0]=new AlertDialog.Builder(this).setView(panel).create();dialog[0].setOnShowListener(d->{dialog[0].getWindow().setBackgroundDrawable(pill(BG,0));if(BuildConfig.TV)download.requestFocus();});dialog[0].show();
    }
    void torrentResults(Catalog.Item item,int season,int episode,boolean fresh){
        message("Searching TSP Search…");io.execute(()->{try{JSONArray results=new TorrentSearchService(TspSearchProvider.get(this)).search(item,season,episode,fresh);ui.post(()->{if(isDestroyed())return;
            LinearLayout panel=column();panel.setPadding(dp(20),dp(18),dp(20),dp(18));
            LinearLayout heading=new LinearLayout(this);heading.setGravity(Gravity.CENTER_VERTICAL);LinearLayout copy=column();TextView eyebrow=text("HEALTHY TORRENTS",11,ACCENT);bold(eyebrow);copy.addView(eyebrow);TextView headingText=text("Downloads · "+item.title,BuildConfig.TV?24:21,INK);bold(headingText);copy.addView(headingText);heading.addView(copy,new LinearLayout.LayoutParams(0,-2,1));Button refresh=button("↻ Refresh",()->torrentResults(item,season,episode,true));heading.addView(refresh);panel.addView(heading);space(panel,8);panel.addView(text("Up to 20 healthy matches · sorted by relevance, health and reported seeders. Speed depends on peers.",12,MUTED));space(panel,14);
            if(results.length()==0)panel.addView(text("No healthy matching torrents found.",16,INK));
            for(int i=0;i<results.length();i++){JSONObject r=results.optJSONObject(i);if(r==null)continue;final JSONObject result=r;boolean recommended=i==0;int health=result.optInt("healthScore");LinearLayout card=column();card.setPadding(dp(16),dp(14),dp(16),dp(14));int cardColor=youtubeLayout()&&!lightTheme?Color.rgb(33,33,33):alphaColor(SURFACE,0xF0);card.setBackground(pill(cardColor,recommended?ACCENT:0));
                if(recommended){TextView badge=text("★  RECOMMENDED",10,ACCENT);bold(badge);card.addView(badge);space(card,5);}TextView title=text(result.optString("title"),BuildConfig.TV?17:15,INK);bold(title);title.setMaxLines(3);card.addView(title);space(card,8);card.addView(text(result.optString("resolution")+"  ·  "+result.optString("codec")+"  ·  "+downloadSize(result.optLong("size_bytes")),13,MUTED));space(card,6);card.addView(text("Seeds "+result.optInt("seeders")+"   ·   Leechers "+(result.has("leechers")?result.optInt("leechers"):"Unknown")+"   ·   Health "+health+"/100",13,INK));space(card,7);ProgressBar healthBar=new ProgressBar(this,null,android.R.attr.progressBarStyleHorizontal);healthBar.setMax(100);healthBar.setProgress(health);healthBar.setProgressTintList(android.content.res.ColorStateList.valueOf(torrentHealthColor(health)));card.addView(healthBar,new LinearLayout.LayoutParams(-1,dp(6)));space(card,10);Button download=button("Download",()->confirmTorrentDownload(item,season,episode,result));if(recommended){download.setTextColor(BG);download.setBackground(pill(ACCENT,0));}card.addView(download,new LinearLayout.LayoutParams(-1,dp(44)));panel.addView(card);space(panel,10);
            }
            ScrollView scroll=new ScrollView(this);scroll.addView(panel);AlertDialog dialog=new AlertDialog.Builder(this).setView(scroll).setNegativeButton("Close",null).create();dialog.setOnShowListener(d->dialog.getWindow().setBackgroundDrawable(pill(BG,0)));dialog.show();
        });}catch(Exception e){ui.post(()->message(e.getMessage()==null?"TSP Search unavailable.":e.getMessage()));}});
    }
'''
between(main,'    void torrentResults(Catalog.Item item,int season,int episode,boolean fresh){','    void tspKeyGuide(){',new_torrent_methods+'    void tspKeyGuide(){')

# Windows defaults/names/copy.
once('windows/ui/index.html','<option value="youtube">Clean UI · Default</option><option value="google">Modern UI</option><option value="classic">Classic · Original</option>',
     '<option value="youtube">Clean UI</option><option value="google">Modern UI</option><option value="classic">Native / Original UI</option>')
all_('windows/ui/index.html','Up to 10 results','Up to 20 results',1)
all_('windows/ui/app.js','TSP Search · Top 10 matching healthy torrents','TSP Search · Up to 20 matching healthy torrents',1)

# Windows TSP cap: keep search mechanics identical, only return/search up to twenty.
all_('windows/tsp-search.cjs','Math.min(10,Math.max(1,config.maxResults||10))','Math.min(20,Math.max(1,config.maxResults||20))',1)
all_('windows/tsp-search.cjs','if(result.length>=10)break','if(result.length>=20)break',1)

# Cleaner Windows result and confirmation UI.
downloads='windows/ui/downloads.js'
all_(downloads,'select from up to 10 matching healthy torrents','select from up to 20 matching healthy torrents',1)
old_search_start='async function search(fresh=false){'
old_search_end='document.addEventListener(\'click\',async event=>'
text=read(downloads); a=text.find(old_search_start); b=text.find(old_search_end,a)
if a<0 or b<0: raise SystemExit('windows/ui/downloads.js: search function markers not found')
new_search=r'''function torrentHealthClass(score){return score>=85?'excellent':score>=70?'good':'fair';}
function confirmTorrent(selected){return new Promise(resolve=>{let dialog=$('#torrent-confirm');if(!dialog){dialog=document.createElement('dialog');dialog.id='torrent-confirm';document.body.append(dialog);}const health=Number(selected.healthScore)||0;dialog.innerHTML='<section class="torrent-confirm-card"><span class="torrent-kicker">READY TO DOWNLOAD</span><h2>'+escape(selected.title)+'</h2><div class="torrent-chips"><span>'+escape(selected.resolution)+'</span><span>'+escape(selected.codec)+'</span><span>'+size(selected.sizeBytes)+'</span></div><div class="torrent-confirm-stats"><span><b>'+selected.seeders+'</b> seeders</span><span><b>'+(selected.leechers??'Unknown')+'</b> leechers</span><span class="health '+torrentHealthClass(health)+'"><b>'+health+'</b>/100 health</span></div><div class="health-track"><i class="'+torrentHealthClass(health)+'" style="width:'+Math.max(0,Math.min(100,health))+'%"></i></div><p>ZeroPlay will add this torrent to your Downloads queue.</p><div class="torrent-confirm-actions"><button data-confirm-choice="cancel">Cancel</button><button class="primary" data-confirm-choice="download">Download</button></div></section>';const finish=value=>{dialog.close();dialog.onclick=null;resolve(value);};dialog.onclick=e=>{const b=e.target.closest('[data-confirm-choice]');if(b)finish(b.dataset.confirmChoice==='download');};dialog.oncancel=e=>{e.preventDefault();finish(false);};if(!dialog.open)dialog.showModal();});}
async function search(fresh=false){if(!activeDetail)return;const item=activeDetail,episode=item.type==='tv'?{season:Number($('#season')?.value),episode:Number($('#episode')?.value)}:{},token=++request;let dialog=$('#torrent-results');if(!dialog){dialog=document.createElement('dialog');dialog.id='torrent-results';document.body.append(dialog);}dialog.innerHTML='<section class="torrent-results-shell"><div class="torrent-results-head"><div><span class="torrent-kicker">HEALTHY TORRENTS</span><h2>Finding downloads…</h2><p>Checking relevance, reported seeders and health.</p></div><button data-action="close-torrents">Close</button></div></section>';if(!dialog.open)dialog.showModal();try{results=await window.zero.torrentSearch(item,episode,fresh);if(token!==request||!dialog.open)return;dialog.innerHTML='<section class="torrent-results-shell"><div class="torrent-results-head"><div><span class="torrent-kicker">HEALTHY TORRENTS</span><h2>Downloads · '+escape(item.title)+'</h2><p>Up to 20 healthy matches, sorted by relevance and health. Actual speed depends on peers.</p></div><div class="torrent-head-actions"><button data-action="refresh-torrents">↻ Refresh</button><button data-action="close-torrents">Close</button></div></div><div class="torrent-result-list">'+(!results.length?'<div class="torrent-empty">No healthy matching torrents found.</div>':results.map((r,i)=>{const health=Number(r.healthScore)||0;return '<article class="torrent-result-card '+(i===0?'recommended':'')+'">'+(i===0?'<span class="torrent-recommended">★ Recommended</span>':'')+'<h3>'+escape(r.title)+'</h3><div class="torrent-chips"><span>'+escape(r.resolution)+'</span><span>'+escape(r.codec)+'</span><span>'+size(r.sizeBytes)+'</span></div><div class="torrent-stat-row"><span><b>'+r.seeders+'</b><small>Seeders</small></span><span><b>'+(r.leechers??'Unknown')+'</b><small>Leechers</small></span><span class="health '+torrentHealthClass(health)+'"><b>'+health+'/100</b><small>Health</small></span></div><div class="health-track"><i class="'+torrentHealthClass(health)+'" style="width:'+Math.max(0,Math.min(100,health))+'%"></i></div>'+(r.sources?.length?'<small class="torrent-sources">'+escape(r.sources.join(' · '))+'</small>':'')+'<button class="torrent-download '+(i===0?'primary':'')+'" data-torrent-result="'+r.id+'">Download</button></article>';}).join(''))+'</div></section>';dialog._item=item;dialog._episode=episode;}catch(e){dialog.innerHTML='<section class="torrent-results-shell"><div class="torrent-results-head"><div><span class="torrent-kicker">DOWNLOADS</span><h2>Downloads unavailable</h2><p>'+escape(e.message)+'</p></div><button data-action="close-torrents">Close</button></div><button class="primary" data-action="setup-downloads">Set Up Downloads</button></section>';}}
'''
text=text[:a]+new_search+text[b:];write(downloads,text)
old="if(n.dataset.torrentResult){const selected=results.find(r=>r.id===n.dataset.torrentResult);if(!confirm('Download '+selected.title+'?\\n'+selected.resolution+' · '+selected.codec+' · '+size(selected.sizeBytes)+'\\n'+selected.seeders+' seeders'))return;n.disabled=true;const d=$('#torrent-results');await window.zero.downloadAdd(d._item,d._episode,{resultId:n.dataset.torrentResult});n.textContent='Queued';toast('Download queued');}"
new="if(n.dataset.torrentResult){const selected=results.find(r=>r.id===n.dataset.torrentResult);if(!selected||!await confirmTorrent(selected))return;n.disabled=true;const d=$('#torrent-results');await window.zero.downloadAdd(d._item,d._episode,{resultId:n.dataset.torrentResult});n.textContent='Queued';toast('Download queued');}"
once(downloads,old,new)

# Clean UI overrides based on the supplied YouTube reference + torrent modal skin.
layouts=Path('windows/ui/layouts.css')
css=layouts.read_text(encoding='utf-8')
marker='/* 1.8.2 Clean UI YouTube-inspired pass */'
if marker in css: raise SystemExit('Clean UI CSS patch already present')
css += r'''

/* 1.8.2 Clean UI YouTube-inspired pass */
:root[data-layout="youtube"][data-theme="dark"]{--bg:#0f0f0f;--surface:#212121;--muted:#aaa;--ink:#f1f1f1;--mint:#f1f1f1}
:root[data-layout="youtube"] aside{background:#0f0f0f;border:0}
:root[data-layout="youtube"] aside button{color:#aaa;border-radius:10px;background:transparent}
:root[data-layout="youtube"] aside button:hover,:root[data-layout="youtube"] aside button:focus-visible{background:#272727;color:#fff}
:root[data-layout="youtube"] aside button.active{background:#272727;color:#fff}
:root[data-layout="youtube"] .brand span{color:#ff0033}
:root[data-layout="youtube"] main{background:#0f0f0f}
:root[data-layout="youtube"] main>header{min-height:48px;gap:10px}
:root[data-layout="youtube"] main>header:before{content:"ZEROPLAY";color:#f1f1f1;font-size:13px;font-weight:800;letter-spacing:.04em;min-width:92px}
:root[data-layout="youtube"] #search-form{height:42px;max-width:560px;margin:0 auto;background:#272727;border:1px solid #3f3f3f;border-radius:24px;padding:3px 5px 3px 14px;box-shadow:none}
:root[data-layout="youtube"] #search-form:focus-within{border-color:#f1f1f1;box-shadow:0 0 0 1px #f1f1f133}
:root[data-layout="youtube"] #search-form>span{font-size:21px;color:#aaa}
:root[data-layout="youtube"] #query{color:#f1f1f1;font-size:14px;padding:7px 8px}
:root[data-layout="youtube"] #query::placeholder{color:#aaa}
:root[data-layout="youtube"] #search-form button{height:32px;padding:5px 14px;border-radius:18px;background:#3a3a3a;color:#f1f1f1;font-weight:600}
:root[data-layout="youtube"] #search-form button:hover{background:#4a4a4a}
:root[data-layout="youtube"] .surprise-button{background:#272727;border-color:#3f3f3f;color:#f1f1f1}
:root[data-layout="youtube"] .surprise-button:hover{background:#3a3a3a}
:root[data-layout="youtube"] .hero{background:#181818;border-radius:14px}
:root[data-layout="youtube"] .hero-shade{background:linear-gradient(90deg,#0f0f0ff2,#0f0f0f75 58%,#0f0f0f24),linear-gradient(0deg,#0f0f0f,transparent 62%)}
:root[data-layout="youtube"] .card{border-radius:12px}
:root[data-layout="youtube"] .card:focus-visible{outline:3px solid #fff;outline-offset:3px}
:root[data-layout="youtube"] .card-title{color:#f1f1f1;font-weight:650}
:root[data-layout="youtube"] .card small{color:#aaa}
:root[data-layout="youtube"] .row-section h3{font-size:16px;font-weight:700;color:#f1f1f1}
:root[data-layout="youtube"] #status{color:#aaa}
@media(max-width:760px){:root[data-layout="youtube"] #search-form{max-width:none;margin:0}:root[data-layout="youtube"] main>header:before{display:none}}

/* The torrent picker and confirmation follow the active ZeroPlay UI instead of stock browser prompts. */
#torrent-results{width:min(980px,94vw);max-height:90vh;padding:0;background:color-mix(in srgb,var(--bg) 94%,#000);border:1px solid color-mix(in srgb,var(--ink) 15%,transparent);border-radius:22px;overflow:auto}
.torrent-results-shell{padding:26px}
.torrent-results-head{display:flex;align-items:flex-start;justify-content:space-between;gap:20px;position:sticky;top:0;z-index:3;padding:2px 0 18px;background:linear-gradient(color-mix(in srgb,var(--bg) 98%,transparent) 72%,transparent);backdrop-filter:blur(16px)}
.torrent-results-head h2{margin:6px 0 4px;font-size:25px}.torrent-results-head p{margin:0;color:var(--muted)}.torrent-head-actions{display:flex;gap:8px}.torrent-kicker{font-size:10px;letter-spacing:.18em;font-weight:800;color:var(--mint)}
.torrent-result-list{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:12px}
.torrent-result-card{position:relative;padding:18px;border:1px solid color-mix(in srgb,var(--ink) 12%,transparent);border-radius:16px;background:color-mix(in srgb,var(--surface) 88%,transparent);box-shadow:0 8px 28px #0002}
.torrent-result-card.recommended{border-color:color-mix(in srgb,var(--mint) 70%,transparent);box-shadow:0 10px 32px #0003,inset 0 0 0 1px color-mix(in srgb,var(--mint) 24%,transparent)}
.torrent-result-card h3{font-size:15px;line-height:1.35;margin:8px 0 12px;min-height:40px}.torrent-recommended{display:inline-block;font-size:10px;font-weight:800;letter-spacing:.08em;color:var(--mint)}
.torrent-chips{display:flex;gap:6px;flex-wrap:wrap;margin:0 0 14px}.torrent-chips span{font-size:11px;padding:5px 8px;border-radius:999px;background:color-mix(in srgb,var(--ink) 8%,transparent);color:var(--ink)}
.torrent-stat-row,.torrent-confirm-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:10px 0}.torrent-stat-row>span,.torrent-confirm-stats>span{padding:9px;border-radius:10px;background:color-mix(in srgb,var(--ink) 5%,transparent)}.torrent-stat-row b,.torrent-confirm-stats b{display:block;font-size:15px;color:var(--ink)}.torrent-stat-row small{display:block;color:var(--muted);font-size:10px;margin-top:3px}
.health.excellent{color:#6ed69a}.health.good{color:#e5b64f}.health.fair{color:#df7379}.health-track{height:5px;border-radius:999px;background:color-mix(in srgb,var(--ink) 9%,transparent);overflow:hidden;margin:10px 0}.health-track i{display:block;height:100%;border-radius:999px}.health-track i.excellent{background:#6ed69a}.health-track i.good{background:#e5b64f}.health-track i.fair{background:#df7379}
.torrent-sources{display:block;min-height:18px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.torrent-download{width:100%;margin-top:14px}.torrent-empty{grid-column:1/-1;padding:50px;text-align:center;color:var(--muted);border:1px dashed color-mix(in srgb,var(--ink) 14%,transparent);border-radius:16px}
#torrent-confirm{width:min(560px,92vw);padding:0;border-radius:22px;background:color-mix(in srgb,var(--bg) 96%,#000);border:1px solid color-mix(in srgb,var(--ink) 14%,transparent)}.torrent-confirm-card{padding:28px}.torrent-confirm-card h2{font-size:21px;line-height:1.35;margin:8px 0 16px}.torrent-confirm-card p{margin:16px 0 0}.torrent-confirm-actions{display:flex;justify-content:flex-end;gap:9px;margin-top:22px}
:root[data-layout="youtube"] #torrent-results,:root[data-layout="youtube"] #torrent-confirm{background:#181818;border-color:#3f3f3f}:root[data-layout="youtube"] .torrent-result-card{background:#212121;border-color:#353535}:root[data-layout="youtube"] .torrent-result-card.recommended{border-color:#f1f1f1}:root[data-layout="youtube"] .torrent-kicker,:root[data-layout="youtube"] .torrent-recommended{color:#f1f1f1}:root[data-layout="youtube"] .torrent-result-card .primary,:root[data-layout="youtube"] .torrent-confirm-card .primary{background:#f1f1f1;color:#0f0f0f;border-color:#f1f1f1}
@media(max-width:700px){.torrent-results-shell{padding:18px}.torrent-results-head{flex-direction:column}.torrent-result-list{grid-template-columns:1fr}.torrent-stat-row,.torrent-confirm-stats{grid-template-columns:1fr 1fr 1fr}}
'''
layouts.write_text(css,encoding='utf-8')

# Small source sanity checks before CI compiles/tests.
assert 'Math.min(20,list.size())' in read(provider)
assert 'if(out.length()>=20)break' in read(provider)
assert 'Math.min(20,Math.max(1,config.maxResults||20))' in read('windows/tsp-search.cjs')
assert 'if(result.length>=20)break' in read('windows/tsp-search.cjs')
assert 'BuildConfig.TV?"classic":"google"' in read(main)
assert "uiLayout:'youtube'" in read('windows/main.cjs')
print('Applied ZeroPlay 1.8.2 platform defaults, Clean UI styling, and 20-result torrent polish.')
