from pathlib import Path


def replace_once(path, old, new):
    p=Path(path); text=p.read_text(encoding='utf-8'); count=text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected exactly one match, found {count}: {old[:120]!r}')
    p.write_text(text.replace(old,new,1),encoding='utf-8')


def replace_all(path, old, new, minimum=1):
    p=Path(path); text=p.read_text(encoding='utf-8'); count=text.count(old)
    if count < minimum:
        raise SystemExit(f'{path}: expected at least {minimum} matches, found {count}: {old!r}')
    p.write_text(text.replace(old,new),encoding='utf-8')
    return count

# Private Android TV can fall back to a build-time TSP key. Public flavors keep this empty.
replace_once(
    'app/src/main/java/com/zerostreams/app/TspSearchProvider.java',
    ' String key(){try{Cipher c=Cipher.getInstance("AES/GCM/NoPadding");c.init(2,secret(),new GCMParameterSpec(128,Base64.decode(prefs.getString("iv",""),2)));return new String(c.doFinal(Base64.decode(prefs.getString("key",""),2)),"UTF-8");}catch(Exception e){return "";}}',
    ' String key(){try{String saved=prefs.getString("key","");if(!saved.isEmpty()){Cipher c=Cipher.getInstance("AES/GCM/NoPadding");c.init(2,secret(),new GCMParameterSpec(128,Base64.decode(prefs.getString("iv",""),2)));return new String(c.doFinal(Base64.decode(saved,2)),"UTF-8");}}catch(Exception ignored){}return BuildConfig.DEFAULT_TSP_KEY==null?"":BuildConfig.DEFAULT_TSP_KEY;}\n boolean bundled(){return BuildConfig.DEFAULT_TSP_KEY!=null&&!BuildConfig.DEFAULT_TSP_KEY.isEmpty();}'
)

main='app/src/main/java/com/zerostreams/app/MainActivity.java'
replace_once(
    main,
    'JSONObject media=RawCast.get(this).stream(source.optString("type"),source.optString("tmdb"),source.optInt("season",1),source.optInt("episode",1));ui.post(()->{if(!isDestroyed())openStream(item,media,key);});',
    'JSONObject media=RawCast.get(this).stream(source.optString("type"),source.optString("tmdb"),source.optInt("season",1),source.optInt("episode",1));media.put("tmdb",source.optString("tmdb")).put("type",source.optString("type")).put("season",source.optInt("season",1)).put("episode",source.optInt("episode",1));ui.post(()->{if(!isDestroyed())openStream(item,media,key);});'
)
replace_once(
    main,
    'else startActivity(new Intent(this,PlayerActivity.class).putExtra("stream",source.toString()).putExtra("title",item.title).putExtra("key",key).putExtra("parent",item.id).putExtra("live",item.type.equals("live")));',
    'else startActivity(new Intent(this,PlayerActivity.class).putExtra("stream",source.toString()).putExtra("title",item.title).putExtra("key",key).putExtra("parent",item.id).putExtra("live",item.type.equals("live")).putExtra("tmdb",source.optString("tmdb")).putExtra("mediaType",source.optString("type")).putExtra("season",source.optInt("season",0)).putExtra("episode",source.optInt("episode",1)));'
)
replace_once(
    main,
    'JSONObject source=new JSONObject().put("url",android.net.Uri.fromFile(file).toString()).put("mimeType",j.optString("mime","video/mp4"));startActivity(new Intent(this,PlayerActivity.class).putExtra("stream",source.toString()).putExtra("title",j.optString("title")).putExtra("key","download:"+j.optString("id")).putExtra("parent","download:"+j.optString("id")));',
    'JSONObject source=new JSONObject().put("url",android.net.Uri.fromFile(file).toString()).put("mimeType",j.optString("mime","video/mp4")).put("tmdb",j.optString("tmdb")).put("type",j.optString("type","movie")).put("season",j.optInt("season",0)).put("episode",j.optInt("episode",1));startActivity(new Intent(this,PlayerActivity.class).putExtra("stream",source.toString()).putExtra("title",j.optString("title")).putExtra("key","download:"+j.optString("id")).putExtra("parent","download:"+j.optString("id")));'
)
replace_once(
    main,
    'if(state.equals("completed")){panel.addView(button("Open file",()->openDownloaded(j)));panel.addView(button("Delete Video",()->confirmDeleteDownload(j)));}',
    'if(state.equals("completed")){panel.addView(button("Open file",()->openDownloaded(j)));panel.addView(button("Open in external player",()->ExternalPlayer.open(this,new File(j.optString("file")),j.optString("mime","video/*"))));panel.addView(button("Delete Video",()->confirmDeleteDownload(j)));}'
)
replace_once(
    main,
    'panel.addView(button("Downloads → Torrent Search",this::torrentSearchSettings));panel.addView(text("Download folder: "+DirectDownloads.get(this).folder,12,MUTED));',
    'panel.addView(button("Downloads → Torrent Search",this::torrentSearchSettings));panel.addView(button("Automatic Subtitles · SubDL",this::subtitleSettings));panel.addView(text("Downloaded videos use local SRT/VTT/ASS files first. SubDL is only used as a fallback when configured.",12,MUTED));panel.addView(text("Download folder: "+DirectDownloads.get(this).folder,12,MUTED));'
)
replace_once(
    main,
    'TextView result=text(api.prefs.contains("key")?"API key saved":"Not configured",14,MUTED);',
    'TextView result=text(api.prefs.contains("key")?"API key saved":api.bundled()?"Private TV key bundled":"Not configured",14,MUTED);'
)
replace_once(
    main,
    'if(BuildConfig.TV){LinearLayout.LayoutParams ap=new LinearLayout.LayoutParams(dp(210),-2);ap.setMargins(dp(22),0,0,0);heading.addView(actions,ap);}else{space(info,14);info.addView(actions,new LinearLayout.LayoutParams(-1,-2));}panel.addView(heading);',
    'boolean wideDetails=BuildConfig.TV||getResources().getConfiguration().screenWidthDp>=720;if(wideDetails){LinearLayout.LayoutParams ap=new LinearLayout.LayoutParams(dp(BuildConfig.TV?210:220),-2);ap.setMargins(dp(22),0,0,0);heading.addView(actions,ap);}panel.addView(heading);if(!wideDetails){space(panel,16);panel.addView(actions,new LinearLayout.LayoutParams(-1,-2));}'
)
subtitle_method='''    void subtitleSettings(){SubtitleProvider api=SubtitleProvider.get(this);LinearLayout panel=column();panel.setPadding(dp(20),dp(16),dp(20),dp(16));Switch enabled=new Switch(this);enabled.setText("Automatic subtitles when no local subtitle exists");enabled.setTextColor(INK);enabled.setChecked(api.prefs.getBoolean("enabled",true));panel.addView(enabled);panel.addView(text("SubDL API key",14,INK));EditText key=new EditText(this);key.setSingleLine(true);key.setInputType(android.text.InputType.TYPE_CLASS_TEXT|android.text.InputType.TYPE_TEXT_VARIATION_PASSWORD);key.setHint(api.key().isEmpty()?"Paste your free key":"Saved · leave blank to keep it");panel.addView(key);panel.addView(text("Free keys are available from SubDL. ZeroPlay stores the key in Android Keystore and only uses it for your own subtitle searches.",12,MUTED));space(panel,10);panel.addView(text("Preferred subtitle language code",14,INK));EditText language=new EditText(this);language.setSingleLine(true);language.setText(api.language());language.setHint("EN");panel.addView(language);TextView result=text(api.key().isEmpty()?"Not configured":"SubDL key saved",14,MUTED);panel.addView(result);panel.addView(button("Get free SubDL key",()->{try{startActivity(new Intent(Intent.ACTION_VIEW,android.net.Uri.parse("https://subdl.com/api-doc")));}catch(Exception e){message("Open subdl.com/api-doc on your phone or computer.");}}));panel.addView(button("Save",()->{try{api.save(key.getText().toString().trim(),enabled.isChecked(),language.getText().toString());key.setText("");result.setText("Subtitle settings saved");}catch(Exception e){result.setText(e.getMessage()==null?"Check the SubDL key.":e.getMessage());}}));panel.addView(button("Test Connection",()->{result.setText("Testing…");io.execute(()->{try{api.test();ui.post(()->result.setText("SubDL connected"));}catch(Exception e){ui.post(()->result.setText(e.getMessage()==null?"SubDL unavailable":e.getMessage()));}});}));panel.addView(button("Remove saved key",()->{api.remove();key.setText("");result.setText("SubDL key removed");}));ScrollView scroll=new ScrollView(this);scroll.addView(panel);new AlertDialog.Builder(this).setTitle("Automatic Subtitles").setView(scroll).setNegativeButton("Close",null).show();}\n'''
replace_once(main,'    String downloadSize(long n){',subtitle_method+'    String downloadSize(long n){')

# Windows: keep internal playback as default, expose a separate OS-player handoff.
replace_once(
    'windows/main.cjs',
    "  ipcMain.handle('download-action',async(event,id,action,value)=>{trusted(event);const result=await downloads.action(String(id),action,value);if(action==='open'){const job=downloads.jobs.find(j=>j.id===String(id));await openLive('Downloads',0,{name:job.item.title,url:pathToFileURL(result).href,headers:{},offline:true});}return true;});",
    "  ipcMain.handle('download-action',async(event,id,action,value)=>{trusted(event);if(action==='external'){const file=await downloads.action(String(id),'open',value);const failure=await shell.openPath(file);if(failure)throw Error(failure);return true;}const result=await downloads.action(String(id),action,value);if(action==='open'){const job=downloads.jobs.find(j=>j.id===String(id));await openLive('Downloads',0,{name:job.item.title,url:pathToFileURL(result).href,headers:{},offline:true});}return true;});"
)
replace_once(
    'windows/ui/downloads.js',
    "(j.state==='completed'?'<button data-job=\"'+j.id+'\" data-job-action=\"open\">Play offline</button><button data-job=\"'+j.id+'\" data-job-action=\"delete\">Delete Video</button>':'')",
    "(j.state==='completed'?'<button data-job=\"'+j.id+'\" data-job-action=\"open\">Play offline</button><button data-job=\"'+j.id+'\" data-job-action=\"external\">Open in external player</button><button data-job=\"'+j.id+'\" data-job-action=\"delete\">Delete Video</button>':'')"
)

# Release plumbing.
replace_all('.github/workflows/release.yml','1.8.0','1.8.1',minimum=6)
replace_all('scripts/publish-release.py','1.8.0','1.8.1',minimum=8)

print('Applied guarded ZeroPlay 1.8.1 source patch.')
