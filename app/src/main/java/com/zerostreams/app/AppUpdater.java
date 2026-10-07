package com.zerostreams.app;

import android.app.*;
import android.content.*;
import android.graphics.Color;
import android.graphics.Typeface;
import android.net.Uri;
import android.os.*;
import android.provider.Settings;
import android.text.TextUtils;
import android.view.*;
import android.widget.*;
import androidx.core.content.FileProvider;
import org.json.*;
import java.io.*;
import java.net.*;
import java.security.*;
import java.util.*;
import java.util.concurrent.*;

final class AppUpdater implements Application.ActivityLifecycleCallbacks {
    private static final String API="https://api.github.com/repos/Zer0Spce/ZeroPlay/releases?per_page=20";
    private final Activity activity;
    private final android.content.SharedPreferences prefs;
    private final ExecutorService io=Executors.newSingleThreadExecutor();
    private final Handler ui=new Handler(Looper.getMainLooper());
    private volatile boolean checking,downloading;
    private boolean waitingInstallPermission;
    private Release pending;
    private AlertDialog dialog;
    private ProgressBar pendingProgress;
    private TextView pendingState;
    private Button pendingButton;

    AppUpdater(Activity activity,android.content.SharedPreferences prefs){
        this.activity=activity;this.prefs=prefs;
        activity.getApplication().registerActivityLifecycleCallbacks(this);
    }

    static boolean newer(String remote,String local){
        int[] a=parts(remote),b=parts(local);int n=Math.max(3,Math.max(a.length,b.length));
        for(int i=0;i<n;i++){int x=i<a.length?a[i]:0,y=i<b.length?b[i]:0;if(x!=y)return x>y;}
        return false;
    }
    static int[] parts(String v){
        String s=String.valueOf(v==null?"":v).trim().replaceFirst("^[vV]","").split("-",2)[0];
        String[] raw=s.split("\\.");int[] out=new int[raw.length];
        for(int i=0;i<raw.length;i++)try{out[i]=Integer.parseInt(raw[i].replaceAll("[^0-9].*$",""));}catch(Exception ignored){out[i]=0;}
        return out;
    }
    static boolean testRelease(String tag){return String.valueOf(tag).matches("(?i).*(^|[-_.])(test|demo|placeholder)($|[-_.]).*");}

    void check(boolean manual){
        if(checking){if(manual)toast("Already checking for updates…");return;}checking=true;
        io.execute(()->{try{
            Release release=latest();
            ui.post(()->{
                checking=false;
                if(!newer(release.version,BuildConfig.VERSION_NAME)){if(manual)toast("ZeroPlay is up to date · v"+BuildConfig.VERSION_NAME);return;}
                if(!manual&&release.version.equals(prefs.getString("skippedUpdateVersion","")))return;
                pending=release;show(release);
            });
        }catch(Exception e){ui.post(()->{checking=false;if(manual)toast("Could not check for updates · "+safe(e.getMessage()));});}});
    }

    private Release latest() throws Exception{
        HttpURLConnection c=open(API);c.setConnectTimeout(15000);c.setReadTimeout(15000);
        if(c.getResponseCode()!=200)throw new IOException("GitHub returned "+c.getResponseCode());
        JSONArray releases=new JSONArray(read(c.getInputStream(),3*1024*1024));JSONObject root=null;
        for(int i=0;i<releases.length();i++){JSONObject candidate=releases.optJSONObject(i);if(candidate==null||candidate.optBoolean("draft")||candidate.optBoolean("prerelease")||testRelease(candidate.optString("tag_name","")))continue;root=candidate;break;}
        if(root==null)throw new IOException("No stable ZeroPlay release is available");
        String tag=root.optString("tag_name","");String version=tag.replaceFirst("^[vV]","");
        JSONArray assets=root.optJSONArray("assets");JSONObject apk=null,sums=null;
        String expected=BuildConfig.TV?"ZeroPlay-"+version+"-Android-TV.apk":"ZeroPlay-"+version+"-Android.apk";
        if(assets!=null)for(int i=0;i<assets.length();i++){JSONObject a=assets.getJSONObject(i);String n=a.optString("name","");if(expected.equals(n))apk=a;if("SHA256SUMS.txt".equals(n))sums=a;}
        if(apk==null)throw new IOException("No "+(BuildConfig.TV?"Android TV":"Android")+" APK in the latest stable release");
        String digest=apk.optString("digest","");
        return new Release(version,tag,root.optString("name",tag),root.optString("body","No changelog was provided."),apk.optString("browser_download_url"),apk.optString("name"),digest,sums==null?null:sums.optString("browser_download_url",null));
    }

    private void show(Release r){
        if(activity.isFinishing())return;if(dialog!=null&&dialog.isShowing())dialog.dismiss();
        int pad=dp(20);LinearLayout box=new LinearLayout(activity);box.setOrientation(LinearLayout.VERTICAL);box.setPadding(pad,pad,pad,pad);
        TextView eyebrow=text("ZEROPLAY UPDATE",11,Color.rgb(101,230,204));eyebrow.setLetterSpacing(.12f);box.addView(eyebrow);
        TextView title=text("Update available",24,Color.WHITE);title.setTypeface(null,Typeface.BOLD);box.addView(title);
        TextView versions=text("v"+BuildConfig.VERSION_NAME+"  →  v"+r.version,14,Color.rgb(190,198,215));versions.setPadding(0,dp(4),0,dp(10));box.addView(versions);
        TextView warning=text("⚠ Android may require permission to install updates from ZeroPlay. If needed, Update will open the exact ‘Install unknown apps’ page for ZeroPlay. Enable it once, return here, and the update will continue automatically.",12,Color.rgb(255,201,77));warning.setPadding(0,0,0,dp(12));box.addView(warning);
        TextView ch=text(r.changelog,13,Color.rgb(225,229,238));ch.setTextIsSelectable(true);ScrollView sc=new ScrollView(activity);sc.addView(ch);box.addView(sc,new LinearLayout.LayoutParams(-1,dp(BuildConfig.TV?205:240)));
        ProgressBar progress=new ProgressBar(activity,null,android.R.attr.progressBarStyleHorizontal);progress.setMax(100);progress.setVisibility(View.GONE);box.addView(progress,new LinearLayout.LayoutParams(-1,dp(10)));
        TextView state=text("",12,Color.rgb(190,198,215));state.setPadding(0,dp(8),0,0);box.addView(state);
        dialog=new AlertDialog.Builder(activity).setView(box).setNegativeButton("Cancel",null).setNeutralButton("Skip this update",(d,w)->prefs.edit().putString("skippedUpdateVersion",r.version).apply()).setPositiveButton("Update",null).create();
        dialog.setOnShowListener(x->{Button update=dialog.getButton(AlertDialog.BUTTON_POSITIVE);update.setOnClickListener(v->begin(r,progress,state,update));if(BuildConfig.TV)update.requestFocus();});
        dialog.show();Window w=dialog.getWindow();if(w!=null){w.setBackgroundDrawableResource(android.R.color.transparent);w.setLayout(dp(BuildConfig.TV?620:Math.min(560,(int)(activity.getResources().getDisplayMetrics().widthPixels/activity.getResources().getDisplayMetrics().density)-28)),-2);}
    }

    private void begin(Release r,ProgressBar progress,TextView state,Button button){
        if(downloading)return;
        if(Build.VERSION.SDK_INT>=26&&!activity.getPackageManager().canRequestPackageInstalls()){
            waitingInstallPermission=true;pending=r;pendingProgress=progress;pendingState=state;pendingButton=button;
            state.setText("Permission required · enable ‘Allow from this source’ for ZeroPlay.");
            Intent settings=new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,Uri.parse("package:"+activity.getPackageName()));
            activity.startActivity(settings);return;
        }
        waitingInstallPermission=false;downloadAndInstall(r,progress,state,button);
    }

    private void downloadAndInstall(Release r,ProgressBar progress,TextView state,Button button){
        if(downloading)return;downloading=true;progress.setVisibility(View.VISIBLE);state.setText("Downloading update…");button.setEnabled(false);
        io.execute(()->{File apk=null;try{
            File dir=new File(activity.getFilesDir(),"updates");if(!dir.exists()&&!dir.mkdirs())throw new IOException("Could not create update folder");
            apk=new File(dir,"ZeroPlay-"+r.version+".apk");download(r.url,apk,(done,total)->ui.post(()->{int p=total>0?(int)Math.min(100,done*100/total):0;progress.setProgress(p);state.setText(total>0?"Downloading · "+p+"%":"Downloading update…");}));
            String expected=r.digest!=null&&r.digest.startsWith("sha256:")?r.digest.substring(7):checksumFromSums(r.sumsUrl,r.assetName);
            if(TextUtils.isEmpty(expected))throw new IOException("Release checksum is unavailable");
            String actual=sha256(apk);if(!actual.equalsIgnoreCase(expected.trim()))throw new IOException("SHA-256 verification failed");
            File ready=apk;ui.post(()->{downloading=false;state.setText("✓ Verified · opening Android installer…");button.setEnabled(true);install(ready);});
        }catch(Exception e){if(apk!=null)apk.delete();String msg=safe(e.getMessage());ui.post(()->{downloading=false;progress.setVisibility(View.GONE);button.setEnabled(true);state.setText("Update failed · "+msg);});}});
    }

    private void install(File apk){
        try{Uri uri=FileProvider.getUriForFile(activity,activity.getPackageName()+".files",apk);Intent i=new Intent(Intent.ACTION_VIEW);i.setDataAndType(uri,"application/vnd.android.package-archive");i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION|Intent.FLAG_ACTIVITY_NEW_TASK);activity.startActivity(i);}catch(Exception e){toast("Could not open Android installer · "+safe(e.getMessage()));}
    }

    private String checksumFromSums(String url,String name) throws Exception{
        if(TextUtils.isEmpty(url))return null;HttpURLConnection c=open(url);c.setConnectTimeout(15000);c.setReadTimeout(15000);if(c.getResponseCode()!=200)return null;
        String body=read(c.getInputStream(),512*1024);for(String line:body.split("\\r?\\n")){String s=line.trim();if(s.endsWith(name)){String[] p=s.split("\\s+");if(p.length>0&&p[0].matches("[A-Fa-f0-9]{64}"))return p[0];}}return null;
    }
    private void download(String url,File target,Progress cb) throws Exception{
        HttpURLConnection c=open(url);c.setConnectTimeout(20000);c.setReadTimeout(30000);c.setInstanceFollowRedirects(true);int code=c.getResponseCode();if(code<200||code>=300)throw new IOException("Download returned "+code);
        long total=c.getContentLengthLong(),done=0;byte[] buf=new byte[64*1024];try(InputStream in=new BufferedInputStream(c.getInputStream());OutputStream out=new BufferedOutputStream(new FileOutputStream(target))){int n;while((n=in.read(buf))!=-1){out.write(buf,0,n);done+=n;cb.on(done,total);}}if(total>0&&done!=total)throw new IOException("Downloaded APK is incomplete");
    }
    private static String sha256(File file) throws Exception{MessageDigest md=MessageDigest.getInstance("SHA-256");byte[] b=new byte[64*1024];try(InputStream in=new BufferedInputStream(new FileInputStream(file))){int n;while((n=in.read(b))!=-1)md.update(b,0,n);}StringBuilder s=new StringBuilder();for(byte x:md.digest())s.append(String.format(Locale.US,"%02x",x));return s.toString();}
    private static HttpURLConnection open(String url) throws Exception{HttpURLConnection c=(HttpURLConnection)new URL(url).openConnection();c.setRequestProperty("Accept","application/vnd.github+json");c.setRequestProperty("User-Agent","ZeroPlay-Android-Updater");return c;}
    private static String read(InputStream in,int max) throws Exception{ByteArrayOutputStream out=new ByteArrayOutputStream();byte[] b=new byte[8192];int total=0,n;while((n=in.read(b))!=-1){total+=n;if(total>max)throw new IOException("Response too large");out.write(b,0,n);}return out.toString("UTF-8");}
    private TextView text(String s,int size,int color){TextView t=new TextView(activity);t.setText(s);t.setTextSize(size);t.setTextColor(color);return t;}
    private int dp(float n){return(int)(activity.getResources().getDisplayMetrics().density*n+.5f);}
    private void toast(String s){Toast.makeText(activity,s,Toast.LENGTH_LONG).show();}
    private static String safe(String s){return TextUtils.isEmpty(s)?"Unknown error":s.replaceAll("https?://\\S+","network request");}
    private interface Progress{void on(long done,long total);}
    private static final class Release{final String version,tag,name,changelog,url,assetName,digest,sumsUrl;Release(String version,String tag,String name,String changelog,String url,String assetName,String digest,String sumsUrl){this.version=version;this.tag=tag;this.name=name;this.changelog=changelog;this.url=url;this.assetName=assetName;this.digest=digest;this.sumsUrl=sumsUrl;}}

    @Override public void onActivityResumed(Activity a){
        if(a!=activity||!waitingInstallPermission||Build.VERSION.SDK_INT<26)return;
        if(activity.getPackageManager().canRequestPackageInstalls()&&pending!=null&&pendingProgress!=null&&pendingState!=null&&pendingButton!=null){
            waitingInstallPermission=false;
            Release r=pending;ProgressBar p=pendingProgress;TextView s=pendingState;Button b=pendingButton;
            pendingProgress=null;pendingState=null;pendingButton=null;
            ui.postDelayed(()->downloadAndInstall(r,p,s,b),250);
        }
    }
    @Override public void onActivityDestroyed(Activity a){if(a==activity){try{activity.getApplication().unregisterActivityLifecycleCallbacks(this);}catch(Exception ignored){}io.shutdownNow();}}
    @Override public void onActivityCreated(Activity a,Bundle b){}
    @Override public void onActivityStarted(Activity a){}
    @Override public void onActivityPaused(Activity a){}
    @Override public void onActivityStopped(Activity a){}
    @Override public void onActivitySaveInstanceState(Activity a,Bundle b){}
}
