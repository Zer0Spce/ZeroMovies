package com.zerostreams.app;
import java.util.*;
/** Append results without shifting previously loaded cards or duplicating titles. */
final class CatalogPaging {
    static List<Catalog.Item> append(List<Catalog.Item> existing,List<Catalog.Item> incoming){
        Set<String> seen=new HashSet<>();for(Catalog.Item item:existing)seen.add(item.id);
        List<Catalog.Item> added=new ArrayList<>();for(Catalog.Item item:incoming)if(seen.add(item.id)){existing.add(item);added.add(item);}return added;
    }
    static boolean hasMore(int page,int totalPages){return page>0&&page<Math.min(500,totalPages);}
}
