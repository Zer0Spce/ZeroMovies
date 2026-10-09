/* ZeroPlay Lite player guard: intentionally minimal for low-end devices. */
(() => {
  if (window.__zeroLitePlayerGuard) return;
  window.__zeroLitePlayerGuard = true;

  // Keep watched/progress reporting without the full DOM scanners used by the
  // standard build. Network/domain ad blocking remains native in WebView.
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

  // Compatibility hooks expected by the native player. They deliberately avoid
  // MutationObservers, shadow-root scans, QR image scans and recurring DOM work.
  window.__zeroDismissQrAd = () => 0;
  window.__zeroRemoteActivity = () => {};
})();
