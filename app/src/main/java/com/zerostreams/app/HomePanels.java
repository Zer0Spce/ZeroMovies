package com.zerostreams.app;
import java.util.*;
final class HomePanels {
 static final String[] IDS={"clock","featured","continue","watchlist","upcoming","providers","recommended","trending","popular","series","now","action","comedy","horror","animation","anime"};
 static final String[] LABELS={"Clock","Featured carousel","Continue watching","Watchlist","Coming soon","Streaming providers","Recommended movies","Trending","Popular movies","Series worth watching","Now playing","Action movies","Comedy movies","Horror movies","Animation movies","Anime series"};
 static Set<String> defaults(){return new HashSet<>(Arrays.asList(Arrays.copyOf(IDS,11)));}
 static int genre(String id){switch(id){case "action":return 28;case "comedy":return 35;case "horror":return 27;case "animation":case "anime":return 16;default:return 0;}}
}
