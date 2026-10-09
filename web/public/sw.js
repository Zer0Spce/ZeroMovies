'use strict';
const CACHE='zeroplay-web-2.1.2-shell-v3';
const SHELL=['/','/index.html','/style.css','/layouts.css','/enhancements.css','/playback-sources.js','/web-native.js','/browser.js','/layouts.js','/app.js','/web-fixes.js','/infinite-scroll.js','/web-enhancements.js','/manifest.json','/assets/icon.png','/assets/tmdb-logo.svg'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('zeroplay-web-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{
  const request=event.request;if(request.method!=='GET')return;
  const url=new URL(request.url);if(url.origin!==self.location.origin||url.pathname.startsWith('/api/'))return;
  if(request.mode==='navigate'){
    event.respondWith(fetch(request).then(response=>{const copy=response.clone();caches.open(CACHE).then(cache=>cache.put('/index.html',copy));return response;}).catch(()=>caches.match('/index.html')));return;
  }
  event.respondWith(caches.match(request).then(cached=>{const update=fetch(request).then(response=>{if(response.ok)caches.open(CACHE).then(cache=>cache.put(request,response.clone()));return response;}).catch(()=>cached);return cached||update;}));
});
