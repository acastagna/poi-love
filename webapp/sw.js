/**
 * © Alessandro Castagna — 321.al / EVOLAB
 * Tutti i diritti riservati. Uso non autorizzato vietato.
 * info@321.it · https://321.al
 *
 * Il ricevitore delle notifiche push di POI•LOVE.
 *
 * Fa UNA cosa sola: riceve la push spedita dalla macchina e la mostra come
 * avviso di sistema. Niente cache, niente gestione della rete: la trappola
 * della cache stantia (kill-switch del 08/05) non deve poter rinascere qui.
 * Se l'app e' davanti agli occhi non mostra nulla: in pagina suona gia'
 * la campanella, due squilli per lo stesso fatto sono uno di troppo.
 */

self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });

self.addEventListener('push', function (event) {
  var d = {};
  try { d = event.data ? event.data.json() : {}; } catch (_) {}
  event.waitUntil((async function () {
    var schede = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    var davanti = schede.some(function (c) { return c.visibilityState === 'visible'; });
    if (davanti) return;
    await self.registration.showNotification(d.title || 'POI•LOVE', {
      body: d.body || '',
      icon: '/img/illi-trasparente-500.png',
      badge: '/img/illi-trasparente-500.png',
      tag: d.tag || 'poilove',
      data: { url: d.url || '/' }
    });
  })());
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  var url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil((async function () {
    var schede = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    if (schede.length) { schede[0].focus(); return; }
    await self.clients.openWindow(url);
  })());
});
