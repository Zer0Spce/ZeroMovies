'use strict';
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const appPath=path.join(root,'ui/app.js');
let app=fs.readFileSync(appPath,'utf8').replace(/\r\n/g,'\n');
function replace(from,to,label){if(app.includes(to))return;if(!app.includes(from))throw Error('Missing Windows episode-progress marker: '+label);app=app.replace(from,to);}
replace(
"function episodeReminder(item,season,episode){const progress=state.positions[key(item)+':'+season+':'+episode];if(!progress||Number(progress.timestamp)<=0)return '';const percent=Number(progress.percent)||0;return percent>=95?' · ✓ Watched':percent>0?' · Continue '+Math.max(1,Math.round(percent))+'%':' · In progress';}",
"function episodeReminder(item,season,episode){const progress=state.positions[key(item)+':'+season+':'+episode];if(!progress)return '';const percent=Number(progress.percent)||0;return percent>=95?' · ✓ Watched':percent>0?' · Continue '+Math.max(1,Math.round(percent))+'%':' · In progress';}",
'started episode reminder');
replace(
"window.zero.onRefresh(async()=>{state=await window.zero.state();applyTheme();if(category==='Library')renderLibrary();else if(category==='Home')await renderHome();else observePaging();});",
"window.zero.onRefresh(async()=>{state=await window.zero.state();applyTheme();if($('#detail').open&&activeDetail)await details(activeDetail);else if(category==='Library')renderLibrary();else if(category==='Home')await renderHome();else observePaging();});",
'open detail refresh');
fs.writeFileSync(appPath,app);
console.log('Applied Windows episode progress refresh fix.');
