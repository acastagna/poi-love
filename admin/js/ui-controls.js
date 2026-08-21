/*
 * © Alessandro Castagna — 321.al / EVOLAB
 * Tutti i diritti riservati. Uso non autorizzato vietato.
 * info@321.it · https://321.al
 *
 * I comandi del pannello, disegnati da noi.
 *
 * Il menu a tendina e la casella di spunta del sistema operativo hanno un aspetto
 * loro: fondo bianco, azzurro Windows, bordi che non c'entrano nulla col resto.
 * Dentro una scheda scura stonano. Qui ci sono le due cose rifatte con i nostri
 * colori, che seguono il tema chiaro e scuro come tutto il pannello.
 *
 *   AdminUI.pick(voci, valore, opzioni)  -> tendina.  Ha .value come un <select>
 *   AdminUI.toggle(testo, acceso)        -> interruttore. Ha .checked
 *
 * La tendina si apre in position:fixed: dentro le schede con lo scorrimento una
 * tendina in absolute viene tagliata a meta.
 */
(function () {
  function h(tag, attrs, kids) {
    var n = document.createElement(tag);
    if (attrs) for (var k in attrs) {
      if (k === 'class') n.className = attrs[k];
      else if (k === 'text') n.textContent = attrs[k];
      else if (k.slice(0, 2) === 'on' && typeof attrs[k] === 'function') n.addEventListener(k.slice(2), attrs[k]);
      else if (attrs[k] != null) n.setAttribute(k, attrs[k]);
    }
    if (kids) (Array.isArray(kids) ? kids : [kids]).forEach(function (c) {
      if (c == null) return; n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return n;
  }
  function ic(name) { return h('i', { class: 'ph-duotone ph-' + name }); }

  function styles() {
    if (document.getElementById('aui-styles')) return;
    var css = ''
      // ── tendina ──
      + '.apick{position:relative;width:100%}'
      + '.apick-btn{width:100%;display:flex;align-items:center;gap:8px;text-align:left;'
      +   'border:1px solid var(--line);background:var(--field-bg);color:var(--paper);'
      +   'border-radius:11px;padding:10px 12px;font-size:13.5px;font-family:inherit;cursor:pointer;'
      +   'transition:border-color .15s,box-shadow .15s}'
      + '.apick-btn:hover{border-color:color-mix(in srgb,var(--gold) 55%,var(--line))}'
      + '.apick.on .apick-btn{border-color:var(--gold);box-shadow:0 0 0 3px color-mix(in srgb,var(--gold) 18%,transparent)}'
      + '.apick-btn>i:first-child{font-size:16px;color:var(--gold);flex-shrink:0}'
      + '.apick-val{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:600}'
      + '.apick-val.empty{color:var(--muted);font-weight:500}'
      + '.apick-caret{font-size:12px;color:var(--muted);flex-shrink:0;transition:transform .18s}'
      + '.apick.on .apick-caret{transform:rotate(180deg)}'
      + '.apick-drop{position:fixed;z-index:900;background:var(--select-bg,#1a1712);border:1px solid var(--line);'
      +   'border-radius:13px;box-shadow:var(--shadow-soft,0 18px 50px rgba(0,0,0,.5));overflow:hidden;'
      +   'display:none;flex-direction:column;max-height:320px}'
      + '.apick-drop.on{display:flex}'
      + '.apick-search{margin:8px;width:calc(100% - 16px);border:1px solid var(--line);background:var(--field-bg);'
      +   'color:var(--paper);border-radius:9px;padding:8px 11px;font-size:13px;font-family:inherit;flex-shrink:0}'
      + '.apick-list{overflow-y:auto;padding:5px;display:flex;flex-direction:column;gap:2px}'
      + '.apick-i{display:flex;align-items:center;gap:9px;padding:9px 11px;border-radius:9px;cursor:pointer;'
      +   'font-size:13.5px;color:var(--paper);border:none;background:none;font-family:inherit;text-align:left;width:100%}'
      + '.apick-i i{font-size:15px;color:var(--muted);flex-shrink:0}'
      + '.apick-i span{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}'
      + '.apick-i small{font-size:11px;color:var(--muted);flex-shrink:0}'
      + '.apick-i:hover,.apick-i.cur{background:color-mix(in srgb,var(--gold) 16%,transparent)}'
      + '.apick-i.sel{background:color-mix(in srgb,var(--gold) 26%,transparent);font-weight:800}'
      + '.apick-i.sel i{color:var(--gold)}'
      + '.apick-empty{padding:14px;text-align:center;font-size:12.5px;color:var(--muted)}'
      // ── interruttore ──
      + '.asw{display:inline-flex;align-items:center;gap:10px;border:none;background:none;padding:0;'
      +   'font-family:inherit;font-size:13.5px;color:var(--paper);cursor:pointer;text-align:left}'
      + '.asw-track{width:44px;height:25px;border-radius:99px;background:var(--field-bg);'
      +   'border:1px solid var(--line);position:relative;flex-shrink:0;transition:background .18s,border-color .18s}'
      + '.asw-knob{position:absolute;top:2px;left:2px;width:19px;height:19px;border-radius:50%;'
      +   'background:var(--muted);transition:transform .18s,background .18s;display:flex;'
      +   'align-items:center;justify-content:center;font-size:10px;color:transparent}'
      + '.asw[aria-checked="true"] .asw-track{background:#1E7F52;border-color:#1E7F52}'
      + '.asw[aria-checked="true"] .asw-knob{transform:translateX(19px);background:#fff;color:#1E7F52}'
      + '.asw-lbl{line-height:1.35}'
      + '.asw-lbl b{display:block;font-weight:700}'
      + '.asw-lbl small{display:block;font-size:11.5px;color:var(--muted)}'
      + '.asw:focus-visible .asw-track{box-shadow:0 0 0 3px color-mix(in srgb,var(--gold) 30%,transparent)}';
    document.head.appendChild(h('style', { id: 'aui-styles', text: css }));
  }

  var aperta = null;                       // una tendina aperta alla volta
  function chiudiTutte() { if (aperta) { aperta(); aperta = null; } }
  document.addEventListener('mousedown', function (e) {
    if (aperta && !e.target.closest('.apick') && !e.target.closest('.apick-drop')) chiudiTutte();
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && aperta) chiudiTutte(); });
  window.addEventListener('resize', chiudiTutte);
  window.addEventListener('scroll', chiudiTutte, true);

  /*
   * voci: [{v:'cibo', label:'Cibo', icon:'fork-knife', nota:'12'}, …]  oppure ['a','b']
   * opzioni: {icon:'', vuoto:'Scegli…', cerca:true|false|numero, onChange:fn}
   */
  function pick(voci, valore, opzioni) {
    styles();
    opzioni = opzioni || {};
    var items = (voci || []).map(function (o) {
      return (typeof o === 'string') ? { v: o, label: o } : o;
    });
    var val = valore == null ? '' : valore;

    var testo = h('span', { class: 'apick-val' });
    var bottone = h('button', { type: 'button', class: 'apick-btn' }, [
      opzioni.icon ? ic(opzioni.icon) : null, testo, h('i', { class: 'ph-bold ph-caret-down apick-caret' })
    ]);
    var root = h('div', { class: 'apick' }, [bottone]);

    var cerca = h('input', { class: 'apick-search', placeholder: 'Filtra…', autocomplete: 'off' });
    var lista = h('div', { class: 'apick-list' });
    var vuoiCerca = opzioni.cerca === true || (opzioni.cerca !== false && items.length >= 9);
    var drop = h('div', { class: 'apick-drop' }, vuoiCerca ? [cerca, lista] : [lista]);
    document.body.appendChild(drop);

    function etichetta(v) { var it = items.filter(function (i) { return i.v === v; })[0]; return it ? it.label : ''; }
    function mostra() {
      var lbl = etichetta(val);
      testo.textContent = lbl || (opzioni.vuoto || 'Scegli…');
      testo.classList.toggle('empty', !lbl);
    }
    function disegna(filtro) {
      lista.textContent = '';
      var f = (filtro || '').trim().toLowerCase();
      var vis = items.filter(function (i) { return !f || (i.label || '').toLowerCase().indexOf(f) >= 0; });
      if (!vis.length) { lista.appendChild(h('div', { class: 'apick-empty', text: 'Nessuna voce' })); return; }
      vis.forEach(function (i) {
        var b = h('button', { type: 'button', class: 'apick-i' + (i.v === val ? ' sel' : '') }, [
          i.icon ? ic(i.icon) : (i.v === val ? h('i', { class: 'ph-bold ph-check' }) : h('i', { class: 'ph ph-dot-outline', style: 'opacity:.25' })),
          h('span', { text: i.label }),
          i.nota ? h('small', { text: i.nota }) : null
        ]);
        if (i.colore && i.v === val) b.style.boxShadow = 'inset 3px 0 0 ' + i.colore;
        b.addEventListener('click', function () { scegli(i.v); });
        lista.appendChild(b);
      });
    }
    function scegli(v) {
      val = v; mostra(); chiudi();
      if (opzioni.onChange) try { opzioni.onChange(v); } catch (e) {}
      root.dispatchEvent(new Event('change', { bubbles: true }));
    }
    function posiziona() {
      var r = bottone.getBoundingClientRect();
      var sotto = window.innerHeight - r.bottom - 12;
      var alt = Math.min(320, Math.max(sotto, 180));
      drop.style.left = r.left + 'px';
      drop.style.width = Math.max(r.width, 210) + 'px';
      drop.style.maxHeight = alt + 'px';
      if (sotto < 200 && r.top > sotto) { drop.style.top = 'auto'; drop.style.bottom = (window.innerHeight - r.top + 5) + 'px'; drop.style.maxHeight = Math.min(320, r.top - 12) + 'px'; }
      else { drop.style.bottom = 'auto'; drop.style.top = (r.bottom + 5) + 'px'; }
    }
    function apri() {
      chiudiTutte();
      cerca.value = ''; disegna(''); posiziona();
      drop.classList.add('on'); root.classList.add('on');
      aperta = chiudi;
      if (vuoiCerca) setTimeout(function () { cerca.focus(); }, 20);
      var sel = lista.querySelector('.sel'); if (sel) sel.scrollIntoView({ block: 'nearest' });
    }
    function chiudi() { drop.classList.remove('on'); root.classList.remove('on'); if (aperta === chiudi) aperta = null; }

    bottone.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); root.classList.contains('on') ? chiudi() : apri(); });
    cerca.addEventListener('input', function () { disegna(cerca.value); });
    cerca.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); var p = lista.querySelector('.apick-i'); if (p) p.click(); }
    });
    // se il campo sparisce (scheda chiusa), la tendina non deve restare orfana nel body
    var osserva = new MutationObserver(function () {
      if (!document.body.contains(root)) { chiudi(); drop.remove(); osserva.disconnect(); }
    });
    osserva.observe(document.body, { childList: true, subtree: true });

    Object.defineProperty(root, 'value', {
      get: function () { return val; },
      set: function (v) { val = v == null ? '' : v; mostra(); }
    });
    root.aggiorna = function (nuove) { items = (nuove || []).map(function (o) { return (typeof o === 'string') ? { v: o, label: o } : o; }); mostra(); };
    mostra();
    return root;
  }

  /* testo puo essere 'Pubblico' oppure {titolo:'Pubblico', nota:'approvato e visibile'} */
  function toggle(testo, acceso) {
    styles();
    var t = (typeof testo === 'string') ? { titolo: testo } : (testo || {});
    var on = !!acceso;
    var knob = h('span', { class: 'asw-knob' }, ic('check'));
    var lbl = h('span', { class: 'asw-lbl' }, [
      h('b', { text: t.titolo || '' }), t.nota ? h('small', { text: t.nota }) : null
    ]);
    var root = h('button', { type: 'button', class: 'asw', role: 'switch', 'aria-checked': on ? 'true' : 'false' },
      [h('span', { class: 'asw-track' }, knob), lbl]);
    root.addEventListener('click', function () {
      on = !on; root.setAttribute('aria-checked', on ? 'true' : 'false');
      root.dispatchEvent(new Event('change', { bubbles: true }));
    });
    Object.defineProperty(root, 'checked', {
      get: function () { return on; },
      set: function (v) { on = !!v; root.setAttribute('aria-checked', on ? 'true' : 'false'); }
    });
    return root;
  }

  window.AdminUI = { pick: pick, toggle: toggle, _h: h };
})();
