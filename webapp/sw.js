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

/* La spia diagnostica (22/08): ogni fase viene segnata sul diario del
   server, cosi' si vede DAL VIVO se la push arriva al telefono e cosa
   le succede. Nessun dato personale: fase, versione, ora. */
var SW_VER = '5.74';
function _spia(fase) {
  try { return fetch('https://poilove.com/sw-diario.php?fase=' + fase + '&v=' + SW_VER, { cache: 'no-store' }).catch(function(){}); }
  catch (_) { return Promise.resolve(); }
}

self.addEventListener('install', function () { _spia('installato'); self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });

self.addEventListener('push', function (event) {
  var d = {};
  try { d = event.data ? event.data.json() : {}; } catch (_) {}
  event.waitUntil((async function () {
    await _spia(event.data ? 'ricevuta' : 'ricevuta_vuota');
    // REGOLA DI APPLE, imparata a spese nostre il 22/08: su iPhone ogni
    // push DEVE mostrare un avviso. Se il ricevitore ne zittisce qualcuna,
    // iOS conta i silenzi e stacca la spina al sito intero. Quindi sui
    // dispositivi Apple si mostra SEMPRE; il silenziatore (niente doppio
    // squillo quando l'app e' davanti) resta solo dove e' tollerato.
    var sub = await self.registration.pushManager.getSubscription();
    var apple = sub && sub.endpoint.indexOf('web.push.apple.com') >= 0;
    if (!apple) {
      var schede = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      var davanti = schede.some(function (c) { return c.focused === true; });
      if (davanti) return;
    }
    try {
      await self.registration.showNotification(d.title || 'POI•LOVE', {
        body: d.body || '',
        icon: '/img/illi-trasparente-500.png',
        badge: '/img/illi-trasparente-500.png',
        tag: d.tag || 'poilove',
        data: { url: d.url || '/' }
      });
      await _spia('mostrata');
    } catch (e) {
      await _spia('errore_mostra');
      throw e;
    }
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
