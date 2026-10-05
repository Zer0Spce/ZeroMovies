package com.zerostreams.app;
import android.app.Notification;
import android.app.PendingIntent;
import android.content.Intent;
import androidx.media3.exoplayer.offline.*;
import androidx.media3.exoplayer.scheduler.Scheduler;
import java.util.List;
@androidx.annotation.OptIn(markerClass=androidx.media3.common.util.UnstableApi.class)
public class MovieDownloadService extends DownloadService {
 public MovieDownloadService(){super(1501,1000,"zeroplay-downloads",R.string.download_channel,0);}
 @Override protected DownloadManager getDownloadManager(){return OfflineDownloads.manager(this);}
 @Override protected Scheduler getScheduler(){return null;}
 @Override protected Notification getForegroundNotification(List<Download> downloads,int requirements){PendingIntent open=PendingIntent.getActivity(this,0,new Intent(this,MainActivity.class).putExtra("downloads",true),PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);return new DownloadNotificationHelper(this,"zeroplay-downloads").buildProgressNotification(this,android.R.drawable.stat_sys_download,open,"Open Downloads for progress",downloads,requirements);}
 @Override public void onTimeout(int startId,int type){OfflineDownloads.manager(this).pauseDownloads();stopSelf();}
}
