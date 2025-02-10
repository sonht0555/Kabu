let revision = 'V2.53';
importScripts('https://cdnjs.cloudflare.com/ajax/libs/workbox-sw/7.3.0/workbox-sw.js');
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
  async ({ request }) => {
    const cache = await caches.open('static-resources');
    try {
      const response = await fetch(request, { cache: 'no-store' });
      if (!response.ok) throw new Error(`Failed to fetch: ${request.url}`);
      await cache.put(request, response.clone());
      return response;
    } catch (error) {
      console.warn(`Không thể tải ${request.url}, dùng cache cũ.`);
      return cache.match(request);
    }
  }
);

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'DELETE_CACHE') {
    fetch('/ping')
      .then(() => {
        caches.keys()
          .then((cacheNames) => {
            return Promise.all(
              cacheNames.map((cacheName) => caches.delete(cacheName))
            );
          })
          .then(() => {
            console.log('Cache deleted successfully.');
          })
          .catch((error) => {
            console.error('Error deleting cache:', error);
          });
      })
      .catch(() => {
        console.warn('Cannot delete cache: No internet connection.');
      });
  }
});