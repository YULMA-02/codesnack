package io.github.yulma02.codesnack;

import android.app.Activity;
import android.app.Dialog;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.view.WindowManager;
import android.widget.FrameLayout;
import android.widget.HorizontalScrollView;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.webkit.ValueCallback;
import java.util.LinkedHashMap;
import java.util.Map;

/** CodeSnack for Android — native Material-style shell with the existing live CodeSnack site. */
public final class MainActivity extends Activity {
    private static final int FILE_REQUEST=1157;
    private static final String[] TABS={"learn","studio","tutor","profile"};
    private static final String[] LABELS={"학습하기","스낵 스튜디오","AI 튜터","마이페이지"};
    private static final int[] ICONS={R.drawable.ic_learn,R.drawable.ic_studio,R.drawable.ic_tutor,R.drawable.ic_profile};
    private LinearLayout app,tabBar;
    private FrameLayout content;
    
    private final Map<String,View> screens=new LinkedHashMap<>();
    private final Map<String,SitePanel> sessions=new LinkedHashMap<>();
    private String selectedTab="learn";
    private ValueCallback<Uri[]> pendingFiles;
    private Dialog extraDialog;
    private SitePanel extraPanel;

    @Override public void onCreate(Bundle savedInstanceState){
        super.onCreate(savedInstanceState);
        Window win=getWindow();win.setStatusBarColor(SnackUi.BG);win.setNavigationBarColor(SnackUi.WHITE);
        win.getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR|View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR);
        win.setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE);
        app=SnackUi.column(this);app.setBackgroundColor(SnackUi.BG);setContentView(app);
        content=new FrameLayout(this);content.setBackgroundColor(SnackUi.BG);
        app.addView(content,new LinearLayout.LayoutParams(-1,0,1));
        makeBottomNavigation();
        addScreen("learn",new LearningScreen(this,new LearningScreen.Listener(){
            @Override public void route(String page,String language){openExtra(page,language);}
            @Override public void tab(String tab){selectTab(tab);}
        }).view());
        app.getViewTreeObserver().addOnGlobalLayoutListener(()->{
            android.graphics.Rect rect=new android.graphics.Rect();app.getWindowVisibleDisplayFrame(rect);
            int total=app.getRootView().getHeight();int hidden=total-rect.bottom;
            boolean keyboard=hidden>SnackUi.dp(this,165);
            if(tabBar.getVisibility()!=(keyboard?View.GONE:View.VISIBLE))tabBar.setVisibility(keyboard?View.GONE:View.VISIBLE);
        });
        selectTab("learn");
    }

    private void makeBottomNavigation(){
        tabBar=SnackUi.row(this);SnackUi.pad(tabBar,this,7,8,7,7);tabBar.setGravity(Gravity.CENTER);
        tabBar.setBackgroundColor(SnackUi.WHITE);tabBar.setElevation(SnackUi.dp(this,10));
        app.addView(tabBar,SnackUi.lp(this,-1,80));
    }
    private void renderNavigation(){
        tabBar.removeAllViews();
        for(int i=0;i<TABS.length;i++){
            final String route=TABS[i];boolean active=selectedTab.equals(route);
            LinearLayout item=SnackUi.column(this);item.setGravity(Gravity.CENTER);item.setClickable(true);
            item.setContentDescription(LABELS[i]+(active?", 선택됨":""));
            LinearLayout.LayoutParams navlp=new LinearLayout.LayoutParams(0,-1,1);tabBar.addView(item,navlp);
            FrameLayout activePill=new FrameLayout(this);activePill.setBackground(SnackUi.bg(this,active?SnackUi.BLUE_SOFT:SnackUi.WHITE,20));
            LinearLayout.LayoutParams pill=SnackUi.lp(this,65,34);item.addView(activePill,pill);
            ImageView img=new ImageView(this);img.setImageResource(ICONS[i]);
            img.setColorFilter(active?SnackUi.BLUE:SnackUi.MUTED);img.setScaleType(ImageView.ScaleType.FIT_CENTER);
            FrameLayout.LayoutParams ilp=new FrameLayout.LayoutParams(SnackUi.dp(this,23),SnackUi.dp(this,23),Gravity.CENTER);
            activePill.addView(img,ilp);
            item.addView(SnackUi.spacer(this,4));
            TextView text=SnackUi.centered(this,LABELS[i],10,active?SnackUi.BLUE:SnackUi.MUTED,active);
            text.setSingleLine(true);text.setTextScaleX(0.96f);
            item.addView(text,SnackUi.lp(this,-1,17));item.setOnClickListener(v->selectTab(route));
        }
    }
    private void addScreen(String id,View screen){
        screens.put(id,screen);FrameLayout.LayoutParams lp=new FrameLayout.LayoutParams(-1,-1);content.addView(screen,lp);screen.setVisibility(View.GONE);
    }
    private void selectTab(String tab){
        selectedTab=tab;
        if(!screens.containsKey(tab)){
            if(tab.equals("studio"))addScreen(tab,createStudioScreen());
            else if(tab.equals("tutor"))addScreen(tab,createTutorScreen());
            else if(tab.equals("profile"))addScreen(tab,createProfileScreen());
        }
        for(Map.Entry<String,View> entry:screens.entrySet())entry.getValue().setVisibility(entry.getKey().equals(tab)?View.VISIBLE:View.GONE);
        if(sessions.containsKey(tab))sessions.get(tab).onShown();
        renderNavigation();
    }
    private View createStudioScreen(){
        LinearLayout panel=SnackUi.column(this);panel.setBackgroundColor(SnackUi.BG);
        LinearLayout tools=SnackUi.row(this);SnackUi.pad(tools,this,17,7,17,12);
        TextView label=SnackUi.text(this,"나의 코딩 공간",14,SnackUi.INK,true);tools.addView(label,new LinearLayout.LayoutParams(0,-2,1));
        TextView examples=SnackUi.button(this,"예제",false);tools.addView(examples);examples.setOnClickListener(v->openExtra("templates",null));
        TextView run=SnackUi.button(this,"▶  실행",true);LinearLayout.LayoutParams rp=SnackUi.lp(this,-2,-2);rp.leftMargin=SnackUi.dp(this,8);tools.addView(run,rp);
        panel.addView(tools);
        SitePanel session=new SitePanel(this,"vscode",null);sessions.put("studio",session);
        run.setOnClickListener(v->session.run("if(typeof runVscCurrentFile==='function')runVscCurrentFile();"));
        panel.addView(session.view(),new LinearLayout.LayoutParams(-1,0,1));return panel;
    }
    private View createTutorScreen(){
        LinearLayout panel=SnackUi.column(this);panel.setBackgroundColor(SnackUi.BG);
        SitePanel session=new SitePanel(this,"ai-chat",null);sessions.put("tutor",session);
        HorizontalScrollView strip=new HorizontalScrollView(this);strip.setHorizontalScrollBarEnabled(false);
        LinearLayout chips=SnackUi.row(this);SnackUi.pad(chips,this,16,5,8,12);
        String[][] questions={{"for문 알려줘","반복문과 for문을 처음 배우는 사람도 이해할 수 있게 설명해줘"},{"Python 리스트","Python 리스트를 간단한 예제와 함께 설명해줘"},{"오류 해결","코드에서 오류를 발견했을 때 해결하는 방법을 알려줘"}};
        for(String[] q:questions){TextView chip=SnackUi.capsule(this,"✦  "+q[0],false);LinearLayout.LayoutParams cl=SnackUi.lp(this,-2,-2);cl.rightMargin=SnackUi.dp(this,8);chips.addView(chip,cl);
            chip.setOnClickListener(v->session.run("if(typeof sendQuickQuestion==='function')sendQuickQuestion("+org.json.JSONObject.quote(q[1])+");"));}
        strip.addView(chips);panel.addView(strip);
        panel.addView(session.view(),new LinearLayout.LayoutParams(-1,0,1));return panel;
    }
    /** The profile header, XP, streak and account form now share one WebView scroll surface. */
    private View createProfileScreen(){
        SitePanel session=new SitePanel(this,"mypage",null);
        sessions.put("profile",session);
        return session.view();
    }
    /** Only invoked for the app's own account action URL from the trusted site. */
    void openAccountLogin(){openExtra("auth",null);}
    private void openExtra(String route,String language){
        extraDialog=new Dialog(this);
        LinearLayout layout=SnackUi.column(this);layout.setBackgroundColor(SnackUi.BG);
        LinearLayout toolbar=SnackUi.row(this);SnackUi.pad(toolbar,this,18,14,16,13);
        TextView title=SnackUi.text(this,routeTitle(route),18,SnackUi.INK,true);toolbar.addView(title,new LinearLayout.LayoutParams(0,-2,1));
        TextView close=SnackUi.button(this,"닫기 ✕",false);toolbar.addView(close);close.setOnClickListener(v->extraDialog.dismiss());layout.addView(toolbar);
        extraPanel=new SitePanel(this,route,language);layout.addView(extraPanel.view(),new LinearLayout.LayoutParams(-1,0,1));
        extraDialog.setContentView(layout);Window win=extraDialog.getWindow();if(win!=null){win.setBackgroundDrawableResource(android.R.color.transparent);win.setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE);}
        extraDialog.setOnDismissListener(d->{if(sessions.containsKey("profile"))sessions.get("profile").reload();extraPanel=null;extraDialog=null;});
        extraDialog.show();if(extraDialog.getWindow()!=null)extraDialog.getWindow().setLayout(-1,-1);
    }
    private String routeTitle(String route){
        switch(route){case "tutorial":return "학습하기";case "quiz":return "퀴즈";case "templates":return "코드 예제";
            case "auth":return "로그인 · 회원가입";case "path":return "학습 로드맵";default:return "CodeSnack";}
    }
    /** Web input[type=file] picker: no storage permission required. */
    boolean openFileChooser(ValueCallback<Uri[]> callback){
        if(pendingFiles!=null)pendingFiles.onReceiveValue(null);pendingFiles=callback;
        try{Intent intent=new Intent(Intent.ACTION_GET_CONTENT);intent.setType("*/*");intent.addCategory(Intent.CATEGORY_OPENABLE);
            startActivityForResult(Intent.createChooser(intent,"파일 선택"),FILE_REQUEST);return true;
        }catch(Exception e){pendingFiles=null;callback.onReceiveValue(null);return false;}
    }
    @Override protected void onActivityResult(int requestCode,int resultCode,Intent data){
        super.onActivityResult(requestCode,resultCode,data);
        if(requestCode==FILE_REQUEST&&pendingFiles!=null){
            Uri[] files=resultCode==RESULT_OK&&data!=null&&data.getData()!=null?new Uri[]{data.getData()}:null;
            pendingFiles.onReceiveValue(files);pendingFiles=null;
        }
    }
    @Override public void onBackPressed(){
        if(extraDialog!=null){extraDialog.dismiss();return;}
        SitePanel panel=sessions.get(selectedTab);
        if(panel!=null&&panel.canGoBack()){panel.goBack();return;}
        if(!selectedTab.equals("learn")){selectTab("learn");return;}
        super.onBackPressed();
    }
    @Override protected void onDestroy(){
        for(SitePanel session:sessions.values())session.web.destroy();
        if(extraPanel!=null)extraPanel.web.destroy();super.onDestroy();
    }
}
