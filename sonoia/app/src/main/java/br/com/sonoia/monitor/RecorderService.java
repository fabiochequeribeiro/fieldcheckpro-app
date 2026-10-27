package br.com.sonoia.monitor;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.media.AudioFormat;
import android.media.AudioRecord;
import android.media.MediaRecorder;
import android.os.IBinder;
import android.os.PowerManager;
import android.util.Log;
import java.io.File;
import java.io.IOException;
import java.io.RandomAccessFile;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import java.util.concurrent.atomic.AtomicBoolean;

public class RecorderService extends Service {
  static final String START="br.com.sonoia.START", STOP="br.com.sonoia.STOP", CHANNEL="sonoia";
  private final AtomicBoolean running=new AtomicBoolean(false);
  private AudioRecord mic; private PowerManager.WakeLock lock; private Thread worker;
  private File folder;
  @Override public IBinder onBind(Intent i){return null;}
  @Override public void onCreate(){
    super.onCreate();
    NotificationChannel c=new NotificationChannel(CHANNEL,"SonoIA: gravação noturna",NotificationManager.IMPORTANCE_LOW);
    ((NotificationManager)getSystemService(NOTIFICATION_SERVICE)).createNotificationChannel(c);
  }
  private Notification notification(){
    PendingIntent open=PendingIntent.getActivity(this,0,new Intent(this,MainActivity.class),PendingIntent.FLAG_IMMUTABLE);
    PendingIntent stop=PendingIntent.getService(this,1,new Intent(this,RecorderService.class).setAction(STOP),PendingIntent.FLAG_IMMUTABLE);
    return new Notification.Builder(this,CHANNEL).setSmallIcon(android.R.drawable.ic_btn_speak_now)
      .setContentTitle("SonoIA monitorando sons").setContentText("O microfone está ativo. Toque para abrir.")
      .setContentIntent(open).setOngoing(true)
      .addAction(android.R.drawable.ic_media_pause,"Parar",stop).build();
  }
  @Override public int onStartCommand(Intent i,int flags,int startId){
    if(i!=null && STOP.equals(i.getAction())){
      running.set(false); try{ if(mic!=null) mic.stop(); }catch(Exception ignored){}
      stopSelf();return START_NOT_STICKY;
    }
    if(!running.compareAndSet(false,true))return START_NOT_STICKY;
    try{
      startForeground(2005,notification(),ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE);
      folder=new File(new File(getFilesDir(),"recordings"),"noite_"+System.currentTimeMillis());
      if(!folder.mkdirs())throw new IOException("Falha criando pasta");
      PowerManager pm=(PowerManager)getSystemService(POWER_SERVICE);
      lock=pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK,"SonoIA:recorder");
      lock.acquire(10*60*60*1000L);
      getSharedPreferences("state",0).edit().putBoolean("active",true).apply();
      worker=new Thread(this::recordLoop,"sonoia-audio");worker.start();
    } catch(Exception e){Log.e("SonoIA","Start",e);finish();stopSelf();}
    return START_NOT_STICKY;
  }
  private void recordLoop(){
    final int rate=16000, frameSize=1600;
    RandomAccessFile out=null; File clip=null; long lastLoud=0,start=0; int written=0; int loudFrames=0;
    double ambient=-58;
    try{
      int buf=Math.max(AudioRecord.getMinBufferSize(rate,AudioFormat.CHANNEL_IN_MONO,AudioFormat.ENCODING_PCM_16BIT)*2,frameSize*8);
      mic=new AudioRecord(MediaRecorder.AudioSource.MIC,rate,AudioFormat.CHANNEL_IN_MONO,AudioFormat.ENCODING_PCM_16BIT,buf);
      if(mic.getState()!=AudioRecord.STATE_INITIALIZED)throw new IOException("Microfone indisponível");
      mic.startRecording();
      while(running.get()){
        short[] samples=new short[frameSize];
        int n=mic.read(samples,0,frameSize,AudioRecord.READ_BLOCKING);
        if(n<=0)break;
        double rms=0;for(int j=0;j<n;j++)rms+=samples[j]*(double)samples[j];
        double db=20*Math.log10(Math.sqrt(rms/n)/32768.0+1e-9);
        boolean loud=db>-47 && db>ambient+10;
        if(!loud)ambient=0.995*ambient+0.005*Math.min(db,ambient+2);
        if(loud){loudFrames++;lastLoud=System.currentTimeMillis();}else loudFrames=0;
        long now=System.currentTimeMillis();
        if(out==null && loudFrames>=3){
          start=now;written=0;
          String name=new SimpleDateFormat("HHmmss_SSS",Locale.US).format(new Date(start));
          clip=new File(folder,"trecho_"+name+".wav");
          out=new RandomAccessFile(clip,"rw");out.write(new byte[44]);
        }
        if(out!=null){
          for(int j=0;j<n;j++){out.writeByte(samples[j]&255);out.writeByte((samples[j]>>>8)&255);}
          written+=n*2;
          if(now-lastLoud>1600 || now-start>30000){
            finishWav(out,written,rate);out.close();out=null;clip=null;
          }
        }
      }
    }catch(Exception e){Log.e("SonoIA","Audio",e);}
    finally{
      if(out!=null)try{finishWav(out,written,rate);out.close();}catch(Exception ignored){}
      try{if(mic!=null){mic.stop();mic.release();}}catch(Exception ignored){}mic=null;
      running.set(false);finish();stopSelf();
    }
  }
  private static void little(RandomAccessFile f,long number,int bytes)throws IOException{
    for(int i=0;i<bytes;i++) f.writeByte((int)((number >>> (8*i)) & 0xff));
  }
  private static void finishWav(RandomAccessFile f,int length,int rate)throws IOException{
    f.seek(0);f.writeBytes("RIFF");little(f,36+length,4);f.writeBytes("WAVE");
    f.writeBytes("fmt ");little(f,16,4);little(f,1,2);little(f,1,2);
    little(f,rate,4);little(f,rate*2,4);little(f,2,2);little(f,16,2);
    f.writeBytes("data");little(f,length,4);
  }
  private synchronized void finish(){
    getSharedPreferences("state",0).edit().putBoolean("active",false).apply();
    if(lock!=null){if(lock.isHeld())lock.release();lock=null;}
    try{stopForeground(STOP_FOREGROUND_REMOVE);}catch(Exception ignored){}
  }
  @Override public void onDestroy(){
    running.set(false);
    try{if(mic!=null)mic.stop();}catch(Exception ignored){}
    if(worker==null)finish();
    super.onDestroy();
  }
}
