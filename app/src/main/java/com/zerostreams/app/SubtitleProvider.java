package com.zerostreams.app;

import android.content.Context;
import android.content.SharedPreferences;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.Base64;
import java.io.*;
import java.net.*;
import java.security.KeyStore;
import java.util.*;
import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import org.json.*;

/** Optional automatic subtitle lookup. Users keep their own SubDL key on-device. */
final class SubtitleProvider {
    private static SubtitleProvider instance;
    static synchronized SubtitleProvider get(Context context){
        if(instance==null)instance=new SubtitleProvider(context.getApplicationContext());
        return instance;
    }

    final SharedPreferences prefs;
    private SubtitleProvider(Context context){prefs=context.getSharedPreferences("subtitleSettings-secure",Context.MODE_PRIVATE);}

    private SecretKey secret() throws Exception {
        KeyStore store=KeyStore.getInstance("AndroidKeyStore");store.load(null);
        String alias="zeroplay.subdl";
        if(!store.containsAlias(alias)){
            KeyGenerator generator=KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES,"AndroidKeyStore");
            generator.init(new KeyGenParameterSpec.Builder(alias,KeyProperties.PURPOSE_ENCRYPT|KeyProperties.PURPOSE_DECRYPT)
                .setBlockModes(KeyProperties.BLOCK_MODE_GCM).setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE).build());
            generator.generateKey();
        }
        return (SecretKey)store.getKey(alias,null);
    }

    synchronized String key(){
        try{
            String value=prefs.getString("key","");if(value.isEmpty())return "";
            Cipher cipher=Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.DECRYPT_MODE,secret(),new GCMParameterSpec(128,Base64.decode(prefs.getString("iv",""),Base64.NO_WRAP)));
            return new String(cipher.doFinal(Base64.decode(value,Base64.NO_WRAP)),"UTF-8");
        }catch(Exception ignored){return "";}
    }

    synchronized void save(String value,boolean enabled,String language) throws Exception {
        SharedPreferences.Editor edit=prefs.edit().putBoolean("enabled",enabled).putString("language",normalizeLanguage(language));
        if(!value.isEmpty()){
            if(!value.matches("[A-Za-z0-9._~-]{8,512}"))throw new IOException("Check the SubDL API key.");
            Cipher cipher=Cipher.getInstance("AES/GCM/NoPadding");cipher.init(Cipher.ENCRYPT_MODE,secret());
            edit.putString("key",Base64.encodeToString(cipher.doFinal(value.getBytes("UTF-8")),Base64.NO_WRAP));
            edit.putString("iv",Base64.encodeToString(cipher.getIV(),Base64.NO_WRAP));
        }
        edit.apply();
    }

    synchronized void remove(){prefs.edit().remove("key").remove("iv").apply();}
    boolean configured(){return prefs.getBoolean("enabled",true)&&!key().isEmpty();}
    String language(){return normalizeLanguage(prefs.getString("language","EN"));}
    static String normalizeLanguage(String value){String s=value==null?"EN":value.trim().toUpperCase(Locale.ROOT);return s.matches("[A-Z]{2,3}")?s:"EN";}

    JSONArray lookup(String tmdb,String type,int season,int episode,String fileName) throws Exception {
        if(!configured())return new JSONArray();
        if(!tmdb.matches("[1-9][0-9]*")||!type.matches("movie|tv"))return new JSONArray();
        StringBuilder address=new StringBuilder("https://api.subdl.com/api/v1/subtitles?api_key=")
            .append(URLEncoder.encode(key(),"UTF-8"))
            .append("&tmdb_id=").append(tmdb)
            .append("&type=").append(type)
            .append("&languages=").append(URLEncoder.encode(language(),"UTF-8"))
            .append("&subs_per_page=12&unpack=1&client=custom_integration");
        if(type.equals("tv")){address.append("&season_number=").append(Math.max(0,season)).append("&episode_number=").append(Math.max(1,episode));}
        if(fileName!=null&&!fileName.trim().isEmpty())address.append("&file_name=").append(URLEncoder.encode(fileName.trim(),"UTF-8"));
        JSONObject response=request(address.toString());
        if(!response.optBoolean("status"))throw new IOException(response.optString("error","Subtitle search unavailable."));
        return candidates(response,type,season,episode);
    }

    void test() throws Exception {
        String api=key();if(api.isEmpty())throw new IOException("Add your SubDL API key first.");
        JSONObject response=request("https://api.subdl.com/api/v1/me?api_key="+URLEncoder.encode(api,"UTF-8"));
        if(response.optBoolean("status",true)==false)throw new IOException(response.optString("error","SubDL key rejected."));
    }

    private static JSONObject request(String address) throws Exception {
        HttpURLConnection connection=(HttpURLConnection)new URL(address).openConnection();
        connection.setConnectTimeout(12000);connection.setReadTimeout(20000);connection.setInstanceFollowRedirects(false);
        connection.setRequestProperty("Accept","application/json");connection.setRequestProperty("User-Agent","ZeroPlay/1.8.1");
        try{
            int code=connection.getResponseCode();
            if(code==401||code==403)throw new IOException("SubDL API key rejected.");
            if(code==429)throw new IOException("SubDL daily limit reached. Try again later.");
            if(code!=200)throw new IOException("SubDL is unavailable right now.");
            try(InputStream input=connection.getInputStream()){return new JSONObject(Catalog.read(input,2_000_000));}
        }finally{connection.disconnect();}
    }

    static JSONArray candidates(JSONObject response,String type,int season,int episode) throws JSONException {
        JSONArray out=new JSONArray(),rows=response.optJSONArray("subtitles");if(rows==null)return out;
        Set<String> seen=new HashSet<>();
        for(int i=0;i<rows.length()&&out.length()<4;i++){
            JSONObject subtitle=rows.optJSONObject(i);if(subtitle==null)continue;
            JSONArray unpack=subtitle.optJSONArray("unpack_files");if(unpack==null)continue;
            for(int n=0;n<unpack.length()&&out.length()<4;n++){
                JSONObject file=unpack.optJSONObject(n);if(file==null)continue;
                String format=file.optString("format").toLowerCase(Locale.ROOT),path=file.optString("url");
                if(!format.matches("srt|vtt")||!path.matches("/subtitle/[A-Za-z0-9._~/-]+"))continue;
                if(type.equals("tv")&&(file.optInt("season",season)!=season||file.optInt("episode",episode)!=episode))continue;
                String url="https://dl.subdl.com"+path;if(!seen.add(url))continue;
                String language=normalizeLanguage(file.optString("language","EN"));
                String label="Auto · "+language+(file.optBoolean("hi")?" · HI":"");
                out.put(new JSONObject().put("url",url).put("mimeType",format.equals("vtt")?"text/vtt":"application/x-subrip").put("language",language.toLowerCase(Locale.ROOT)).put("label",label));
            }
        }
        return out;
    }
}
