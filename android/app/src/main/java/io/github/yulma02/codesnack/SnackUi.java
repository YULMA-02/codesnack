package io.github.yulma02.codesnack;

import android.content.Context;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.view.Gravity;
import android.view.View;
import android.widget.LinearLayout;
import android.widget.TextView;

/** Small Android UI helpers; solid Material-inspired surfaces, no translucent glass. */
final class SnackUi {
    static final int BG = Color.rgb(250,249,246);
    static final int INK = Color.rgb(26,31,67);
    static final int MUTED = Color.rgb(109,115,139);
    static final int BLUE = Color.rgb(55,70,216);
    static final int BLUE_SOFT = Color.rgb(235,237,255);
    static final int LAVENDER = Color.rgb(239,234,255);
    static final int LIME = Color.rgb(240,246,213);
    static final int WHITE = Color.WHITE;
    static final int HAIRLINE = Color.rgb(238,237,242);

    static int dp(Context c, float value) { return Math.round(value * c.getResources().getDisplayMetrics().density); }
    static LinearLayout column(Context c) {
        LinearLayout v=new LinearLayout(c); v.setOrientation(LinearLayout.VERTICAL); return v;
    }
    static LinearLayout row(Context c) {
        LinearLayout v=new LinearLayout(c); v.setOrientation(LinearLayout.HORIZONTAL); v.setGravity(Gravity.CENTER_VERTICAL); return v;
    }
    static LinearLayout.LayoutParams lp(Context c,int w,int h) { return new LinearLayout.LayoutParams(w<0?w:dp(c,w),h<0?h:dp(c,h)); }
    static LinearLayout.LayoutParams weight(Context c) { return new LinearLayout.LayoutParams(0,-1,1f); }
    static GradientDrawable bg(Context c,int color,int radius) {
        GradientDrawable d=new GradientDrawable();d.setColor(color);d.setCornerRadius(dp(c,radius));return d;
    }
    static GradientDrawable border(Context c,int color,int radius,int line) {
        GradientDrawable d=bg(c,color,radius);d.setStroke(dp(c,1),line);return d;
    }
    static TextView text(Context c,String s,int size,int color,boolean bold) {
        TextView t=new TextView(c);t.setText(s);t.setTextSize(size);t.setTextColor(color);
        t.setGravity(Gravity.CENTER_VERTICAL);t.setIncludeFontPadding(false);
        if(bold)t.setTypeface(Typeface.DEFAULT,Typeface.BOLD);return t;
    }
    static TextView centered(Context c,String s,int size,int color,boolean bold) {
        TextView t=text(c,s,size,color,bold);t.setGravity(Gravity.CENTER);return t;
    }
    static void pad(View v,Context c,int l,int t,int r,int b){v.setPadding(dp(c,l),dp(c,t),dp(c,r),dp(c,b));}
    static View spacer(Context c,int h){View v=new View(c);v.setLayoutParams(lp(c,-1,h));return v;}
    static TextView capsule(Context c,String text,boolean active) {
        TextView v=centered(c,text,12,active?WHITE:INK,true);
        pad(v,c,15,10,15,10);v.setBackground(bg(c,active?BLUE:WHITE,18));
        return v;
    }
    static TextView button(Context c,String label,boolean primary){
        TextView v=centered(c,label,14,primary?WHITE:BLUE,true);
        pad(v,c,15,12,15,12);v.setBackground(bg(c,primary?BLUE:BLUE_SOFT,16));
        return v;
    }
}
