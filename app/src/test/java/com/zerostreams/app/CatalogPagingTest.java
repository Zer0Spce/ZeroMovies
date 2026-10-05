package com.zerostreams.app;
import org.junit.Test;
import org.json.*;
import java.util.*;
import static org.junit.Assert.*;
public class CatalogPagingTest {
    @Test public void appendPreservesOlderCardsAndDeduplicatesOverlappingPages() throws Exception {
        Catalog.Item first=item(1),second=item(2),third=item(3);List<Catalog.Item> catalog=new ArrayList<>(Arrays.asList(first,second));
        List<Catalog.Item> added=CatalogPaging.append(catalog,Arrays.asList(item(2),third,item(3)));
        assertEquals(Arrays.asList(first,second,third),catalog);assertEquals(Collections.singletonList(third),added);assertSame(first,catalog.get(0));
        assertTrue(CatalogPaging.append(catalog,Arrays.asList(item(1),item(2),item(3))).isEmpty());assertEquals(3,catalog.size());
    }
    @Test public void respectsTheApiLastPageAndTmdbFiveHundredPageLimit(){
        assertTrue(CatalogPaging.hasMore(1,2));assertFalse(CatalogPaging.hasMore(2,2));assertFalse(CatalogPaging.hasMore(1,0));assertTrue(CatalogPaging.hasMore(499,9000));assertFalse(CatalogPaging.hasMore(500,9000));
    }
    private static Catalog.Item item(int id) throws Exception {return new Catalog.Item(new JSONObject().put("id","tmdb-movie-"+id).put("title","Title "+id).put("type","movie"));}
}
