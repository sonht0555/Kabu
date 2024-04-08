const CACHE_NAME = 'v1.0.3'
const urlsToCache = [
    './manifest.json',
    './index.html',
    './js/global.js',
    './js/nip.js',
    './js/mgba.js',
    './js/mgba.wasm',
    './js/kabu.js',
    './img/favi.png',
    './img/icon.png',
    './font/04b03b.ttf',
    './font/Tuson.ttf',
    './css/main.css',
];
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
        .then((cache) => {
            console.log('Opened cache');
            return cache.addAll(urlsToCache);
        })
    );
});
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
        .then((response) => {
            if (response) {
                return response;
            }
            const fetchRequest = event.request.clone();
            return fetch(fetchRequest)
                .then((response) => {
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME)
                        .then((cache) => {
                            cache.put(event.request, responseToCache);
                        });
                    return response;
                });
        })
    );
});
self.addEventListener('message', function(event) {
    if (event.data && event.data.command === 'clearCache') {
        console.log('Received clear cache command from client.');
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.map(function(cacheName) {
                    return caches.delete(cacheName);
                })
            );
        }).then(function() {
            console.log('All caches cleared successfully.');
        }).catch(function(error) {
            console.error('Failed to clear caches:', error);
        });
    }
});
