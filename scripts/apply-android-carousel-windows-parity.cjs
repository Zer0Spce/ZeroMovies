'use strict';
const fs=require('fs');
const file='app/src/main/java/com/zerostreams/app/MainActivity.java';
let s=fs.readFileSync(file,'utf8');
const old=`    void ensureCarouselSource(String mode){if(mode.equals("top")||mode.equals("watchlist")||mode.equals("continue")||carouselSourceCache.containsKey(mode)||!carouselSourceLoading.add(mode))return;String key=tmdbKey();io.execute(()->{List<Catalog.Item> loaded=new ArrayList<>();try{loaded=ContentApi.carouselItems(key,mode);}catch(Exception ignored){}List<Catalog.Item> ready=loaded;ui.post(()->{carouselSourceLoading.remove(mode);carouselSourceCache.put(mode,ready);if(!isDestroyed()&&category.equals("Home")&&carouselSource().equals(mode)){heroIndex=0;render();}});});}
    List<Catalog.Item> carouselSourceItems(List<Catalog.Item> all){List<Catalog.Item> source=new ArrayList<>();String mode=carouselSource();if(mode.equals("watchlist")){for(String id:favorites()){String saved=prefs.getString("saved:"+id,"");if(!saved.isEmpty())try{source.add(new Catalog.Item(new JSONObject(saved)));}catch(Exception ignored){}}}else if(mode.equals("continue")){source.addAll(continuing());}else if(mode.equals("top")){for(Catalog.Item item:all)if(item.raw.optBoolean("trending")&&!item.raw.optBoolean("upcoming"))source.add(item);if(source.isEmpty())source.addAll(all);}else{List<Catalog.Item> cached=carouselSourceCache.get(mode);if(cached!=null)source.addAll(cached);else ensureCarouselSource(mode);}
        LinkedHashMap<String,Catalog.Item> unique=new LinkedHashMap<>();for(Catalog.Item item:source){if(item==null||item.type.equals("live")||item.type.equals("manga"))continue;unique.put(item.type+":"+item.id,item);if(unique.size()>=10)break;}return new ArrayList<>(unique.values());}`;
const replacement=`    void ensureCarouselSource(String mode){/* Android home already loads all carousel source feeds in browseMovies(); no second fetch is needed. */}
    List<Catalog.Item> carouselSourceItems(List<Catalog.Item> all){
        List<Catalog.Item> source=new ArrayList<>();String mode=carouselSource();
        if(mode.equals("watchlist")){
            for(String id:favorites()){String saved=prefs.getString("saved:"+id,"");if(!saved.isEmpty())try{source.add(new Catalog.Item(new JSONObject(saved)));}catch(Exception ignored){}}
        }else if(mode.equals("continue")){
            source.addAll(continuing());
        }else{
            for(Catalog.Item item:all){
                if(item==null)continue;
                boolean include=mode.equals("top")?item.raw.optBoolean("trending")&&!item.raw.optBoolean("upcoming"):
                    mode.equals("recommended")?item.type.equals("movie")&&item.raw.optBoolean("recommended"):
                    mode.equals("popular")?item.type.equals("movie")&&item.raw.optBoolean("popular"):
                    mode.equals("now")?item.type.equals("movie")&&item.raw.optBoolean("nowPlaying"):false;
                if(include)source.add(item);
            }
        }
        LinkedHashMap<String,Catalog.Item> unique=new LinkedHashMap<>();
        for(Catalog.Item item:source){if(item==null||item.type.equals("live")||item.type.equals("manga")||(item.raw.optString("backdrop").isEmpty()&&item.poster.isEmpty()))continue;unique.put(item.type+":"+item.id,item);if(unique.size()>=10)break;}
        if(unique.isEmpty()&&!mode.equals("top"))for(Catalog.Item item:all){if(item!=null&&item.raw.optBoolean("trending")&&!item.raw.optBoolean("upcoming")&&!item.type.equals("live")&&!item.type.equals("manga")&&(!item.raw.optString("backdrop").isEmpty()||!item.poster.isEmpty())){unique.put(item.type+":"+item.id,item);if(unique.size()>=10)break;}}
        return new ArrayList<>(unique.values());
    }`;
if(s.includes(old)) s=s.replace(old,replacement);
s=s.replaceAll('item.backdrop.isEmpty()','item.raw.optString("backdrop").isEmpty()');
fs.writeFileSync(file,s);
console.log('Android/TV carousel source behavior now mirrors Windows home data selection.');
