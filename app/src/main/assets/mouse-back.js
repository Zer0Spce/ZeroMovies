(() => {
  if (window.__zeroMouseBackInstalled) return;
  window.__zeroMouseBackInstalled = true;

  // In Android TV D-pad mode the provider may hide its controls after a few
  // seconds. The first controller navigation press after that idle state is a
  // wake-up press only: restore the provider controls and consume that single
  // navigation event so it cannot seek, activate, or move focus accidentally.
  // Mouse mode is unaffected because native mouse handling consumes those keys
  // before a zerostreams-tv-nav message is sent to the provider iframe.
  function wakeHiddenDpadControls(event) {
    const data = event.data;
    if (!window.__zeroTv || !data || data.type !== 'zerostreams-tv-nav') return;
    if (window.parent === window || event.source !== window.parent) return;
    const root = document.documentElement;
    const hidden = root.classList.contains('zero-player-idle') || root.classList.contains('zero-back-hide');
    if (!hidden) return;
    root.classList.remove('zero-player-idle', 'zero-back-hide');
    if (typeof window.__zeroRemoteActivity === 'function') window.__zeroRemoteActivity();
    event.stopImmediatePropagation();
  }
  window.addEventListener('message', wakeHiddenDpadControls, true);

  const MENU_SELECTORS = [
    'dialog[open]',
    '[role="dialog"]',
    '[role="menu"]',
    '[role="listbox"]',
    '.vjs-menu',
    '.vjs-menu-content',
    '.plyr__menu__container',
    '.shaka-settings-menu',
    '.shaka-overflow-menu',
    '[data-state="open"]',
    '[aria-expanded="true"] + *'
  ].join(',');

  function visible(node) {
    if (!node || node.hidden) return false;
    const style = getComputedStyle(node);
    const rect = node.getBoundingClientRect();
    return style.display !== 'none' && style.visibility !== 'hidden' &&
      Number(style.opacity || 1) > 0 && rect.width > 2 && rect.height > 2;
  }

  function closeLocalMenu() {
    const menus = Array.from(document.querySelectorAll(MENU_SELECTORS)).filter(node => {
      if (!visible(node)) return false;
      if (node.querySelector('video,iframe')) return false;
      const rect = node.getBoundingClientRect();
      // Ignore normal full-screen player wrappers. A popup/settings menu is smaller
      // than the complete viewport or explicitly identifies itself as a menu/dialog.
      return node.matches('dialog,[role="dialog"],[role="menu"],[role="listbox"],.vjs-menu,.vjs-menu-content,.plyr__menu__container,.shaka-settings-menu,.shaka-overflow-menu') ||
        rect.width < innerWidth * .92 || rect.height < innerHeight * .92;
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
      .find(node => visible(node));
    if (expanded) {
      expanded.click();
      return true;
    }

    // Provider UIs commonly use Escape to close resolution/settings popups.
    const target = document.activeElement || document;
    target.dispatchEvent(new KeyboardEvent('keydown', {key:'Escape', code:'Escape', bubbles:true, cancelable:true}));
    target.dispatchEvent(new KeyboardEvent('keyup', {key:'Escape', code:'Escape', bubbles:true, cancelable:true}));
    return true;
  }

  let sequence = 0;
  const waiters = new Map();

  function askChildren() {
    const frames = Array.from(document.querySelectorAll('iframe')).filter(visible);
    if (!frames.length) return Promise.resolve(false);

    const request = 'zmb-' + (++sequence) + '-' + Date.now();
    return new Promise(resolve => {
      let remaining = frames.length;
      let finished = false;
      const timer = setTimeout(() => finish(false), 220);

      function finish(value) {
        if (finished) return;
        finished = true;
        clearTimeout(timer);
        waiters.delete(request);
        resolve(value);
      }

      waiters.set(request, {
        reply(handled) {
          if (handled) return finish(true);
          remaining--;
          if (remaining <= 0) finish(false);
        }
      });

      frames.forEach(frame => {
        try {
          frame.contentWindow.postMessage({type:'zerostreams-mouse-back-query', request}, '*');
        } catch (_) {
          remaining--;
          if (remaining <= 0) finish(false);
        }
      });
    });
  }

  async function closeOneProviderFunction() {
    if (closeLocalMenu()) return true;
    return await askChildren();
  }

  window.__zeroMouseBackRequest = async token => {
    window.__zeroBackResult = null;
    const handled = await closeOneProviderFunction();
    window.__zeroBackResult = {token, handled};
  };

  window.addEventListener('message', async event => {
    const data = event.data;
    if (!data) return;

    if (data.type === 'zerostreams-mouse-back-query' && data.request) {
      const handled = await closeOneProviderFunction();
      try {
        event.source.postMessage({type:'zerostreams-mouse-back-result', request:data.request, handled}, '*');
      } catch (_) {}
      return;
    }

    if (data.type === 'zerostreams-mouse-back-result' && data.request) {
      const waiter = waiters.get(data.request);
      if (waiter) waiter.reply(data.handled === true);
    }
  });
})();
