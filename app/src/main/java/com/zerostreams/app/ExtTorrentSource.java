package com.zerostreams.app;
import java.net.*;
import java.util.*;
import java.io.IOException;
import org.json.*;
import org.jsoup.Jsoup;
import org.jsoup.nodes.*;
final class ExtTorrentSource {
 static String searchUrl(String query){try{return "https://ext.to/browse/?q="+URLEncoder.encode(query.substring(0,Math.min(160,query.length())),"UTF-8");}catch(Exception e){throw new IllegalArgumentException("Invalid search");}}
 static Document page(String url)throws Exception{URI u=new URI(url);if(!"https".equals(u.getScheme())||!"ext.to".equals(u.getHost())||u.getPort()!=-1||u.getUserInfo()!=null)throw new IllegalArgumentException("Invalid EXT source");org.jsoup.Connection.Response response=Jsoup.connect(url).timeout(20000).maxBodySize(4*1024*1024).followRedirects(false).ignoreHttpErrors(true).execute();if(response.statusCode()!=200)throw new IOException("EXT search is unavailable. Open EXT in a browser or paste a magnet link.");String html=response.body();if(html.contains("cf-chl-")||html.contains("Just a moment")||html.contains("Verify you are human"))throw new IOException("EXT needs a browser check. Open EXT and paste its magnet link.");return response.parse();}
 static JSONArray search(String query)throws Exception{Document doc=page(searchUrl(query));JSONArray out=new JSONArray();Set<String> seen=new HashSet<>();for(Element a:doc.select("a[href]")){String href=a.attr("href"),title=a.text().trim();if(title.length()<8||!href.matches("(?i)/[a-z0-9][a-z0-9-]+-[0-9]+/?")||href.matches(".*-m[0-9]+/?"))continue;String url="https://ext.to"+href;if(seen.add(url)&&out.length()<25)out.put(new JSONObject().put("title",title).put("url",url));}return out;}
 static String resolve(String url)throws Exception{Element a=page(url).selectFirst("a[href^=magnet:]");if(a==null)throw new IOException("No magnet found. Open EXT and paste its magnet link.");return TorrentDownloads.magnet(a.attr("href"));}
}
