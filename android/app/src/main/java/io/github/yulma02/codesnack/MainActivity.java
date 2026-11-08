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
    private LinearLayout app,header,tabBar;
    private FrameLayout content;
    private TextView headerSubtitle,headerAction,xpValue,streakValue,nameValue;
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
        makeHeader();
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

    private void makeHeader(){
        header=SnackUi.row(this);SnackUi.pad(header,this,18,13,16,13);header.setBackgroundColor(SnackUi.BG);
        ImageView logo=new ImageView(this);logo.setImageResource(R.drawable.app_icon);logo.setScaleType(ImageView.ScaleType.CENTER_CROP);
        logo.setBackground(SnackUi.bg(this,SnackUi.BLUE_SOFT,13));
        header.addView(logo,SnackUi.lp(this,43,43));
        LinearLayout title=SnackUi.column(this);LinearLayout.LayoutParams tlp=new LinearLayout.LayoutParams(0,-2,1);tlp.leftMargin=SnackUi.dp(this,11);header.addView(title,tlp);
        title.addView(SnackUi.text(this,"CodeSnack",19,SnackUi.INK,true));
        headerSubtitle=SnackUi.text(this,"학습하기",11,SnackUi.MUTED,false);title.addView(SnackUi.spacer(this,3));title.addView(headerSubtitle);
        headerAction=SnackUi.centered(this,"↻",24,SnackUi.BLUE,true);
        headerAction.setBackground(SnackUi.bg(this,SnackUi.WHITE,14));header.addView(headerAction,SnackUi.lp(this,43,43));
        headerAction.setOnClickListener(v->{
            if(selectedTab.equals("learn"))selectTab("profile");
            else if(sessions.containsKey(selectedTab))sessions.get(selectedTab).reload();
        });
        app.addView(header,SnackUi.lp(this,-1,-2));
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
        int index=0;for(int i=0;i<TABS.length;i++)if(TABS[i].equals(tab))index=i;
        headerSubtitle.setText(LABELS[index]);
        headerAction.setText(tab.equals("learn")?"◉":"↻");headerAction.setContentDescription(tab.equals("learn")?"마이페이지 열기":"현재 화면 새로고침");
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
    private View createProfileScreen(){
        LinearLayout panel=SnackUi.column(this);panel.setBackgroundColor(SnackUi.BG);
        LinearLayout profileTop=SnackUi.column(this);SnackUi.pad(profileTop,this,17,8,17,13);
        LinearLayout identity=SnackUi.row(this);ImageView avatar=new ImageView(this);avatar.setImageResource(R.drawable.app_icon);
        identity.addView(avatar,SnackUi.lp(this,42,42));
        LinearLayout nameColumn=SnackUi.column(this);LinearLayout.LayoutParams nlp=new LinearLayout.LayoutParams(0,-2,1);nlp.leftMargin=SnackUi.dp(this,11);identity.addView(nameColumn,nlp);
        nameValue=SnackUi.text(this,"나의 CodeSnack",17,SnackUi.INK,true);nameColumn.addView(nameValue);
        nameColumn.addView(SnackUi.spacer(this,4));nameColumn.addView(SnackUi.text(this,"내 학습 기록과 계정을 관리해요",11,SnackUi.MUTED,false));
        TextView login=SnackUi.button(this,"로그인",false);identity.addView(login);login.setOnClickListener(v->openExtra("auth",null));
        profileTop.addView(identity);profileTop.addView(SnackUi.spacer(this,14));
        LinearLayout metrics=SnackUi.row(this);
        LinearLayout xpCard=metricCard("누적 경험치","★",SnackUi.LAVENDER);xpValue=(TextView)xpCard.getTag();metrics.addView(xpCard,new LinearLayout.LayoutParams(0,SnackUi.dp(this,104),1));
        LinearLayout streakCard=metricCard("연속 학습","⚡",SnackUi.LIME);streakValue=(TextView)streakCard.getTag();
        LinearLayout.LayoutParams stlp=new LinearLayout.LayoutParams(0,SnackUi.dp(this,104),1);stlp.leftMargin=SnackUi.dp(this,10);metrics.addView(streakCard,stlp);
        profileTop.addView(metrics);profileTop.addView(SnackUi.spacer(this,19));
        profileTop.addView(SnackUi.text(this,"계정 설정",19,SnackUi.INK,true));
        profileTop.addView(SnackUi.spacer(this,4));profileTop.addView(SnackUi.text(this,"아래에서 프로필과 내 활동을 관리할 수 있어요",11,SnackUi.MUTED,false));
        profileTop.addView(SnackUi.spacer(this,12));
        panel.addView(profileTop);
        SitePanel session=new SitePanel(this,"mypage",null);sessions.put("profile",session);
        session.setProfileCallback(obj->{
            if(nameValue!=null){String name=obj.optString("name","");if(!name.isEmpty()&&!name.equals("사용자"))nameValue.setText(name);}
            if(xpValue!=null){String xp=obj.optString("xp","");xpValue.setText(xp.isEmpty()?"—":xp);}
            if(streakValue!=null){String streak=obj.optString("streak","");streakValue.setText(streak.isEmpty()?"—":streak);}
        });
        HorizontalScrollView menuScroll=new HorizontalScrollView(this);menuScroll.setHorizontalScrollBarEnabled(false);
        LinearLayout menu=SnackUi.row(this);SnackUi.pad(menu,this,17,0,8,11);
        String[][] sections={{"profile","내 정보"},{"learning","학습 기록"},{"quizzes","내 퀴즈"},{"role","수업"},{"preferences","화면 설정"}};
        final TextView[] active={null};
        for(String[] section:sections){TextView pill=SnackUi.capsule(this,section[1],section[0].equals("profile"));
            LinearLayout.LayoutParams lp=SnackUi.lp(this,-2,-2);lp.rightMargin=SnackUi.dp(this,8);menu.addView(pill,lp);
            if(section[0].equals("profile"))active[0]=pill;
            pill.setOnClickListener(v->{
                if(active[0]!=null){active[0].setBackground(SnackUi.bg(this,SnackUi.WHITE,18));active[0].setTextColor(SnackUi.INK);}
                pill.setBackground(SnackUi.bg(this,SnackUi.BLUE,18));pill.setTextColor(SnackUi.WHITE);active[0]=pill;
                session.section(section[0]);
            });
        }
        menuScroll.addView(menu);panel.addView(menuScroll);
        panel.addView(session.view(),new LinearLayout.LayoutParams(-1,0,1));return panel;
    }
    private LinearLayout metricCard(String label,String symbol,int background){
        LinearLayout card=SnackUi.column(this);SnackUi.pad(card,this,15,13,13,13);card.setBackground(SnackUi.bg(this,background,20));
        card.addView(SnackUi.text(this,symbol+"  "+label,12,SnackUi.INK,true));
        card.addView(SnackUi.spacer(this,12));
        // Keep a direct reference to the metric value rather than casting the spacer at child index 1.
        TextView value=SnackUi.text(this,"—",24,SnackUi.INK,true);
        card.addView(value);card.setTag(value);return card;
    }
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
