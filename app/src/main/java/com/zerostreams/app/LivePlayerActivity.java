package com.zerostreams.app;

import android.app.*;
import android.os.*;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.view.*;
import android.widget.*;
import androidx.media3.common.*;
import androidx.media3.datasource.DefaultHttpDataSource;
import androidx.media3.exoplayer.ExoPlayer;
import androidx.media3.exoplayer.source.DefaultMediaSourceFactory;
import androidx.media3.exoplayer.drm.*;
import androidx.media3.ui.PlayerView;
import androidx.media3.ui.AspectRatioFrameLayout;
import java.util.*;
import java.util.concurrent.*;

/** ZeroPlay' native live player. No WebView, embedded provider page or external player. */
@androidx.annotation.OptIn(markerClass=androidx.media3.common.util.UnstableApi.class)
public class LivePlayerActivity extends Activity {
    private static final int ACCENT=0xFF65E6CC, SURFACE=0xEF161822, MAX_AUTO_RETRIES=4;
    private final Handler ui=new Handler(Looper.getMainLooper());
    private final ExecutorService io=Executors.newSingleThreadExecutor();
    private ExoPlayer player;
    private PlayerView video;
    private LinearLayout controls, toolbar;
    private FrameLayout root;
    private TextView title, status;
    private ProgressBar buffering;
    private Button play;
    private List<M3uPlaylist.Channel> channels=Collections.emptyList();
    private int index,resizeMode=AspectRatioFrameLayout.RESIZE_MODE_FIT,retryAttempt,loadGeneration;
    private boolean started, destroyed, playWhenReady=true;
    private final Runnable hideControls=()->setControls(false);
    private Runnable pendingReconnect;
    private final Runnable infoTick=new Runnable(){public void run(){if(!started||player==null)return;if(player.getPlayerError()==null){long offset=player.getCurrentLiveOffset();String quality=player.getVideoFormat()==null?"":player.getVideoFormat().height>0?" · "+player.getVideoFormat().height+"p":"";status.setText(player.getPlaybackState()==Player.STATE_BUFFERING?"Connecting…":player.getPlaybackState()==Player.STATE_ENDED?"Stream ended · reconnecting…":player.isPlaying()?"● LIVE"+(offset!=C.TIME_UNSET&&offset>12_000?" · behind live":"")+quality:"Paused");}ui.postDelayed(this,1000);}};
    int dp(int n){return (int)(getResources().getDisplayMetrics().density*n+.5f);}
    GradientDrawable background(int color,int border){GradientDrawable d=new GradientDrawable();d.setColor(color);d.setCornerRadius(dp(9));if(border!=0)d.setStroke(dp(2),border);return d;}
    Button control(String label,Runnable action){Button b=new Button(this);b.setText(label);b.setAllCaps(false);b.setTextColor(Color.WHITE);b.setTextSize(14);b.setPadding(dp(12),dp(6),dp(12),dp(6));b.setMinWidth(0);b.setMinimumWidth(0);b.setBackground(background(SURFACE,0));b.setFocusable(true);b.setOnClickListener(v->{action.run();wakeControls();});b.setOnFocusChangeListener((v,f)->{v.setBackground(background(SURFACE,f?ACCENT:0));if(f)wakeControls();});return b;}
    @Override public void onCreate(Bundle state){
        super.onCreate(state);getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_FULLSCREEN|View.SYSTEM_UI_FLAG_HIDE_NAVIGATION|View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY);
        root=new FrameLayout(this);root.setBackgroundColor(Color.BLACK);
        video=new PlayerView(this);video.setUseController(false);video.setResizeMode(resizeMode);root.addView(video,new FrameLayout.LayoutParams(-1,-1));
        buffering=new ProgressBar(this);root.addView(buffering,new FrameLayout.LayoutParams(dp(48),dp(48),Gravity.CENTER));
        toolbar=new LinearLayout(this);toolbar.setGravity(Gravity.CENTER_VERTICAL);toolbar.setPadding(dp(14),dp(12),dp(14),dp(12));toolbar.setBackgroundColor(0xD9000000);toolbar.addView(control("‹ Back",this::finish));
        LinearLayout labels=new LinearLayout(this);labels.setOrientation(LinearLayout.VERTICAL);labels.setPadding(dp(16),0,dp(8),0);
        title=new TextView(this);title.setTextColor(Color.WHITE);title.setTextSize(20);title.setTypeface(null,Typeface.BOLD);title.setMaxLines(1);title.setEllipsize(android.text.TextUtils.TruncateAt.END);labels.addView(title);
        status=new TextView(this);status.setTextColor(ACCENT);status.setTextSize(13);status.setText("Opening channel…");labels.addView(status);toolbar.addView(labels,new LinearLayout.LayoutParams(0,-2,1));
        TextView brand=new TextView(this);brand.setText("ZERO • LIVE");brand.setTextColor(ACCENT);brand.setTextSize(12);toolbar.addView(brand);root.addView(toolbar,new FrameLayout.LayoutParams(-1,-2,Gravity.TOP));
        controls=new LinearLayout(this);controls.setGravity(Gravity.CENTER_VERTICAL);controls.setPadding(dp(12),dp(14),dp(12),dp(14));controls.setBackgroundColor(0xD9000000);
        play=control("Pause",()->{if(player!=null){if(player.isPlaying())player.pause();else player.play();}});controls.addView(play);
        controls.addView(control("● Live",()->{if(player!=null){player.seekToDefaultPosition();player.play();}}));
        controls.addView(control("Retry",this::retry));controls.addView(control("Channels",this::channelPicker));
        controls.addView(control("Audio",()->trackPicker(C.TRACK_TYPE_AUDIO)));
        controls.addView(control("Subtitles",()->trackPicker(C.TRACK_TYPE_TEXT)));
        controls.addView(control("Fit",()->{resizeMode=resizeMode==AspectRatioFrameLayout.RESIZE_MODE_FIT?AspectRatioFrameLayout.RESIZE_MODE_ZOOM:AspectRatioFrameLayout.RESIZE_MODE_FIT;video.setResizeMode(resizeMode);message(resizeMode==AspectRatioFrameLayout.RESIZE_MODE_FIT?"Fit to screen":"Fill screen");}));
        HorizontalScrollView row=new HorizontalScrollView(this);row.setHorizontalScrollBarEnabled(false);row.addView(controls);root.addView(row,new FrameLayout.LayoutParams(-1,-2,Gravity.BOTTOM));
        controlsContainer=row;
        root.setOnTouchListener((v,event)->{if(event.getAction()==MotionEvent.ACTION_UP){v.performClick();wakeControls();return true;}return true;});
        video.setOnClickListener(v->wakeControls());setContentView(root);
        boolean live=getIntent().getBooleanExtra("liveList",true);String requested=state==null?getIntent().getStringExtra("channelUrl"):state.getString("channelUrl",getIntent().getStringExtra("channelUrl"));
        if(state!=null)playWhenReady=state.getBoolean("playing",true);
        io.execute(()->{try{List<M3uPlaylist.Channel> list=PlaylistStore.cached(getApplicationContext(),live).channels;int selected=-1;for(int i=0;i<list.size();i++)if(list.get(i).url.equals(requested)){selected=i;break;}final int found=selected;
            ui.post(()->{if(destroyed)return;if(found<0){status.setText("This channel is no longer in the list. Return and refresh.");buffering.setVisibility(View.GONE);return;}channels=list;index=found;title.setText(channels.get(index).name);if(started)startChannel(true);});
        }catch(Exception error){ui.post(()->{if(!destroyed){status.setText("Channel list unavailable. Return and refresh.");buffering.setVisibility(View.GONE);}});}});
    }
    private HorizontalScrollView controlsContainer;
    private void cancelReconnect(){if(pendingReconnect!=null){ui.removeCallbacks(pendingReconnect);pendingReconnect=null;}}
    private boolean transientPlaybackError(PlaybackException error){String name=error==null?"":error.getErrorCodeName();return !(name.contains("DECODING")||name.contains("DRM")||name.contains("PARSING")||name.contains("FAILED_RUNTIME_CHECK")||name.contains("BEHIND_LIVE_WINDOW"));}
    private void scheduleReconnect(String reason){
        if(!started||destroyed||channels.isEmpty())return;
        cancelReconnect();
        if(retryAttempt>=MAX_AUTO_RETRIES){buffering.setVisibility(View.GONE);status.setText("Stream unavailable · Retry or choose another channel");wakeControls();return;}
        final int generation=loadGeneration;final int attempt=++retryAttempt;long delay=Math.min(10000L,1500L*(1L<<(attempt-1)));
        status.setText("Stream interrupted · reconnecting "+attempt+"/"+MAX_AUTO_RETRIES+"…");buffering.setVisibility(View.VISIBLE);
        pendingReconnect=()->{pendingReconnect=null;if(!started||destroyed||generation!=loadGeneration)return;startChannel(false);};ui.postDelayed(pendingReconnect,delay);
    }
    private void startChannel(boolean resetRetries){
        cancelReconnect();if(resetRetries){retryAttempt=0;loadGeneration++;}
        releasePlayer();if(!started||channels.isEmpty())return;
        M3uPlaylist.Channel channel=channels.get(index);title.setText(channel.name);status.setText(retryAttempt>0?"Reconnecting…":"Connecting…");buffering.setVisibility(View.VISIBLE);
        try {
            DefaultHttpDataSource.Factory http=new DefaultHttpDataSource.Factory().setUserAgent(channel.headers.containsKey("User-Agent")?channel.headers.get("User-Agent"):"ZeroPlay/"+BuildConfig.VERSION_NAME).setConnectTimeoutMs(20000).setReadTimeoutMs(30000).setAllowCrossProtocolRedirects(true).setDefaultRequestProperties(channel.headers);
            DefaultMediaSourceFactory sources=new DefaultMediaSourceFactory(http);
            MediaItem.Builder media=new MediaItem.Builder().setUri(channel.url).setMediaMetadata(new MediaMetadata.Builder().setTitle(channel.name).build());
            if(!channel.mime.isEmpty())media.setMimeType(channel.mime);
            if(!channel.drmType.isEmpty()){
                if(!channel.drmType.equals("clearkey")&&!channel.drmType.equals("org.w3.clearkey"))throw new IllegalArgumentException("Unsupported channel protection");
                byte[] response=ClearKeyConfig.response(channel.drmKey);
                DefaultDrmSessionManager drm=new DefaultDrmSessionManager.Builder().setUuidAndExoMediaDrmProvider(C.CLEARKEY_UUID,FrameworkMediaDrm.DEFAULT_PROVIDER).build(new LocalMediaDrmCallback(response));
                sources.setDrmSessionManagerProvider(item->drm);media.setDrmConfiguration(new MediaItem.DrmConfiguration.Builder(C.CLEARKEY_UUID).build());
            }
            player=new ExoPlayer.Builder(this).setMediaSourceFactory(sources).build();
            player.setAudioAttributes(new AudioAttributes.Builder().setUsage(C.USAGE_MEDIA).setContentType(C.AUDIO_CONTENT_TYPE_MOVIE).build(),true);player.setHandleAudioBecomingNoisy(true);
            player.addListener(new Player.Listener(){
                @Override public void onPlaybackStateChanged(int state){buffering.setVisibility(state==Player.STATE_BUFFERING?View.VISIBLE:View.GONE);if(state==Player.STATE_READY){retryAttempt=0;wakeControls();}if(state==Player.STATE_ENDED)scheduleReconnect("ended");}
                @Override public void onIsPlayingChanged(boolean playing){play.setText(playing?"Pause":"Play");if(!playing)wakeControls();}
                @Override public void onPlayerError(PlaybackException error){if(transientPlaybackError(error)){scheduleReconnect(error.getErrorCodeName());}else{buffering.setVisibility(View.GONE);status.setText("Stream unavailable · "+error.getErrorCodeName()+" · Retry or choose another channel");wakeControls();}}
            });
            video.setPlayer(player);player.setMediaItem(media.build());player.prepare();player.setPlayWhenReady(playWhenReady);ui.removeCallbacks(infoTick);ui.post(infoTick);wakeControls();play.requestFocus();
        }catch(Exception error){buffering.setVisibility(View.GONE);status.setText("Channel settings are not supported on this device. Try another channel.");wakeControls();}
    }
    void retry(){playWhenReady=true;startChannel(true);}
    void message(String text){Toast.makeText(this,text,Toast.LENGTH_SHORT).show();}
    void channelPicker(){if(channels.isEmpty())return;String[] names=new String[channels.size()];for(int i=0;i<names.length;i++)names[i]=channels.get(i).name;new AlertDialog.Builder(this).setTitle("Channels").setSingleChoiceItems(names,index,(dialog,which)->{index=which;playWhenReady=true;startChannel(true);dialog.dismiss();}).setNegativeButton("Close",null).show();}
    void trackPicker(int type){
        if(player==null)return;List<Tracks.Group> groups=new ArrayList<>();List<Integer> indices=new ArrayList<>();List<String> labels=new ArrayList<>();
        if(type==C.TRACK_TYPE_TEXT){groups.add(null);indices.add(-1);labels.add("Off");}
        for(Tracks.Group group:player.getCurrentTracks().getGroups())if(group.getType()==type)for(int i=0;i<group.length;i++)if(group.isTrackSupported(i)){Format f=group.getTrackFormat(i);groups.add(group);indices.add(i);labels.add(f.label!=null?f.label:f.language!=null?f.language:"Track "+(labels.size()+1));}
        if(labels.isEmpty()){message("No alternate tracks available");return;}
        new AlertDialog.Builder(this).setTitle(type==C.TRACK_TYPE_AUDIO?"Audio track":"Subtitles").setItems(labels.toArray(new String[0]),(d,which)->{if(player==null)return;TrackSelectionParameters.Builder params=player.getTrackSelectionParameters().buildUpon().clearOverridesOfType(type);Tracks.Group group=groups.get(which);if(group==null)params.setTrackTypeDisabled(type,true);else params.setTrackTypeDisabled(type,false).setOverrideForType(new TrackSelectionOverride(group.getMediaTrackGroup(),indices.get(which)));player.setTrackSelectionParameters(params.build());}).setNegativeButton("Close",null).show();
    }
    void setControls(boolean show){toolbar.setVisibility(show?View.VISIBLE:View.GONE);controlsContainer.setVisibility(show?View.VISIBLE:View.GONE);}
    void wakeControls(){setControls(true);ui.removeCallbacks(hideControls);if(player!=null&&player.isPlaying()&&player.getPlayerError()==null)ui.postDelayed(hideControls,4500);}
    private void releasePlayer(){ui.removeCallbacks(infoTick);if(player!=null){video.setPlayer(null);player.release();player=null;}}
    @Override protected void onStart(){super.onStart();started=true;if(!channels.isEmpty())startChannel(true);}
    @Override protected void onStop(){started=false;cancelReconnect();if(player!=null)playWhenReady=player.getPlayWhenReady();releasePlayer();ui.removeCallbacks(hideControls);super.onStop();}
    @Override protected void onDestroy(){destroyed=true;cancelReconnect();ui.removeCallbacksAndMessages(null);io.shutdownNow();releasePlayer();super.onDestroy();}
    @Override protected void onSaveInstanceState(Bundle state){if(!channels.isEmpty())state.putString("channelUrl",channels.get(index).url);state.putBoolean("playing",player==null?playWhenReady:player.getPlayWhenReady());super.onSaveInstanceState(state);}
    @Override public void onBackPressed(){if(controlsContainer!=null&&controlsContainer.getVisibility()==View.VISIBLE){setControls(false);ui.removeCallbacks(hideControls);return;}finish();}
    @Override public boolean dispatchKeyEvent(KeyEvent event){
        int key=event.getKeyCode();if(key==KeyEvent.KEYCODE_BACK)return super.dispatchKeyEvent(event);
        if(event.getAction()==KeyEvent.ACTION_DOWN){
            if(key==KeyEvent.KEYCODE_CHANNEL_UP||key==KeyEvent.KEYCODE_CHANNEL_DOWN){if(!channels.isEmpty()){index=(index+(key==KeyEvent.KEYCODE_CHANNEL_UP?1:channels.size()-1))%channels.size();playWhenReady=true;startChannel(true);}return true;}
            if(key==KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE){if(player!=null){if(player.isPlaying())player.pause();else player.play();}wakeControls();return true;}
            if(key==KeyEvent.KEYCODE_MEDIA_PLAY){if(player!=null)player.play();wakeControls();return true;}
            if(key==KeyEvent.KEYCODE_MEDIA_PAUSE){if(player!=null)player.pause();wakeControls();return true;}
            if(key==KeyEvent.KEYCODE_DPAD_CENTER||key==KeyEvent.KEYCODE_ENTER||key==KeyEvent.KEYCODE_DPAD_UP||key==KeyEvent.KEYCODE_DPAD_DOWN||key==KeyEvent.KEYCODE_DPAD_LEFT||key==KeyEvent.KEYCODE_DPAD_RIGHT||key==KeyEvent.KEYCODE_MENU){boolean hidden=controlsContainer.getVisibility()!=View.VISIBLE;wakeControls();if(hidden){play.requestFocus();return true;}}
        }
        return super.dispatchKeyEvent(event);
    }
}
