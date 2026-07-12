/*
 * © Alessandro Castagna — 321.al / EVOLAB
 * Tutti i diritti riservati. Uso non autorizzato vietato.
 * info@321.al · https://321.al
 *
 * Scheda POI del pannello IDENTICA al frontend dell'app (foto, fascia rossa con titolo/categoria/badge,
 * indirizzo, descrizione, autore), con SOTTO i comandi da amministratore: Modifica, Badge, Affidamento a
 * un utente (@handle) oppure a ILLI (= proprietà del sistema), Pubblica/Sospendi/Elimina.
 * window.PoiFrontend.open(poi). Riusa la CSS pdm-* del frontend per essere fedele.
 */
(function () {
  function h(tag, attrs, kids) {
    var n = document.createElement(tag);
    if (attrs) for (var k in attrs) { if (k === 'class') n.className = attrs[k]; else if (k === 'html') n.innerHTML = attrs[k]; else if (k === 'text') n.textContent = attrs[k]; else if (k.slice(0, 2) === 'on' && typeof attrs[k] === 'function') n.addEventListener(k.slice(2), attrs[k]); else if (attrs[k] != null) n.setAttribute(k, attrs[k]); }
    if (kids) (Array.isArray(kids) ? kids : [kids]).forEach(function (c) { if (c == null) return; n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return n;
  }
  function sb() { return window.sb || null; }
  function toast(m, k) { if (window.toast) window.toast(m, k); }
  var _badges = null; // mappa id → badge

  function ensureStyles() {
    if (document.getElementById('pf-styles')) return;
    // CSS presa dal frontend (pdm-*) + wrapper modale. I colori seguono il brand.
    var css = ''
      + '.pf-ovl{position:fixed;inset:0;background:rgba(0,0,0,.6);backdrop-filter:blur(5px);z-index:930;display:flex;align-items:center;justify-content:center;padding:24px 16px;overflow:auto}'
      + '.pf-card{width:440px;max-width:100%;margin:auto;background:#EAE4D8;border-radius:26px;overflow:hidden;box-shadow:0 24px 70px rgba(0,0,0,.5);position:relative}'
      + '.pf-pen{background:rgba(255,255,255,.18);border:none;border-radius:7px;color:#fff;width:26px;height:26px;cursor:pointer;margin-left:8px;vertical-align:middle;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;font-size:13px}'
      + '.pf-edit-in,.pf-edit-ta{width:100%;border:none;border-radius:9px;padding:8px 11px;font-family:inherit;font-size:14px;background:rgba(255,255,255,.96);color:#222;box-sizing:border-box}'
      + '.pf-edit-ta{min-height:70px;resize:vertical;font-size:13.5px;line-height:1.45}'
      + '.pf-edit-row{display:flex;gap:6px;margin-top:6px}'
      + '.pf-mini{border:none;border-radius:8px;padding:7px 13px;cursor:pointer;font-family:inherit;font-size:13px;background:rgba(255,255,255,.22);color:#fff;display:inline-flex;align-items:center;gap:5px}.pf-mini.gold{background:#E8B04B;color:#161310;font-weight:800}'
      + '.pf-x{position:absolute;top:12px;right:12px;z-index:6;width:34px;height:34px;border-radius:50%;background:#fff;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:16px;color:#444;box-shadow:0 2px 14px rgba(0,0,0,.26)}'
      + '.pf-photos{display:flex;gap:3px;background:#1c1c1e;position:relative}'
      + '.pf-slot{background:#2a2a2c center/cover no-repeat;position:relative}'
      + '.pf-photos.n1 .pf-slot{flex:0 0 100%;aspect-ratio:16/9}'
      + '.pf-photos.n2 .pf-slot{flex:0 0 calc(50% - 2px);aspect-ratio:1}'
      + '.pf-photos.n3 .pf-slot{flex:0 0 calc(33.333% - 2px);aspect-ratio:1}'
      + '.pf-photos.n0{height:64px;background:#D42B2B;display:flex;align-items:center;justify-content:center;color:#fff;font-size:26px}'
      + '.pf-white{padding:14px 18px 10px;background:#EAE4D8}'
      + '.pf-meta{display:flex;align-items:flex-start;gap:9px;font-size:12.5px;color:#6b6257;margin-bottom:7px;line-height:1.5}'
      + '.pf-meta i{font-size:15px;flex-shrink:0;color:#D42B2B}.pf-meta span{flex:1;word-break:break-word}'
      + '.pf-hero{background:#D42B2B;padding:16px 18px 16px}'
      + '.pf-title{font-size:24px;font-weight:900;color:#fff;line-height:1.15;margin:0 0 10px;letter-spacing:-.4px}'
      + '.pf-tags{display:flex;flex-wrap:wrap;gap:7px;margin-bottom:8px}'
      + '.pf-tag{display:inline-flex;align-items:center;gap:5px;background:rgba(255,255,255,.2);border:1.5px solid rgba(255,255,255,.4);border-radius:20px;padding:5px 12px;font-size:11px;font-weight:800;color:#fff;letter-spacing:.2px}'
      + '.pf-tag.badge{border:none}'
      + '.pf-desc{color:#fff;opacity:.95;font-size:13.5px;line-height:1.45;white-space:pre-wrap;margin:4px 0 0}'
      + '.pf-author{display:flex;align-items:center;gap:9px;padding:12px 18px;background:#EAE4D8;border-top:1px solid rgba(0,0,0,.07)}'
      + '.pf-author img{width:34px;height:34px;border-radius:50%;object-fit:cover}'
      + '.pf-author .nm{font-weight:800;font-size:13.5px;color:#241f18}.pf-author .sub{font-size:11px;color:#8a8175}'
      + '.pf-love{margin-left:auto;display:flex;align-items:center;gap:5px;color:#D42B2B;font-weight:800;font-size:14px}'
      // ── zona admin ──
      + '.pf-admin{background:#161310;padding:14px 16px 16px;color:#F4ECE0}'
      + '.pf-admin-lbl{font-size:10.5px;font-weight:800;letter-spacing:.6px;text-transform:uppercase;color:#9a9184;margin:2px 0 9px;display:flex;align-items:center;gap:6px}'
      + '.pf-aff{background:#211d18;border:1px solid #37312a;border-radius:12px;padding:11px 12px;margin-bottom:12px}'
      + '.pf-aff-now{font-size:13px;font-weight:700;display:flex;align-items:center;gap:7px;color:#F4ECE0}'
      + '.pf-seg{display:flex;gap:6px;margin:9px 0}'
      + '.pf-seg button{flex:1;border:1px solid #37312a;background:transparent;color:#cdc4b6;border-radius:9px;padding:8px;font-weight:700;font-size:12.5px;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:6px}'
      + '.pf-seg button.on{background:#E8B04B;color:#161310;border-color:#E8B04B}'
      + '.pf-aff-search{position:relative}'
      + '.pf-aff-search input{width:100%;padding:8px 11px;border:1px solid #37312a;border-radius:9px;background:#161310;color:#F4ECE0;font-family:inherit;font-size:13px;box-sizing:border-box}'
      + '.pf-drop{position:absolute;left:0;right:0;top:calc(100% + 3px);background:#161310;border:1px solid #37312a;border-radius:9px;overflow:hidden;max-height:200px;overflow-y:auto;z-index:5;display:none}'
      + '.pf-drop.on{display:block}.pf-drop-i{padding:8px 11px;cursor:pointer;font-size:13px;display:flex;align-items:center;gap:7px}.pf-drop-i:hover{background:rgba(255,255,255,.06)}'
      + '.pf-badges-row{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0 12px}'
      + '.pf-bchip{display:inline-flex;align-items:center;gap:5px;border-radius:16px;padding:5px 10px;font-size:11.5px;font-weight:800;cursor:pointer;border:2px solid transparent;opacity:.55;background:#FDFAF5;color:#241f18}'
      + '.pf-bchip.on{opacity:1;box-shadow:0 0 0 2px rgba(232,176,75,.5)}'
      + '.pf-acts{display:flex;flex-wrap:wrap;gap:8px;margin-top:4px}'
      + '.pf-btn{flex:1;min-width:120px;border:1px solid #37312a;background:#211d18;color:#F4ECE0;border-radius:10px;padding:10px;font-weight:800;font-size:13px;cursor:pointer;font-family:inherit;display:inline-flex;align-items:center;justify-content:center;gap:7px}'
      + '.pf-btn.gold{background:#E8B04B;color:#161310;border-color:#E8B04B}.pf-btn.blue{background:#285EA7;color:#fff;border-color:#285EA7}.pf-btn.green{background:#1E7F52;color:#fff;border-color:#1E7F52}.pf-btn.red{background:#8E2C2C;color:#fff;border-color:#8E2C2C}';
    var st = document.createElement('style'); st.id = 'pf-styles'; st.textContent = css; document.head.appendChild(st);
  }
  function close() { var o = document.getElementById('pf-ovl'); if (o) o.remove(); }

  function loadBadges() {
    if (_badges) return Promise.resolve(_badges);
    var db = sb(); if (!db) return Promise.resolve({});
    return db.from('badges').select('id,name,icon,color,text_color,active').eq('active', true).order('sort').then(function (r) {
      _badges = {}; (r && r.data || []).forEach(function (b) { _badges[b.id] = b; }); return _badges;
    }).catch(function () { _badges = {}; return _badges; });
  }

  function catLabel(p) {
    // usa la stessa etichetta leggibile dell'admin se disponibile
    if (window._admFamLbl && p.category) { try { return window._admFamLbl(p.category); } catch (e) { } }
    return p.subcategory || p.category || 'Luogo';
  }

  function _o(k, v) { var o = {}; o[k] = v; return o; }
  // Campo correggibile sul posto: mostra il testo con una matita; alla matita diventa editabile e salva.
  function renderEditable(host, value, multiline, onSave) {
    host.innerHTML = '';
    var span = h('span', { text: value || (multiline ? '(aggiungi una descrizione)' : '—') });
    var pen = h('button', { class: 'pf-pen', html: '<i class="ph-duotone ph-pencil-simple"></i>', title: 'Correggi' });
    host.appendChild(span); host.appendChild(pen);
    pen.addEventListener('click', function () {
      host.innerHTML = '';
      var inp = multiline ? h('textarea', { class: 'pf-edit-ta' }) : h('input', { class: 'pf-edit-in', type: 'text' });
      inp.value = value || '';
      var save = h('button', { class: 'pf-mini gold', html: '<i class="ph-duotone ph-check"></i> Salva' });
      var cancel = h('button', { class: 'pf-mini', html: 'Annulla' });
      host.appendChild(inp); host.appendChild(h('div', { class: 'pf-edit-row' }, [save, cancel])); inp.focus();
      cancel.addEventListener('click', function () { renderEditable(host, value, multiline, onSave); });
      save.addEventListener('click', function () { var v = (inp.value || '').trim(); save.disabled = true; Promise.resolve(onSave(v)).then(function (ok) { if (ok !== false) { value = v; } renderEditable(host, value, multiline, onSave); }); });
    });
  }

  function open(poi) {
    ensureStyles();
    var db = sb(); var id = poi && poi.id;
    loadBadges().then(function () {
      if (db && id) {
        db.from('pois').select('*, profiles:author_id(username,avatar_url)').eq('id', id).maybeSingle().then(function (r) {
          var full = (r && r.data) ? r.data : (poi || {});
          if (full.assigned_user_id) {
            db.from('profiles').select('username').eq('id', full.assigned_user_id).maybeSingle().then(function (u) { full._assigned_username = (u && u.data && u.data.username) || null; _render(full); });
          } else _render(full);
        }).catch(function () { _render(poi || {}); });
      } else _render(poi || {});
    });
  }
  function _render(poi) {
    var p = poi || {};
    var photos = Array.isArray(p.photos) ? p.photos.filter(function (u) { return /^https?:\/\//i.test(u); }) : [];

    // ── FOTO ──
    var n = Math.min(3, photos.length);
    var photoWrap = h('div', { class: 'pf-photos n' + n });
    if (!n) photoWrap.appendChild(h('i', { class: 'ph-duotone ph-image' }));
    else photos.slice(0, 3).forEach(function (u, i) {
      var slot = h('div', { class: 'pf-slot' }); slot.style.backgroundImage = "url('" + String(u).replace(/'/g, '%27') + "')";
      slot.style.cursor = 'zoom-in'; slot.addEventListener('click', function () { if (window._photoLightbox) window._photoLightbox(u); });
      photoWrap.appendChild(slot);
    });

    // ── META (indirizzo + coordinate) ──
    var addrSpan = h('span', { text: p.address || '…' });
    if (!p.address && p.lat && p.lng) {
      fetch('https://nominatim.openstreetmap.org/reverse?lat=' + p.lat + '&lon=' + p.lng + '&format=json')
        .then(function (r) { return r.json(); }).then(function (d) { addrSpan.textContent = (d && d.display_name) ? d.display_name.split(',').slice(0, 3).join(',') : '—'; }).catch(function () { addrSpan.textContent = '—'; });
    }
    var coordTxt = (p.lat != null && p.lng != null) ? (Number(p.lat).toFixed(5) + ', ' + Number(p.lng).toFixed(5)) : '—';
    var white = h('div', { class: 'pf-white' }, [
      h('div', { class: 'pf-meta' }, [h('i', { class: 'ph-duotone ph-map-pin' }), addrSpan]),
      h('div', { class: 'pf-meta' }, [h('i', { class: 'ph-duotone ph-crosshair' }), h('span', { text: coordTxt })])
    ]);

    // ── FASCIA ROSSA: titolo + categoria + badge + descrizione ──
    var tags = h('div', { class: 'pf-tags' }, [h('span', { class: 'pf-tag', html: '<i class="ph-duotone ph-tag"></i> ' + String(catLabel(p)).replace(/</g, '&lt;') })]);
    // badge personalizzati
    (Array.isArray(p.badge_ids) ? p.badge_ids : []).forEach(function (id) {
      var b = _badges && _badges[id]; if (!b) return;
      tags.appendChild(h('span', { class: 'pf-tag badge', html: '<i class="ph-fill ph-' + (b.icon || 'seal-check') + '"></i> ' + String(b.name).replace(/</g, '&lt;'), style: 'background:' + b.color + ';color:' + (b.text_color || '#fff') }));
    });
    // titolo e descrizione CORREGGIBILI sul posto (matita → editabile → salva)
    function saveField(field, val) {
      var db = sb(); if (!db || !p.id) return Promise.resolve(false);
      return db.from('pois').update(_o(field, val || null)).eq('id', p.id).select('id').then(function (r) {
        if (r.error || !r.data || !r.data.length) { toast((r.error && r.error.message) || 'Nessuna riga aggiornata', 'err'); return false; }
        p[field] = val; toast('Corretto', 'ok'); if (window.reloadPois) window.reloadPois(); return true;
      }).catch(function () { toast('Errore', 'err'); return false; });
    }
    var titleEl = h('h2', { class: 'pf-title' }); renderEditable(titleEl, p.title || p.name || '', false, function (v) { return saveField('title', v); });
    var descEl = h('p', { class: 'pf-desc' }); renderEditable(descEl, p.description || '', true, function (v) { return saveField('description', v); });
    var hero = h('div', { class: 'pf-hero' }, [titleEl, tags, descEl]);

    // ── AUTORE + love ──
    var authorName = (p.profiles && p.profiles.username) || p._author_username || 'Anonimo';
    var author = h('div', { class: 'pf-author' }, [
      h('img', { src: (p.profiles && p.profiles.avatar_url) || ('https://ui-avatars.com/api/?name=' + encodeURIComponent(authorName) + '&background=D42B2B&color=fff&size=80'), alt: '' }),
      h('div', null, [h('div', { class: 'nm', text: authorName }), h('div', { class: 'sub', text: (p.visibility || '') })]),
      h('div', { class: 'pf-love' }, [h('i', { class: 'ph-fill ph-heart' }), h('span', { text: String(p.love_count || 0) })])
    ]);

    // ── ZONA ADMIN: affidamento + badge + azioni ──
    var admin = buildAdmin(p);

    var card = h('div', { class: 'pf-card' }, [
      h('button', { class: 'pf-x', html: '&times;', onclick: close }),
      photoWrap, white, hero, author, admin
    ]);
    var ovl = h('div', { class: 'pf-ovl', id: 'pf-ovl', onclick: function (e) { if (e.target === ovl) close(); } }, [card]);
    document.body.appendChild(ovl);
  }

  // Costruisce la zona admin: affidamento (utente/ILLI), badge, azioni.
  function buildAdmin(p) {
    var state = { assigned: p.assigned_user_id || null, assignedName: p._assigned_username || null, mode: p.assigned_user_id ? 'user' : 'illi', badgeIds: {} };
    (Array.isArray(p.badge_ids) ? p.badge_ids : []).forEach(function (id) { state.badgeIds[id] = true; });

    // Affidamento
    var affNow = h('div', { class: 'pf-aff-now' });
    function drawNow() {
      affNow.innerHTML = '';
      if (state.mode === 'illi' || !state.assigned) affNow.appendChild(h('span', { html: '<i class="ph-duotone ph-robot"></i> Affidato a <b>ILLI · sistema</b>' }));
      else affNow.appendChild(h('span', { html: '<i class="ph-duotone ph-user"></i> Affidato a <b>@' + String(state.assignedName || 'utente').replace(/</g, '&lt;') + '</b>' }));
    }
    drawNow();

    var searchWrap = h('div', { class: 'pf-aff-search', style: 'display:none' });
    var searchIn = h('input', { type: 'text', placeholder: 'Cerca @utente…', autocomplete: 'off' });
    var drop = h('div', { class: 'pf-drop' });
    searchWrap.appendChild(searchIn); searchWrap.appendChild(drop);
    var timer = null;
    searchIn.addEventListener('input', function () {
      clearTimeout(timer); var q = searchIn.value.trim().replace(/^@/, '');
      if (q.length < 2) { drop.classList.remove('on'); drop.innerHTML = ''; return; }
      timer = setTimeout(function () {
        var db = sb(); if (!db) return; drop.classList.add('on'); drop.innerHTML = '<div class="pf-drop-i">Cerco…</div>';
        db.from('profiles').select('id,username,avatar_url').ilike('username', '%' + q + '%').limit(6).then(function (r) {
          var rows = (r && r.data) || []; if (!rows.length) { drop.innerHTML = '<div class="pf-drop-i">Nessun utente</div>'; return; }
          drop.innerHTML = '';
          rows.forEach(function (u) {
            var it = h('div', { class: 'pf-drop-i', text: '@' + (u.username || '?') });
            it.addEventListener('mousedown', function (e) { e.preventDefault(); state.assigned = u.id; state.assignedName = u.username; state.mode = 'user'; searchIn.value = ''; drop.classList.remove('on'); drawNow(); });
            drop.appendChild(it);
          });
        });
      }, 260);
    });

    var segUser = h('button', { class: 'pf-seg-user', html: '<i class="ph-duotone ph-user"></i> Un utente' });
    var segIlli = h('button', { class: 'pf-seg-illi', html: '<i class="ph-duotone ph-robot"></i> ILLI · sistema' });
    function setMode(m) {
      state.mode = m;
      segUser.classList.toggle('on', m === 'user'); segIlli.classList.toggle('on', m === 'illi');
      searchWrap.style.display = m === 'user' ? 'block' : 'none';
      if (m === 'illi') { state.assigned = null; state.assignedName = null; drawNow(); }
    }
    segUser.addEventListener('click', function () { setMode('user'); });
    segIlli.addEventListener('click', function () { setMode('illi'); drawNow(); });
    var seg = h('div', { class: 'pf-seg' }, [segUser, segIlli]);
    segUser.classList.toggle('on', state.mode === 'user'); segIlli.classList.toggle('on', state.mode === 'illi');
    searchWrap.style.display = state.mode === 'user' ? 'block' : 'none';

    var affBox = h('div', { class: 'pf-aff' }, [affNow, seg, searchWrap]);

    // Badge (chip cliccabili dai badge definiti)
    var badgeRow = h('div', { class: 'pf-badges-row' }, [h('span', { class: 'pf-drop-i', text: 'Carico badge…' })]);
    loadBadges().then(function (map) {
      badgeRow.innerHTML = '';
      var arr = Object.keys(map || {}).map(function (k) { return map[k]; });
      if (!arr.length) { badgeRow.appendChild(h('a', { class: 'pf-drop-i', href: '#', text: 'Nessun badge: crealo nella sezione Badge', onclick: function (e) { e.preventDefault(); if (window.openSection) window.openSection('badges'); } })); return; }
      arr.forEach(function (b) {
        var on = !!state.badgeIds[b.id];
        var chip = h('span', { class: 'pf-bchip' + (on ? ' on' : ''), html: '<i class="ph-fill ph-' + (b.icon || 'seal-check') + '"></i> ' + String(b.name).replace(/</g, '&lt;'), style: 'background:' + b.color + ';color:' + (b.text_color || '#fff') });
        chip.addEventListener('click', function () { if (state.badgeIds[b.id]) delete state.badgeIds[b.id]; else state.badgeIds[b.id] = true; chip.classList.toggle('on', !!state.badgeIds[b.id]); });
        badgeRow.appendChild(chip);
      });
    });

    // Azioni
    var saveBtn = h('button', { class: 'pf-btn gold', html: '<i class="ph-duotone ph-check"></i> Salva badge e affidamento' });
    saveBtn.addEventListener('click', function () {
      var db = sb(); if (!db) return; saveBtn.disabled = true;
      var ids = Object.keys(state.badgeIds);
      db.rpc('admin_set_entity_badges', { p_entity: 'poi', p_id: p.id, p_badge_ids: ids, p_tier: null, p_assigned: state.mode === 'user' ? state.assigned : null })
        .then(function (r) { saveBtn.disabled = false; if (r.error) { toast(r.error.message || 'Errore', 'err'); return; } toast('Salvato', 'ok'); p.badge_ids = ids; p.assigned_user_id = state.mode === 'user' ? state.assigned : null; });
    });
    var editBtn = h('button', { class: 'pf-btn blue', html: '<i class="ph-duotone ph-pencil-simple"></i> Modifica' });
    editBtn.addEventListener('click', function () { close(); if (window.editPoi) window.editPoi(p); });

    var acts = h('div', { class: 'pf-acts' }, [editBtn, saveBtn]);
    // Pubblica / Sospendi
    if (p.is_approved === false && window.approvePoi) acts.appendChild(h('button', { class: 'pf-btn green', html: '<i class="ph-duotone ph-check-circle"></i> Pubblica', onclick: function () { window.approvePoi(p.id); close(); } }));
    if (window.softDeletePoi) acts.appendChild(h('button', { class: 'pf-btn red', html: '<i class="ph-duotone ph-eye-slash"></i> Sospendi', onclick: function () { window.softDeletePoi(p.id, p.title || p.name); close(); } }));

    return h('div', { class: 'pf-admin' }, [
      h('div', { class: 'pf-admin-lbl' }, [h('i', { class: 'ph-duotone ph-shield-star' }), document.createTextNode('Controllo amministratore')]),
      h('div', { class: 'pf-admin-lbl', style: 'margin-top:0', text: 'Affidamento' }), affBox,
      h('div', { class: 'pf-admin-lbl', style: 'margin-top:0', text: 'Badge' }), badgeRow,
      acts
    ]);
  }

  window.PoiFrontend = { open: open, loadBadges: loadBadges };
})();
