/* ZeroPlay Lite player guard: intentionally minimal for low-end devices. */
(() => {
  if (window.__zeroLitePlayerGuard) return;
  window.__zeroLitePlayerGuard = true;

  // Low-complexity VidStuck skin for weak TV GPUs. Keep controls functional,
  // but strip costly blur, long transitions, shadows and decorative animation.
  try {
    const style = document.createElement('style');
    style.id = 'zeroplay-lite-player-skin';
    style.textContent = `
      html,body{background:#000!important;}
      *,*::before,*::after{
        animation-duration:.001ms!important;
        animation-delay:0s!important;
        animation-iteration-count:1!important;
        transition:none!important;
        scroll-behavior:auto!important;
      }
      [class*="control"],[class*="Control"],[class*="menu"],[class*="Menu"],
      [class*="overlay"],[class*="Overlay"],[role="toolbar"],[role="menu"],
      [role="dialog"],button,[role="button"]{
        -webkit-backdrop-filter:none!important;
        backdrop-filter:none!important;
        text-shadow:none!important;
      }
      [class*="control"],[class*="Control"],[class*="menu"],[class*="Menu"],
      [class*="overlay"],[class*="Overlay"],[role="toolbar"],[role="menu"],[role="dialog"]{
        box-shadow:none!important;
      }
      video{filter:none!important;box-shadow:none!important;}
    `;
    (document.head || document.documentElement).appendChild(style);
  } catch (_) {}

  if (window.ZeroProgress) window.addEventListener('message', event => {
    if (!['https://vidstuck.xyz','https://vidsrc.sh'].includes(event.origin)) return;
    try {
      let data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
      if (data && data.type === 'PLAYER_EVENT') {
        const p = data.data, info = p && p.player_info;
        data = info && info.tmdb ? {
          id: info.tmdb,
          type: info.mediaType,
          timestamp: p.player_progress,
          duration: p.player_duration,
          season: info.season,
          episode: info.episode
        } : null;
      }
      if (data && (data.type === 'movie' || data.type === 'tv') &&
          Number.isFinite(Number(data.timestamp)) && Number.isFinite(Number(data.duration))) {
        window.ZeroProgress.postMessage(JSON.stringify(data));
      }
    } catch (_) {}
  });

  // TV navigation is still supplied by tv-player-input.js after this guard.
  window.__zeroDismissQrAd = () => 0;
  window.__zeroRemoteActivity = () => {};
})();
