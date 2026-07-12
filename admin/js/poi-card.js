/*
 * © Alessandro Castagna — 321.al / EVOLAB
 * Tutti i diritti riservati. Uso non autorizzato vietato.
 * info@321.al · https://321.al
 *
 * A1 — Scheda POI riusabile, IDENTICA a quella dell'app. window.AdminPoiCard.open(poi) apre un
 * drawer con la card in stile app (foto, fascia rossa col titolo, indirizzo+coordinate, descrizione,
 * cuori, autore) + le azioni admin (Modifica ricco, Pubblica, Rimuovi, Badge/Assegnazione).
 * Le azioni riusano le funzioni già nel pannello (editPoi, approvePoi, softDeletePoi) e AdminBadge.
 * Richiamabile da: Dashboard (ultimi POI), POI creati, Copilota. Un solo componente per tutti.
 */
(function () {
  function h(tag, attrs, kids) {
    var n = document.createElement(tag);
    if (attrs) for (var k in attrs) {
      if (k === 'class') n.className = attrs[k];
      else if (k === 'text') n.textContent = attrs[k];
      else if (k === 'html') n.innerHTML = attrs[k];
      else if (k.slice(0, 2) === 'on' && typeof attrs[k] === 'function') n.addEventListener(k.slice(2), attrs[k]);
      else if (attrs[k] != null) n.setAttribute(k, attrs[k]);
    }
    if (kids) (Array.isArray(kids) ? kids : [kids]).forEach(function (c) { if (c == null) return; n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return n;
  }
  function safeImg(u) { return /^https?:\/\//i.test(u || '') ? u : ''; }
  function esc(s) { return String(s == null ? '' : s); }
  function authorName(p) { if (!p) return '—'; if (p.author && p.author.username) return p.author.username; if (typeof p.author === 'string') return p.author; return '—'; }

  function close() {
    var ov = document.getElementById('apc-ov'); if (!ov) return;
    ov.classList.remove('on'); setTimeout(function () { if (ov.parentNode) ov.parentNode.removeChild(ov); }, 220);
  }

  function photoStrip(p) {
    var photos = (Array.isArray(p.photos) ? p.photos : []).map(safeImg).filter(Boolean);
    if (!photos.length && safeImg(p.cover_photo)) photos = [p.cover_photo];
    photos = photos.slice(0, 3);
    var strip = h('div', { class: 'pdm-photos n' + photos.length });
    photos.forEach(function (u) { strip.appendChild(h('div', { class: 'pdm-photo-slot' }, h('img', { src: u, alt: '', loading: 'lazy' }))); });
    var total = (Array.isArray(p.photos) ? p.photos.length : 0);
    if (total > 3) strip.appendChild(h('div', { class: 'pdm-photo-counter', text: total + ' foto' }));
    return strip;
  }

  function open(p) {
    if (!p) return;
    close();
    var lat = p.lat, lng = p.lng, hasCoord = (lat != null && lng != null);
    var addr = p.address || [p.city, p.country].filter(Boolean).join(', ') || 'Indirizzo non indicato';
    var cat = p.category || 'Luogo';
    var tags = Array.isArray(p.tags) ? p.tags.filter(Boolean) : [];
    var cats = Array.isArray(p.categories) ? p.categories.filter(Boolean) : [];
    var desc = p.description || '';
    var au = authorName(p);

    // ── stato ──
    var stateWrap = h('div', { class: 'apc-state' });
    if (p.removed_at) stateWrap.appendChild(h('span', { class: 'apc-chip red', text: 'Rimosso' }));
    else if (p.is_approved === false) stateWrap.appendChild(h('span', { class: 'apc-chip gold', text: 'Bozza' }));
    else stateWrap.appendChild(h('span', { class: 'apc-chip green', text: 'Pubblicato' }));
    if (p.visibility === 'official') stateWrap.appendChild(h('span', { class: 'apc-chip dim', text: 'Ufficiale' }));
    if (p.created_via === 'ai') stateWrap.appendChild(h('span', { class: 'apc-chip dim', text: 'AI' }));

    // ── tag della fascia rossa: categoria + eventuali altre categorie + tag ──
    var heroTags = h('div', { class: 'pdm-hero-tags' });
    heroTags.appendChild(h('span', { class: 'pdm-hero-tag' }, [h('i', { class: 'ph-duotone ph-tag' }), document.createTextNode(' ' + cat)]));
    cats.forEach(function (c) { if (c && c !== cat) heroTags.appendChild(h('span', { class: 'pdm-hero-tag', text: c })); });
    tags.slice(0, 6).forEach(function (t) { heroTags.appendChild(h('span', { class: 'pdm-hero-tag', text: '#' + t })); });

    // ── card in stile app ──
    var card = h('div', { class: 'apc' }, [
      photoStrip(p),
      stateWrap,
      h('div', { class: 'pdm-white-section' }, [
        h('div', { class: 'pdm-meta-row' }, [h('i', { class: 'ph-duotone ph-map-pin' }), h('span', { text: addr })]),
        hasCoord ? h('div', { class: 'pdm-meta-row coords' }, [
          h('i', { class: 'ph-duotone ph-crosshair-simple' }),
          h('span', null, [document.createTextNode(lat + ', ' + lng + '  '),
            h('a', { href: 'https://www.google.com/maps?q=' + lat + ',' + lng, target: '_blank', rel: 'noopener', text: 'Mappa' })])
        ]) : null
      ]),
      h('div', { class: 'pdm-hero' }, [
        h('h2', { class: 'pdm-hero-title', text: p.title || '—' }),
        heroTags,
        h('p', { class: 'pdm-hero-desc' + (desc ? '' : ' empty'), text: desc || 'Nessuna descrizione' })
      ]),
      h('div', { class: 'pdm-love-row' }, [h('i', { class: 'ph-duotone ph-heart' }), document.createTextNode(' ' + (p.love_count || 0) + ' cuori')]),
      h('div', { class: 'pdm-author' }, [
        h('div', { class: 'pdm-author-avatar', text: (au[0] || '?').toUpperCase() }),
        h('div', null, [h('div', { class: 'pdm-author-name', text: '@' + au }), h('div', { class: 'pdm-author-meta', text: 'Autore del luogo' })])
      ])
    ]);

    // ── azioni admin ──
    var admin = h('div', { class: 'apc-admin' });
    admin.appendChild(h('div', { class: 'apc-admin-lbl', text: 'Azioni amministratore' }));
    var actions = h('div', { class: 'apc-actions' });
    actions.appendChild(h('button', { class: 'apc-btn blue', text: 'Modifica', onclick: function () { if (window.editPoi) { close(); window.editPoi(p); } } }));
    if (p.is_approved === false && !p.removed_at) actions.appendChild(h('button', { class: 'apc-btn green', text: 'Pubblica', onclick: function () { if (window.approvePoi) { window.approvePoi(p.id); close(); } } }));
    if (!p.removed_at) actions.appendChild(h('button', { class: 'apc-btn red', text: 'Rimuovi', onclick: function () { if (window.softDeletePoi) { window.softDeletePoi(p.id, p.title); close(); } } }));
    admin.appendChild(actions);

    // ── badge + assegnazione (componente A3) ──
    if (window.AdminBadge) {
      var bpBox = h('div', null);
      admin.appendChild(bpBox);
      var picker = window.AdminBadge.mount(bpBox, { badge_ids: Array.isArray(p.badge_ids) ? p.badge_ids : [], tier: p.badge_tier || '', assigned: null });
      admin.appendChild(h('div', { style: 'margin-top:8px' }, h('button', {
        class: 'apc-btn', text: 'Salva badge e assegnazione', onclick: function (e) {
          var btn = e.currentTarget; btn.disabled = true; btn.textContent = 'Salvo…';
          picker.save('poi', p.id).then(function (r) {
            btn.disabled = false; btn.textContent = r.ok ? 'Salvato ✓' : 'Errore';
            if (r.ok && window.toast) window.toast('Badge aggiornato', 'ok');
            else if (!r.ok && window.toast) window.toast(r.error || 'Errore', 'err');
          });
        }
      })));
    }

    var drawer = h('div', { class: 'apc-drawer' }, [
      h('div', { class: 'apc-close' }, h('button', { text: '×', title: 'Chiudi', onclick: close })),
      card, admin
    ]);
    var ov = h('div', { class: 'apc-ov', id: 'apc-ov', onclick: function (e) { if (e.target === ov) close(); } }, [drawer]);
    document.body.appendChild(ov);
    requestAnimationFrame(function () { ov.classList.add('on'); });
    document.addEventListener('keydown', function esc(e) { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc); } });
  }

  window.AdminPoiCard = { open: open, close: close };
})();
