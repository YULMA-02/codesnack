package io.github.yulma02.codesnack;

import android.app.AlertDialog;
import android.content.Context;
import android.content.SharedPreferences;
import android.graphics.Typeface;
import android.view.Gravity;
import android.view.View;
import android.widget.HorizontalScrollView;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.ImageView;
import java.util.HashSet;
import java.util.Set;

final class LearningScreen {
    interface Listener { void route(String page, String language); void tab(String name); }
    private final Context ctx;
    private final Listener listener;
    private final SharedPreferences prefs;
    private final ScrollView scroll;
    private String language="python";
    private static final String[][] PY={
      {"py-variable","변수와 자료형","값을 이름으로 저장하기","5분","변수는 데이터를 저장하고 다시 사용할 수 있게 해 주는 이름입니다. Python에서는 = 기호로 값을 대입해요.","name = 'CodeSnack'\nage = 17\nprint(name, age)","문자열은 따옴표로 감싸고 숫자는 그대로 적어요."},
      {"py-if","조건문","if, else로 판단하기","7분","조건문은 조건이 맞을 때와 아닐 때 실행할 코드를 구분합니다. Python에서는 들여쓰기가 중요해요.","score = 90\nif score >= 80:\n    print('잘했어요!')\nelse:\n    print('다시 도전!')","if문 끝의 콜론(:)과 들여쓰기를 확인하세요."},
      {"py-loop","반복문","for, while 이해하기","8분","반복문은 같은 작업을 여러 번 실행해요. range(3)은 0, 1, 2를 차례대로 만듭니다.","for i in range(3):\n    print(i)","range(3)은 3이 아니라 0부터 2까지예요."}
    };
    private static final String[][] JS={
      {"js-variable","변수와 자료형","let과 const 이해하기","5분","JavaScript에서 let은 값을 변경할 수 있고 const는 다시 할당할 수 없는 변수를 만들어요.","const name = 'CodeSnack';\nlet level = 1;\nconsole.log(name, level);","const는 재할당할 수 없고 let은 재할당할 수 있어요."},
      {"js-if","조건문","if, else로 선택하기","6분","조건을 만족할 때와 그렇지 않을 때 다른 코드를 실행합니다.","const score = 90;\nif (score >= 80) {\n  console.log('잘했어요!');\n} else {\n  console.log('다시 도전!');\n}","엄격한 비교에는 ===를 사용해 보세요."},
      {"js-loop","반복문","for로 반복하기","7분","for문은 초기값, 조건식, 증가식을 이용해 원하는 횟수만큼 반복합니다.","for (let i = 1; i <= 3; i++) {\n  console.log(i);\n}","종료 조건을 올바르게 설정하세요."}
    };
    LearningScreen(Context c,Listener l){
        ctx=c;listener=l;prefs=c.getSharedPreferences("codesnack.android.lessons",Context.MODE_PRIVATE);
        scroll=new ScrollView(c);scroll.setFillViewport(true);scroll.setVerticalScrollBarEnabled(false);scroll.setBackgroundColor(SnackUi.BG);render();
    }
    View view(){return scroll;}
    private Set<String> completed(){return new HashSet<>(prefs.getStringSet("finished",new HashSet<>()));}
    private void mark(String id){Set<String> done=completed();done.add(id);prefs.edit().putStringSet("finished",done).apply();render();}
    private void render(){
        LinearLayout main=SnackUi.column(ctx); SnackUi.pad(main,ctx,19,17,19,30);scroll.removeAllViews();scroll.addView(main);
        LinearLayout hero=SnackUi.row(ctx); SnackUi.pad(hero,ctx,21,22,14,22);hero.setBackground(SnackUi.bg(ctx,SnackUi.INK,26));
        LinearLayout texts=SnackUi.column(ctx); hero.addView(texts,new LinearLayout.LayoutParams(0,-2,1));
        TextView tag=SnackUi.text(ctx,"TODAY'S CODE SNACK",10,0xFFBFC5FF,true);texts.addView(tag);
        texts.addView(SnackUi.spacer(ctx,9));
        TextView greeting=SnackUi.text(ctx,"오늘도 한 입,\n코딩해볼까요?",24,SnackUi.WHITE,true); greeting.setLineSpacing(SnackUi.dp(ctx,5),1f);texts.addView(greeting);
        texts.addView(SnackUi.spacer(ctx,9));
        texts.addView(SnackUi.text(ctx,"짧고 부담 없는 코딩 공부",12,0xFFD4D8F3,false));
        ImageView icon=new ImageView(ctx);icon.setImageResource(R.drawable.app_icon);icon.setScaleType(ImageView.ScaleType.FIT_CENTER);
        LinearLayout.LayoutParams iclp=SnackUi.lp(ctx,80,80);iclp.leftMargin=SnackUi.dp(ctx,10);hero.addView(icon,iclp);
        main.addView(hero,SnackUi.lp(ctx,-1,-2));
        main.addView(SnackUi.spacer(ctx,14));

        LinearLayout prog=SnackUi.column(ctx);SnackUi.pad(prog,ctx,17,17,17,17);prog.setBackground(SnackUi.bg(ctx,SnackUi.WHITE,22));
        Set<String> done=completed();int count=0;for(String[] item:PY)if(done.contains(item[0]))count++;for(String[] item:JS)if(done.contains(item[0]))count++;
        LinearLayout pHead=SnackUi.row(ctx);pHead.addView(SnackUi.text(ctx,"내 미니 학습 진행률",14,SnackUi.INK,true),new LinearLayout.LayoutParams(0,-2,1));pHead.addView(SnackUi.text(ctx,(count*100/6)+"%",14,SnackUi.BLUE,true));prog.addView(pHead);
        prog.addView(SnackUi.spacer(ctx,7));prog.addView(SnackUi.text(ctx,count+" / 6개 단원 완료 · 앱 안에 저장돼요",12,SnackUi.MUTED,false));
        prog.addView(SnackUi.spacer(ctx,12));
        ProgressBar bar=new ProgressBar(ctx,null,android.R.attr.progressBarStyleHorizontal);bar.setMax(6);bar.setProgress(count);bar.setProgressTintList(android.content.res.ColorStateList.valueOf(SnackUi.BLUE));bar.setProgressBackgroundTintList(android.content.res.ColorStateList.valueOf(SnackUi.BLUE_SOFT));
        prog.addView(bar,SnackUi.lp(ctx,-1,6));main.addView(prog);
        main.addView(SnackUi.spacer(ctx,25));sectionTitle(main,"언어 선택","관심 있는 언어부터 시작해요");main.addView(SnackUi.spacer(ctx,11));
        HorizontalScrollView strip=new HorizontalScrollView(ctx);strip.setHorizontalScrollBarEnabled(false);strip.setFillViewport(false);
        LinearLayout chips=SnackUi.row(ctx);String[][] langs={{"python","🐍 Python"},{"javascript","⚡ JavaScript"},{"cpp","C++"},{"java","Java"},{"csharp","C#"}};
        for(String[] lang:langs){TextView chip=SnackUi.capsule(ctx,lang[1],language.equals(lang[0]));LinearLayout.LayoutParams clp=SnackUi.lp(ctx,-2,-2);clp.rightMargin=SnackUi.dp(ctx,8);chips.addView(chip,clp);chip.setOnClickListener(v->{language=lang[0];render();});}
        strip.addView(chips);main.addView(strip);
        main.addView(SnackUi.spacer(ctx,24));sectionTitle(main,"오늘의 추천","가볍게 시작하는 첫 걸음");main.addView(SnackUi.spacer(ctx,10));
        LinearLayout recommended=SnackUi.column(ctx);SnackUi.pad(recommended,ctx,19,18,19,18);recommended.setBackground(SnackUi.bg(ctx,SnackUi.LAVENDER,23));
        recommended.addView(SnackUi.text(ctx,"✦  오늘의 추천",12,SnackUi.BLUE,true));recommended.addView(SnackUi.spacer(ctx,8));
        TextView rtitle=SnackUi.text(ctx,"첫 프로그램을 만들어봐요",18,SnackUi.INK,true);recommended.addView(rtitle);
        recommended.addView(SnackUi.spacer(ctx,6));recommended.addView(SnackUi.text(ctx,"예제를 읽고 직접 코드를 실행해 보세요.",12,SnackUi.MUTED,false));
        recommended.addView(SnackUi.spacer(ctx,14));TextView start=SnackUi.button(ctx,"전체 학습 열기   ›",true);recommended.addView(start,SnackUi.lp(ctx,-1,-2));
        start.setOnClickListener(v->listener.route("tutorial",language));main.addView(recommended);
        main.addView(SnackUi.spacer(ctx,26));sectionTitle(main,"한 입에 배우는 코딩","하나씩 완료하고 진행률을 높여봐요");main.addView(SnackUi.spacer(ctx,11));
        String[][] current=language.equals("python")?PY:language.equals("javascript")?JS:null;
        if(current==null){
            LinearLayout callout=SnackUi.column(ctx);callout.setBackground(SnackUi.bg(ctx,SnackUi.WHITE,21));SnackUi.pad(callout,ctx,17,18,17,18);
            callout.addView(SnackUi.text(ctx,"이 언어는 웹 학습에서 이어서 배워요.",14,SnackUi.INK,true));callout.addView(SnackUi.spacer(ctx,13));
            TextView b=SnackUi.button(ctx,"강의 보러 가기",false);callout.addView(b);b.setOnClickListener(v->listener.route("tutorial",language));main.addView(callout);
        } else {
            int i=0;for(String[] lesson:current){i++;LinearLayout card=SnackUi.row(ctx);SnackUi.pad(card,ctx,16,15,14,15);card.setBackground(SnackUi.bg(ctx,SnackUi.WHITE,20));
                TextView num=SnackUi.centered(ctx,done.contains(lesson[0])?"✓":String.format("%02d",i),13,SnackUi.BLUE,true);
                num.setBackground(SnackUi.bg(ctx,SnackUi.BLUE_SOFT,13));card.addView(num,SnackUi.lp(ctx,43,43));
                LinearLayout info=SnackUi.column(ctx);LinearLayout.LayoutParams ip=new LinearLayout.LayoutParams(0,-2,1);ip.leftMargin=SnackUi.dp(ctx,13);card.addView(info,ip);
                info.addView(SnackUi.text(ctx,lesson[1],15,SnackUi.INK,true));info.addView(SnackUi.spacer(ctx,5));info.addView(SnackUi.text(ctx,lesson[2]+" · "+lesson[3],11,SnackUi.MUTED,false));
                card.addView(SnackUi.text(ctx,"›",25,SnackUi.BLUE,true));card.setOnClickListener(v->showLesson(lesson));
                LinearLayout.LayoutParams cp=SnackUi.lp(ctx,-1,-2);cp.bottomMargin=SnackUi.dp(ctx,9);main.addView(card,cp);
            }
        }
        main.addView(SnackUi.spacer(ctx,22));sectionTitle(main,"빠른 접근","학습한 내용을 바로 활용해요");main.addView(SnackUi.spacer(ctx,11));
        LinearLayout links=SnackUi.row(ctx);
        TextView quiz=SnackUi.button(ctx,"▤  퀴즈 풀기",false);LinearLayout.LayoutParams qlp=new LinearLayout.LayoutParams(0,SnackUi.dp(ctx,47),1);qlp.rightMargin=SnackUi.dp(ctx,9);links.addView(quiz,qlp);
        quiz.setOnClickListener(v->listener.route("quiz",language));
        TextView example=SnackUi.button(ctx,"</>  코드 예제",false);links.addView(example,new LinearLayout.LayoutParams(0,SnackUi.dp(ctx,47),1));
        example.setOnClickListener(v->listener.route("templates",language));
        main.addView(links);
    }
    private void sectionTitle(LinearLayout parent,String title,String sub){
        parent.addView(SnackUi.text(ctx,title,19,SnackUi.INK,true));parent.addView(SnackUi.spacer(ctx,5));parent.addView(SnackUi.text(ctx,sub,12,SnackUi.MUTED,false));
    }
    private void showLesson(String[] lesson){
        ScrollView sc=new ScrollView(ctx);LinearLayout content=SnackUi.column(ctx);SnackUi.pad(content,ctx,23,22,23,23);sc.addView(content);
        content.addView(SnackUi.text(ctx,lesson[1],23,SnackUi.INK,true));content.addView(SnackUi.spacer(ctx,7));
        content.addView(SnackUi.text(ctx,lesson[2]+"  ·  "+lesson[3],13,SnackUi.MUTED,false));content.addView(SnackUi.spacer(ctx,22));
        content.addView(SnackUi.text(ctx,lesson[4],15,SnackUi.INK,false));content.addView(SnackUi.spacer(ctx,20));
        TextView code=SnackUi.text(ctx,lesson[5],14,0xFFE7E9FF,false);code.setTypeface(Typeface.MONOSPACE);code.setBackground(SnackUi.bg(ctx,0xFF222945,17));SnackUi.pad(code,ctx,16,18,16,18);content.addView(code);
        content.addView(SnackUi.spacer(ctx,17));TextView tip=SnackUi.text(ctx,"TIP  "+lesson[6],13,SnackUi.BLUE,true);tip.setBackground(SnackUi.bg(ctx,SnackUi.BLUE_SOFT,14));SnackUi.pad(tip,ctx,14,15,14,15);content.addView(tip);
        AlertDialog dialog=new AlertDialog.Builder(ctx).setView(sc).create();
        content.addView(SnackUi.spacer(ctx,22));TextView finish=SnackUi.button(ctx,completed().contains(lesson[0])?"완료한 단원 ✓":"학습 완료 표시 ✓",true);
        finish.setOnClickListener(v->{mark(lesson[0]);dialog.dismiss();});content.addView(finish,SnackUi.lp(ctx,-1,-2));
        content.addView(SnackUi.spacer(ctx,10));TextView studio=SnackUi.button(ctx,"스낵 스튜디오 열기",false);studio.setOnClickListener(v->{dialog.dismiss();listener.tab("studio");});content.addView(studio,SnackUi.lp(ctx,-1,-2));
        dialog.show();if(dialog.getWindow()!=null){dialog.getWindow().setBackgroundDrawable(SnackUi.bg(ctx,SnackUi.WHITE,24));dialog.getWindow().setLayout(ctx.getResources().getDisplayMetrics().widthPixels-SnackUi.dp(ctx,36),-2);}
    }
}
