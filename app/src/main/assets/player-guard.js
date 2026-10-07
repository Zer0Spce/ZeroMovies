/* Only the timed QR advertising creative is removed. No CAPTCHA interaction. */
(() => {
  if (window.__zeroQrAdFilter) return;
  window.__zeroQrAdFilter = true;
  const adHost = host => host === 'gurlleviter.cyou' || host.endsWith('.gurlleviter.cyou');
  const heading = value => /^confirm you['’]re not a robot[.!]?$/i.test(value.trim());
  const media = 'video,audio,.jwplayer,.plyr,.vjs-player,[data-player]';
  const challenge = 'iframe[src*="recaptcha"],iframe[src*="hcaptcha"],iframe[src*="challenges.cloudflare.com"],.g-recaptcha,.h-captcha,.cf-turnstile,input[name="cf-turnstile-response"],input[type="checkbox"],[role="checkbox"]';
  let shadowRoots=[],shadowChecked=0;
  function all(selector,refresh=false){
    if(refresh||Date.now()-shadowChecked>1500){
      shadowChecked=Date.now();shadowRoots=[];const roots=[document];
      for(let i=0;i<roots.length&&i<40;i++)roots[i].querySelectorAll('*').forEach(node=>{if(node.shadowRoot){shadowRoots.push(node.shadowRoot);roots.push(node.shadowRoot);}});
    }
    return [document,...shadowRoots].reduce((nodes,root)=>nodes.concat(Array.from(root.querySelectorAll(selector))),[]);
  }

  if (window.ZeroProgress) window.addEventListener('message', event => {
    if(!['https://vidstuck.xyz','https://vidsrc.sh'].includes(event.origin))return;
    try {
      let data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;if(data&&data.type==='PLAYER_EVENT'){const p=data.data,info=p&&p.player_info;data=info&&info.tmdb?{id:info.tmdb,type:info.mediaType,timestamp:p.player_progress,duration:p.player_duration,season:info.season,episode:info.episode}:null;}
      if (data && (data.type === 'movie' || data.type === 'tv') && Number.isFinite(Number(data.timestamp)) && Number.isFinite(Number(data.duration)))
        window.ZeroProgress.postMessage(JSON.stringify(data));
    } catch (_) {}
  });
  window.__zeroDismissQrAd = () => {
    // Called only after the native screen reader identifies the reported advertising QR.
    all('iframe',true).forEach(frame => { try { frame.contentWindow.postMessage({type:'zerostreams-dismiss-ad-qr'}, '*'); } catch (_) {} });
    all('img,canvas,svg').forEach(image => {
      const bounds=image.getBoundingClientRect();
      // A provider may paint the whole white banner as one image/canvas with
      // no white DOM container. Only the native advertising QR confirmation
      // permits removing this viewport-sized artwork.
      if(bounds.width>=innerWidth*.7&&bounds.height>=innerHeight*.7&&
        !image.matches('video,audio')&&!image.closest('.g-recaptcha,.h-captcha')&&
        !(image.parentElement&&image.parentElement.querySelector(challenge))){
        hide(image);
        if(window.parent!==window&&!document.body.querySelector('iframe,'+media+','+challenge)){
          window.parent.postMessage({type:'zerostreams-timed-qr-ad'},'*');
          document.body.style.backgroundColor='transparent';
        }
        return;
      }
      if (bounds.width < 48 || bounds.height < 48 || bounds.width/bounds.height < .65 || bounds.width/bounds.height > 1.4) return;
      let node=image.parentElement,candidate=null;
      for(let depth=0;node&&depth<10;depth++,node=node.parentElement){
        if(node.querySelector(media)||node.querySelector(challenge))break;
        const r=node.getBoundingClientRect(),style=getComputedStyle(node);
        if(r.width>=innerWidth*.4&&r.height>=innerHeight*.4&&( /rgb\(255, 255, 255\)|#fff/i.test(style.backgroundColor)||style.position==='fixed'||style.position==='absolute'))candidate=node;
      }
      if(!candidate)return;
      if(candidate===document.body||candidate===document.documentElement){
        if(window.parent!==window&&!candidate.querySelector('iframe,'+media)){window.parent.postMessage({type:'zerostreams-timed-qr-ad'},'*');Array.from(document.body.children).forEach(hide);document.body.style.backgroundColor='transparent';}
      }else hide(candidate);
    });
    // Some creatives paint the entire banner as CSS background artwork.
    // Native QR confirmation makes this independent of readable DOM text.
    all('div,section,aside,dialog').forEach(node => {
      if(node.querySelector(media)||node.querySelector(challenge))return;
      const r=node.getBoundingClientRect(),style=getComputedStyle(node);
      if(r.width>=innerWidth*.7&&r.height>=innerHeight*.7&&
        (style.position==='fixed'||style.position==='absolute')&&
        /rgb\(255, 255, 255\)|#fff/i.test(style.backgroundColor))hide(node);
    });
  };
  window.addEventListener('message', event => {
    if(event.source===window.parent&&event.data&&event.data.type==='zerostreams-dismiss-ad-qr')window.__zeroDismissQrAd();
  });
  if (Number(window.__zeroGain) > 1) {
    const amount = Math.min(2, Number(window.__zeroGain));
    const connected = new WeakSet();
    const pending = new WeakSet();
    let context, noticeShown = false;
    function unavailable() {
      if (noticeShown || !document.body) return;
      noticeShown = true;
      const note = document.createElement('div');
      note.textContent = 'Audio boost unavailable for this source';
      note.style.cssText = 'position:fixed;bottom:12px;left:12px;z-index:2147483647;background:#202020;color:white;padding:8px;border-radius:4px;font:14px sans-serif;pointer-events:none';
      document.body.appendChild(note);
      setTimeout(() => note.remove(), 4000);
    }
    function boost() {
      document.querySelectorAll('video,audio').forEach(element => {
        if (connected.has(element) || pending.has(element) || element.paused || !element.currentSrc) return;
        let sameOrigin = false;
        try { sameOrigin = new URL(element.currentSrc, location.href).origin === location.origin; } catch (_) {}
        // Cross-origin media without CORS becomes silent when routed through Web Audio.
        // Leave those streams on their original audio path.
        if (!sameOrigin && !element.currentSrc.startsWith('blob:') && !element.crossOrigin) { unavailable(); return; }
        const Audio = window.AudioContext || window.webkitAudioContext;
        if (!Audio) { unavailable(); return; }
        try {
          context = context || new Audio();
          pending.add(element);
          context.resume().then(() => {
            pending.delete(element);
            if (context.state !== 'running' || connected.has(element)) return;
            const source = context.createMediaElementSource(element);
            const gain = context.createGain();
            gain.gain.value = amount;
            const limiter = context.createDynamicsCompressor();
            limiter.threshold.value = -1; limiter.knee.value = 0; limiter.ratio.value = 20;
            limiter.attack.value = 0.003; limiter.release.value = 0.1;
            source.connect(gain); gain.connect(limiter); limiter.connect(context.destination);
            connected.add(element);
          }).catch(() => { pending.delete(element); unavailable(); });
        } catch (_) { pending.delete(element); unavailable(); }
      });
    }
    document.addEventListener('playing', boost, true);
    document.addEventListener('pointerdown', boost);
    document.addEventListener('keydown', boost);
    window.addEventListener('message', event => {
      if (event.source === window.parent && event.data && event.data.type === 'zerostreams-remote-active') boost();
    });
    boost();
  }
  {
    const bars = '.jw-controlbar,.plyr__controls,.vjs-control-bar,[role="toolbar"],[data-zero-controlbar],nav,header';
    let idleTimer;
    const visibleOverrides=new Map();
    function restoreControls(){for(const [node,values] of visibleOverrides){for(const [name,value,priority] of values)if(value)node.style.setProperty(name,value,priority);else node.style.removeProperty(name);}visibleOverrides.clear();}
    function showControls(){const nodes=new Set(all('[data-zero-controls]'));for(const bar of Array.from(nodes)){let parent=bar.parentElement;for(let i=0;parent&&i<3;i++,parent=parent.parentElement){if(parent.tagName==='BODY'||parent.querySelector('video,iframe')||parent.closest('[role="dialog"],dialog'))break;const r=parent.getBoundingClientRect();if(r.height>=innerHeight*.25)break;nodes.add(parent);}}nodes.forEach(node=>{
      if(node.querySelector('video,iframe')||node.closest('[role="dialog"],dialog'))return;
      if(!visibleOverrides.has(node))visibleOverrides.set(node,['opacity','visibility','pointer-events','display'].map(name=>[name,node.style.getPropertyValue(name),node.style.getPropertyPriority(name)]));
      node.style.setProperty('opacity','1','important');node.style.setProperty('visibility','visible','important');node.style.setProperty('pointer-events','auto','important');
      if(getComputedStyle(node).display==='none')node.style.setProperty('display','flex','important');
    });}
    function idle(){restoreControls();document.documentElement.classList.add('zero-player-idle');all('.zero-tv-focused').forEach(node=>node.classList.remove('zero-tv-focused'));}
    function activity() {
      // Support custom control bars without hiding their video container or dialogs.
      all('button,[role="button"]').forEach(button => {
        let node = button.parentElement;
        for (let depth = 0; node && depth < 4; depth++, node = node.parentElement) {
          if (node.querySelector('video,iframe') || node.tagName === 'BODY') break;
          const r = node.getBoundingClientRect();
          if (r.height > 0 && r.height < innerHeight * 0.25 && r.bottom > innerHeight * 0.7 && node.querySelectorAll('button,[role="button"]').length >= 2) {
            node.setAttribute('data-zero-controlbar', 'true'); break;
          }
        }
      });
      markControls();
      document.documentElement.classList.remove('zero-player-idle');
      // Trigger the player's own mouse/activity listener, including React handlers.
      const target = document.querySelector('video') || document.body;
      if(target){for(const node of [target,target.parentElement,document.body].filter(Boolean)){node.dispatchEvent(new MouseEvent('mousemove',{bubbles:true,clientX:innerWidth/2,clientY:innerHeight/2}));node.dispatchEvent(new MouseEvent('mouseover',{bubbles:true}));if(window.PointerEvent)node.dispatchEvent(new PointerEvent('pointermove',{bubbles:true,pointerType:'mouse',clientX:innerWidth/2,clientY:innerHeight/2}));}}showControls();
      clearTimeout(idleTimer);
      idleTimer = setTimeout(idle,3000);
      all('iframe').forEach(frame => {
        try { frame.contentWindow.postMessage({type: 'zerostreams-remote-active'}, '*'); } catch (_) {}
      });
    }
    function markControls() {
      all(bars).forEach(node => {
        if (!node.querySelector('video,iframe')) node.setAttribute('data-zero-controls','true');
      });
    }
    function hideControls() {
      markControls();
      clearTimeout(idleTimer);
      let visible = false;
      if (!document.documentElement.classList.contains('zero-player-idle')) {
        all(bars).forEach(node => {
          // A player container must never become a control bar.
          if (node.querySelector('video,iframe')) return;
          const r = node.getBoundingClientRect(), style = getComputedStyle(node);
          if (r.width > 0 && r.height > 0 && style.visibility !== 'hidden' && style.display !== 'none' && Number(style.opacity || 1) > 0) visible = true;
        });
      }
      idle();
      return visible;
    }
    let backSequence = 0;
    const backWaiters = new Map();
    function dismissLocalMenu(){
      const selectors='dialog[open],[role="dialog"],[role="menu"],.vjs-menu,.plyr__menu__container,.shaka-settings-menu,.shaka-overflow-menu,[data-state="open"][role="listbox"]';
      const menus=all(selectors).filter(node=>{const style=getComputedStyle(node),rect=node.getBoundingClientRect();return !node.querySelector('video,iframe')&&!node.hidden&&!node.classList.contains('shaka-hidden')&&style.display!=='none'&&style.visibility!=='hidden'&&Number(style.opacity||1)>0&&rect.width>0&&rect.height>0;});
      if(!menus.length)return false;
      const menu=menus[menus.length-1];
      if(menu.tagName==='DIALOG'&&typeof menu.close==='function'){menu.close();return true;}
      const close=menu.querySelector('[aria-label="Close"],[aria-label="Back"],.shaka-back-to-overflow-button,.vjs-menu-button');
      if(close)close.click();
      else {document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',code:'Escape',bubbles:true}));document.dispatchEvent(new KeyboardEvent('keyup',{key:'Escape',code:'Escape',bubbles:true}));const toggle=all('[aria-expanded="true"]').find(node=>node.getAttribute('aria-controls')===menu.id);if(toggle)toggle.click();}
      return true;
    }
    function dismissControls(budget = 250) {
      const local = dismissLocalMenu();
      const frames = Array.from(document.querySelectorAll('iframe')).filter(frame => {const style=getComputedStyle(frame);return style.display!=='none'&&style.visibility!=='hidden';});
      return Promise.all(frames.map(frame => new Promise(resolve => {
        const request=++backSequence,timer=setTimeout(()=>{backWaiters.delete(request);resolve(false);},Math.max(30,budget));
        backWaiters.set(request,{source:frame.contentWindow,resolve,timer});
        try{frame.contentWindow.postMessage({type:'zerostreams-hide-controls',request,budget:Math.max(30,budget-50)},'*');}catch(_){clearTimeout(timer);backWaiters.delete(request);resolve(false);}
      }))).then(results=>local||results.some(Boolean));
    }
    window.__zeroDismissMenus=dismissControls;
    window.__zeroBackRequest = token => {
      window.__zeroBackResult = null;
      dismissControls().then(handled => { window.__zeroBackResult = {token, handled}; });
    };
    window.addEventListener('message', event => {
      const data=event.data;
      if(!data || !Number.isInteger(data.request)) return;
      if(data.type==='zerostreams-hide-controls' && window.parent!==window && event.source===window.parent) {
        dismissControls(Math.min(200,Number(data.budget)||200)).then(handled => event.source.postMessage({type:'zerostreams-controls-hidden',request:data.request,handled}, event.origin==='null'?'*':event.origin));
      } else if(data.type==='zerostreams-controls-hidden') {
        const waiter=backWaiters.get(data.request);
        if(!waiter || waiter.source!==event.source) return;
        clearTimeout(waiter.timer);backWaiters.delete(data.request);waiter.resolve(data.handled!==false);
      }
    });
    if(window.__zeroTv){
      let selected=null;
      const controls='button,a[href],input:not([type="hidden"]),select,summary,[role="button"],[role="menuitem"],[role="option"],[tabindex],.cursor-pointer,iframe';
      function visible(node){const r=node.getBoundingClientRect(),style=getComputedStyle(node);return r.width>1&&r.height>1&&style.display!=='none'&&style.visibility!=='hidden'&&Number(style.opacity||1)>0&&!node.disabled&&node.getAttribute('aria-disabled')!=='true'&&!node.dataset.zeroQrHidden;}
      function candidates(){return all(controls).filter(node=>visible(node)&&!node.matches('video,audio')&&!node.querySelector('video')&&(!node.hasAttribute('tabindex')||Number(node.getAttribute('tabindex'))>=0||node.matches('button,a,input,select,iframe')));}
      function initial(nodes){return nodes.find(node=>node.tagName!=='IFRAME'&&/play|pause/i.test(node.getAttribute('aria-label')||node.getAttribute('title')||node.textContent||''))||nodes.find(node=>node.tagName!=='IFRAME'&&!backButton(node))||nodes[0];}
      function focus(node){all('.zero-tv-focused').forEach(el=>el.classList.remove('zero-tv-focused'));selected=node;node.classList.add('zero-tv-focused');try{node.focus({preventScroll:true});node.scrollIntoView({block:'nearest',inline:'nearest'});}catch(_){try{node.focus();}catch(_){}}}
      function backButton(node){return node&&/^(back|go back|return|exit player|close player)(\s+to\s+.*)?$/i.test((node.getAttribute('aria-label')||node.getAttribute('title')||node.textContent||'').trim());}
      function exitPlayer(){if(window.parent===window){if(window.ZeroPlayer)window.ZeroPlayer.postMessage('back');}else window.parent.postMessage({type:'zerostreams-player-back'},'*');}
      window.__zeroTvNavigate=(direction,fromChild=null)=>{
        if(!['left','right','up','down','ok'].includes(direction))return;
        activity();const nodes=candidates();if(!nodes.length)return;
        let current=fromChild||(selected&&selected.isConnected&&nodes.includes(selected)?selected:null)||nodes.find(node=>node===document.activeElement);
        if(current&&current.tagName==='IFRAME'&&!fromChild){try{current.contentWindow.postMessage({type:'zerostreams-tv-nav',direction},'*');}catch(_){}return;}
        if(direction==='ok'){
          if(!current){current=initial(nodes);focus(current);}
          if(current.tagName==='IFRAME'){try{current.contentWindow.postMessage({type:'zerostreams-tv-nav',direction},'*');}catch(_){}}
          else if(backButton(current))exitPlayer();else current.click();return;
        }
        if(!current){const first=initial(nodes);focus(first);if(first.tagName==='IFRAME')try{first.contentWindow.postMessage({type:'zerostreams-tv-nav',direction},'*');}catch(_){}return;}
        const rect=current.getBoundingClientRect(),x=rect.left+rect.width/2,y=rect.top+rect.height/2;
        const ranked=nodes.filter(node=>node!==current).map(node=>{const r=node.getBoundingClientRect(),dx=r.left+r.width/2-x,dy=r.top+r.height/2-y;const primary=direction==='left'?-dx:direction==='right'?dx:direction==='up'?-dy:dy;const side=(direction==='left'||direction==='right')?Math.abs(dy):Math.abs(dx);return {node,primary,score:primary+side*3};}).filter(row=>row.primary>2).sort((a,b)=>a.score-b.score);
        if(ranked.length){focus(ranked[0].node);if(ranked[0].node.tagName==='IFRAME')try{ranked[0].node.contentWindow.postMessage({type:'zerostreams-tv-nav',direction},'*');}catch(_){}return;}
        if(window.parent!==window){window.parent.postMessage({type:'zerostreams-tv-nav-edge',direction},'*');return;}
        const origin=current.getBoundingClientRect(),ox=(origin.left+origin.right)/2,oy=(origin.top+origin.bottom)/2;
        const horizontal=direction==='left'||direction==='right',sign=(direction==='left'||direction==='up')?-1:1;
        let best=null,bestScore=Infinity;
        for(const node of nodes){if(node===current)continue;const r=node.getBoundingClientRect(),x=(r.left+r.right)/2,y=(r.top+r.bottom)/2,primary=horizontal?(x-ox)*sign:(y-oy)*sign;if(primary<=3)continue;const cross=Math.abs(horizontal?y-oy:x-ox);const overlap=horizontal?Math.max(0,Math.min(origin.bottom,r.bottom)-Math.max(origin.top,r.top)):Math.max(0,Math.min(origin.right,r.right)-Math.max(origin.left,r.left));const score=primary+cross*(overlap>0?.35:1.35);if(score<bestScore){bestScore=score;best=node;}}
        if(best){focus(best);return;}
        // No wraparound. Embedded frames may ask their parent to continue, otherwise stay put.
        if(window.parent!==window)window.parent.postMessage({type:'zerostreams-tv-nav-edge',direction},'*');
      };
      window.addEventListener('message',event=>{
        const data=event.data;if(!data)return;
        if(event.source===window.parent&&window.parent!==window&&data.type==='zerostreams-tv-nav')window.__zeroTvNavigate(data.direction);
        const frame=all('iframe').find(node=>node.contentWindow===event.source);if(!frame)return;
        if(data.type==='zerostreams-tv-nav-edge')window.__zeroTvNavigate(data.direction,frame);
        if(data.type==='zerostreams-player-back')exitPlayer();
      });
      document.addEventListener('keydown',event=>{const direction={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down',Enter:'ok'}[event.key];if(!direction)return;event.preventDefault();event.stopImmediatePropagation();window.__zeroTvNavigate(direction);},true);
      document.addEventListener('keyup',event=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Enter'].includes(event.key)){event.preventDefault();event.stopImmediatePropagation();}},true);
      document.addEventListener('click',event=>{const node=event.composedPath().find(el=>el.matches&&el.matches('button,a,[role="button"]'))||event.target.closest('button,a,[role="button"]');if(!backButton(node))return;event.preventDefault();event.stopImmediatePropagation();exitPlayer();},true);
      const style=document.createElement('style');style.textContent='.zero-tv-focused{outline:2px solid #65e6cc!important;outline-offset:3px!important;border-radius:7px!important;box-shadow:0 0 0 2px rgba(101,230,204,.12),0 0 16px rgba(101,230,204,.28)!important;filter:brightness(1.08)!important;transition:outline-color .12s,box-shadow .12s,filter .12s!important}';
      if(document.head)document.head.appendChild(style);else document.addEventListener('DOMContentLoaded',()=>document.head.appendChild(style),{once:true});
    }
    window.__zeroRemoteActivity = activity;
    window.addEventListener('message', event => {
      if (event.source === window.parent && event.data && event.data.type === 'zerostreams-remote-active') activity();
    });
    document.addEventListener('keydown', event => { if (event.key !== 'Escape' && event.key !== 'BrowserBack') activity(); });
    document.addEventListener('pointerdown', activity);
    const setupControls = () => {
      const style = document.createElement('style');
      style.textContent = '.zero-player-idle [data-zero-controls]{visibility:hidden!important;pointer-events:none!important}';
      document.head.appendChild(style);
      activity();
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setupControls, {once: true});
    else setupControls();
  }
  function hide(node) {
    if (node.dataset.zeroQrHidden) return;
    node.dataset.zeroQrHidden = 'true';
    node.style.setProperty('display', 'none', 'important');
    node.style.setProperty('pointer-events', 'none', 'important');
  }
  function graphic(node) {
    return Array.from(node.querySelectorAll('img,canvas,svg')).some(el => {
      const r = el.getBoundingClientRect();
      const w = r.width || Number(el.getAttribute('width'));
      const h = r.height || Number(el.getAttribute('height'));
      return w >= 48 && h >= 48 && w / h > 0.7 && w / h < 1.3;
    });
  }
  function timer(node) {
    return Array.from(node.querySelectorAll('span,div,p,b')).some(el => {
      if (el.children.length || !/^(?:skip (?:ad )?in\s*)?\d{1,2}\s*(?:s|seconds?)?$/i.test(el.textContent.trim())) return false;
      const value = Number(el.textContent.match(/\d+/)[0]);
      const style = getComputedStyle(el);
      return value > 0 && value <= 60 &&
        (/timer|countdown|dismiss/i.test(el.className + ' ' + el.id) || parseFloat(style.borderRadius) >= 10 || Array.from(node.querySelectorAll('button,[role="button"],a')).some(control=>/^(?:[x×✕✖]|close(?: ad)?|dismiss(?: ad)?)$/i.test((control.getAttribute('aria-label')||control.getAttribute('title')||control.textContent||'').trim())));
    });
  }
  function adContainer(label) {
    let node = label.parentElement;
    for (let depth = 0; node && depth < 8; depth++, node = node.parentElement) {
      if (node.querySelector(media) || node.querySelector(challenge)) break;
      if (!graphic(node) || !timer(node)) continue;
      const r = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      const large = r.width >= innerWidth * 0.2 && r.height >= innerHeight * 0.2;
      if (large && (/rgb\(255, 255, 255\)|#fff/i.test(style.backgroundColor)||['fixed','absolute'].includes(style.position)||node.matches('dialog,[role="dialog"]'))) return node;
    }
    return null;
  }
  function scan() {
    if (!document.body || !window.__zeroBlockAds) return;
    // Explicit ad slots only: never remove containers holding movie media,
    // genuine verification, or a non-ad frame used by the player.
    all('.adsbygoogle,.advertisement,.ad-banner,.banner-ad,.ad-container,.ad-overlay,.ad-popup,.popup-ad,[data-ad-slot],[data-ad-client],ins[data-ad-unit],iframe[id^="google_ads_iframe"]',true).forEach(node=>{
      if(node.matches(media+','+challenge)||node.querySelector(media+','+challenge))return;
      if(Array.from(node.querySelectorAll('iframe')).some(frame=>{try{return !adHost(new URL(frame.src,location.href).hostname);}catch{return true;}}))return;
      hide(node);
    });
    // The exact destination decoded from the reported advertising QR code.
    document.querySelectorAll('iframe[src],a[href]').forEach(el => {
      try {
        if (adHost(new URL(el.src || el.href, location.href).hostname)) {
          if (el.tagName === 'IFRAME') hide(el);
          else { el.removeAttribute('href'); el.style.pointerEvents = 'none'; }
        }
      } catch (_) {}
    });
    all('h1,h2,h3,p,span,div',true).forEach(label => {
      if (!heading(label.textContent)) return;
      const node = adContainer(label);
      if (!node) return;
      if (node === document.body || node === document.documentElement) {
        // An ad-only child frame must be hidden by its parent, not left as a blank overlay.
        if (window.parent !== window && !node.querySelector('iframe,' + media)) {
          window.parent.postMessage({type: 'zerostreams-timed-qr-ad'}, '*');
          Array.from(document.body.children).forEach(hide);
          document.body.style.backgroundColor = 'transparent';
        }
      } else hide(node);
    });
  }
  window.addEventListener('message', event => {
    if (!event.data || event.data.type !== 'zerostreams-timed-qr-ad') return;
    // No native bridge: only hide the exact child frame reporting its own ad creative.
    all('iframe').forEach(frame => {
      if (frame.contentWindow === event.source) hide(frame);
    });
  });
  let pending = false;
  new MutationObserver(() => {
    if (pending) return;
    pending = true;
    setTimeout(() => { pending = false; scan(); }, 400);
  }).observe(document, {subtree: true, childList: true, characterData: true});
  document.addEventListener('DOMContentLoaded', scan);
  setInterval(scan,1500); // Includes late creatives inside open shadow roots.
  scan();
})();


(() => {
  if(window.__zeroExitInstalled)return;window.__zeroExitInstalled=true;
  const back=node=>node&&/^(back|go back|return|exit player|close player)(\s+to\s+.*)?$/i.test((node.getAttribute('aria-label')||node.getAttribute('title')||node.textContent||'').trim());
  function exit(){if(window.parent===window&&window.ZeroPlayer){window.ZeroPlayer.postMessage('back');return;}if(window.parent===window)window.postMessage({type:'zeromovies-player-exit'},window.location.origin);else window.parent.postMessage({type:'zeromovies-player-exit'},'*');}
  document.addEventListener('click',event=>{const node=event.composedPath().find(el=>el.matches&&el.matches('button,a,[role="button"]'));if(!back(node))return;event.preventDefault();event.stopImmediatePropagation();exit();},true);
  window.addEventListener('message',event=>{if(event.source===window)return;if(event.data&&event.data.type==='zeromovies-player-exit'&&Array.from(document.querySelectorAll('iframe')).some(frame=>frame.contentWindow===event.source))exit();});
})();
