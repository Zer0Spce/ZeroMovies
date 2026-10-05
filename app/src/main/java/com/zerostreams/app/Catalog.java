package com.zerostreams.app;

import android.content.Context;
import org.json.*;
import java.io.*;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.util.*;

final class Catalog {
    static final class Item {
        final JSONObject raw;
        final String id, title, type, description, poster;
        final int year;
        Item(JSONObject o) throws JSONException {
            raw = o; id = o.getString("id"); title = o.getString("title");
            type = o.optString("type", "movie"); year = o.optInt("year");
            description = o.optString("description"); poster = o.optString("poster");
        }
        JSONArray streams() { return raw.optJSONArray("streams"); }
        JSONArray episodes() { return raw.optJSONArray("episodes"); }
    }
    static List<Item> parse(String text) throws JSONException {
        JSONObject root = new JSONObject(text);
        if (root.optInt("schemaVersion") != 1) throw new JSONException("Unsupported catalog schema");
        JSONArray rows = root.getJSONArray("items");
        List<Item> items = new ArrayList<>(); Set<String> ids = new HashSet<>();
        for (int i=0; i<rows.length(); i++) {
            Item item = new Item(rows.getJSONObject(i));
            if (item.id.isEmpty() || item.title.isEmpty() || !ids.add(item.id)) throw new JSONException("Invalid or duplicate title ID");
            items.add(item);
        }
        return items;
    }
    static String read(InputStream in, int limit) throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream(); byte[] buffer = new byte[8192]; int n;
        while ((n=in.read(buffer))!=-1) {
            if (out.size()+n>limit) throw new IOException("Response exceeds size limit");
            out.write(buffer,0,n);
        }
        return out.toString(StandardCharsets.UTF_8.name());
    }
    static List<Item> load(Context context, String endpoint) throws Exception {
        if (endpoint.isEmpty()) { try (InputStream in=context.getAssets().open("catalog.json")) { return parse(read(in,5_000_000)); } }
        URL url = new URL(endpoint);
        if (!"https".equalsIgnoreCase(url.getProtocol()) || url.getHost().isEmpty()) throw new IOException("Use an HTTPS catalog URL");
        HttpURLConnection connection=(HttpURLConnection)url.openConnection();
        connection.setConnectTimeout(12000); connection.setReadTimeout(15000); connection.setInstanceFollowRedirects(false);
        connection.setRequestProperty("Accept","application/json");
        try {
            if (connection.getResponseCode()!=200) throw new IOException("Catalog HTTP " + connection.getResponseCode());
            try (InputStream in=connection.getInputStream()) { return parse(read(in,5_000_000)); }
        } finally { connection.disconnect(); }
    }
}
