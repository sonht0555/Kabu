let revision = 'V4.81';
var urlsToCache = [
    '/',
    './README.md',
    './_headers',
    './img/favi.png',
    './img/icon.png',
    './img/textured.png',
    './index.html',
    './manifest.json',
    './server.py',
    './src/core/1.1.0/mgba.js',
    './src/core/1.1.0/mgba.wasm',
    './src/core/2.0.0/mgba.js',
    './src/core/2.0.0/mgba.wasm',
    './src/core/vba/vba.js',
    './src/core/vba/vba.wasm',
    './src/css/main.css',
    './src/font/04b.ttf',
    './src/font/04bf.woff',
    './src/font/Tuson.ttf',
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
    './src/lut/lut.py',
    './src/lut/lut64_cool_0.0.bin',
    './src/lut/lut64_cool_1.0.bin',
    './src/lut/lut64_cool_2.0.bin',
    './src/lut/lut64_cool_3.0.bin',
    './src/lut/lut64_cool_4.0.bin',
    './src/lut/lut64_neutral_0.0.bin',
    './src/lut/lut64_neutral_1.0.bin',
    './src/lut/lut64_neutral_2.0.bin',
    './src/lut/lut64_neutral_3.0.bin',
    './src/lut/lut64_neutral_4.0.bin',
    './src/lut/lut64_warm_0.0.bin',
    './src/lut/lut64_warm_1.0.bin',
    './src/lut/lut64_warm_2.0.bin',
    './src/lut/lut64_warm_3.0.bin',
    './src/lut/lut64_warm_4.0.bin',
    './src/lut/lut_gba.py',
    './src/shaders/fragmentShader.glsl',
    './src/shaders/vertexShader.glsl',
    './src/temp/main.c',
    './src/temp/main.js',
    './src/temp/mgba.js',
    './src/temp/mgba.wasm',
    './src/temp/scale.html',
    './src/temp/test.html',
    './sw.js',
    './three.html'
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