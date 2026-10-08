(() => {
  if (window.__zeroMouseBackInstalled) return;
  window.__zeroMouseBackInstalled = true;

  const MENU_SELECTORS = [
    'dialog[open]', '[role="dialog"]', '[role="menu"]', '[role="listbox"]', '[aria-modal="true"]',
    '.vjs-menu', '.vjs-menu-content', '.plyr__menu__container', '.shaka-settings-menu', '.shaka-overflow-menu',
    '[data-state="open"]', '[class*="settings"][class*="menu"]', '[class*="quality"][class*="menu"]',
    '[class*="resolution"][class*="menu"]', '[class*="popover"]', '[class*="dropdown"]'
  ].join(',');
  const CONTROL_SELECTORS = [
    '.jw-controlbar', '.jw-controls', '.plyr__controls', '.vjs-control-bar', '.shaka-controls-container',
    '[role="toolbar"]', '[data-zero-controlbar]', '[data-zero-controls]'
  ].join(',');

  function roots() {
    const out=[document], queue=[document];
    for(let i=0;i<queue.length&&i<48;i++){
      const root=queue[i];
      root.querySelectorAll('*').forEach(node=>{
        if(node.shadowRoot&&!out.includes(node.shadowRoot)){out.push(node.shadowRoot);queue.push(node.shadowRoot);}
      });
    }
    return out;
  }
  function all(selector){
    const out=[];
    for(const root of roots()){
      try{out.push(...root.querySelectorAll(selector));}catch(_){}
    }
    return Array.from(new Set(out));
  }
  function visible(node) {
    if (!node || node.hidden) return false;
    const style = getComputedStyle(node), rect = node.getBoundingClientRect();
    return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity || 1) > 0 && rect.width > 2 && rect.height > 2;
  }
  function visibleFrames(){
    return all('iframe').filter(visible).sort((a,b)=>{
      const ar=a.getBoundingClientRect(),br=b.getBoundingClientRect();return br.width*br.height-ar.width*ar.height;
    });
  }
  function idleRoot(){
    return document.documentElement.classList.contains('zero-player-idle') || document.documentElement.classList.contains('zero-back-hide');
  }
  function localControlsVisible(){
    if(idleRoot())return false;
    const bars=all(CONTROL_SELECTORS).filter(node=>{
      if(!visible(node)||node.querySelector?.('video,iframe'))return false;
      return node.getBoundingClientRect().height<innerHeight*.42;
    });
    if(bars.length||all('video').some(visible))return true;
    return visibleFrames().some(frame=>{const r=frame.getBoundingClientRect();return r.width>=innerWidth*.45&&r.height>=innerHeight*.45;});
  }

  // Main-document CSS cannot style controls inside a provider Shadow DOM.
  // Mirror the TV focus class as an inline highlight so the selected control is
  // always visible, even inside nested/shadow player components.
  const HIGHLIGHT_PROPS=['outline','outline-offset','border-radius','box-shadow','filter'];
  let highlighted=null, savedHighlight=[];
  function clearHighlight(){
    if(!highlighted)return;
    for(const [name,value,priority] of savedHighlight){
      if(value)highlighted.style.setProperty(name,value,priority);
      else highlighted.style.removeProperty(name);
    }
    highlighted=null;savedHighlight=[];
  }
  function applyHighlight(node){
    if(!node||!visible(node)){clearHighlight();return;}
    if(node===highlighted)return;
    clearHighlight();
    highlighted=node;
    savedHighlight=HIGHLIGHT_PROPS.map(name=>[name,node.style.getPropertyValue(name),node.style.getPropertyPriority(name)]);
    node.style.setProperty('outline','4px solid #65e6cc','important');
    node.style.setProperty('outline-offset','4px','important');
    node.style.setProperty('border-radius','9px','important');
    node.style.setProperty('box-shadow','0 0 0 3px rgba(101,230,204,.42),0 0 24px rgba(101,230,204,.9)','important');
    node.style.setProperty('filter','brightness(1.22)','important');
  }
  function syncHighlight(){
    const selected=all('.zero-tv-focused').filter(visible).pop()||null;
    applyHighlight(selected);
  }
  const originalTvNavigate=typeof window.__zeroTvNavigate==='function'?window.__zeroTvNavigate:null;
  if(originalTvNavigate){
    window.__zeroTvNavigate=function(direction,fromChild=null){
      const result=originalTvNavigate(direction,fromChild);
      try{requestAnimationFrame(syncHighlight);}catch(_){setTimeout(syncHighlight,0);}
      setTimeout(syncHighlight,50);
      return result;
    };
  }

  function expandedToggle(){
    return all('[aria-expanded="true"]').reverse().find(node=>{
      if(!visible(node))return false;
      const text=(node.getAttribute('aria-label')||node.getAttribute('title')||node.textContent||'').trim();
      return /settings|quality|resolution|subtitle|caption|audio|speed|menu|more|options/i.test(text)||Boolean(node.getAttribute('aria-controls'));
    });
  }
  function closeLocalMenu(){
    const toggle=expandedToggle();
    if(toggle){toggle.click();return true;}
    const menus=all(MENU_SELECTORS).filter(node=>{
      if(!visible(node)||node.querySelector?.('video,iframe')||node.classList?.contains('shaka-hidden'))return false;
      const rect=node.getBoundingClientRect();if(rect.width>=innerWidth*.97&&rect.height>=innerHeight*.97)return false;
      return Boolean(node.matches?.('dialog,[role="dialog"],[role="menu"],[role="listbox"],[aria-modal="true"]')||node.querySelector?.('button,[role="button"],[role="menuitem"],[role="option"],input,select,[tabindex]'));
    });
    if(!menus.length)return false;
    const menu=menus[menus.length-1];
    if(menu.tagName==='DIALOG'&&typeof menu.close==='function'){menu.close();return true;}
    const close=menu.querySelector?.('[aria-label="Close"],[aria-label="Back"],[title="Close"],[title="Back"],.shaka-back-to-overflow-button,.vjs-menu-button');
    if(close){close.click();return true;}
    const owner=all('[aria-expanded="true"]').reverse().find(node=>visible(node)&&(!menu.id||node.getAttribute('aria-controls')===menu.id));
    if(owner){owner.click();return true;}
    const target=menu.contains?.(document.activeElement)?document.activeElement:menu;
    for(const receiver of [target,document]){
      receiver.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',code:'Escape',bubbles:true,cancelable:true}));
      receiver.dispatchEvent(new KeyboardEvent('keyup',{key:'Escape',code:'Escape',bubbles:true,cancelable:true}));
    }
    return true;
  }
  function hideLocalControls(){
    clearHighlight();
    if(typeof window.__zeroHidePlayerControls==='function')window.__zeroHidePlayerControls();
    else document.documentElement.classList.add('zero-back-hide','zero-player-idle');
  }
  function forceMenuBack(){
    closeLocalMenu();
    const target=document.activeElement||document;
    for(const receiver of [target,document]){
      receiver.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',code:'Escape',bubbles:true,cancelable:true}));
      receiver.dispatchEvent(new KeyboardEvent('keyup',{key:'Escape',code:'Escape',bubbles:true,cancelable:true}));
    }
    visibleFrames().forEach(frame=>{try{frame.contentWindow.postMessage({type:'zerostreams-tv-force-back'},'*');}catch(_){}});
  }
  window.__zeroTvForceProviderBack=forceMenuBack;

  let sequence=0;
  const waiters=new Map();
  function askChild(frame){
    const request='ztv-'+(++sequence)+'-'+Date.now();
    return new Promise(resolve=>{
      const timer=setTimeout(()=>{waiters.delete(request);resolve('unknown');},420);
      waiters.set(request,{source:frame.contentWindow,resolve:value=>{clearTimeout(timer);waiters.delete(request);resolve(value);}});
      try{frame.contentWindow.postMessage({type:'zerostreams-tv-back-query',request},'*');}
      catch(_){clearTimeout(timer);waiters.delete(request);resolve('unknown');}
    });
  }
  async function askChildrenStage(){
    let unknown=false;
    for(const frame of visibleFrames()){
      const stage=await askChild(frame);
      if(stage==='menu'||stage==='controls')return stage;
      if(stage==='unknown')unknown=true;
    }
    return unknown?'unknown':'exit';
  }
  async function backStep(){
    if(closeLocalMenu())return 'menu';
    const childStage=await askChildrenStage();
    if(childStage==='menu')return 'menu';
    if(childStage==='controls')return 'controls';
    if(localControlsVisible()){hideLocalControls();return 'controls';}
    return childStage;
  }

  window.__zeroTvBackStep=async token=>{
    window.__zeroBackResult=null;
    const stage=await backStep();
    window.__zeroBackResult={token,stage,handled:stage!=='exit'&&stage!=='unknown'};
  };
  window.__zeroMouseBackRequest=window.__zeroTvBackStep;

  window.addEventListener('message',async event=>{
    const data=event.data;if(!data)return;
    if(data.type==='zerostreams-tv-force-back'){forceMenuBack();return;}
    if(data.type==='zerostreams-tv-back-query'&&data.request){
      const stage=await backStep();
      try{event.source.postMessage({type:'zerostreams-tv-back-result',request:data.request,stage},'*');}catch(_){}
      return;
    }
    if(data.type==='zerostreams-tv-back-result'&&data.request){
      const waiter=waiters.get(data.request);
      if(waiter&&waiter.source===event.source)waiter.resolve(['menu','controls','exit','unknown'].includes(data.stage)?data.stage:'unknown');
    }
  });
})();
