package com.zerostreams.app;
import org.json.JSONArray;
interface TorrentSearchProvider {JSONArray search(Catalog.Item item,int season,int episode,boolean fresh)throws Exception;}
