from pathlib import Path

path = Path("app/src/main/java/com/zerostreams/app/MainActivity.java")
text = path.read_text(encoding="utf-8")
start_marker = "    ArrayAdapter<String> spinnerAdapter(String[] labels){"
end_marker = "    @Override public void onTrimMemory"
start = text.index(start_marker)
end = text.index(end_marker, start)

replacement = r'''    void styleSettingsSpinner(Spinner spinner){
        spinner.setFocusable(true);
        spinner.setFocusableInTouchMode(false);
        spinner.setPadding(dp(14),dp(6),dp(14),dp(6));
        spinner.setBackground(shape(SURFACE,0));
        spinner.setOnFocusChangeListener((v,focused)->{
            int fill=focused?(lightTheme?Color.rgb(212,235,229):Color.rgb(34,57,58)):SURFACE;
            v.setBackground(shape(fill,focused?ACCENT:0));
            if(BuildConfig.TV&&prefs.getBoolean("uiAnimations",true))v.animate().scaleX(focused?1.02f:1f).scaleY(focused?1.02f:1f).setDuration(90).start();
            else{v.setScaleX(1f);v.setScaleY(1f);}
        });
    }
    ArrayAdapter<String> spinnerAdapter(String[] labels){return new ArrayAdapter<String>(this,android.R.layout.simple_spinner_dropdown_item,labels){
        int selectedPosition;
        @Override public View getView(int position,View recycled,ViewGroup parent){
            selectedPosition=position;
            TextView view=(TextView)super.getView(position,recycled,parent);
            view.setTextColor(INK);
            view.setBackgroundColor(Color.TRANSPARENT);
            view.setPadding(dp(8),dp(6),dp(8),dp(6));
            if(parent instanceof Spinner)styleSettingsSpinner((Spinner)parent);
            return view;
        }
        @Override public View getDropDownView(int position,View recycled,ViewGroup parent){
            TextView view=(TextView)super.getDropDownView(position,recycled,parent);
            view.setTextColor(INK);
            // Keep rows transparent so Android TV's ListView selector remains visible while D-pad focus moves.
            view.setBackgroundColor(Color.TRANSPARENT);
            view.setPadding(dp(18),dp(12),dp(18),dp(12));
            view.setMinHeight(dp(BuildConfig.TV?54:48));
            view.setTypeface(null,position==selectedPosition?Typeface.BOLD:Typeface.NORMAL);
            if(position==selectedPosition)view.setText("✓  "+labels[position]);
            else view.setText("   "+labels[position]);
            return view;
        }
    };}
'''

updated = text[:start] + replacement + text[end:]
if updated == text:
    raise SystemExit("No source change produced")
path.write_text(updated, encoding="utf-8")
print("Patched Android TV settings spinner focus visibility")
