/*
 * © Alessandro Castagna — 321.al / EVOLAB
 * Tutti i diritti riservati. Uso non autorizzato vietato.
 * info@321.al · https://321.al
 *
 * A3 — Selettore BADGE + ASSEGNAZIONE riusabile (unica implementazione).
 * window.AdminBadge.mount(container, opts) monta il componente e ritorna { getValues, save }.
 * Stesso comportamento su POI, Rotte/Itinerari, Compagnie: badge Ufficiale / Indispensabile,
 * livello utente (tier), e assegnazione a un utente registrato (ricerca profilo).
 * Il salvataggio passa SEMPRE dalla RPC server-side admin_set_badge_and_owner (gate + audit).
 * Non dipende dagli helper di panel.html: usa DOM nativo, così è portabile ovunque.
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
      else if (k === 'html') n.innerHTML = attrs[k];
      else if (k.slice(0, 2) === 'on' && typeof attrs[k] === 'function') n.addEventListener(k.slice(2), attrs[k]);
      else if (attrs[k] != null) n.setAttribute(k, attrs[k]);
    }
    if (kids) (Array.isArray(kids) ? kids : [kids]).forEach(function (c) {
      if (c == null) return;
      n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return n;
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[<>&"]/g, function (c) { return ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' })[c]; }); }

  // Client Supabase: usa quello globale del pannello (sb) se presente.
  function client() { return (typeof window !== 'undefined' && window.sb) ? window.sb : null; }

  // Stili iniettati una volta sola (a tema, usano le variabili del pannello).
  function ensureStyles() {
    if (document.getElementById('bp-styles')) return;
    var css = ''
      + '.badge-picker{border:1px solid var(--line);border-radius:14px;padding:14px;background:var(--glass-soft)}'
      + '.bp-title{font-size:12px;font-weight:800;letter-spacing:.4px;text-transform:uppercase;color:var(--muted);margin-bottom:10px}'
      + '.bp-row{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px}'
      + '.bp-toggle{border:1px solid var(--line);background:transparent;color:var(--muted);border-radius:20px;padding:6px 13px;font-size:12.5px;font-weight:700;font-family:inherit;cursor:pointer;transition:all .15s}'
      + '.bp-toggle.on{color:var(--on-accent,#fff)}'
      + '.bp-toggle.on.gold{background:var(--gold);border-color:var(--gold)}'
      + '.bp-toggle.on.purple{background:#7C3AED;border-color:#7C3AED;color:#fff}'
      + '.bp-field{margin-bottom:12px}'
      + '.bp-lbl{display:block;font-size:11.5px;font-weight:700;color:var(--muted);margin-bottom:5px}'
      + '.bp-select{width:100%;max-width:280px;background:var(--select-bg);color:var(--paper);border:1px solid var(--line);border-radius:10px;padding:8px 10px;font-size:13px;font-family:inherit;cursor:pointer}'
      + '.bp-assigned{margin-bottom:6px}'
      + '.bp-chip{display:inline-flex;align-items:center;gap:6px;background:color-mix(in srgb,var(--gold) 16%,transparent);border:1px solid color-mix(in srgb,var(--gold) 40%,transparent);color:var(--paper);border-radius:20px;padding:4px 6px 4px 12px;font-size:12.5px;font-weight:700}'
      + '.bp-x{border:none;background:none;color:var(--muted);font-size:16px;line-height:1;cursor:pointer;padding:0 4px}'
      + '.bp-x:hover{color:var(--red)}'
      + '.bp-search-wrap{position:relative;max-width:280px}'
      + '.bp-search{width:100%;background:var(--field-bg);color:var(--paper);border:1px solid var(--line);border-radius:10px;padding:8px 10px;font-size:13px;font-family:inherit}'
      + '.bp-drop{position:absolute;left:0;right:0;top:calc(100% + 4px);background:var(--select-bg);border:1px solid var(--line);border-radius:10px;overflow:hidden;z-index:50;display:none;box-shadow:var(--shadow-soft)}'
      + '.bp-drop.on{display:block}'
      + '.bp-drop-i{padding:9px 12px;font-size:13px;color:var(--muted)}'
      + '.bp-drop-i.pick{color:var(--paper);cursor:pointer}'
      + '.bp-drop-i.pick:hover{background:var(--glass-soft)}';
    var st = document.createElement('style'); st.id = 'bp-styles'; st.textContent = css; document.head.appendChild(st);
  }

  function mount(container, opts) {
    ensureStyles();
    opts = opts || {};
    var state = {
      official: !!opts.official,
      essential: !!opts.essential,
      tier: opts.tier || '',
      assigned: opts.assigned || null   // {id, username, avatar_url} | null
    };
    container.innerHTML = '';
    container.classList.add('badge-picker');

    // ── Badge Ufficiale / Indispensabile (due toggle) ──
    function badgeToggle(key, label, cls) {
      var b = h('button', { type: 'button', class: 'bp-toggle ' + (state[key] ? 'on ' + cls : ''), text: label });
      b.addEventListener('click', function () { state[key] = !state[key]; b.classList.toggle('on', state[key]); b.classList.toggle(cls, state[key]); });
      return b;
    }
    var toggles = h('div', { class: 'bp-row' }, [
      badgeToggle('official', '★ Ufficiale', 'gold'),
      badgeToggle('essential', '◆ Indispensabile', 'purple')
    ]);

    // ── Livello utente (tier) ──
    var sel = h('select', { class: 'bp-select' });
    TIERS.forEach(function (t) { var o = h('option', { value: t.v, text: t.label }); if (t.v === state.tier) o.setAttribute('selected', 'selected'); sel.appendChild(o); });
    sel.addEventListener('change', function () { state.tier = sel.value; });
    var tierRow = h('div', { class: 'bp-field' }, [h('label', { class: 'bp-lbl', text: 'Livello badge' }), sel]);

    // ── Assegnazione a utente registrato (ricerca profilo) ──
    var assignedBox = h('div', { class: 'bp-assigned' });
    var searchIn = h('input', { class: 'bp-search', type: 'text', placeholder: 'Assegna a… cerca @utente', autocomplete: 'off' });
    var drop = h('div', { class: 'bp-drop' });
    function drawAssigned() {
      assignedBox.innerHTML = '';
      if (!state.assigned) return;
      var a = state.assigned;
      assignedBox.appendChild(h('span', { class: 'bp-chip' }, [
        h('span', { text: '@' + (a.username || '?') }),
        h('button', { type: 'button', class: 'bp-x', text: '×', title: 'Rimuovi assegnazione', onclick: function () { state.assigned = null; drawAssigned(); } })
      ]));
    }
    var searchTimer = null;
    searchIn.addEventListener('input', function () {
      clearTimeout(searchTimer);
      var q = searchIn.value.trim().replace(/^@/, '');
      if (q.length < 2) { drop.classList.remove('on'); drop.innerHTML = ''; return; }
      searchTimer = setTimeout(function () { runSearch(q); }, 300);
    });
    searchIn.addEventListener('blur', function () { setTimeout(function () { drop.classList.remove('on'); }, 200); });
    function runSearch(q) {
      var sb = client();
      drop.classList.add('on'); drop.innerHTML = '<div class="bp-drop-i">Cerco…</div>';
      if (!sb) { drop.innerHTML = '<div class="bp-drop-i">Ricerca non disponibile</div>'; return; }
      sb.from('profiles').select('id,username,avatar_url').ilike('username', '%' + q + '%').limit(6).then(function (res) {
        var rows = (res && res.data) || [];
        if (!rows.length) { drop.innerHTML = '<div class="bp-drop-i">Nessun utente</div>'; return; }
        drop.innerHTML = '';
        rows.forEach(function (u) {
          var it = h('div', { class: 'bp-drop-i pick', text: '@' + (u.username || '?') });
          it.addEventListener('mousedown', function (e) { e.preventDefault(); state.assigned = { id: u.id, username: u.username, avatar_url: u.avatar_url }; drawAssigned(); searchIn.value = ''; drop.classList.remove('on'); });
          drop.appendChild(it);
        });
      });
    }
    var searchWrap = h('div', { class: 'bp-search-wrap' }, [searchIn, drop]);
    var assignRow = h('div', { class: 'bp-field' }, [h('label', { class: 'bp-lbl', text: 'Assegna a un utente' }), assignedBox, searchWrap]);
    drawAssigned();

    container.appendChild(h('div', { class: 'bp-title', text: 'Badge e assegnazione' }));
    container.appendChild(toggles);
    container.appendChild(tierRow);
    container.appendChild(assignRow);

    function getValues() {
      return { official: state.official, essential: state.essential, tier: state.tier || null, assigned: state.assigned ? state.assigned.id : null };
    }
    // Salva via RPC. entity: 'poi'|'route'|'trip'|'companion'. Ritorna Promise<{ok, error?}>.
    function save(entity, id) {
      var sb = client();
      if (!sb) return Promise.resolve({ ok: false, error: 'no client' });
      var v = getValues();
      return sb.rpc('admin_set_badge_and_owner', {
        p_entity: entity, p_id: id,
        p_official: v.official, p_essential: v.essential, p_tier: v.tier, p_assigned: v.assigned
      }).then(function (res) { return res.error ? { ok: false, error: res.error.message || 'errore' } : { ok: true }; });
    }

    return { getValues: getValues, save: save, state: state };
  }

  window.AdminBadge = { mount: mount, TIERS: TIERS };
})();
