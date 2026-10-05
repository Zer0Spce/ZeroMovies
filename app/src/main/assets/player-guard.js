/* Only the timed QR advertising creative is removed. No CAPTCHA interaction. */
(() => {
  if (window.__zeroQrAdFilter) return;
  window.__zeroQrAdFilter = true;
  const adHost = host => host === 'gurlleviter.cyou' || host.endsWith('.gurlleviter.cyou');
  const heading = value => /^confirm you['’]re not a robot[.!]?$/i.test(value.trim());
  const media = 'video,audio,.jwplayer,.plyr,.vjs-player,[data-player]';
  const challenge = 'iframe[src*="recaptcha"],iframe[src*="hcaptcha"],iframe[src*="challenges.cloudflare.com"],.g-recaptcha,.h-captcha,input[name="cf-turnstile-response"]';
  if (window.ZeroProgress) window.addEventListener('message', event => {
    if (event.origin !== 'https://vidstuck.xyz') return;
    try {
      const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
      if (data && (data.type === 'movie' || data.type === 'tv') && Number.isFinite(Number(data.timestamp)) && Number.isFinite(Number(data.duration)))
        window.ZeroProgress.postMessage(JSON.stringify(data));
    } catch (_) {}
  });
  window.__zeroDismissQrAd = () => {
    // Called only after the native screen reader identifies the reported advertising QR.
    document.querySelectorAll('iframe').forEach(frame => { try { frame.contentWindow.postMessage({type:'zerostreams-dismiss-ad-qr'}, '*'); } catch (_) {} });
    document.querySelectorAll('img,canvas,svg').forEach(image => {
      const bounds=image.getBoundingClientRect();
      // A provider may paint the whole white banner as one image/canvas with
      // no white DOM container. Only the native advertising QR confirmation
      // permits removing this viewport-sized artwork.
      if(bounds.width>=innerWidth*.7&&bounds.height>=innerHeight*.7&&
        !image.matches('video,audio')&&!image.closest('.g-recaptcha,.h-captcha')&&
        !image.parentElement?.querySelector(challenge)){
        hide(image);return;
      }
      if (bounds.width < 100 || bounds.height < 100 || bounds.width/bounds.height < .65 || bounds.width/bounds.height > 1.4) return;
      let node=image.parentElement,candidate=null;
      for(let depth=0;node&&depth<10;depth++,node=node.parentElement){
        if(node.querySelector(media)||node.querySelector(challenge))break;
        const r=node.getBoundingClientRect(),style=getComputedStyle(node);
        if(r.width>=innerWidth*.4&&r.height>=innerHeight*.4&&/rgb\(255, 255, 255\)|#fff/i.test(style.backgroundColor))candidate=node;
      }
      if(!candidate)return;
      if(candidate===document.body||candidate===document.documentElement){
        if(window.parent!==window&&!candidate.querySelector('iframe,'+media)){window.parent.postMessage({type:'zerostreams-timed-qr-ad'},'*');Array.from(document.body.children).forEach(hide);document.body.style.backgroundColor='transparent';}
      }else hide(candidate);
    });
    // Some creatives paint the entire banner as CSS background artwork.
    // Native QR confirmation makes this independent of readable DOM text.
    document.querySelectorAll('div,section,aside,dialog').forEach(node => {
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
    function activity() {
      // Support custom control bars without hiding their video container or dialogs.
      document.querySelectorAll('button,[role="button"]').forEach(button => {
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
      if (target) target.dispatchEvent(new MouseEvent('mousemove', {bubbles: true, clientX: innerWidth / 2, clientY: innerHeight / 2}));
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => document.documentElement.classList.add('zero-player-idle'), 3000);
      document.querySelectorAll('iframe').forEach(frame => {
        try { frame.contentWindow.postMessage({type: 'zerostreams-remote-active'}, '*'); } catch (_) {}
      });
    }
    function markControls() {
      document.querySelectorAll(bars).forEach(node => {
        if (!node.querySelector('video,iframe')) node.setAttribute('data-zero-controls','true');
      });
    }
    function hideControls() {
      markControls();
      clearTimeout(idleTimer);
      let visible = false;
      if (!document.documentElement.classList.contains('zero-player-idle')) {
        document.querySelectorAll(bars).forEach(node => {
          // A player container must never become a control bar.
          if (node.querySelector('video,iframe')) return;
          const r = node.getBoundingClientRect(), style = getComputedStyle(node);
          if (r.width > 0 && r.height > 0 && style.visibility !== 'hidden' && style.display !== 'none' && Number(style.opacity || 1) > 0) visible = true;
        });
      }
      document.documentElement.classList.add('zero-player-idle');
      return visible;
    }
    let backSequence = 0;
    const backWaiters = new Map();
    function dismissControls(budget = 650) {
      const local = hideControls();
      const frames = Array.from(document.querySelectorAll('iframe')).filter(frame => {
        const style=getComputedStyle(frame);
        return style.display !== 'none' && style.visibility !== 'hidden';
      });
      return Promise.all(frames.map(frame => new Promise(resolve => {
        const request = ++backSequence;
        const timer = setTimeout(() => { backWaiters.delete(request); resolve(true); }, Math.max(30,budget));
        backWaiters.set(request, {source:frame.contentWindow, resolve, timer});
        try { frame.contentWindow.postMessage({type:'zerostreams-hide-controls', request, budget:Math.max(30,budget-200)}, '*'); }
        catch (_) { clearTimeout(timer); backWaiters.delete(request); resolve(true); }
      }))).then(results => local || results.some(Boolean));
    }
    window.__zeroBackRequest = token => {
      window.__zeroBackResult = null;
      dismissControls().then(handled => { window.__zeroBackResult = {token, handled}; });
    };
    window.addEventListener('message', event => {
      const data=event.data;
      if(!data || !Number.isInteger(data.request)) return;
      if(data.type==='zerostreams-hide-controls' && window.parent!==window && event.source===window.parent) {
        dismissControls(Math.min(450,Number(data.budget)||450)).then(handled => event.source.postMessage({type:'zerostreams-controls-hidden',request:data.request,handled}, event.origin==='null'?'*':event.origin));
      } else if(data.type==='zerostreams-controls-hidden') {
        const waiter=backWaiters.get(data.request);
        if(!waiter || waiter.source!==event.source) return;
        clearTimeout(waiter.timer);backWaiters.delete(data.request);waiter.resolve(data.handled!==false);
      }
    });
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
      return w >= 100 && h >= 100 && w / h > 0.7 && w / h < 1.3;
    });
  }
  function timer(node) {
    return Array.from(node.querySelectorAll('span,div,p,b')).some(el => {
      if (el.children.length || !/^\d{1,2}$/.test(el.textContent.trim())) return false;
      const value = Number(el.textContent.trim());
      const style = getComputedStyle(el);
      return value > 0 && value <= 60 &&
        (/timer|countdown|dismiss/i.test(el.className + ' ' + el.id) || parseFloat(style.borderRadius) >= 10);
    });
  }
  function adContainer(label) {
    let node = label.parentElement;
    for (let depth = 0; node && depth < 8; depth++, node = node.parentElement) {
      if (node.querySelector(media) || node.querySelector(challenge)) break;
      if (!graphic(node) || !timer(node)) continue;
      const r = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      const large = r.width >= innerWidth * 0.5 && r.height >= innerHeight * 0.5;
      if (large && (/rgb\(255, 255, 255\)|#fff/i.test(style.backgroundColor))) return node;
    }
    return null;
  }
  function scan() {
    if (!document.body || !window.__zeroBlockAds) return;
    // The exact destination decoded from the reported advertising QR code.
    document.querySelectorAll('iframe[src],a[href]').forEach(el => {
      try {
        if (adHost(new URL(el.src || el.href, location.href).hostname)) {
          if (el.tagName === 'IFRAME') hide(el);
          else { el.removeAttribute('href'); el.style.pointerEvents = 'none'; }
        }
      } catch (_) {}
    });
    if(!/confirm you['’]re not a robot/i.test(document.body.textContent))return;
    document.querySelectorAll('h1,h2,h3,p,span,div').forEach(label => {
      if (label.children.length || !heading(label.textContent)) return;
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
    document.querySelectorAll('iframe').forEach(frame => {
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
  scan();
})();

