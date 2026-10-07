from pathlib import Path

main_path=Path('app/src/main/java/com/zerostreams/app/MainActivity.java')
win_app_path=Path('windows/ui/app.js')
win_index_path=Path('windows/ui/index.html')
win_main_path=Path('windows/main.cjs')

main=main_path.read_text()
win_app=win_app_path.read_text()
win_index=win_index_path.read_text()
win_main=win_main_path.read_text()

def rep(text,old,new,label):
    if old not in text: raise SystemExit('missing target: '+label)
    return text.replace(old,new,1)

# Android: Cignal off by default, Converge on by default. Applies only to Live TV/IPTV.
main=rep(main,
'    boolean channelFavorite(String section,M3uPlaylist.Channel c){return savedIds("liveFavorites").contains(channelFavoriteKey(section,c));}\n',
'''    boolean channelFavorite(String section,M3uPlaylist.Channel c){return savedIds("liveFavorites").contains(channelFavoriteKey(section,c));}\n    boolean liveTvChannelEnabled(M3uPlaylist.Channel channel){String vendor=(channel.name+" "+channel.group).toLowerCase(Locale.ROOT);if(vendor.contains("cignal")&&!prefs.getBoolean("liveCignal",false))return false;if(vendor.contains("converge")&&!prefs.getBoolean("liveConverge",true))return false;return true;}\n''','android channel helper')
main=rep(main,
'for(M3uPlaylist.Channel channel:snapshot.channels)groups.add(channel.group);',
'for(M3uPlaylist.Channel channel:snapshot.channels)if(live||liveTvChannelEnabled(channel))groups.add(channel.group);','android visible groups')
main=rep(main,
'List<M3uPlaylist.Channel> channels=new ArrayList<>();for(M3uPlaylist.Channel channel:snapshot.channels)if((channelGroup.equals("All")||channelGroup.equals("Favorites")&&channelFavorite(section,channel)||channelGroup.equals(channel.group))&&(submittedQuery.isEmpty()||TitleSearch.matches(channel.name+" "+channel.group,submittedQuery)))channels.add(channel);',
'List<M3uPlaylist.Channel> channels=new ArrayList<>();for(M3uPlaylist.Channel channel:snapshot.channels)if((live||liveTvChannelEnabled(channel))&&(channelGroup.equals("All")||channelGroup.equals("Favorites")&&channelFavorite(section,channel)||channelGroup.equals(channel.group))&&(submittedQuery.isEmpty()||TitleSearch.matches(channel.name+" "+channel.group,submittedQuery)))channels.add(channel);','android channel filter')
main=rep(main,
'panel.addView(text("Downloaded videos use local SRT/VTT/ASS files first. SubDL is only used as a fallback when configured.",12,MUTED));panel.addView(text("Download folder: "+DirectDownloads.get(this).folder,12,MUTED));space(panel,12);Switch ads=',
'''panel.addView(text("Downloaded videos use local SRT/VTT/ASS files first. SubDL is only used as a fallback when configured.",12,MUTED));panel.addView(text("Download folder: "+DirectDownloads.get(this).folder,12,MUTED));space(panel,16);panel.addView(text("Live TV channel providers",16,INK));Switch cignalChannels=new Switch(this);cignalChannels.setText("Enable Cignal channels · Disabled by default on Android");cignalChannels.setTextColor(INK);cignalChannels.setChecked(prefs.getBoolean("liveCignal",false));cignalChannels.setOnCheckedChangeListener((v,on)->prefs.edit().putBoolean("liveCignal",on).apply());panel.addView(cignalChannels);Switch convergeChannels=new Switch(this);convergeChannels.setText("Enable Converge channels");convergeChannels.setTextColor(INK);convergeChannels.setChecked(prefs.getBoolean("liveConverge",true));convergeChannels.setOnCheckedChangeListener((v,on)->prefs.edit().putBoolean("liveConverge",on).apply());panel.addView(convergeChannels);panel.addView(text("World and other Live TV channels always remain available.",12,MUTED));space(panel,12);Switch ads=''', 'android settings toggles')

# Windows: both Cignal and Converge off by default.
win_main=rep(win_main,
"previewDelay:2000,homePanels:homePanelIds.slice(0,11)",
"previewDelay:2000,liveCignal:false,liveConverge:false,homePanels:homePanelIds.slice(0,11)",'windows defaults')
win_main=rep(win_main,
"rawcastPlayback:value.rawcastPlayback===true,region:value.region,gain:Number(value.gain),theme:value.theme,source:value.source==='rawcast'&&value.rawcastPlayback!==true?'vidstuck':value.source,homePanels:",
"rawcastPlayback:value.rawcastPlayback===true,liveCignal:value.liveCignal===true,liveConverge:value.liveConverge===true,region:value.region,gain:Number(value.gain),theme:value.theme,source:value.source==='rawcast'&&value.rawcastPlayback!==true?'vidstuck':value.source,homePanels:",'windows save settings')

win_app=rep(win_app,
"const playlistTab=()=>category==='LiveTV'||category==='IPTV';",
"const playlistTab=()=>category==='LiveTV'||category==='IPTV';\nconst liveTvChannelEnabled=c=>{const vendor=((c?.name||'')+' '+(c?.group||'')).toLowerCase();if(vendor.includes('cignal')&&state.settings.liveCignal!==true)return false;if(vendor.includes('converge')&&state.settings.liveConverge!==true)return false;return true;};",'windows channel helper')
old_playlist="const live=section==='LiveTV';const groups=['All','Favorites',...[...new Set(snapshot.channels.map(c=>c.group))].sort((a,b)=>a.localeCompare(b))];if(!groups.includes(channelGroup))channelGroup='All';const rows=snapshot.channels.filter(c=>(channelGroup==='All'||channelGroup==='Favorites'&&c.favorite||channelGroup===c.group)&&(!submittedQuery||(c.name+' '+c.group).toLowerCase().includes(submittedQuery.toLowerCase())));"
new_playlist="const live=section==='LiveTV';const availableChannels=live?snapshot.channels:snapshot.channels.filter(liveTvChannelEnabled);const groups=['All','Favorites',...[...new Set(availableChannels.map(c=>c.group))].sort((a,b)=>a.localeCompare(b))];if(!groups.includes(channelGroup))channelGroup='All';const rows=availableChannels.filter(c=>(channelGroup==='All'||channelGroup==='Favorites'&&c.favorite||channelGroup===c.group)&&(!submittedQuery||(c.name+' '+c.group).toLowerCase().includes(submittedQuery.toLowerCase())));"
win_app=rep(win_app,old_playlist,new_playlist,'windows playlist filter')
win_app=rep(win_app,
"status(snapshot.channels.length+' channels · refreshed '+new Date(snapshot.updated).toLocaleString());",
"status((live?snapshot.channels.length:availableChannels.length)+' channels · refreshed '+new Date(snapshot.updated).toLocaleString());",'windows visible count')
win_app=rep(win_app,
"for(const id of ['uiAnimations','focusInfo','focusTrailer','homepageTrailer'])$('#'+id).checked=state.settings[id]!==false;",
"for(const id of ['uiAnimations','focusInfo','focusTrailer','homepageTrailer'])$('#'+id).checked=state.settings[id]!==false;$('#liveCignal').checked=state.settings.liveCignal===true;$('#liveConverge').checked=state.settings.liveConverge===true;",'windows settings populate')
win_app=rep(win_app,
"...Object.fromEntries(['uiAnimations','focusInfo','focusTrailer','homepageTrailer'].map(id=>[id,$('#'+id).checked])),rawcastPlayback:",
"...Object.fromEntries(['uiAnimations','focusInfo','focusTrailer','homepageTrailer'].map(id=>[id,$('#'+id).checked])),liveCignal:$('#liveCignal').checked,liveConverge:$('#liveConverge').checked,rawcastPlayback:",'windows settings submit')

win_index=rep(win_index,
'<label>Provider availability region<select id="region">',
'<fieldset><legend>Live TV channel providers</legend><p>World and other Live TV channels always remain enabled.</p><label class="panel-toggle"><input type="checkbox" id="liveCignal">Enable Cignal channels</label><label class="panel-toggle"><input type="checkbox" id="liveConverge">Enable Converge channels</label><small>Cignal and Converge are disabled by default on Windows.</small></fieldset><label>Provider availability region<select id="region">','windows settings UI')

main_path.write_text(main)
win_app_path.write_text(win_app)
win_index_path.write_text(win_index)
win_main_path.write_text(win_main)
print('Applied #23 Live TV channel provider defaults and settings')
