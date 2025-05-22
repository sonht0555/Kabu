let revision = 'V6.77';
var urlsToCache = [
    '/',
    './README.md',
    './_headers',
    './index.html',
    './manifest.json',
    './src/core/4.0.9/mgba.js',
    './src/core/4.0.9/mgba.wasm',
    './src/core/4.0.8/mgba.js',
    './src/core/4.0.8/mgba.wasm',
    './src/css/main.css',
    './src/font/04b.ttf',
    './src/font/04bf.woff',
    './src/font/mother.ttf',
    './src/img/favi.png',
    './src/img/icon.png',
    './src/js/cloud.js',
    './src/js/gamepad.js',
    './src/js/global.js',
    './src/js/main.js',
    './src/js/ocr.js',
    './src/js/setting.js',
    './src/js/shader.js',
    './src/js/state.js',
    './src/js/storage.js',
    './src/js/welcome.js',
    './src/library/interact.js',
    './src/library/nip.js',
    './sw.js'
];

self.addEventListener('install', function (event) {
    postMsg({msg:'Updating...'});
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