const fs=require('node:fs');

function replace(path,from,to,label){
  let text=fs.readFileSync(path,'utf8');
  if(text.includes(to)){console.log(label+' already applied');return;}
  if(!text.includes(from))throw new Error(label+' source pattern not found in '+path);
  text=text.replace(from,to);
  fs.writeFileSync(path,text);
  console.log('Applied '+label);
}

const mainActivity='app/src/main/java/com/zerostreams/app/MainActivity.java';
let android=fs.readFileSync(mainActivity,'utf8');
if(!android.includes('carouselSourceCache')){
  android=android.replace(
    '    private final Map<String,JSONArray> providerCache=new HashMap<>();private final Set<String> providerLoading=new HashSet<>();\n',
    '    private final Map<String,JSONArray> providerCache=new HashMap<>();private final Set<String> providerLoading=new HashSet<>();\n    private final Map<String,List<Catalog.Item>> carouselSourceCache=new HashMap<>();private final Set<String> carouselSourceLoading=new HashSet<>();\n'
  );
  if(!android.includes('carouselSourceCache'))throw new Error('Could not add Android carousel source cache');

  const oldPicker='    void carouselSourcePicker(Button anchor){String[] labels={"This Week Top Picks - Default","Watchlist","Recommended Movies","Popular Movies","Now Playing","Continue Watching"};String[] ids={"top","watchlist","recommended","popular","now","continue"};int selected=Math.max(0,Arrays.asList(ids).indexOf(carouselSource()));AlertDialog picker=new AlertDialog.Builder(this).setTitle("Homepage carousel").setSingleChoiceItems(labels,selected,(dialog,which)->{prefs.edit().putString("carouselSource",ids[which]).apply();heroIndex=0;stopPreview();anchor.setText("Homepage carousel · "+labels[which]+"  ▾");dialog.dismiss();if(category.equals("Home")){scroll.scrollTo(0,0);load();}}).setNegativeButton("Cancel",null).create();picker.setOnShowListener(d->{picker.getWindow().setBackgroundDrawable(shape(SURFACE,0));});picker.show();}\n';
  const newPicker='    void carouselSourcePicker(Button anchor){String[] labels={"This Week Top Picks - Default","Watchlist","Recommended Movies","Popular Movies","Now Playing","Continue Watching"};String[] ids={"top","watchlist","recommended","popular","now","continue"};int selected=Math.max(0,Arrays.asList(ids).indexOf(carouselSource()));AlertDialog picker=new AlertDialog.Builder(this).setTitle("Homepage carousel").setSingleChoiceItems(labels,selected,(dialog,which)->{String selectedMode=ids[which];prefs.edit().putString("carouselSource",selectedMode).commit();heroIndex=0;stopPreview();anchor.setText("Homepage carousel · "+labels[which]+"  ▾");anchor.setContentDescription("Homepage carousel · "+labels[which]);dialog.dismiss();if(category.equals("Home")){scroll.scrollTo(0,0);ensureCarouselSource(selectedMode);render();}}).setNegativeButton("Cancel",null).create();picker.setOnShowListener(d->{picker.getWindow().setBackgroundDrawable(shape(SURFACE,0));});picker.show();}\n    void ensureCarouselSource(String mode){if(mode.equals("top")||mode.equals("watchlist")||mode.equals("continue")||carouselSourceCache.containsKey(mode)||!carouselSourceLoading.add(mode))return;String key=tmdbKey();io.execute(()->{List<Catalog.Item> loaded=new ArrayList<>();try{loaded=ContentApi.carouselItems(key,mode);}catch(Exception ignored){}List<Catalog.Item> ready=loaded;ui.post(()->{carouselSourceLoading.remove(mode);carouselSourceCache.put(mode,ready);if(!isDestroyed()&&category.equals("Home")&&carouselSource().equals(mode)){heroIndex=0;render();}});});}\n';
  if(!android.includes(oldPicker))throw new Error('Android carousel picker pattern not found');
  android=android.replace(oldPicker,newPicker);

  const oldItems='    List<Catalog.Item> carouselSourceItems(List<Catalog.Item> all){List<Catalog.Item> source=new ArrayList<>();String mode=carouselSource();if(mode.equals("watchlist")){for(String id:favorites()){String saved=prefs.getString("saved:"+id,"");if(!saved.isEmpty())try{source.add(new Catalog.Item(new JSONObject(saved)));}catch(Exception ignored){}}}else if(mode.equals("continue")){source.addAll(continuing());}else{for(Catalog.Item item:all){if(mode.equals("recommended")&&item.type.equals("movie")&&item.raw.optBoolean("recommended"))source.add(item);else if(mode.equals("popular")&&item.type.equals("movie")&&item.raw.optBoolean("popular"))source.add(item);else if(mode.equals("now")&&item.type.equals("movie")&&item.raw.optBoolean("nowPlaying"))source.add(item);else if(mode.equals("top")&&item.raw.optBoolean("trending")&&!item.raw.optBoolean("upcoming"))source.add(item);}if(mode.equals("popular"))Collections.sort(source,(a,b)->Double.compare(b.raw.optDouble("popularity",0),a.raw.optDouble("popularity",0)));}\n        if(source.isEmpty()&&mode.equals("top"))source.addAll(all);LinkedHashMap<String,Catalog.Item> unique=new LinkedHashMap<>();for(Catalog.Item item:source){if(item==null||item.type.equals("live")||item.type.equals("manga"))continue;unique.put(item.type+":"+item.id,item);if(unique.size()>=10)break;}return new ArrayList<>(unique.values());}\n';
  const newItems='    List<Catalog.Item> carouselSourceItems(List<Catalog.Item> all){List<Catalog.Item> source=new ArrayList<>();String mode=carouselSource();if(mode.equals("watchlist")){for(String id:favorites()){String saved=prefs.getString("saved:"+id,"");if(!saved.isEmpty())try{source.add(new Catalog.Item(new JSONObject(saved)));}catch(Exception ignored){}}}else if(mode.equals("continue")){source.addAll(continuing());}else if(mode.equals("top")){for(Catalog.Item item:all)if(item.raw.optBoolean("trending")&&!item.raw.optBoolean("upcoming"))source.add(item);if(source.isEmpty())source.addAll(all);}else{List<Catalog.Item> cached=carouselSourceCache.get(mode);if(cached!=null)source.addAll(cached);else ensureCarouselSource(mode);}\n        LinkedHashMap<String,Catalog.Item> unique=new LinkedHashMap<>();for(Catalog.Item item:source){if(item==null||item.type.equals("live")||item.type.equals("manga"))continue;unique.put(item.type+":"+item.id,item);if(unique.size()>=10)break;}return new ArrayList<>(unique.values());}\n';
  if(!android.includes(oldItems))throw new Error('Android carousel item selector pattern not found');
  android=android.replace(oldItems,newItems);
  fs.writeFileSync(mainActivity,android);
  console.log('Applied Android carousel source reload fix');
}else console.log('Android carousel source reload fix already applied');

const contentApi='app/src/main/java/com/zerostreams/app/ContentApi.java';
let api=fs.readFileSync(contentApi,'utf8');
if(!api.includes('static List<Catalog.Item> carouselItems')){
  const marker='    static JSONObject browsePageData(String key,String section,int page) throws Exception {return tmdb(section.equals("Series")?"/tv/popular":"/movie/popular",key,"&page="+page);}\n';
  const addition=marker+'    static List<Catalog.Item> carouselItems(String key,String mode) throws Exception {String path,media;if(mode.equals("recommended")){path="/movie/top_rated";media="movie";}else if(mode.equals("popular")){path="/movie/popular";media="movie";}else if(mode.equals("now")){path="/movie/now_playing";media="movie";}else if(mode.equals("top")){path="/trending/all/week";media="";}else return new ArrayList<>();return tmdbRows(tmdb(path,key,"&page=1").getJSONArray("results"),media,false);}\n';
  if(!api.includes(marker))throw new Error('ContentApi browsePageData marker not found');
  api=api.replace(marker,addition);
  fs.writeFileSync(contentApi,api);
  console.log('Added dedicated TMDB carousel source endpoints');
}else console.log('Dedicated carousel endpoints already present');

const windowsMain='windows/main.cjs';
let win=fs.readFileSync(windowsMain,'utf8');
if(win.includes("title:'Exit ZeroPlay?'")){
  win=win.replace('let main,player,toolbar,playerHost,current,scanTimer,cursorTimer,qrWorker,scanning=false,state,file,guard,lastProgress=0,offlineSelection,exitPromptOpen=false,allowWindowClose=false;','let main,player,toolbar,playerHost,current,scanTimer,cursorTimer,qrWorker,scanning=false,state,file,guard,lastProgress=0,offlineSelection;');
  const oldClose="main.once('ready-to-show',()=>{versions.confirmCurrent(app.getVersion());main.show();if(sportsCacheFailures.length&&!smoke)dialog.showMessageBox(main,{type:'warning',title:'Old Live Sports cache',message:'Some retired sports cache files could not be removed. Keep Microsoft Defender enabled and remove or quarantine any detected item in Protection History. The new sports player uses a memory-only browser session.'});});main.on('close',event=>{if(smoke||allowWindowClose)return;event.preventDefault();if(exitPromptOpen)return;exitPromptOpen=true;dialog.showMessageBox(main,{type:'question',title:'Exit ZeroPlay?',message:'Are you sure you want to close ZeroPlay?',buttons:['No, Go Back','Yes, exit'],defaultId:0,cancelId:0,noLink:true}).then(result=>{exitPromptOpen=false;if(result.response===1){allowWindowClose=true;app.quit();}}).catch(()=>{exitPromptOpen=false;});});main.on('closed',closePlayer);await main.loadURL(uiURL);";
  const newClose="main.once('ready-to-show',()=>{versions.confirmCurrent(app.getVersion());main.show();if(sportsCacheFailures.length&&!smoke)dialog.showMessageBox(main,{type:'warning',title:'Old Live Sports cache',message:'Some retired sports cache files could not be removed. Keep Microsoft Defender enabled and remove or quarantine any detected item in Protection History. The new sports player uses a memory-only browser session.'});});main.on('closed',closePlayer);await main.loadURL(uiURL);";
  if(!win.includes(oldClose))throw new Error('Windows exit confirmation pattern not found');
  win=win.replace(oldClose,newClose);
  fs.writeFileSync(windowsMain,win);
  console.log('Removed Windows exit confirmation');
}else console.log('Windows exit confirmation already removed');
