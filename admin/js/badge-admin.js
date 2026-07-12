/*
 * © Alessandro Castagna — 321.al / EVOLAB
 * Tutti i diritti riservati. Uso non autorizzato vietato.
 * info@321.al · https://321.al
 *
 * Sezione BADGE (gestione come le Categorie). Crea/modifica/elimina badge personalizzabili:
 * nome, ICONA (Phosphor), COLORE sfondo, COLORE icona+testo, LIVELLO utente associato, attivo.
 * Anteprima live. I badge così definiti compaiono nel selettore dentro i pannelli (POI, rotte…).
 * Scrive via le RPC admin_upsert_badge / admin_delete_badge (gate admin, audit). window.BadgeAdmin.
 */
(function () {
  var ICONS = ['seal-check', 'star', 'crown', 'medal', 'trophy', 'heart', 'fire', 'lightning', 'diamond', 'shield-check', 'certificate', 'sparkle', 'hand-heart', 'thumbs-up', 'flag-banner', 'rocket'];
  var TIERS = [['', 'Nessun livello'], ['professionista', 'Professionista'], ['professionista_plus', 'Professionista Plus'], ['sostenitore', 'Sostenitore'], ['mecenate', 'Mecenate'], ['influencer', 'Influencer']];

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
  function sb() { return window.sb || null; }
  function toast(m, k) { if (window.toast) window.toast(m, k); }

  function ensureStyles() {
    if (document.getElementById('ba-styles')) return;
    var css = ''
      + '.ba-badge{display:inline-flex;align-items:center;gap:6px;border-radius:20px;padding:7px 14px;font-size:13px;font-weight:800}'
      + '.ba-icons{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px}'
      + '.ba-ico{width:36px;height:36px;border-radius:10px;border:1px solid var(--line);background:var(--glass-soft);color:var(--paper);display:flex;align-items:center;justify-content:center;font-size:17px;cursor:pointer}'
      + '.ba-ico.on{border-color:var(--gold);color:var(--gold);background:color-mix(in srgb,var(--gold) 14%,transparent)}'
      + '.ba-color-row{display:flex;gap:14px;flex-wrap:wrap}'
      + '.ba-color-row input[type=color]{width:52px;height:40px;border:1px solid var(--line);border-radius:10px;background:none;cursor:pointer;padding:2px}'
      + '.ba-prev{display:flex;align-items:center;gap:10px;padding:14px;border:1px dashed var(--line);border-radius:12px;background:var(--glass-soft);margin-top:6px}'
      + '#baList{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;align-items:start}'
      + '@media(max-width:1100px){#baList{grid-template-columns:repeat(2,minmax(0,1fr))}}'
      + '@media(max-width:680px){#baList{grid-template-columns:minmax(0,1fr)}}'
      + '.ba-list-row{display:flex;align-items:center;gap:10px;padding:11px 12px;border:1px solid var(--line);border-radius:12px;background:var(--glass-soft);flex-wrap:wrap;min-width:0}';
    var st = document.createElement('style'); st.id = 'ba-styles'; st.textContent = css; document.head.appendChild(st);
  }

  var editingId = null;

  function load(box) {
    if (!box) return;
    ensureStyles();
    box.innerHTML = '';

    // ── form ──
    var f = {};
    var preview = h('span', { class: 'ba-badge' });
    function refreshPreview() {
      preview.style.background = f.color.value; preview.style.color = f.text.value;
      preview.innerHTML = '<i class="ph-duotone ph-' + (f.icon.value || 'seal-check') + '"></i> ' + (f.name.value || 'Anteprima');
    }
    f.name = h('input', { placeholder: 'Es. Ufficiale', autocomplete: 'off', oninput: refreshPreview });
    f.icon = h('input', { value: 'seal-check', autocomplete: 'off', oninput: refreshPreview });
    var iconRow = h('div', { class: 'ba-icons' });
    ICONS.forEach(function (ic) {
      var b = h('div', { class: 'ba-ico', title: ic, onclick: function () { f.icon.value = ic; markIcon(); refreshPreview(); } }, h('i', { class: 'ph-duotone ph-' + ic }));
      b.setAttribute('data-ic', ic); iconRow.appendChild(b);
    });
    function markIcon() { iconRow.querySelectorAll('.ba-ico').forEach(function (e) { e.classList.toggle('on', e.getAttribute('data-ic') === f.icon.value); }); }
    f.color = h('input', { type: 'color', value: '#B4823C', oninput: refreshPreview });
    f.text = h('input', { type: 'color', value: '#FFFFFF', oninput: refreshPreview });
    f.tier = h('select', { class: 'tier-select' }); TIERS.forEach(function (t) { f.tier.appendChild(h('option', { value: t[0], text: t[1] })); });
    f.active = h('input', { type: 'checkbox', checked: 'checked', style: 'width:auto' });

    var saveBtn = h('button', { class: 'btn gold', text: 'Salva badge', onclick: doSave });
    var cancelBtn = h('button', { class: 'btn', text: 'Annulla', style: 'display:none', onclick: resetForm });

    var form = h('div', { class: 'panel', style: 'margin-bottom:16px' }, [
      h('div', { class: 'card-h' }, [h('span', { class: 'ic' }, h('i', { class: 'ph-duotone ph-seal-check' })), h('span', { id: 'baFormTitle', text: 'Crea un badge' })]),
      h('div', { class: 'sm', style: 'margin-bottom:10px', text: 'Definisci nome, icona, colori e livello. Poi lo applichi ai contenuti dal loro pannello.' }),
      h('div', { class: 'field' }, [h('label', { text: 'Nome' }), f.name]),
      h('div', { class: 'field' }, [h('label', { text: 'Icona (Phosphor)' }), f.icon, iconRow]),
      h('div', { class: 'field' }, [h('label', { text: 'Colori (sfondo · icona/testo)' }), h('div', { class: 'ba-color-row' }, [f.color, f.text])]),
      h('div', { class: 'field' }, [h('label', { text: 'Livello utente associato' }), f.tier]),
      h('label', { style: 'display:flex;align-items:center;gap:8px;margin:6px 0;font-size:13px' }, [f.active, document.createTextNode('Attivo (visibile e applicabile)')]),
      h('div', { class: 'field' }, [h('label', { text: 'Anteprima' }), h('div', { class: 'ba-prev' }, preview)]),
      h('div', { style: 'display:flex;gap:8px;margin-top:6px' }, [saveBtn, cancelBtn])
    ]);

    var listWrap = h('div', { class: 'panel' }, [
      h('div', { class: 'card-h' }, [h('span', { class: 'ic' }, h('i', { class: 'ph-duotone ph-list-bullets' })), h('span', { text: 'Badge esistenti' }),
        h('button', { class: 'btn sm', style: 'margin-left:auto', text: 'Aggiorna', onclick: function () { load(box); } })]),
      h('div', { id: 'baList' }, h('div', { class: 'sm', style: 'opacity:.7', text: 'Carico…' }))
    ]);

    box.appendChild(form); box.appendChild(listWrap);
    markIcon(); refreshPreview();

    function resetForm() {
      editingId = null; f.name.value = ''; f.icon.value = 'seal-check'; f.color.value = '#B4823C'; f.text.value = '#FFFFFF';
      f.tier.value = ''; f.active.checked = true; document.getElementById('baFormTitle').textContent = 'Crea un badge';
      cancelBtn.style.display = 'none'; markIcon(); refreshPreview();
    }
    function fillForm(b) {
      editingId = b.id; f.name.value = b.name || ''; f.icon.value = b.icon || 'seal-check';
      f.color.value = b.color || '#B4823C'; f.text.value = b.text_color || '#FFFFFF'; f.tier.value = b.tier || ''; f.active.checked = b.active !== false;
      document.getElementById('baFormTitle').textContent = 'Modifica badge'; cancelBtn.style.display = ''; markIcon(); refreshPreview();
      form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    function doSave() {
      var db = sb(); if (!db) { toast('Client non disponibile', 'err'); return; }
      var name = (f.name.value || '').trim(); if (!name) { toast('Il nome è obbligatorio', 'err'); return; }
      saveBtn.disabled = true; saveBtn.textContent = 'Salvo…';
      db.rpc('admin_upsert_badge', { p_id: editingId, p_name: name, p_icon: f.icon.value || 'seal-check', p_color: f.color.value, p_text_color: f.text.value, p_tier: f.tier.value || null, p_active: !!f.active.checked, p_sort: 100 })
        .then(function (r) {
          saveBtn.disabled = false; saveBtn.textContent = 'Salva badge';
          if (r.error) { toast(r.error.message || 'Errore', 'err'); return; }
          toast('Badge salvato', 'ok'); resetForm(); renderList();
        });
    }
    window.__baFill = fillForm; // usato dai bottoni Modifica

    function renderList() {
      var db = sb(); var el = document.getElementById('baList'); if (!db || !el) return;
      el.innerHTML = '<div class="sm" style="opacity:.7">Carico…</div>';
      db.from('badges').select('*').order('sort').then(function (r) {
        var rows = (r && r.data) || [];
        if (!rows.length) { el.innerHTML = '<div class="sm" style="opacity:.7">Ancora nessun badge.</div>'; return; }
        el.innerHTML = '';
        rows.forEach(function (b) {
          var chip = h('span', { class: 'ba-badge', style: 'background:' + b.color + ';color:' + (b.text_color || '#fff') }, [h('i', { class: 'ph-duotone ph-' + (b.icon || 'seal-check') }), document.createTextNode(' ' + b.name)]);
          var meta = h('span', { class: 'sm' }, (b.tier ? ('livello: ' + b.tier) : 'nessun livello') + (b.active === false ? ' · spento' : ''));
          var edit = h('button', { class: 'btn sm', text: 'Modifica', onclick: function () { fillForm(b); } });
          // Sospendi / Riattiva: spegne il badge (active=false) senza cancellarlo. Riusa admin_upsert_badge.
          var susp = h('button', { class: 'btn sm' + (b.active === false ? ' green' : ' gold'), text: b.active === false ? 'Riattiva' : 'Sospendi', onclick: function () {
            db.rpc('admin_upsert_badge', { p_id: b.id, p_name: b.name, p_icon: b.icon, p_color: b.color, p_text_color: b.text_color || '#FFFFFF', p_tier: b.tier || null, p_active: b.active === false, p_sort: b.sort || 100, p_key: b.key || null })
              .then(function (rr) { if (rr.error) toast(rr.error.message, 'err'); else { toast(b.active === false ? 'Riattivato' : 'Sospeso', 'ok'); renderList(); } });
          } });
          var del = h('button', { class: 'btn sm red', text: 'Elimina', onclick: function () {
            var go = window.adminConfirm ? window.adminConfirm('Eliminare il badge "' + b.name + '"? Verrà tolto da tutti i contenuti.') : Promise.resolve(confirm('Eliminare?'));
            go.then(function (ok) { if (!ok) return; db.rpc('admin_delete_badge', { p_id: b.id }).then(function (rr) { if (rr.error) toast(rr.error.message, 'err'); else { toast('Badge eliminato', 'ok'); renderList(); } }); });
          } });
          el.appendChild(h('div', { class: 'ba-list-row' }, [chip, meta, h('span', { style: 'flex:1' }), edit, susp, del]));
        });
      });
    }
    renderList();
  }

  window.BadgeAdmin = { load: load };
})();
