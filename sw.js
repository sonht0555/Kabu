importScripts('https://storage.googleapis.com/workbox-cdn/releases/5.1.2/workbox-sw.js');
workbox.precaching.precacheAndRoute([
  { url: '/', revision: null },
]);
workbox.routing.registerRoute(
  new workbox.routing.NavigationRoute(
    new workbox.strategies.NetworkFirst()
  )
);