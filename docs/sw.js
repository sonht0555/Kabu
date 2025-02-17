let revision = 'V2.56';
importScripts('https://cdnjs.cloudflare.com/ajax/libs/workbox-sw/7.3.0/workbox-sw.js');
workbox.setConfig({ debug: false });
revision = (parseInt(revision) + 1).toString();

// IndexedDB Helper
const dbName = 'cacheDB';
const storeName = 'resources';

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, 1);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName, { keyPath: 'url' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveToDB(url, response) {
  const db = await openDB();
  const transaction = db.transaction(storeName, 'readwrite');
  const store = transaction.objectStore(storeName);
  store.put({ url, response: await response.clone().arrayBuffer() });
}

async function getFromDB(url) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(url);
    request.onsuccess = () => resolve(request.result ? new Response(request.result.response) : null);
    request.onerror = () => reject(request.error);
  });
}

workbox.precaching.precacheAndRoute([
  { url: './src/css/main.css', revision: revision },
  { url: './src/font/04b.ttf', revision: revision },
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
    const cachedResponse = await getFromDB(request.url);
    if (cachedResponse) return cachedResponse;
    
    const networkResponse = await fetch(request);
    saveToDB(request.url, networkResponse.clone());
    return networkResponse;
  }
);

self.addEventListener('message', async (event) => {
  if (event.data && event.data.type === 'DELETE_CACHE') {
    try {
      const response = await fetch('https://kabu.io.vn', { method: 'HEAD', cache: 'no-store' });
      if (response.ok) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
        const db = await openDB();
        const transaction = db.transaction(storeName, 'readwrite');
        transaction.objectStore(storeName).clear();
      }
    } catch (error) {}
  }
});