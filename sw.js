let revision = 'V3.09';
var urlsToCache = [
    '/',
    './src/css/main.css',
    './src/font/04b.ttf',
    './src/font/04bf.woff',
    './src/font/Tuson.ttf',
    './img/favi.png',
    './img/icon.png',
    './src/js/cloud.js',
    './src/js/gamepad.js',
    './src/js/global.js',
    './src/js/main.js',
    './src/js/ocr.js',
    './src/js/setting.js',
    './src/js/state.js',
    './src/js/storage.js',
    './src/js/welcome.js',
    './src/core/mgba.js',
    './src/core/mgba.wasm',
    './src/library/nip.js',
    './src/library/interact.js',
    './sw.js',
    './index.html',
    './manifest.json',
];

self.addEventListener('install', function (event) {
    postMsg({msg:'Updating'});
    var urlsAddVersion = urlsToCache.map(function (url) {
        return url + '?ver=' + revision
    });
    event.waitUntil(
        caches.open(revision)
            .then(function (cache) {
                return cache.addAll(urlsAddVersion);
            }).then(() => {
                self.skipWaiting()
            })
    );
});

self.addEventListener('fetch', function (event) {
    event.respondWith(
        caches.match(event.request, {
            ignoreSearch: true
        }).then(function (response) {
            if (response) {
                return response;
            }
            return fetch(event.request);
        })
    );
});

self.addEventListener('activate', function (event) {
    var cacheAllowlist = [revision];
    event.waitUntil(
        caches.keys().then(function (cacheNames) {
            return Promise.all(
                cacheNames.map(function (cacheName) {
                    if (cacheAllowlist.indexOf(cacheName) === -1) {
                        console.log(cacheName)
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    postMsg({msg:'Updated'})
});

function postMsg(obj) {
    clients.matchAll({ includeUncontrolled: true, type: 'window' }).then((arr) => {
        for (client of arr) {
            client.postMessage(obj);
        }
    })
}