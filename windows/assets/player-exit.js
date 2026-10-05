(() => {
  if(window.__zeroExitInstalled)return;window.__zeroExitInstalled=true;
  const back=node=>node&&/^(back|go back|return|exit player|close player)(\s+to\s+.*)?$/i.test((node.getAttribute('aria-label')||node.getAttribute('title')||node.textContent||'').trim());
  function exit(){if(window.parent===window&&window.ZeroPlayer){window.ZeroPlayer.postMessage('back');return;}if(window.parent===window)window.postMessage({type:'zeromovies-player-exit'},window.location.origin);else window.parent.postMessage({type:'zeromovies-player-exit'},'*');}
  document.addEventListener('click',event=>{const node=event.composedPath().find(el=>el.matches&&el.matches('button,a,[role="button"]'));if(!back(node))return;event.preventDefault();event.stopImmediatePropagation();exit();},true);
  window.addEventListener('message',event=>{if(event.source===window)return;if(event.data?.type==='zeromovies-player-exit'&&Array.from(document.querySelectorAll('iframe')).some(frame=>frame.contentWindow===event.source))exit();});
})();
