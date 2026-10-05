document.getElementById('back').addEventListener('click',()=>window.playerTools.back());
document.getElementById('fullscreen').addEventListener('click',()=>window.playerTools.fullscreen());
window.playerTools.onTitle(title=>document.getElementById('title').textContent=title);
