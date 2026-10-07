'use strict';
const $=id=>document.getElementById(id);let release;
function busy(text){for(const id of ['update','cancel','skip'])$(id).disabled=true;$('progress-wrap').hidden=false;$('progress-text').textContent=text;}
window.zeroUpdater.onRelease(value=>{release=value;$('headline').textContent='ZeroPlay '+value.version+' is available';$('versions').textContent='You have '+value.current+' · New version '+value.version;$('changelog').textContent=value.changelog||'No changelog was provided.';});
window.zeroUpdater.onProgress(value=>{const percent=Math.max(0,Math.min(100,Number(value.percent)||0));$('progress').style.width=percent+'%';$('progress-text').textContent=value.total?'Downloading update… '+percent.toFixed(0)+'%':'Downloading update…';});
$('cancel').onclick=()=>window.zeroUpdater.action('cancel');
$('skip').onclick=()=>window.zeroUpdater.action('skip');
$('update').onclick=async()=>{busy('Downloading update…');try{await window.zeroUpdater.action('install');$('progress').style.width='100%';$('progress-text').textContent='Update ready. Restarting ZeroPlay…';}catch(error){for(const id of ['update','cancel','skip'])$(id).disabled=false;$('progress-wrap').hidden=false;$('progress-text').textContent=error.message||'Update failed. Please try again.';}};
