(() => {
  if (window.__zeroMouseBackInstalled) return;
  window.__zeroMouseBackInstalled = true;

  const MENU_SELECTORS = [
    'dialog[open]',
    '[role="dialog"]',
    '[role="menu"]',
    '[role="listbox"]',
    '[aria-modal="true"]',
    '.vjs-menu',
    '.vjs-menu-content',
    '.plyr__menu__container',
    '.shaka-settings-menu',
    '.shaka-overflow-menu',
    '[data-state="open"]',
    '[class*="settings"][class*="menu"]',
    '[class*="quality"][class*="menu"]',
    '[class*="resolution"][class*="menu"]',
    '[class*="popover"]',
    '[class*="dropdown"]'
  ].join(',');
  const CONTROL_SELECTORS = [
    '.jw-controlbar',
    '.jw-controls',
    '.plyr__controls',
    '.vjs-control-bar',
    '.shaka-controls-container',
    '[role="toolbar"]',
    '[data-zero-controlbar]',
    '[data-zero-controls]'
  ].join(',');

  let unknownBackFallback = 0;

  function visible(node) {
    if (!node || node.hidden) return false;
    const style = getComputedStyle(node);
    const rect = node.getBoundingClientRect();
    return style.display !== 'none' && style.visibility !== 'hidden' &&
      Number(style.opacity || 1) > 0 && rect.width > 2 && rect.height > 2;
  }
  function idleRoot() {
    const root = document.documentElement;
    return root.classList.contains('zero-player-idle') || root.classList.contains('zero-back-hide');
  }
  function localControlsVisible() {
    if (idleRoot()) return false;
    const bars = Array.from(document.querySelectorAll(CONTROL_SELECTORS)).filter(node => {
      if (!visible(node) || node.querySelector('video,iframe')) return false;
      const rect = node.getBoundingClientRect();
      return rect.height < innerHeight * .42;
    });
    if (bars.length) return true;
    if (document.querySelector('video')) return true;
    // The outer VidStuck document can be little more than a full-size iframe.
    // While it is active/non-idle, that still represents visible player controls.
    return Array.from(document.querySelectorAll('iframe')).some(frame => {
      if (!visible(frame)) return false;
      const r = frame.getBoundingClientRect();
      return r.width >= innerWidth * .45 && r.height >= innerHeight * .45;
    });
  }

  function expandedToggle() {
    return Array.from(document.querySelectorAll('[aria-expanded="true"]')).reverse().find(node => {
      if (!visible(node)) return false;
      const text = (node.getAttribute('aria-label') || node.getAttribute('title') || node.textContent || '').trim();
      return /settings|quality|resolution|subtitle|caption|audio|speed|menu|more|options/i.test(text) ||
        Boolean(node.getAttribute('aria-controls'));
    });
  }

  function closeLocalMenu() {
    const toggle = expandedToggle();
    if (toggle) {
      toggle.click();
      return true;
    }

    const menus = Array.from(document.querySelectorAll(MENU_SELECTORS)).filter(node => {
      if (!visible(node)) return false;
      if (node.querySelector('video,iframe')) return false;
      if (node.classList.contains('shaka-hidden')) return false;
      const rect = node.getBoundingClientRect();
      if (rect.width >= innerWidth * .97 && rect.height >= innerHeight * .97) return false;
      const hasChoice = node.matches('dialog,[role="dialog"],[role="menu"],[role="listbox"],[aria-modal="true"]') ||
        node.querySelector('button,[role="button"],[role="menuitem"],[role="option"],input,select,[tabindex]');
      return Boolean(hasChoice);
    });
    if (!menus.length) return false;

    const menu = menus[menus.length - 1];
    if (menu.tagName === 'DIALOG' && typeof menu.close === 'function') {
      menu.close();
      return true;
    }

    const close = menu.querySelector(
      '[aria-label="Close"],[aria-label="Back"],[title="Close"],[title="Back"],.shaka-back-to-overflow-button,.vjs-menu-button'
    );
    if (close) {
      close.click();
      return true;
    }

    const owner = Array.from(document.querySelectorAll('[aria-expanded="true"]')).reverse()
      .find(node => visible(node) && (!menu.id || node.getAttribute('aria-controls') === menu.id));
    if (owner) {
      owner.click();
      return true;
    }

    const target = menu.contains(document.activeElement) ? document.activeElement : menu;
    for (const receiver of [target, document]) {
      receiver.dispatchEvent(new KeyboardEvent('keydown', {key:'Escape', code:'Escape', bubbles:true, cancelable:true}));
      receiver.dispatchEvent(new KeyboardEvent('keyup', {key:'Escape', code:'Escape', bubbles:true, cancelable:true}));
    }
    return true;
  }

  function hideLocalControls() {
    if (typeof window.__zeroHidePlayerControls === 'function') window.__zeroHidePlayerControls();
    else document.documentElement.classList.add('zero-back-hide', 'zero-player-idle');
  }

  function forceMenuBack() {
    const target = document.activeElement || document;
    for (const receiver of [target, document]) {
      receiver.dispatchEvent(new KeyboardEvent('keydown', {key:'Escape', code:'Escape', bubbles:true, cancelable:true}));
      receiver.dispatchEvent(new KeyboardEvent('keyup', {key:'Escape', code:'Escape', bubbles:true, cancelable:true}));
    }
    document.querySelectorAll('iframe').forEach(frame => {
      try { frame.contentWindow.postMessage({type:'zerostreams-tv-force-back'}, '*'); } catch (_) {}
    });
  }

  let sequence = 0;
  const waiters = new Map();
  function askChild(frame) {
    const request = 'ztv-' + (++sequence) + '-' + Date.now();
    return new Promise(resolve => {
      const timer = setTimeout(() => { waiters.delete(request); resolve('unknown'); }, 360);
      waiters.set(request, {source:frame.contentWindow, resolve:value => { clearTimeout(timer); waiters.delete(request); resolve(value); }});
      try { frame.contentWindow.postMessage({type:'zerostreams-tv-back-query', request}, '*'); }
      catch (_) { clearTimeout(timer); waiters.delete(request); resolve('unknown'); }
    });
  }
  async function askChildrenStage() {
    const frames = Array.from(document.querySelectorAll('iframe')).filter(visible).sort((a,b) => {
      const ar=a.getBoundingClientRect(),br=b.getBoundingClientRect();return br.width*br.height-ar.width*ar.height;
    });
    let unknown = false;
    for (const frame of frames) {
      const stage = await askChild(frame);
      if (stage === 'menu' || stage === 'controls') return stage;
      if (stage === 'unknown') unknown = true;
    }
    return unknown ? 'unknown' : 'exit';
  }
  async function backStep() {
    if (closeLocalMenu()) {
      unknownBackFallback = 0;
      return 'menu';
    }

    const childStage = await askChildrenStage();
    if (childStage === 'menu') {
      unknownBackFallback = 0;
      return 'menu';
    }
    if (childStage === 'controls') {
      unknownBackFallback = 1;
      return 'controls';
    }

    if (localControlsVisible()) {
      hideLocalControls();
      unknownBackFallback = 1;
      return 'controls';
    }

    // Never let a slow/unresponsive provider iframe turn the first Back into
    // an accidental movie exit. Give it an Escape-style menu close first,
    // then controls-hide, and only allow exit on the following Back.
    if (childStage === 'unknown') {
      if (unknownBackFallback === 0) {
        unknownBackFallback = 1;
        forceMenuBack();
        return 'menu';
      }
      if (unknownBackFallback === 1) {
        unknownBackFallback = 2;
        hideLocalControls();
        return 'controls';
      }
      unknownBackFallback = 0;
      return 'exit';
    }

    unknownBackFallback = 0;
    return 'exit';
  }

  // First D-pad press after player idle is wake-only. Native Android also sends
  // a real hover event, while this capture listener prevents that same press
  // from seeking or activating a provider control.
  window.addEventListener('message', event => {
    const data = event.data;
    if (!window.__zeroTv || !data || data.type !== 'zerostreams-tv-nav') return;
    if (window.parent === window || event.source !== window.parent || !idleRoot()) return;
    document.documentElement.classList.remove('zero-player-idle', 'zero-back-hide');
    if (typeof window.__zeroRemoteActivity === 'function') window.__zeroRemoteActivity();
    event.stopImmediatePropagation();
  }, true);

  window.__zeroTvBackStep = async token => {
    window.__zeroBackResult = null;
    const stage = await backStep();
    window.__zeroBackResult = {token, stage, handled:stage !== 'exit'};
  };
  window.__zeroMouseBackRequest = window.__zeroTvBackStep;

  window.addEventListener('message', async event => {
    const data = event.data;
    if (!data) return;
    if (data.type === 'zerostreams-tv-force-back') {
      if (!closeLocalMenu()) forceMenuBack();
      return;
    }
    if (data.type === 'zerostreams-tv-back-query' && data.request) {
      const stage = await backStep();
      try { event.source.postMessage({type:'zerostreams-tv-back-result', request:data.request, stage}, '*'); } catch (_) {}
      return;
    }
    if (data.type === 'zerostreams-tv-back-result' && data.request) {
      const waiter = waiters.get(data.request);
      if (waiter && waiter.source === event.source) waiter.resolve(['menu','controls','exit'].includes(data.stage)?data.stage:'unknown');
    }
  });

  const resetFallback = () => { unknownBackFallback = 0; };
  document.addEventListener('pointerdown', resetFallback, true);
  document.addEventListener('keydown', event => {
    if (!['Escape','BrowserBack'].includes(event.key)) resetFallback();
  }, true);
})();
