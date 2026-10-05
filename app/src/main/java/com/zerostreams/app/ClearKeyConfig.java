package com.zerostreams.app;

import org.json.*;
import java.nio.charset.StandardCharsets;
import java.util.*;

/** Convert playlist-provided ClearKey configuration to Android's standard key response. */
final class ClearKeyConfig {
    static byte[] response(String input) throws JSONException {
        JSONArray keys=new JSONArray();String value=input.split("\\|",2)[0].trim();
        if(value.startsWith("{")){
            JSONObject json=new JSONObject(value);JSONArray list=json.optJSONArray("keys");
            if(list!=null){for(int i=0;i<list.length();i++){JSONObject k=list.getJSONObject(i);String kid=k.getString("kid"),key=k.getString("k");if(!kid.matches("[A-Za-z0-9_+/-]{22}={0,2}")||!key.matches("[A-Za-z0-9_+/-]{22}={0,2}"))throw new JSONException("Invalid key");keys.put(new JSONObject().put("kty","oct").put("kid",kid.replace("=","").replace('+','-').replace('/','_')).put("k",key.replace("=","").replace('+','-').replace('/','_')));}}
            else {Iterator<String> names=json.keys();while(names.hasNext()){String id=names.next();keys.put(pair(id,json.getString(id)));}}
        }else {for(String entry:value.split(",")){String[] pair=entry.trim().split(":",2);if(pair.length!=2)throw new JSONException("Invalid key pair");keys.put(pair(pair[0],pair[1]));}}
        if(keys.length()==0||keys.length()>32)throw new JSONException("Invalid key count");
        return new JSONObject().put("keys",keys).put("type","temporary").toString().getBytes(StandardCharsets.UTF_8);
    }
    private static JSONObject pair(String kid,String key) throws JSONException {return new JSONObject().put("kty","oct").put("kid",encode(kid)).put("k",encode(key));}
    private static String encode(String hex) throws JSONException {hex=hex.replace("-","").trim();if(!hex.matches("[0-9a-fA-F]{32}"))throw new JSONException("Invalid key");byte[] bytes=new byte[16];for(int i=0;i<16;i++)bytes[i]=(byte)Integer.parseInt(hex.substring(i*2,i*2+2),16);return base64url(bytes);}
    private static String base64url(byte[] data){String alphabet="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";StringBuilder out=new StringBuilder();int bits=0,buffer=0;for(byte b:data){buffer=(buffer<<8)|(b&255);bits+=8;while(bits>=6){bits-=6;out.append(alphabet.charAt((buffer>>>bits)&63));}}if(bits>0)out.append(alphabet.charAt((buffer<<(6-bits))&63));return out.toString();}
}
