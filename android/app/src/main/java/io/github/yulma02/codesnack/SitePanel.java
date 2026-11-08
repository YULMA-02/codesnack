package io.github.yulma02.codesnack;

import android.app.Activity;
import android.app.DownloadManager;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Environment;
import android.os.Handler;
import android.os.Looper;
import android.view.Gravity;
import android.view.View;
import android.webkit.CookieManager;
import android.webkit.DownloadListener;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebSettings;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;
import org.json.JSONObject;
import java.io.InputStream;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.util.function.Consumer;

/** Keeps a WebView per destination so studio edits and chat survive native tab changes. */
final class SitePanel {
    static final String HOME="https://yulma-02.github.io/codesnack/";
    private final MainActivity activity;
    private final String route,language;
    final FrameLayout root;
    final WebView web;
    private final LinearLayout waiting;
    private final TextView notice;
    private final Handler handler=new Handler(Looper.getMainLooper());
    private final String mobileCss;
    private Consumer<JSONObject> profileCallback;
    private boolean ready=false, failed=false;
    private int attempts=0;

    SitePanel(MainActivity activity,String route,String language){
        this.activity=activity;this.route=route;this.language=language==null?"":language;
        mobileCss=readCss(activity);
        root=new FrameLayout(activity);root.setBackgroundColor(SnackUi.BG);
        web=new WebView(activity);web.setVisibility(View.INVISIBLE);web.setBackgroundColor(SnackUi.BG);
        root.addView(web,new FrameLayout.LayoutParams(-1,-1));
        waiting=SnackUi.column(activity);waiting.setGravity(Gravity.CENTER);SnackUi.pad(waiting,activity,22,22,22,22);
        ProgressBar progress=new ProgressBar(activity);progress.setIndeterminateTintList(android.content.res.ColorStateList.valueOf(SnackUi.BLUE));
        waiting.addView(progress,SnackUi.lp(activity,39,39));
        waiting.addView(SnackUi.spacer(activity,19));
        notice=SnackUi.centered(activity,"화면을 불러오는 중…",13,SnackUi.MUTED,true);waiting.addView(notice);
        waiting.setOnClickListener(v->{if(failed)reload();});
        FrameLayout.LayoutParams wp=new FrameLayout.LayoutParams(-1,-2,Gravity.CENTER);root.addView(waiting,wp);
        configure();reload();
    }
    View view(){return root;}
    void setProfileCallback(Consumer<JSONObject> callback){this.profileCallback=callback;}
    void reload(){ready=false;failed=false;attempts=0;waiting.setVisibility(View.VISIBLE);web.setVisibility(View.INVISIBLE);notice.setText("화면을 불러오는 중…");web.loadUrl(HOME);}
    void run(String javascript){if(ready)web.evaluateJavascript("(function(){try{"+javascript+"}catch(e){console.warn(e)}})();",null);}
    void section(String name){if(!name.matches("profile|learning|role|quizzes|preferences"))return;
        run("if(typeof switchMyPageSection==='function')switchMyPageSection("+JSONObject.quote(name)+");");}
    boolean canGoBack(){return web.canGoBack();}
    void goBack(){web.goBack();}
    void onShown(){if(route.equals("mypage")&&ready)fetchProfile();}

    private void configure(){
        WebSettings settings=web.getSettings();
        settings.setJavaScriptEnabled(true);settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);settings.setAllowContentAccess(true);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);settings.setSupportMultipleWindows(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setBuiltInZoomControls(false);settings.setDisplayZoomControls(false);
        settings.setMediaPlaybackRequiresUserGesture(true);
        settings.setDefaultTextEncodingName("UTF-8");
        CookieManager.getInstance().setAcceptCookie(true);CookieManager.getInstance().setAcceptThirdPartyCookies(web,true);
        web.setWebViewClient(new WebViewClient(){
            @Override public void onPageStarted(WebView v,String url,android.graphics.Bitmap icon){
                ready=false;failed=false;attempts=0;web.setVisibility(View.INVISIBLE);waiting.setVisibility(View.VISIBLE);
            }
            @Override public void onPageFinished(WebView v,String url){
                if(url.startsWith(HOME)){
                    web.evaluateJavascript(injectionScript(),null);
                    handler.postDelayed(()->poll(),180);
                }
            }
            @Override public boolean shouldOverrideUrlLoading(WebView v,WebResourceRequest request){
                Uri uri=request.getUrl();String scheme=uri.getScheme()==null?"":uri.getScheme();
                if("codesnack".equalsIgnoreCase(scheme) && "auth".equalsIgnoreCase(uri.getHost())){
                    activity.openAccountLogin();return true;
                }
                if((scheme.equals("https")||scheme.equals("http")) && "yulma-02.github.io".equalsIgnoreCase(uri.getHost()))return false;
                try{activity.startActivity(new Intent(Intent.ACTION_VIEW,uri));}catch(Exception e){notice.setText("외부 주소를 열 수 없어요.");}
                return true;
            }
            @Override public void onReceivedError(WebView v,WebResourceRequest request,WebResourceError error){
                if(request.isForMainFrame()){failed=true;showFailure("네트워크 연결을 확인하고 눌러서 다시 시도해 주세요.");}
            }
        });
        web.setWebChromeClient(new WebChromeClient(){
            @Override public boolean onShowFileChooser(WebView v,ValueCallback<Uri[]> callback,FileChooserParams params){
                return activity.openFileChooser(callback);
            }
        });
        web.setDownloadListener((url,ua,disposition,mimeType,length)->{
            if(!url.startsWith("https://")){android.widget.Toast.makeText(activity,"다운로드 링크를 지원하지 않아요.",android.widget.Toast.LENGTH_SHORT).show();return;}
            try{
                DownloadManager.Request req=new DownloadManager.Request(Uri.parse(url));
                req.addRequestHeader("Cookie",CookieManager.getInstance().getCookie(url));
                req.setTitle("CodeSnack 다운로드");req.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
                req.setDestinationInExternalFilesDir(activity,Environment.DIRECTORY_DOWNLOADS,"codesnack-"+System.currentTimeMillis());
                DownloadManager dm=(DownloadManager)activity.getSystemService(Context.DOWNLOAD_SERVICE);dm.enqueue(req);
                android.widget.Toast.makeText(activity,"파일 다운로드를 시작했어요.",android.widget.Toast.LENGTH_SHORT).show();
            }catch(Exception e){android.widget.Toast.makeText(activity,"파일을 저장할 수 없어요.",android.widget.Toast.LENGTH_SHORT).show();}
        });
    }
    private void showFailure(String message){waiting.setVisibility(View.VISIBLE);web.setVisibility(View.INVISIBLE);notice.setText(message);}
    private void poll(){
        if(ready||failed)return;
        web.evaluateJavascript("Boolean(window.__codesnackAndroidReady)",result->{
            if("true".equals(result)){
                ready=true;waiting.setVisibility(View.GONE);web.setVisibility(View.VISIBLE);
                if("mypage".equals(route))fetchProfile();
            } else if(++attempts<=100){handler.postDelayed(this::poll,160);}
            else{failed=true;showFailure("사이트를 열지 못했어요. 눌러서 다시 시도해 주세요.");}
        });
    }
    void fetchProfile(){
        if(!ready||profileCallback==null)return;
        String script="(function(){var g=function(id){return(document.getElementById(id)?.textContent||'').trim()};return JSON.stringify({name:g('profileNickname'),xp:g('myPageXP'),streak:g('myPageStreak'),solved:g('myPageSolvedCount')})})()";
        web.evaluateJavascript(script,val->{
            if(val==null||val.equals("null"))return;
            try{String decoded=new org.json.JSONArray("["+val+"]").getString(0);profileCallback.accept(new JSONObject(decoded));}
            catch(Exception ignored){}
        });
    }
    private String injectionScript(){
        String profileUi="mypage".equals(route)?readAsset(activity,"profile-shell.js"):"";
        String js="(function(){"
           +profileUi
           +"if(window.__codesnackAndroidStarted)return;window.__codesnackAndroidStarted=true;window.__codesnackAndroidReady=false;"
           +"var css="+JSONObject.quote(mobileCss)+";"
           +"var style=document.createElement('style');style.textContent=css;document.head.appendChild(style);"
           +"var route="+JSONObject.quote(route)+";var lang="+JSONObject.quote(language)+";var count=0;"
           +"function apply(){var el=document.getElementById('view-'+route);"
           +"var modular=!!document.querySelector('script[src*=bootstrap]');"
           +"if((!modular||window.codesnackPagesReady===true)&&typeof window.switchTab==='function'&&el){"
           +"try{if(lang&&typeof window.setLanguage==='function')window.setLanguage(lang);window.switchTab(route);"
           +"if(route==='mypage'&&typeof window.switchMyPageSection==='function')window.switchMyPageSection('profile');"
           +"document.body.setAttribute('data-cs-mobile-route',route);"
           +"if(route==='mypage'&&typeof installCodeSnackProfileShell==='function')installCodeSnackProfileShell();"
           +"window.scrollTo(0,0);window.__codesnackAndroidReady=true;}"
           +"catch(e){console.warn('Android route:',e)}}"
           +"else if(++count<130)setTimeout(apply,150);}" 
           +"apply();})();";
        return js;
    }
    private static String readCss(Context context){return readAsset(context,"mobile.css");}
    private static String readAsset(Context context,String filename){
        try(InputStream stream=context.getAssets().open(filename)){
            ByteArrayOutputStream out=new ByteArrayOutputStream();byte[] buffer=new byte[8192];int n;
            while((n=stream.read(buffer))!=-1)out.write(buffer,0,n);return out.toString("UTF-8");
        }catch(Exception e){return "";}
    }
}
