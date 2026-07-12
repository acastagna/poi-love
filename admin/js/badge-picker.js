/*
 * © Alessandro Castagna — 321.al / EVOLAB
 * Tutti i diritti riservati. Uso non autorizzato vietato.
 * info@321.al · https://321.al
 *
 * Selettore BADGE + ASSEGNAZIONE riusabile. I badge sono definiti nella sezione "Badge" (tabella
 * badges: nome, icona, colore sfondo, colore testo/icona, livello). Qui si sceglie QUALI applicare al
 * contenuto (chip colorati coi colori del badge), il livello e l'assegnazione a un utente. Salva via
 * la RPC admin_set_entity_badges. window.AdminBadge.mount(container, opts) → { getValues, save }.
 */
(function () {
  var TIERS = [
    { v: '', label: 'Nessun livello' },
    { v: 'professionista', label: 'Professionista' },
    { v: 'professionista_plus', label: 'Professionista Plus' },
    { v: 'sostenitore', label: 'Sostenitore' },
    { v: 'mecenate', label: 'Mecenate' },
    { v: 'influencer', label: 'Influencer' }
  ];
  function h(tag, attrs, kids) {
    var n = document.createElement(tag);
    if (attrs) for (var k in attrs) {
      if (k === 'class') n.className = attrs[k];
      else if (k === 'text') n.textContent = attrs[k];
      else if (k.slice(0, 2) === 'on' && typeof attrs[k] === 'function') n.addEventListener(k.slice(2), attrs[k]);
      else if (attrs[k] != null) n.setAttribute(k, attrs[k]);
    }
    if (kids) (Array.isArray(kids) ? kids : [kids]).forEach(function (c) { if (c == null) return; n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return n;
  }
  function client() { return (typeof window !== 'undefined' && window.sb) ? window.sb : null; }

  function ensureStyles() {
    if (document.getElementById('bp-styles')) return;
    var css = ''
      + '.badge-picker{border:1px solid rgba(0,0,0,.1);border-radius:14px;padding:14px;background:#FDFAF5;color:#241f18}'
      + '.bp-title{font-size:12px;font-weight:800;letter-spacing:.4px;text-transform:uppercase;color:#6B6B6B;margin-bottom:10px}'
      + '.bp-row{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px}'
      + '.bp-field{margin-bottom:12px}'
      + '.bp-lbl{display:block;font-size:11.5px;font-weight:700;color:#6B6B6B;margin-bottom:5px}'
      + '.bp-hint{font-size:11.5px;color:#8a8172}'
      + '.bp-select{width:100%;max-width:280px;background:#fff;color:#241f18;border:1px solid rgba(0,0,0,.14);border-radius:10px;padding:8px 10px;font-size:13px;font-family:inherit;cursor:pointer}'
      + '.bp-assigned{margin-bottom:6px}'
      + '.bp-chip{display:inline-flex;align-items:center;gap:6px;background:#F4EEDF;border:1px solid rgba(180,130,60,.4);color:#241f18;border-radius:20px;padding:4px 6px 4px 12px;font-size:12.5px;font-weight:700}'
      + '.bp-x{border:none;background:none;color:#6B6B6B;font-size:16px;line-height:1;cursor:pointer;padding:0 4px}'
      + '.bp-x:hover{color:#D42B2B}'
      + '.bp-search-wrap{position:relative;max-width:280px}'
      + '.bp-search{width:100%;background:#fff;color:#241f18;border:1px solid rgba(0,0,0,.14);border-radius:10px;padding:8px 10px;font-size:13px;font-family:inherit}'
      + '.bp-drop{position:absolute;left:0;right:0;top:calc(100% + 4px);background:#fff;border:1px solid rgba(0,0,0,.14);border-radius:10px;overflow:hidden;z-index:50;display:none;box-shadow:0 12px 30px rgba(0,0,0,.18)}'
      + '.bp-drop.on{display:block}'
      + '.bp-drop-i{padding:9px 12px;font-size:13px;color:#6B6B6B}'
      + '.bp-drop-i.pick{color:#241f18;cursor:pointer}'
      + '.bp-drop-i.pick:hover{background:#F4EEDF}'
      + '.bp-badge-chip{display:inline-flex;align-items:center;gap:6px;border-radius:20px;padding:7px 14px;font-size:12.5px;font-weight:800;font-family:inherit;cursor:pointer;border:2px solid transparent;opacity:.42;filter:grayscale(.3);transition:opacity .15s,filter .15s}'
      + '.bp-badge-chip.on{opacity:1;filter:none;box-shadow:0 2px 8px rgba(0,0,0,.18)}';
    var st = document.createElement('style'); st.id = 'bp-styles'; st.textContent = css; document.head.appendChild(st);
  }

  function mount(container, opts) {
    ensureStyles();
    opts = opts || {};
    var state = {
      badgeIds: {},                       // set di id badge applicati
      tier: opts.tier || '',
      assigned: opts.assigned || null
    };
    (Array.isArray(opts.badge_ids) ? opts.badge_ids : []).forEach(function (id) { if (id) state.badgeIds[id] = true; });

    container.innerHTML = '';
    container.classList.add('badge-picker');
    container.appendChild(h('div', { class: 'bp-title', text: 'Badge e assegnazione' }));

    // ── chip badge (caricati dalla tabella badges) ──
    var badgeRow = h('div', { class: 'bp-row' }, h('span', { class: 'bp-hint', text: 'Carico i badge…' }));
    container.appendChild(badgeRow);
    var db = client();
    if (db) db.from('badges').select('id,name,icon,color,text_color,active').eq('active', true).order('sort').then(function (r) {
      var badges = (r && r.data) || [];
      badgeRow.innerHTML = '';
      if (!badges.length) { badgeRow.appendChild(h('a', { class: 'bp-hint', href: '#', onclick: function (e) { e.preventDefault(); if (window.openSection) window.openSection('badges'); }, text: 'Nessun badge definito. Creane uno nella sezione Badge.' })); return; }
      badges.forEach(function (b) {
        var on = !!state.badgeIds[b.id];
        var chip = h('button', {
          type: 'button', class: 'bp-badge-chip' + (on ? ' on' : ''),
          style: 'background:' + b.color + ';color:' + (b.text_color || '#fff') + ';border-color:' + b.color
        }, [h('i', { class: 'ph-duotone ph-' + (b.icon || 'seal-check') }), document.createTextNode(' ' + b.name)]);
        chip.addEventListener('click', function () {
          if (state.badgeIds[b.id]) delete state.badgeIds[b.id]; else state.badgeIds[b.id] = true;
          chip.classList.toggle('on', !!state.badgeIds[b.id]);
        });
        badgeRow.appendChild(chip);
      });
    });

    // ── livello ──
    var sel = h('select', { class: 'bp-select' });
    TIERS.forEach(function (t) { var o = h('option', { value: t.v, text: t.label }); if (t.v === state.tier) o.setAttribute('selected', 'selected'); sel.appendChild(o); });
    sel.addEventListener('change', function () { state.tier = sel.value; });
    container.appendChild(h('div', { class: 'bp-field' }, [h('label', { class: 'bp-lbl', text: 'Livello badge' }), sel]));

    // ── assegnazione utente ──
    var assignedBox = h('div', { class: 'bp-assigned' });
    var searchIn = h('input', { class: 'bp-search', type: 'text', placeholder: 'Assegna a… cerca @utente', autocomplete: 'off' });
    var drop = h('div', { class: 'bp-drop' });
    function drawAssigned() {
      assignedBox.innerHTML = ''; if (!state.assigned) return; var a = state.assigned;
      assignedBox.appendChild(h('span', { class: 'bp-chip' }, [h('span', { text: '@' + (a.username || '?') }),
        h('button', { type: 'button', class: 'bp-x', text: '×', title: 'Rimuovi', onclick: function () { state.assigned = null; drawAssigned(); } })]));
    }
    var searchTimer = null;
    searchIn.addEventListener('input', function () {
      clearTimeout(searchTimer); var q = searchIn.value.trim().replace(/^@/, '');
      if (q.length < 2) { drop.classList.remove('on'); drop.innerHTML = ''; return; }
      searchTimer = setTimeout(function () { runSearch(q); }, 300);
    });
    searchIn.addEventListener('blur', function () { setTimeout(function () { drop.classList.remove('on'); }, 200); });
    function runSearch(q) {
      var sb = client(); drop.classList.add('on'); drop.innerHTML = '<div class="bp-drop-i">Cerco…</div>';
      if (!sb) { drop.innerHTML = '<div class="bp-drop-i">Ricerca non disponibile</div>'; return; }
      sb.from('profiles').select('id,username,avatar_url').ilike('username', '%' + q + '%').limit(6).then(function (res) {
        var rows = (res && res.data) || []; if (!rows.length) { drop.innerHTML = '<div class="bp-drop-i">Nessun utente</div>'; return; }
        drop.innerHTML = '';
        rows.forEach(function (u) {
          var it = h('div', { class: 'bp-drop-i pick', text: '@' + (u.username || '?') });
          it.addEventListener('mousedown', function (e) { e.preventDefault(); state.assigned = { id: u.id, username: u.username, avatar_url: u.avatar_url }; drawAssigned(); searchIn.value = ''; drop.classList.remove('on'); });
          drop.appendChild(it);
        });
      });
    }
    var searchWrap = h('div', { class: 'bp-search-wrap' }, [searchIn, drop]);
    container.appendChild(h('div', { class: 'bp-field' }, [h('label', { class: 'bp-lbl', text: 'Assegna a un utente' }), assignedBox, searchWrap]));
    drawAssigned();

    function getValues() { return { badge_ids: Object.keys(state.badgeIds), tier: state.tier || null, assigned: state.assigned ? state.assigned.id : null }; }
    function save(entity, id) {
      var sb = client(); if (!sb) return Promise.resolve({ ok: false, error: 'no client' });
      var v = getValues();
      return sb.rpc('admin_set_entity_badges', { p_entity: entity, p_id: id, p_badge_ids: v.badge_ids, p_tier: v.tier, p_assigned: v.assigned })
        .then(function (res) { return res.error ? { ok: false, error: res.error.message || 'errore' } : { ok: true }; });
    }
    return { getValues: getValues, save: save, state: state };
  }

  window.AdminBadge = { mount: mount, TIERS: TIERS };
})();
