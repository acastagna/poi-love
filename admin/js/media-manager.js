/*
 * © Alessandro Castagna — 321.al / EVOLAB
 * Tutti i diritti riservati. Uso non autorizzato vietato.
 * info@321.al · https://321.al
 *
 * Media Manager: scelta immagini via UPLOAD o LIBRERIA (mai URL a mano). Ogni upload va a
 * media.poilove.com/upload.php (WebP lato server) e viene registrato in media_assets → così esiste
 * una libreria da cui riscegliere. window.POIMedia.pick({kind,onPick}) apre la modale; upload(file).
 */
(function () {
  var MEDIA_SERVER = 'https://media.poilove.com';
  function sb() { return window.sb || null; }
  function h(tag, attrs, kids) {
    var n = document.createElement(tag);
    if (attrs) for (var k in attrs) { if (k === 'class') n.className = attrs[k]; else if (k === 'text') n.textContent = attrs[k]; else if (k.slice(0, 2) === 'on' && typeof attrs[k] === 'function') n.addEventListener(k.slice(2), attrs[k]); else if (attrs[k] != null) n.setAttribute(k, attrs[k]); }
    if (kids) (Array.isArray(kids) ? kids : [kids]).forEach(function (c) { if (c == null) return; n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return n;
  }
  function toast(m, k) { if (window.toast) window.toast(m, k); }

  // Carica un file sul media server e lo registra in media_assets. Ritorna {url} o null.
  function upload(file, opts) {
    var db = sb(); if (!db) return Promise.resolve(null);
    return db.auth.getSession().then(function (s) {
      var jwt = s && s.data && s.data.session && s.data.session.access_token;
      var uid = (s && s.data && s.data.session && s.data.session.user && s.data.session.user.id) || null;
      if (!jwt) return null;
      var key = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : ('xxxxxxxx-xxxx-4xxx-8xxx-xxxxxxxxxxxx'.replace(/x/g, function () { return Math.floor(Math.random() * 16).toString(16); }));
      var fd = new FormData(); fd.append('poi_id', key); fd.append('photos[]', file, 'photo.jpg');
      return fetch(MEDIA_SERVER + '/upload.php', { method: 'POST', headers: { 'Authorization': 'Bearer ' + jwt }, body: fd })
        .then(function (r) { return r.json().catch(function () { return {}; }); })
        .then(function (j) {
          var url = j && j.ok && j.urls && j.urls[0]; if (!url) return null;
          try { db.from('media_assets').insert({ owner_id: uid, url: url, kind: (opts && opts.kind) || 'generic', source: 'upload' }).then(function () {}); } catch (e) {}
          return { url: url };
        }).catch(function () { return null; });
    });
  }

  function ensureStyles() {
    if (document.getElementById('mm-styles')) return;
    var css = ''
      + '.mm-ovl{position:fixed;inset:0;background:rgba(0,0,0,.6);backdrop-filter:blur(4px);z-index:920;display:flex;align-items:center;justify-content:center;padding:18px}'
      + '.mm-mod{width:640px;max-width:100%;max-height:88vh;display:flex;flex-direction:column;background:var(--bg-base,#161310);border:1px solid var(--line,#333);border-radius:18px;overflow:hidden;color:var(--paper,#eee)}'
      + '.mm-head{display:flex;align-items:center;gap:12px;padding:14px 18px;border-bottom:1px solid var(--line,#333)}.mm-head h3{font-size:15px;font-weight:800;flex:1}'
      + '.mm-x{background:none;border:none;color:var(--muted,#999);font-size:22px;cursor:pointer}'
      + '.mm-tabs{display:flex;gap:6px;padding:12px 18px 0}.mm-tab{border:1px solid var(--line,#333);background:transparent;color:var(--muted,#999);border-radius:10px;padding:8px 14px;font-weight:700;font-size:12.5px;cursor:pointer;font-family:inherit}.mm-tab.on{background:var(--gold,#E8B04B);color:#161310;border-color:var(--gold,#E8B04B)}'
      + '.mm-body{padding:16px 18px;overflow:auto}'
      + '.mm-drop{border:2px dashed var(--line,#444);border-radius:14px;padding:30px;text-align:center;color:var(--muted,#999);cursor:pointer;transition:border-color .15s}.mm-drop:hover,.mm-drop.over{border-color:var(--gold,#E8B04B);color:var(--paper,#eee)}'
      + '.mm-drop i{font-size:34px;display:block;margin-bottom:8px;color:var(--gold,#E8B04B)}'
      + '.mm-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}@media(max-width:560px){.mm-grid{grid-template-columns:repeat(3,1fr)}}'
      + '.mm-thumb{aspect-ratio:1;border-radius:10px;overflow:hidden;cursor:pointer;border:2px solid transparent;background:#222}.mm-thumb:hover{border-color:var(--gold,#E8B04B)}.mm-thumb img{width:100%;height:100%;object-fit:cover}'
      + '.mm-empty{color:var(--muted,#999);font-size:13px;text-align:center;padding:20px}'
      + '.mm-searchrow{display:flex;gap:8px;align-items:center}'
      + '.mm-search{flex:1;padding:9px 12px;border:1px solid var(--line,#333);border-radius:10px;background:var(--field-bg,#111);color:var(--paper,#eee);font-family:inherit;font-size:13.5px;box-sizing:border-box}';
    var st = document.createElement('style'); st.id = 'mm-styles'; st.textContent = css; document.head.appendChild(st);
  }

  function close() { var o = document.getElementById('mm-ovl'); if (o) o.remove(); }

  function pick(opts) {
    opts = opts || {}; ensureStyles();
    var onPick = opts.onPick || function () {};
    function done(url, meta) { close(); onPick(url, meta || {}); }

    var body = h('div', { class: 'mm-body' });
    var tabCarica = h('button', { class: 'mm-tab', text: 'Carica' });
    var tabMedia = h('button', { class: 'mm-tab', text: 'Media POI•LOVE' });
    var tabOnline = h('button', { class: 'mm-tab', text: 'Cerca online' });
    function setTab(t) { [tabCarica, tabMedia, tabOnline].forEach(function (b) { b.classList.remove('on'); }); t.classList.add('on'); }

    function pickGrid(items) {
      // items: array di {url, thumb}
      body.innerHTML = '';
      if (!items.length) { body.innerHTML = '<div class="mm-empty">Nessuna immagine.</div>'; return; }
      var grid = h('div', { class: 'mm-grid' });
      items.forEach(function (it) { grid.appendChild(h('div', { class: 'mm-thumb', onclick: function () { done(it.url); } }, h('img', { src: it.thumb || it.url, alt: '', loading: 'lazy' }))); });
      body.appendChild(grid);
    }

    // 1) CARICA dal computer
    function showCarica() {
      setTab(tabCarica);
      body.innerHTML = '';
      var drop = h('div', { class: 'mm-drop' }, [h('i', { class: 'ph-duotone ph-upload-simple' }), h('div', { text: 'Trascina qui una foto o clicca per sceglierla' })]);
      var inp = h('input', { type: 'file', accept: 'image/*', style: 'display:none' });
      function go(file) {
        if (!file) return; drop.innerHTML = '<i class="ph-duotone ph-circle-notch"></i><div>Carico…</div>';
        // leggo i dati geografici (GPS EXIF) del file, se presenti, PRIMA della compressione server (che li toglie)
        var gpsP = (typeof exifr !== 'undefined' && exifr.gps) ? exifr.gps(file).catch(function () { return null; }) : Promise.resolve(null);
        Promise.all([upload(file, { kind: opts.kind }), gpsP]).then(function (arr) {
          var r = arr[0], gps = arr[1]; var meta = {};
          if (gps && gps.latitude != null) meta.gps = { lat: gps.latitude, lng: gps.longitude };
          if (r && r.url) done(r.url, meta); else { toast('Caricamento non riuscito', 'err'); showCarica(); }
        });
      }
      drop.addEventListener('click', function () { inp.click(); });
      inp.addEventListener('change', function () { go(inp.files && inp.files[0]); });
      drop.addEventListener('dragover', function (e) { e.preventDefault(); drop.classList.add('over'); });
      drop.addEventListener('dragleave', function () { drop.classList.remove('over'); });
      drop.addEventListener('drop', function (e) { e.preventDefault(); drop.classList.remove('over'); go(e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]); });
      body.appendChild(drop); body.appendChild(inp);
    }

    // 2) MEDIA POI•LOVE: le immagini VERE del frontend (foto dei POI) + inventario media_assets
    function showMedia() {
      setTab(tabMedia);
      body.innerHTML = '<div class="mm-empty">Carico le immagini di POI•LOVE…</div>';
      var db = sb(); if (!db) { body.innerHTML = '<div class="mm-empty">Non disponibile</div>'; return; }
      Promise.all([
        db.from('pois').select('photos').not('photos', 'is', null).order('created_at', { ascending: false }).limit(90),
        db.from('media_assets').select('url').order('created_at', { ascending: false }).limit(40)
      ]).then(function (res) {
        var seen = {}, items = [];
        function add(u) { if (u && /^https?:\/\//.test(u) && !seen[u]) { seen[u] = 1; items.push({ url: u }); } }
        ((res[0] && res[0].data) || []).forEach(function (r) { (r.photos || []).forEach(add); });
        ((res[1] && res[1].data) || []).forEach(function (r) { add(r.url); });
        if (!items.length) { body.innerHTML = '<div class="mm-empty">Ancora nessuna immagine sul frontend. Caricane una dalla scheda Carica o cercala online.</div>'; return; }
        pickGrid(items.slice(0, 150));
      }).catch(function () { body.innerHTML = '<div class="mm-empty">Errore nel caricare i media</div>'; });
    }

    // 3) CERCA ONLINE: foto reali libere (Openverse: Unsplash/Flickr/Wikimedia) + genera con AI (Pollinations)
    function showOnline() {
      setTab(tabOnline);
      body.innerHTML = '';
      var q = h('input', { class: 'mm-search', type: 'text', placeholder: 'Cerca: es. ristorante Tirana, spiaggia, hotel…' });
      var aiBtn = h('button', { class: 'mm-tab', text: '✨ Genera con AI' });
      var hint = h('div', { class: 'mm-empty', text: 'Scrivi e premi Invio: foto reali e libere. Oppure generane una con l\'AI.' });
      var grid = h('div', { class: 'mm-grid', style: 'margin-top:10px' });
      function runSearch() {
        var term = (q.value || '').trim(); if (!term) return; grid.innerHTML = ''; hint.textContent = 'Cerco…';
        fetch('https://api.openverse.org/v1/images/?q=' + encodeURIComponent(term) + '&page_size=20&license_type=commercial')
          .then(function (r) { return r.json(); }).then(function (d) {
            var rows = (d && d.results) || []; grid.innerHTML = ''; hint.textContent = rows.length ? '' : 'Nessun risultato: prova a generarla con l\'AI.';
            rows.forEach(function (it) { var u = it.url; if (!u) return; grid.appendChild(h('div', { class: 'mm-thumb', onclick: function () { done(u); } }, h('img', { src: u, alt: '', loading: 'lazy', onerror: function () { this.parentNode.style.display = 'none'; } }))); });
          }).catch(function () { hint.textContent = 'Ricerca non riuscita, riprova.'; });
      }
      function runAI() {
        var term = (q.value || '').trim(); if (!term) { hint.textContent = 'Scrivi prima cosa vuoi generare.'; return; }
        grid.innerHTML = ''; hint.textContent = 'L\'AI sta dipingendo alcune varianti…';
        var base = Date.now();
        for (var i = 0; i < 6; i++) { (function (seed) { var u = 'https://image.pollinations.ai/prompt/' + encodeURIComponent(term) + '?width=800&height=600&nologo=true&seed=' + seed; grid.appendChild(h('div', { class: 'mm-thumb', onclick: function () { done(u); } }, h('img', { src: u, alt: '', loading: 'lazy' }))); })(base + i * 911); }
      }
      q.addEventListener('keydown', function (e) { if (e.key === 'Enter') runSearch(); });
      aiBtn.addEventListener('click', runAI);
      body.appendChild(h('div', { class: 'mm-searchrow' }, [q, aiBtn]));
      body.appendChild(hint); body.appendChild(grid);
      setTimeout(function () { q.focus(); }, 30);
    }

    tabCarica.addEventListener('click', showCarica);
    tabMedia.addEventListener('click', showMedia);
    tabOnline.addEventListener('click', showOnline);

    var mod = h('div', { class: 'mm-mod' }, [
      h('div', { class: 'mm-head' }, [h('h3', { text: 'Scegli un\'immagine' }), h('button', { class: 'mm-x', text: '×', onclick: close })]),
      h('div', { class: 'mm-tabs' }, [tabCarica, tabMedia, tabOnline]),
      body
    ]);
    var ovl = h('div', { class: 'mm-ovl', id: 'mm-ovl', onclick: function (e) { if (e.target === ovl) close(); } }, [mod]);
    document.body.appendChild(ovl);
    showMedia(); // apre direttamente sui media reali di POI•LOVE
  }

  window.POIMedia = { upload: upload, pick: pick };
})();
