(() => {
  if (!window.__zeroTv || window.__zeroTvInputV3) return;
  window.__zeroTvInputV3 = true;

  const INTERACTIVE = 'button,a[href],input:not([type="hidden"]),select,summary,[role="button"],[role="menuitem"],[role="option"],[tabindex],.cursor-pointer';
  const CONTROL_BARS = '.jw-controlbar,.jw-controls,.plyr__controls,.vjs-control-bar,.shaka-controls-container,[role="toolbar"],[data-zero-controlbar],[data-zero-controls]';
  const MENUS = 'dialog[open],[role="dialog"],[role="menu"],[role="listbox"],[aria-modal="true"],.vjs-menu,.vjs-menu-content,.plyr__menu__container,.shaka-settings-menu,.shaka-overflow-menu,[data-state="open"],[class*="settings"][class*="menu"],[class*="quality"][class*="menu"],[class*="resolution"][class*="menu"],[class*="popover"],[class*="dropdown"]';

  let selected = null;
  let requestId = 0;
  let unknownBackCount = 0;
  const backWaiters = new Map();
  const hiddenStyles = new Map();
  const focusStyles = new Map();

  function roots() {
    const out = [document], queue = [document];
    for (let i = 0; i < queue.length && i < 64; i++) {
      const root = queue[i];
      try {
        root.querySelectorAll('*').forEach(node => {
          if (node.shadowRoot && !out.includes(node.shadowRoot)) {
            out.push(node.shadowRoot);
            queue.push(node.shadowRoot);
          }
        });
      } catch (_) {}
    }
    return out;
  }

  function all(selector) {
    const out = [];
    for (const root of roots()) {
      try { out.push(...root.querySelectorAll(selector)); } catch (_) {}
    }
    return Array.from(new Set(out));
  }

  function visible(node) {
    if (!node || node.hidden || node.disabled || node.getAttribute?.('aria-disabled') === 'true') return false;
    const r = node.getBoundingClientRect();
    const s = getComputedStyle(node);
    return r.width > 2 && r.height > 2 && s.display !== 'none' && s.visibility !== 'hidden' && Number(s.opacity || 1) > 0;
  }

  function frameScore(frame) {
    const r = frame.getBoundingClientRect();
    let bonus = 0;
    try {
      const src = String(frame.src || '');
      if (/vidstuck|vidsrc|embed|player/i.test(src)) bonus = innerWidth * innerHeight * 2;
    } catch (_) {}
    return r.width * r.height + bonus;
  }

  function frames() {
    return all('iframe').filter(visible).sort((a, b) => frameScore(b) - frameScore(a));
  }

  function candidates() {
    return all(INTERACTIVE).filter(node => {
      if (!visible(node) || node.matches('video,audio,iframe')) return false;
      if (node.dataset?.zeroQrHidden) return false;
      if (node.hasAttribute('tabindex') && Number(node.getAttribute('tabindex')) < 0 && !node.matches('button,a,input,select')) return false;
      const r = node.getBoundingClientRect();
      // Ignore full-screen transparent click catchers and obvious page-level wrappers.
      if (r.width > innerWidth * .94 && r.height > innerHeight * .75 && !/play|pause|settings|quality|subtitle|caption|volume|fullscreen/i.test(label(node))) return false;
      return true;
    });
  }

  function label(node) {
    return String(node?.getAttribute?.('aria-label') || node?.getAttribute?.('title') || node?.textContent || '').trim();
  }

  function saveStyles(map, node, names) {
    if (map.has(node)) return;
    map.set(node, names.map(name => [name, node.style.getPropertyValue(name), node.style.getPropertyPriority(name)]));
  }

  function restoreStyles(map, node) {
    const rows = map.get(node);
    if (!rows) return;
    for (const [name, value, priority] of rows) {
      if (value) node.style.setProperty(name, value, priority);
      else node.style.removeProperty(name);
    }
    map.delete(node);
  }

  function clearFocus() {
    for (const node of Array.from(focusStyles.keys())) restoreStyles(focusStyles, node);
    all('.zero-tv-focused').forEach(node => node.classList.remove('zero-tv-focused'));
    selected = null;
  }

  function paintFocus(node) {
    if (!node) return;
    if (selected && selected !== node) restoreStyles(focusStyles, selected);
    all('.zero-tv-focused').forEach(el => { if (el !== node) el.classList.remove('zero-tv-focused'); });
    selected = node;
    saveStyles(focusStyles, node, ['outline','outline-offset','border-radius','box-shadow','filter','position','z-index']);
    node.classList.add('zero-tv-focused');
    node.style.setProperty('outline', '2px solid #65e6cc', 'important');
    node.style.setProperty('outline-offset', '2px', 'important');
    node.style.setProperty('border-radius', '7px', 'important');
    node.style.setProperty('box-shadow', '0 0 0 1px rgba(101,230,204,.28),0 0 10px rgba(101,230,204,.48)', 'important');
    node.style.setProperty('filter', 'brightness(1.08)', 'important');
    node.style.setProperty('position', getComputedStyle(node).position === 'static' ? 'relative' : getComputedStyle(node).position, 'important');
    node.style.setProperty('z-index', '2147483646', 'important');
    try { node.focus({preventScroll:true}); node.scrollIntoView({block:'nearest', inline:'nearest'}); }
    catch (_) { try { node.focus(); } catch (_) {} }
  }

  function localControlsVisible() {
    if (document.documentElement.classList.contains('zero-player-idle') || document.documentElement.classList.contains('zero-tv-hidden')) return false;
    if (all(CONTROL_BARS).some(node => visible(node) && !node.querySelector?.('video,iframe'))) return true;
    return candidates().some(node => {
      const r = node.getBoundingClientRect();
      return r.top > innerHeight * .55 || /play|pause|settings|quality|resolution|subtitle|caption|volume|fullscreen|speed/i.test(label(node));
    });
  }

  function restoreControls() {
    for (const node of Array.from(hiddenStyles.keys())) restoreStyles(hiddenStyles, node);
    document.documentElement.classList.remove('zero-player-idle','zero-tv-hidden','zero-back-hide');
  }

  function forceShowControls() {
    restoreControls();
    const target = all('video')[0] || document.body;
    const x = Math.max(2, Math.round(innerWidth / 2));
    const y = Math.max(2, Math.round(innerHeight * .72));
    for (const node of [target, target?.parentElement, document.body].filter(Boolean)) {
      try { node.dispatchEvent(new MouseEvent('mousemove',{bubbles:true,clientX:x,clientY:y})); } catch (_) {}
      try { node.dispatchEvent(new MouseEvent('mouseover',{bubbles:true,clientX:x,clientY:y})); } catch (_) {}
      try { if (window.PointerEvent) node.dispatchEvent(new PointerEvent('pointermove',{bubbles:true,pointerType:'mouse',clientX:x,clientY:y})); } catch (_) {}
    }
    for (const bar of all(CONTROL_BARS)) {
      if (bar.querySelector?.('video,iframe')) continue;
      saveStyles(hiddenStyles, bar, ['opacity','visibility','pointer-events','display']);
      bar.style.setProperty('opacity','1','important');
      bar.style.setProperty('visibility','visible','important');
      bar.style.setProperty('pointer-events','auto','important');
      if (getComputedStyle(bar).display === 'none') {
        const display = bar.matches('.plyr__controls,.vjs-control-bar,[role="toolbar"]') ? 'flex' : 'block';
        bar.style.setProperty('display',display,'important');
      }
    }
  }

  function wakeTree() {
    forceShowControls();
    // Some provider frameworks update their hidden state on the next render tick.
    // Reinforce the same wake briefly without changing navigation semantics.
    setTimeout(forceShowControls, 70);
    setTimeout(forceShowControls, 180);
    if (typeof window.__zeroRemoteActivity === 'function') {
      try { window.__zeroRemoteActivity(); } catch (_) {}
    }
    for (const frame of frames()) {
      try { frame.contentWindow.postMessage({type:'zeroplay-tv-wake'}, '*'); } catch (_) {}
    }
  }
  window.__zeroTvWake = wakeTree;

  function hideLocalControls() {
    let handled = false;
    for (const bar of all(CONTROL_BARS)) {
      if (!visible(bar) || bar.querySelector?.('video,iframe')) continue;
      saveStyles(hiddenStyles, bar, ['opacity','visibility','pointer-events']);
      bar.style.setProperty('opacity','0','important');
      bar.style.setProperty('visibility','hidden','important');
      bar.style.setProperty('pointer-events','none','important');
      handled = true;
    }
    document.documentElement.classList.add('zero-tv-hidden');
    clearFocus();
    return handled;
  }

  function expandedToggle() {
    return all('[aria-expanded="true"]').reverse().find(node => {
      if (!visible(node)) return false;
      return /settings|quality|resolution|subtitle|caption|audio|speed|menu|more|options/i.test(label(node)) || Boolean(node.getAttribute('aria-controls'));
    });
  }

  function closeLocalMenu() {
    const toggle = expandedToggle();
    if (toggle) { try { toggle.click(); } catch (_) {} return true; }
    const menus = all(MENUS).filter(node => {
      if (!visible(node) || node.querySelector?.('video,iframe') || node.classList?.contains('shaka-hidden')) return false;
      const r = node.getBoundingClientRect();
      if (r.width >= innerWidth * .97 && r.height >= innerHeight * .97) return false;
      return true;
    });
    if (!menus.length) return false;
    const menu = menus[menus.length - 1];
    if (menu.tagName === 'DIALOG' && typeof menu.close === 'function') { menu.close(); return true; }
    const close = Array.from(menu.querySelectorAll?.('[aria-label="Close"],[aria-label="Back"],[title="Close"],[title="Back"],.shaka-back-to-overflow-button,.vjs-menu-button') || []).find(visible);
    if (close) { try { close.click(); } catch (_) {} return true; }
    for (const receiver of [document.activeElement, menu, document].filter(Boolean)) {
      try { receiver.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',code:'Escape',bubbles:true,cancelable:true})); } catch (_) {}
      try { receiver.dispatchEvent(new KeyboardEvent('keyup',{key:'Escape',code:'Escape',bubbles:true,cancelable:true})); } catch (_) {}
    }
    return true;
  }

  function initial(nodes) {
    return nodes.find(node => /play|pause/i.test(label(node))) ||
      nodes.find(node => /settings|quality|subtitle|caption/i.test(label(node))) ||
      nodes.slice().sort((a,b) => b.getBoundingClientRect().top - a.getBoundingClientRect().top)[0] || null;
  }

  function spatial(nodes, current, direction) {
    const r0 = current.getBoundingClientRect();
    const x0 = (r0.left + r0.right) / 2, y0 = (r0.top + r0.bottom) / 2;
    const horizontal = direction === 'left' || direction === 'right';
    const sign = (direction === 'left' || direction === 'up') ? -1 : 1;
    let best = null, bestScore = Infinity;
    for (const node of nodes) {
      if (node === current) continue;
      const r = node.getBoundingClientRect();
      const x = (r.left + r.right) / 2, y = (r.top + r.bottom) / 2;
      const primary = (horizontal ? x - x0 : y - y0) * sign;
      if (primary <= 3) continue;
      const cross = Math.abs(horizontal ? y - y0 : x - x0);
      const overlap = horizontal ? Math.max(0, Math.min(r0.bottom,r.bottom)-Math.max(r0.top,r.top)) : Math.max(0, Math.min(r0.right,r.right)-Math.max(r0.left,r.left));
      const score = primary + cross * (overlap > 0 ? .32 : 1.45);
      if (score < bestScore) { bestScore = score; best = node; }
    }
    return best;
  }

  function navigateLocal(direction) {
    const wasVisible = localControlsVisible();
    forceShowControls();
    let nodes = candidates();
    if (!nodes.length) return false;
    if (!wasVisible) return true; // first press after real provider idle is wake-only

    let current = selected && selected.isConnected && nodes.includes(selected) ? selected : nodes.find(node => node === document.activeElement);
    if (direction === 'ok') {
      if (!current) { current = initial(nodes); if (current) paintFocus(current); return true; }
      try { current.click(); } catch (_) {}
      return true;
    }
    if (!current) {
      current = initial(nodes);
      if (current) paintFocus(current);
      return Boolean(current);
    }
    const next = spatial(nodes, current, direction);
    if (next) { paintFocus(next); return true; }
    return false;
  }

  function routeNavigation(direction) {
    if (!['left','right','up','down','ok'].includes(direction)) return;
    const local = candidates();
    const providerFrames = frames();
    // Embed wrapper pages should delegate into the actual player frame. A real
    // player frame with usable controls owns navigation locally.
    if (providerFrames.length && local.length < 2) {
      forceShowControls();
      try { providerFrames[0].contentWindow.postMessage({type:'zeroplay-tv-nav',direction}, '*'); return; } catch (_) {}
    }
    if (navigateLocal(direction)) return;
    if (providerFrames.length) {
      try { providerFrames[0].contentWindow.postMessage({type:'zeroplay-tv-nav',direction}, '*'); return; } catch (_) {}
    }
    if (window.parent !== window) {
      try { window.parent.postMessage({type:'zeroplay-tv-edge',direction}, '*'); } catch (_) {}
    }
  }
  window.__zeroTvNavigate = routeNavigation;

  function askFrame(frame) {
    return new Promise(resolve => {
      const request = 'zp-' + (++requestId) + '-' + Date.now();
      const timer = setTimeout(() => { backWaiters.delete(request); resolve('unknown'); }, 320);
      backWaiters.set(request,{source:frame.contentWindow,resolve:value=>{clearTimeout(timer);backWaiters.delete(request);resolve(value);}});
      try { frame.contentWindow.postMessage({type:'zeroplay-tv-back-query',request}, '*'); }
      catch (_) { clearTimeout(timer);backWaiters.delete(request);resolve('unknown'); }
    });
  }

  async function backStep() {
    if (closeLocalMenu()) { unknownBackCount = 0; return 'menu'; }
    for (const frame of frames()) {
      const stage = await askFrame(frame);
      if (stage === 'menu' || stage === 'controls') { unknownBackCount = 0; return stage; }
      if (stage === 'unknown') {
        unknownBackCount++;
        if (unknownBackCount < 2) { try { frame.contentWindow.postMessage({type:'zeroplay-tv-wake'}, '*'); } catch (_) {} return 'controls'; }
      }
    }
    if (localControlsVisible()) { unknownBackCount = 0; hideLocalControls(); return 'controls'; }
    unknownBackCount = 0;
    return 'exit';
  }

  window.__zeroTvBackRequest = async token => {
    window.__zeroBackResult = null;
    const stage = await backStep();
    window.__zeroBackResult = {token,stage};
  };

  window.addEventListener('message', async event => {
    const data = event.data;
    if (!data) return;
    if (data.type === 'zeroplay-tv-wake') { forceShowControls(); return; }
    if (data.type === 'zeroplay-tv-nav') { routeNavigation(data.direction); return; }
    if (data.type === 'zeroplay-tv-edge') {
      const frame = frames().find(f => f.contentWindow === event.source);
      const nodes = candidates();
      if (frame && nodes.length) navigateLocal(data.direction);
      else if (window.parent !== window) try { window.parent.postMessage(data, '*'); } catch (_) {}
      return;
    }
    if (data.type === 'zeroplay-tv-back-query' && data.request) {
      const stage = await backStep();
      try { event.source.postMessage({type:'zeroplay-tv-back-result',request:data.request,stage}, '*'); } catch (_) {}
      return;
    }
    if (data.type === 'zeroplay-tv-back-result' && data.request) {
      const waiter = backWaiters.get(data.request);
      if (waiter && waiter.source === event.source) waiter.resolve(['menu','controls','exit','unknown'].includes(data.stage) ? data.stage : 'unknown');
    }
  });

  // Provider-generated keyboard events must not seek while D-pad mode is active.
  document.addEventListener('keydown', event => {
    const direction = {ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down',Enter:'ok'}[event.key];
    if (!direction) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    routeNavigation(direction);
  }, true);
  document.addEventListener('keyup', event => {
    if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Enter'].includes(event.key)) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }, true);
})();
