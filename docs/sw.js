let revision = 'V2.24';
importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.1.0/workbox-sw.js');
workbox.setConfig({ debug: false });
revision = (parseInt(revision) + 1).toString();
workbox.precaching.precacheAndRoute([
  { url: './src/css/main.css', revision: revision },
  { url: './src/font/04b.ttf', revision: revision },
  { url: './src/font/04bf.ttf', revision: revision },
  { url: './src/font/Tuson.ttf', revision: revision },
  { url: './img/favi.png', revision: revision },
  { url: './img/icon.png', revision: revision },
  { url: './src/js/cloud.js', revision: revision },
  { url: './src/js/gamepad.js', revision: revision },
  { url: './src/js/global.js', revision: revision },
  { url: './src/js/main.js', revision: revision },
  { url: './src/js/ocr.js', revision: revision },
  { url: './src/js/setting.js', revision: revision },
  { url: './src/js/state.js', revision: revision },
  { url: './src/js/storage.js', revision: revision },
  { url: './src/js/welcome.js', revision: revision },
  { url: './src/core/mgba.js', revision: revision },
  { url: './src/core/mgba.wasm', revision: revision },
  { url: './src/library/nip.js', revision: revision },
  { url: './src/library/interact.js', revision: revision },
  { url: './sw.js', revision: revision },
  { url: './index.html', revision: revision },
  { url: './manifest.json', revision: revision },
]);
workbox.routing.registerRoute(
  /\.(?:css|ttf|png|js|wasm|html|json)$/,
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: 'static-resources',
  })
);
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'DELETE_CACHE') {
    if (navigator.onLine) {
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            return caches.delete(cacheName);
          })
        );
      })
    }
  }
});