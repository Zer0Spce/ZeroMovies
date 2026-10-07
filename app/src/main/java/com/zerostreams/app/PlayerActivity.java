package com.zerostreams.app;

import android.app.Activity;
import android.os.Bundle;
import android.content.SharedPreferences;
import android.net.Uri;
import android.view.*;
import android.widget.*;
import android.graphics.Color;
import androidx.media3.common.*;
import androidx.media3.exoplayer.ExoPlayer;
import androidx.media3.datasource.DefaultHttpDataSource;
import androidx.media3.exoplayer.source.DefaultMediaSourceFactory;
import androidx.media3.ui.PlayerView;
import org.json.*;
import java.io.File;
import java.util.*;

@androidx.annotation.OptIn(markerClass = androidx.media3.common.util.UnstableApi.class)
public class PlayerActivity extends Activity {
    private ExoPlayer player;
    private PlayerView view;
    private TextView error;
    private SharedPreferences prefs;
    private JSONObject source;
    private String key,parent;
    private boolean live, playWhenReady=true, subtitleLookupStarted;
    private long position;
    @Override public void onCreate(Bundle saved) {
        super.onCreate(saved);getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_FULLSCREEN|View.SYSTEM_UI_FLAG_HIDE_NAVIGATION|View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY);
        prefs=getSharedPreferences("zero",MODE_PRIVATE);key=getIntent().getStringExtra("key");parent=getIntent().getStringExtra("parent");live=getIntent().getBooleanExtra("live",false);
        if(key==null||parent==null){finish();return;}position=live?0:prefs.getLong("position:"+key,0);
        if(saved!=null){position=saved.getLong("position",position);playWhenReady=saved.getBoolean("playing",true);subtitleLookupStarted=saved.getBoolean("subtitleLookupStarted",false);}
        try{source=new JSONObject(getIntent().getStringExtra("stream"));}catch(Exception e){finish();return;}
        FrameLayout root=new FrameLayout(this);root.setBackgroundColor(Color.BLACK);view=new PlayerView(this);view.setShowSubtitleButton(true);view.setShowBuffering(PlayerView.SHOW_BUFFERING_WHEN_PLAYING);view.setControllerAutoShow(true);view.setControllerHideOnTouch(!BuildConfig.TV);root.addView(view,new FrameLayout.LayoutParams(-1,-1));
        error=new TextView(this);error.setTextColor(Color.WHITE);error.setTextSize(18);error.setPadding(24,24,24,24);error.setBackgroundColor(0xCC111111);error.setVisibility(View.GONE);FrameLayout.LayoutParams p=new FrameLayout.LayoutParams(-1,-2,Gravity.TOP);root.addView(error,p);setContentView(root);
    }
    private void startPlayer() {
        if(player!=null)return;
        addLocalSidecars();
        DefaultHttpDataSource.Factory http=new DefaultHttpDataSource.Factory().setUserAgent("ZeroPlay/1.8.1").setAllowCrossProtocolRedirects(false);
        Map<String,String> headers=new HashMap<>();JSONObject h=source.optJSONObject("headers");if(h!=null){Iterator<String> names=h.keys();while(names.hasNext()){String name=names.next();headers.put(name,h.optString(name));}}http.setDefaultRequestProperties(headers);
        String offline=getIntent().getStringExtra("offline");androidx.media3.exoplayer.offline.Download download=null;if(offline!=null)try{download=OfflineDownloads.manager(this).getDownloadIndex().getDownload(offline);}catch(java.io.IOException ignored){}if(offline!=null&&(download==null||download.state!=androidx.media3.exoplayer.offline.Download.STATE_COMPLETED)){error.setText("Download is not ready. Return to Downloads.");error.setVisibility(View.VISIBLE);return;}
        androidx.media3.datasource.DataSource.Factory data=offline!=null?OfflineDownloads.factory(this,null,true):new androidx.media3.datasource.DefaultDataSource.Factory(this,http);player=new ExoPlayer.Builder(this).setMediaSourceFactory(new DefaultMediaSourceFactory(data)).build();view.setPlayer(player);
        player.addListener(new Player.Listener(){
            @Override public void onPlayerError(PlaybackException exception){error.setText("Playback failed. Press Back and choose another source.\n"+exception.getErrorCodeName());error.setVisibility(View.VISIBLE);view.showController();}
            @Override public void onPlaybackStateChanged(int state){if(state==Player.STATE_ENDED&&!live)prefs.edit().remove("position:"+key).remove("position:"+parent).apply();}
        });
        MediaItem.Builder media=new MediaItem.Builder().setUri(source.optString("url")).setMediaMetadata(new MediaMetadata.Builder().setTitle(getIntent().getStringExtra("title")).build());
        if(!source.optString("mimeType").isEmpty())media.setMimeType(source.optString("mimeType"));
        JSONArray subtitles=source.optJSONArray("subtitles");List<MediaItem.SubtitleConfiguration> tracks=new ArrayList<>();
        if(subtitles!=null)for(int i=0;i<subtitles.length();i++){JSONObject s=subtitles.optJSONObject(i);if(s==null)continue;String address=s.optString("url");Uri uri=Uri.parse(address);String scheme=uri.getScheme();if(!Arrays.asList("https","file","content").contains(scheme))continue;tracks.add(new MediaItem.SubtitleConfiguration.Builder(uri).setMimeType(s.optString("mimeType","text/vtt")).setLanguage(s.optString("language","en")).setLabel(s.optString("label","Subtitles")).build());}
        media.setSubtitleConfigurations(tracks);player.setMediaItem(download==null?media.build():download.request.toMediaItem());if(!live)player.seekTo(position);player.prepare();player.setPlayWhenReady(playWhenReady);view.requestFocus();view.showController();
        if(!live&&download==null&&tracks.isEmpty())lookupAutomaticSubtitles();
    }
    private void lookupAutomaticSubtitles(){
        if(subtitleLookupStarted)return;String tmdb=source.optString("tmdb",getIntent().getStringExtra("tmdb")),type=source.optString("type",getIntent().getStringExtra("mediaType"));int season=source.optInt("season",getIntent().getIntExtra("season",0)),episode=source.optInt("episode",getIntent().getIntExtra("episode",1));
        SubtitleProvider provider=SubtitleProvider.get(this);if(!provider.configured()||tmdb==null||type==null||!tmdb.matches("[1-9][0-9]*")||!type.matches("movie|tv"))return;subtitleLookupStarted=true;
        String fileName="";try{Uri uri=Uri.parse(source.optString("url"));if("file".equals(uri.getScheme()))fileName=new File(uri.getPath()).getName();}catch(Exception ignored){}final String matchFile=fileName;
        new Thread(()->{try{JSONArray found=provider.lookup(tmdb,type,season,episode,matchFile);if(found.length()==0)return;runOnUiThread(()->{if(isFinishing()||isDestroyed()||player==null)return;try{source.put("subtitles",found);}catch(JSONException ignored){}long at=player.getCurrentPosition();boolean playing=player.getPlayWhenReady();view.setPlayer(null);player.release();player=null;position=at;playWhenReady=playing;startPlayer();});}catch(Exception ignored){}} ,"ZeroPlay-Subtitles").start();
    }
    private void addLocalSidecars(){
        if(source.optJSONArray("subtitles")!=null&&source.optJSONArray("subtitles").length()>0)return;
        try{
            Uri videoUri=Uri.parse(source.optString("url"));if(!"file".equals(videoUri.getScheme()))return;File video=new File(videoUri.getPath()),root=video.getParentFile();if(root==null||!root.isDirectory())return;
            int season=source.optInt("season",getIntent().getIntExtra("season",0)),episode=source.optInt("episode",getIntent().getIntExtra("episode",1));String episodeTag=season>0?String.format(Locale.ROOT,"s%02de%02d",season,episode):"";String base=video.getName().replaceFirst("(?i)\\.[a-z0-9]{2,5}$","").toLowerCase(Locale.ROOT);
            ArrayList<File> files=new ArrayList<>();collectSubtitles(root,files,0);JSONArray local=new JSONArray();
            files.sort((a,b)->Integer.compare(sidecarScore(b,base,episodeTag),sidecarScore(a,base,episodeTag)));
            for(File file:files){if(local.length()>=6)break;String name=file.getName().toLowerCase(Locale.ROOT);if(!episodeTag.isEmpty()&&!name.contains(episodeTag)&&files.size()>1)continue;String ext=name.substring(name.lastIndexOf('.')+1);String mime=ext.equals("vtt")?"text/vtt":ext.equals("ass")||ext.equals("ssa")?"text/x-ssa":"application/x-subrip";local.put(new JSONObject().put("url",Uri.fromFile(file).toString()).put("mimeType",mime).put("language","en").put("label","Local · "+file.getName()));}
            if(local.length()>0)source.put("subtitles",local);
        }catch(Exception ignored){}
    }
    private static void collectSubtitles(File folder,List<File> out,int depth){if(depth>3||out.size()>80)return;File[] children=folder.listFiles();if(children==null)return;for(File child:children){if(child.isDirectory())collectSubtitles(child,out,depth+1);else if(child.getName().matches("(?i).*\\.(srt|vtt|ass|ssa)$"))out.add(child);if(out.size()>80)return;}}
    private static int sidecarScore(File file,String videoBase,String episodeTag){String name=file.getName().toLowerCase(Locale.ROOT);int score=0;if(!episodeTag.isEmpty()&&name.contains(episodeTag))score+=100;if(name.contains(videoBase))score+=50;if(name.contains("english")||name.matches(".*[._ -]en[._ -].*"))score+=20;if(name.endsWith(".srt"))score+=5;return score;}
    private void stopPlayer() {
        if(player==null)return;position=player.getCurrentPosition();playWhenReady=player.getPlayWhenReady();
        if(!live){SharedPreferences.Editor edit=prefs.edit();if(player.getPlaybackState()==Player.STATE_ENDED)edit.remove("position:"+key).remove("position:"+parent);else{edit.putLong("position:"+key,position);edit.putLong("position:"+parent,position);}edit.apply();}
        view.setPlayer(null);player.release();player=null;
    }
    @Override protected void onStart(){super.onStart();startPlayer();}
    @Override protected void onStop(){stopPlayer();super.onStop();}
    @Override protected void onSaveInstanceState(Bundle out){if(player!=null){position=player.getCurrentPosition();playWhenReady=player.getPlayWhenReady();}out.putLong("position",position);out.putBoolean("playing",playWhenReady);out.putBoolean("subtitleLookupStarted",subtitleLookupStarted);super.onSaveInstanceState(out);}
    @Override public boolean dispatchKeyEvent(KeyEvent event){return view.dispatchKeyEvent(event)||super.dispatchKeyEvent(event);}
}
