'use strict';
const fs=require('fs');
const file='app/src/main/java/com/zerostreams/app/MainActivity.java';
let s=fs.readFileSync(file,'utf8');

const start=s.indexOf('    void ensureCarouselSource(String mode){');
const end=s.indexOf('    void confirmResetApplication(){');
if(start<0||end<0||end<=start) throw new Error('Carousel source methods not found');

const replacement=`    void ensureCarouselSource(String mode){
        if(mode.equals("top")||mode.equals("watchlist")||mode.equals("continue")||carouselSourceCache.containsKey(mode)||!carouselSourceLoading.add(mode))return;
        String key=tmdbKey();
        io.execute(()->{
            List<Catalog.Item> loaded=new ArrayList<>();
            try{loaded=ContentApi.carouselItems(key,mode);}catch(Exception ignored){}
            List<Catalog.Item> ready=loaded;
            ui.post(()->{
                carouselSourceLoading.remove(mode);
                carouselSourceCache.put(mode,ready);
                if(!isDestroyed()&&category.equals("Home")&&carouselSource().equals(mode)){
                    heroIndex=0;
                    stopPreview();
                    render();
                }
            });
        });
    }
    List<Catalog.Item> carouselSourceItems(List<Catalog.Item> all){
        List<Catalog.Item> source=new ArrayList<>();String mode=carouselSource();
        if(mode.equals("watchlist")){
            for(String id:favorites()){
                String saved=prefs.getString("saved:"+id,"");
                if(!saved.isEmpty())try{source.add(new Catalog.Item(new JSONObject(saved)));}catch(Exception ignored){}
            }
        }else if(mode.equals("continue")){
            source.addAll(continuing());
        }else if(mode.equals("top")){
            for(Catalog.Item item:all)if(item!=null&&item.raw.optBoolean("trending")&&!item.raw.optBoolean("upcoming"))source.add(item);
            if(source.isEmpty())source.addAll(all);
        }else{
            List<Catalog.Item> cached=carouselSourceCache.get(mode);
            if(cached!=null)source.addAll(cached);else ensureCarouselSource(mode);
        }
        LinkedHashMap<String,Catalog.Item> unique=new LinkedHashMap<>();
        for(Catalog.Item item:source){
            if(item==null||item.type.equals("live")||item.type.equals("manga"))continue;
            if(item.raw.optString("backdrop").isEmpty()&&item.poster.isEmpty())continue;
            unique.put(item.type+":"+item.id,item);
            if(unique.size()>=10)break;
        }
        return new ArrayList<>(unique.values());
    }
`;
s=s.slice(0,start)+replacement+s.slice(end);

const oldPicker='if(category.equals("Home")){scroll.scrollTo(0,0);ensureCarouselSource(selectedMode);render();}';
const newPicker='if(!selectedMode.equals("top")&&!selectedMode.equals("watchlist")&&!selectedMode.equals("continue"))carouselSourceCache.remove(selectedMode);if(category.equals("Home")){scroll.scrollTo(0,0);ensureCarouselSource(selectedMode);render();}';
if(!s.includes(oldPicker)) throw new Error('Carousel picker update point not found');
s=s.replace(oldPicker,newPicker);

fs.writeFileSync(file,s);
console.log('Android/TV carousel now uses dedicated ordered source feeds and no longer falls back to Trending for empty local sources.');
