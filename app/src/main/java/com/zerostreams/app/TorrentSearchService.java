package com.zerostreams.app;
import org.json.JSONArray;
final class TorrentSearchService {final TorrentSearchProvider provider;TorrentSearchService(TorrentSearchProvider p){provider=p;}JSONArray search(Catalog.Item item,int season,int episode,boolean fresh)throws Exception{return provider.search(item,season,episode,fresh);}}
