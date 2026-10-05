package com.zerostreams.app;
import android.app.*;
import android.content.*;
import android.os.*;
public class TorrentDownloadService extends Service {
 private final Handler handler=new Handler(Looper.getMainLooper());
 static void ensure(Context c){Intent intent=new Intent(c,TorrentDownloadService.class);if(Build.VERSION.SDK_INT>=26)c.startForegroundService(intent);else c.startService(intent);}
 @Override public int onStartCommand(Intent intent,int flags,int id){if(Build.VERSION.SDK_INT>=26){NotificationManager manager=(NotificationManager)getSystemService(NOTIFICATION_SERVICE);manager.createNotificationChannel(new NotificationChannel("zeroplay-torrents","Torrent downloads",NotificationManager.IMPORTANCE_LOW));}PendingIntent open=PendingIntent.getActivity(this,0,new Intent(this,MainActivity.class).putExtra("downloads",true),PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);Notification.Builder builder=Build.VERSION.SDK_INT>=26?new Notification.Builder(this,"zeroplay-torrents"):new Notification.Builder(this);startForeground(1502,builder.setSmallIcon(android.R.drawable.stat_sys_download).setContentTitle("ZeroPlay torrent downloads").setContentText("Open Downloads for progress").setContentIntent(open).setOngoing(true).build());handler.removeCallbacks(check);handler.postDelayed(check,3000);return START_NOT_STICKY;}
 private final Runnable check=new Runnable(){public void run(){if(!TorrentDownloads.get(TorrentDownloadService.this).active()){stopSelf();return;}handler.postDelayed(this,3000);}};
 @Override public void onTimeout(int id,int type){TorrentDownloads.get(this).pauseAll();stopSelf();}
 @Override public void onDestroy(){handler.removeCallbacks(check);super.onDestroy();}
 @Override public android.os.IBinder onBind(Intent i){return null;}
}
