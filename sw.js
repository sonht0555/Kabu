importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.1.0/workbox-sw.js');
workbox.setConfig({ debug: false });
let revision = '57';
revision = (parseInt(revision) + 1).toString();

workbox.precaching.precacheAndRoute([
  { url: './css/main.css', revision: revision },
  { url: './font/04b.ttf', revision: revision },
  { url: './font/04bf.ttf', revision: revision },
  { url: './font/Tuson.ttf', revision: revision },
  { url: './img/favi.png', revision: revision },
  { url: './img/icon.png', revision: revision },
  { url: './js/cloud.js', revision: revision },
  { url: './js/global.js', revision: revision },
  { url: './js/kabu.js', revision: revision },
  { url: './js/mgba.js', revision: revision },
  { url: './js/mgba.wasm', revision: revision },
  { url: './js/nip.js', revision: revision },
  { url: './sw.js', revision: revision },
  { url: './index.html', revision: revision },
  { url: './manifest.json', revision: revision },
]);
if (navigator.onLine) {
workbox.routing.registerRoute(
  /\.(?:css|ttf|png|js|wasm|html|json)$/,
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: 'static-resources',
  })
);
} else {
  workbox.routing.registerRoute(
    /\.(?:css|ttf|png|js|wasm|html|json)$/,
    new workbox.strategies.CacheFirst({
      cacheName: 'static-resources',
    })
  );
}


