package br.com.sonoia.monitor;

import android.Manifest;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.media.MediaPlayer;
import android.os.Bundle;
import android.os.Handler;
import android.view.View;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import java.io.File;
import java.text.SimpleDateFormat;
import java.util.Arrays;
import java.util.Date;
import java.util.Locale;

public class MainActivity extends Activity {
  private LinearLayout root;
  private MediaPlayer player;
  private final Handler handler = new Handler();
  private final int bg = Color.rgb(10,20,38), fg = Color.rgb(235,243,252);
  private TextView text(String s, int size) {
    TextView t = new TextView(this); t.setText(s); t.setTextSize(size); t.setTextColor(fg);
    t.setPadding(0, 15, 0, 15); return t;
  }
  private Button button(String s, View.OnClickListener action) {
    Button b = new Button(this); b.setText(s); b.setAllCaps(false); b.setTextSize(15); b.setOnClickListener(action);
    root.addView(b); return b;
  }
  @Override public void onCreate(Bundle b) { super.onCreate(b); draw(); }
  @Override public void onResume() { super.onResume(); draw(); }
  private boolean active() { return getSharedPreferences("state",0).getBoolean("active",false); }
  private void draw() {
    ScrollView sc = new ScrollView(this); sc.setBackgroundColor(bg);
    root = new LinearLayout(this); root.setOrientation(LinearLayout.VERTICAL); root.setPadding(35,45,35,60);
    sc.addView(root); setContentView(sc);
    root.addView(text("SonoIA · Monitor Noturno",26));
    root.addView(text("Detecta e salva trechos de sons fortes durante o sono. Classificação experimental: não confirma roncos nem apneia.",15));
    root.addView(text(active() ? "● Monitoramento ativo" : "○ Monitoramento parado",20));
    if(active()) button("Encerrar monitoramento",v->{
      startService(new Intent(this,RecorderService.class).setAction(RecorderService.STOP));
      handler.postDelayed(this::draw,1300);
    }); else button("Iniciar monitoramento",v->{
      if(checkSelfPermission(Manifest.permission.RECORD_AUDIO)!=PackageManager.PERMISSION_GRANTED)
        requestPermissions(new String[]{Manifest.permission.RECORD_AUDIO},101);
      else startRecording();
    });
    root.addView(text("Gravações salvas neste celular",19));
    File base = new File(getFilesDir(),"recordings");
    File[] nights = base.listFiles(File::isDirectory);
    if(nights==null||nights.length==0) root.addView(text("Nenhuma gravação até agora.",14));
    else {
      Arrays.sort(nights,(a,b)->Long.compare(b.lastModified(),a.lastModified()));
      SimpleDateFormat date = new SimpleDateFormat("dd/MM/yyyy HH:mm",new Locale("pt","BR"));
      int total=0;
      for(File night:nights) {
        File[] clips=night.listFiles((d,n)->n.endsWith(".wav"));
        if(clips==null||clips.length==0) continue;
        root.addView(text("Noite iniciada em "+date.format(new Date(night.lastModified()))+" · "+clips.length+" trecho(s)",16));
        Arrays.sort(clips,(a,b)->a.getName().compareTo(b.getName()));
        for(File clip:clips) {
          if(++total>120) break;
          String label = clip.getName().replace("trecho_","").replace(".wav","");
          button("Ouvir · "+label+" ("+(clip.length()/1024)+" KB)",v->play(clip));
        }
      }
      button("Apagar TODAS as gravações",v->{
        new android.app.AlertDialog.Builder(this).setTitle("Excluir áudios?")
          .setMessage("Esta ação não pode ser desfeita.")
          .setNegativeButton("Cancelar",null)
          .setPositiveButton("Excluir",(d,w)->{ if(!active()) { deleteRecursively(base); draw(); } }).show();
      });
    }
    root.addView(text("Privacidade: áudios apenas no aparelho; sem internet. O smartwatch ainda não é integrado nesta versão.",13));
    root.addView(text("Saúde: episódios ou ausência de som no áudio não diagnosticam apneia. Procure avaliação médica em caso de engasgos, pausas observadas ou sonolência excessiva.",13));
  }
  private void startRecording() {
    try { startForegroundService(new Intent(this,RecorderService.class).setAction(RecorderService.START)); handler.postDelayed(this::draw,1000); }
    catch(Exception e){ new android.app.AlertDialog.Builder(this).setMessage("Erro ao iniciar: "+e.getMessage()).setPositiveButton("OK",null).show(); }
  }
  @Override public void onRequestPermissionsResult(int req,String[] perms,int[] results) {
    super.onRequestPermissionsResult(req,perms,results);
    if(req==101 && results.length>0 && results[0]==PackageManager.PERMISSION_GRANTED) startRecording();
    else if(req==101) new android.app.AlertDialog.Builder(this).setMessage("É necessário autorizar o microfone.").setPositiveButton("OK",null).show();
  }
  private void play(File f) {
    try { if(player!=null){player.release();player=null;}
      player=new MediaPlayer(); player.setDataSource(f.getAbsolutePath()); player.prepare(); player.start();
    } catch(Exception e){ new android.app.AlertDialog.Builder(this).setMessage("Não foi possível reproduzir o áudio.").setPositiveButton("OK",null).show(); }
  }
  private void deleteRecursively(File f) {
    if(f.isDirectory()){File[] children=f.listFiles();if(children!=null)for(File c:children)deleteRecursively(c);}
    f.delete();
  }
  @Override public void onDestroy(){if(player!=null){player.release();player=null;}super.onDestroy();}
}
