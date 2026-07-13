/**
 * © Alessandro Castagna — 321.al / EVOLAB
 * Tutti i diritti riservati. Uso non autorizzato vietato.
 * info@321.al · https://321.al
 *
 * LANDING PAGE BUILDER (POI•LOVE): sezione admin per costruire pagine di atterraggio
 * col MOTORE UNICO EvolabBuilder (resa 'page'). Salvate in landing_pages (design + html),
 * pubblicate su https://poilove.com/lp.php?s=<slug>. Immagini via Media Manager.
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
  var BASE = 'https://poilove.com/lp.php?s=';

  function openBuilder(lp) {
    lp = lp || {};
    if (!window.EvolabBuilder) { toast('Builder non caricato', 'err'); return; }
    EvolabBuilder.openModal({
      mode: 'page',
      title: 'Landing Builder',
      saveLabel: 'Salva la landing',
      doc: lp.design || null,
      brand: { accent: '#D42B2B', footer: 'Ingegnerizzazione di Alessandro Castagna · 321.AL / EVOLAB • Tirana', name: 'POI•LOVE', linkBase: 'https://poilove.com/', title: lp.title || '' },
      pickImage: function (cb) { if (window.POIMedia && window.POIMedia.pick) window.POIMedia.pick({ kind: 'og', onPick: cb }); else cb(null); },
      headFields: [
        { key: 'slug', label: 'indirizzo (es. lancio-tirana)', value: lp.slug || '', width: '190px' },
        { key: 'title', label: 'Titolo della pagina', value: lp.title || '' },
        { key: 'template_for', type: 'select', value: lp.template_for || 'libera', options: [['libera', 'Uso: pagina libera'], ['poi', 'Uso: condivisione POI'], ['trip', 'Uso: condivisione itinerario'], ['route', 'Uso: condivisione rotta'], ['evento', 'Uso: evento/lancio']] }
      ],
      placeholders: '{{titolo}} {{descrizione}} {{foto}} {{mittente}} {{link}}',
      onSave: function (doc, html, text, vals) {
        var db = sb(); if (!db) return false;
        var slug = (vals.slug || '').trim().toLowerCase().replace(/[^a-z0-9\-]/g, '-').replace(/\-+/g, '-').replace(/^\-|\-$/g, '');
        if (slug.length < 2) { toast('Dai un indirizzo alla landing (es. lancio-tirana)', 'err'); return false; }
        // il titolo entra nella pagina resa
        html = (window.EvolabBuilder).renderPage(doc, { accent: '#D42B2B', footer: 'Ingegnerizzazione di Alessandro Castagna · 321.AL / EVOLAB • Tirana', name: 'POI•LOVE', linkBase: 'https://poilove.com/', title: (vals.title || slug) });
        var rec = { slug: slug, title: (vals.title || '').trim() || slug, template_for: vals.template_for || 'libera', design: doc, html: html, updated_at: new Date().toISOString() };
        if (!lp.id && window.ME) rec.created_by = window.ME.id;
        var q = lp.id ? db.from('landing_pages').update(rec).eq('id', lp.id).select('id')
                      : db.from('landing_pages').insert(rec).select('id');
        return q.then(function (r) {
          if (r.error || !r.data || !r.data.length) { toast((r.error && r.error.message) || 'Salvataggio non riuscito', 'err'); return false; }
          toast('Landing salvata', 'ok');
          if (window.logAudit) window.logAudit(lp.id ? 'landing_edit' : 'landing_create', 'landing', slug, {});
          load();
          return true;
        });
      }
    });
  }

  async function load() {
    var box = document.getElementById('landingTable'); if (!box) return;
    box.innerHTML = '<div class="sm" style="opacity:.6;padding:8px">…</div>';
    var db = sb(); if (!db) return;
    var r = await db.from('landing_pages').select('*').order('updated_at', { ascending: false });
    var rows = (r && r.data) || [];
    box.innerHTML = '';
    if (!rows.length) { box.appendChild(h('div', { class: 'sm', style: 'opacity:.7;padding:8px', text: 'Nessuna landing ancora: creane una col Landing Builder.' })); return; }
    rows.forEach(function (lp) {
      var row = h('div', { style: 'display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:10px 0;border-bottom:1px solid rgba(128,128,128,.15)' });
      row.appendChild(h('div', { style: 'flex:1;min-width:160px' }, [
        h('div', { class: 'ttl', text: lp.title || lp.slug }),
        h('div', { class: 'sm', style: 'opacity:.8', text: '/lp.php?s=' + lp.slug })
      ]));
      var USO = { libera: 'Libera', poi: 'POI', trip: 'Itinerario', route: 'Rotta', evento: 'Evento' };
      row.appendChild(h('span', { class: 'chip gold', text: 'Uso: ' + (USO[lp.template_for] || 'Libera') }));
      row.appendChild(h('span', { class: 'chip ' + (lp.published ? 'green' : 'dim'), text: lp.published ? 'Pubblicata' : 'Bozza' }));
      if (lp.published) row.appendChild(h('a', { class: 'btn sm', href: BASE + encodeURIComponent(lp.slug), target: '_blank', rel: 'noopener', html: '<i class="ph-duotone ph-arrow-square-out"></i> Apri' }));
      row.appendChild(h('button', { class: 'btn sm ' + (lp.published ? '' : 'green'), text: lp.published ? 'Metti in bozza' : 'Pubblica', onclick: async function () {
        var res = await sb().from('landing_pages').update({ published: !lp.published, updated_at: new Date().toISOString() }).eq('id', lp.id).select('id');
        if (res.error || !res.data || !res.data.length) { toast('Operazione non riuscita', 'err'); return; }
        if (window.logAudit) window.logAudit(lp.published ? 'landing_unpublish' : 'landing_publish', 'landing', lp.slug, {});
        toast(lp.published ? 'Landing in bozza' : 'Landing PUBBLICATA', 'ok'); load();
      } }));
      row.appendChild(h('button', { class: 'btn sm gold', html: '<i class="ph-duotone ph-browser"></i> Costruttore', onclick: function () { openBuilder(lp); } }));
      row.appendChild(h('button', { class: 'btn sm red', text: 'Elimina', onclick: async function () {
        var ok = window.adminConfirm ? await window.adminConfirm('Eliminare la landing "' + (lp.title || lp.slug) + '"?') : confirm('Eliminare?');
        if (!ok) return;
        var res = await sb().from('landing_pages').delete().eq('id', lp.id).select('id');
        if (res.error || !res.data || !res.data.length) { toast('Eliminazione non riuscita', 'err'); return; }
        if (window.logAudit) window.logAudit('landing_delete', 'landing', lp.slug, {});
        toast('Landing eliminata', 'ok'); load();
      } }));
      box.appendChild(row);
    });
  }

  window.LandingAdmin = { load: load, openBuilder: openBuilder };
})();
