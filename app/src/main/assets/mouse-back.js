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
    '[data-state="open"]'
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
    // player-guard maintains zero-player-idle after its inactivity window. If a
    // provider uses an unrecognised control class, a non-idle document that owns
    // the video still counts as controls-visible for the Back stack.
    return Boolean(document.querySelector('video'));
  }

  function closeLocalMenu() {
    const menus = Array.from(document.querySelectorAll(MENU_SELECTORS)).filter(node => {
      if (!visible(node)) return false;
      if (node.querySelector('video,iframe')) return false;
      if (node.classList.contains('shaka-hidden')) return false;
      const rect = node.getBoundingClientRect();
      return node.matches('dialog,[role="dialog"],[role="menu"],[role="listbox"],[aria-modal="true"],.vjs-menu,.vjs-menu-content,.plyr__menu__container,.shaka-settings-menu,.shaka-overflow-menu') ||
        rect.width < innerWidth * .94 || rect.height < innerHeight * .94;
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

    const expanded = Array.from(document.querySelectorAll('[aria-expanded="true"]')).reverse()
      .find(node => visible(node) && (!menu.id || node.getAttribute('aria-controls') === menu.id || node.closest('button,[role="button"]')));
    if (expanded) {
      expanded.click();
      return true;
    }

    const target = document.activeElement || document;
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

  let sequence = 0;
  const waiters = new Map();
  function askChild(frame) {
    const request = 'ztv-' + (++sequence) + '-' + Date.now();
    return new Promise(resolve => {
      const timer = setTimeout(() => { waiters.delete(request); resolve('exit'); }, 260);
      waiters.set(request, {source:frame.contentWindow, resolve:value => { clearTimeout(timer); waiters.delete(request); resolve(value); }});
      try { frame.contentWindow.postMessage({type:'zerostreams-tv-back-query', request}, '*'); }
      catch (_) { clearTimeout(timer); waiters.delete(request); resolve('exit'); }
    });
  }
  async function askChildrenStage() {
    const frames = Array.from(document.querySelectorAll('iframe')).filter(visible).sort((a,b) => {
      const ar=a.getBoundingClientRect(),br=b.getBoundingClientRect();return br.width*br.height-ar.width*ar.height;
    });
    for (const frame of frames) {
      const stage = await askChild(frame);
      if (stage !== 'exit') return stage;
    }
    return 'exit';
  }
  async function backStep() {
    const childStage = await askChildrenStage();
    if (childStage !== 'exit') return childStage;
    if (closeLocalMenu()) return 'menu';
    if (localControlsVisible()) {
      hideLocalControls();
      return 'controls';
    }
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
  // Compatibility for older callers while the native TV path uses staged Back.
  window.__zeroMouseBackRequest = window.__zeroTvBackStep;

  window.addEventListener('message', async event => {
    const data = event.data;
    if (!data) return;
    if (data.type === 'zerostreams-tv-back-query' && data.request) {
      const stage = await backStep();
      try { event.source.postMessage({type:'zerostreams-tv-back-result', request:data.request, stage}, '*'); } catch (_) {}
      return;
    }
    if (data.type === 'zerostreams-tv-back-result' && data.request) {
      const waiter = waiters.get(data.request);
      if (waiter && waiter.source === event.source) waiter.resolve(['menu','controls','exit'].includes(data.stage)?data.stage:'exit');
    }
  });
})();
