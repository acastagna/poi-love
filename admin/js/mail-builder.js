/**
 * © Alessandro Castagna — 321.al / EVOLAB
 * Tutti i diritti riservati. Uso non autorizzato vietato.
 * info@321.al · https://321.al
 *
 * EVOLAB Mail Builder (installazione POI•LOVE). Sorgente unica nata su Top Market
 * (inc/mail_eventi.php + initMailEditor in assets/app.js): costruttore email a
 * RIGHE > COLONNE > MODULI stile Mailchimp, con anteprima WYSIWYG desktop/mobile.
 * Qui: immagini via Media Manager (window.POIMedia, URL pubblici), salvataggio in
 * email_templates (subject, body_html, body_text, design) compatibile con l'edge
 * send-email (segnaposto {{nome}} {{email}} {{link}}). window.MailBuilder.open(tpl).
 * REGOLA: le migliorie al builder vanno riportate in tutte le installazioni.
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
  var BRAND = 'POI•LOVE · 321.al / EVOLAB';
  var ACCENT_DEF = '#D42B2B';

  /* ══ CSS (porting di .mail-* di Top Market, adattata al tema scuro admin) ══ */
  function ensureStyles() {
    if (document.getElementById('mb-styles')) return;
    var css = ''
      + '.mb-ovl{position:fixed;inset:0;background:rgba(0,0,0,.66);backdrop-filter:blur(5px);z-index:950;display:flex;align-items:center;justify-content:center;padding:14px}'
      + '.mb-mod{width:1100px;max-width:100%;height:92vh;display:flex;flex-direction:column;background:var(--bg-base,#161310);border:1px solid var(--line,#333);border-radius:18px;overflow:hidden;color:var(--paper,#eee)}'
      + '.mb-head{display:flex;flex-wrap:wrap;align-items:center;gap:10px;padding:12px 44px 12px 16px;border-bottom:1px solid var(--line,#333);position:relative}'
      + '.mb-head h3{font-size:15px;font-weight:800;margin-right:6px;display:flex;align-items:center;gap:8px;white-space:nowrap}'
      + '.mb-head input,.mb-head select{padding:8px 10px;border:1px solid var(--line,#333);border-radius:9px;background:var(--field-bg,#211d18);color:var(--paper,#eee);font-family:inherit;font-size:13px;box-sizing:border-box}'
      + '.mb-head select{width:auto;flex:0 0 auto}'
      + '.mb-x{position:absolute;top:10px;right:12px;background:none;border:none;color:var(--muted,#999);font-size:22px;cursor:pointer}'
      + '.mb-top{display:flex;flex-wrap:wrap;align-items:center;gap:8px;padding:8px 16px;border-bottom:1px solid var(--line,#333)}'
      + '.mb-add{display:inline-flex;align-items:center;gap:5px;cursor:pointer;font-family:inherit;font-size:12px;font-weight:600;color:var(--paper,#eee);background:var(--field-bg,#211d18);border:1px solid var(--line,#333);border-radius:999px;padding:6px 11px}'
      + '.mb-add:hover{border-color:var(--gold,#E8B04B);color:var(--gold,#E8B04B)}'
      + '.mb-sp{flex:1}'
      + '.mb-view{display:inline-flex;border:1px solid var(--line,#333);border-radius:9px;overflow:hidden}'
      + '.mb-view-b{display:inline-flex;align-items:center;justify-content:center;width:34px;height:30px;border:none;background:transparent;color:var(--muted,#999);cursor:pointer}'
      + '.mb-view-b.on{background:var(--gold,#E8B04B);color:#161310}'
      + '.mb-main{display:flex;align-items:stretch;flex:1;min-height:0}'
      + '.mb-stage{flex:1;min-width:0;padding:18px;overflow:auto;display:flex;justify-content:center;background:repeating-conic-gradient(rgba(255,255,255,.03) 0% 25%, transparent 0% 50%) 0 0/16px 16px}'
      + '.mb-side{width:260px;flex-shrink:0;border-left:1px solid var(--line,#333);display:flex;flex-direction:column;background:var(--glass-soft,#1d1a16)}'
      + '.mb-tabs{display:flex;border-bottom:1px solid var(--line,#333)}'
      + '.mb-tab{flex:1;display:inline-flex;align-items:center;justify-content:center;gap:5px;padding:10px 6px;border:none;background:transparent;color:var(--muted,#999);font-family:inherit;font-size:12px;font-weight:700;cursor:pointer;border-bottom:2px solid transparent}'
      + '.mb-tab.on{color:var(--paper,#eee);border-bottom-color:var(--gold,#E8B04B)}'
      + '.mb-sbody{padding:12px;overflow:auto;flex:1}'
      + '.mb-hint{font-size:12px;color:var(--muted,#999);line-height:1.5;margin:0 0 10px}'
      + '.mb-tit{font-size:12.5px;font-weight:800;color:var(--paper,#eee);margin:0 0 12px}'
      + '.mb-pal{display:grid;grid-template-columns:1fr 1fr;gap:8px}'
      + '.mb-pal-it{display:flex;flex-direction:column;align-items:center;gap:6px;padding:14px 6px;border:1px solid var(--line,#333);border-radius:10px;background:var(--field-bg,#211d18);color:var(--paper,#eee);font-family:inherit;font-size:11.5px;font-weight:600;cursor:grab}'
      + '.mb-pal-it:hover{border-color:var(--gold,#E8B04B);color:var(--gold,#E8B04B)}'
      + '.mb-pal-it i{font-size:19px}'
      + '.mb-set{display:flex;flex-direction:column;gap:6px;margin-bottom:14px}'
      + '.mb-set-lab{font-size:11.5px;font-weight:700;color:var(--muted,#999)}'
      + '.mb-set-in{width:100%;box-sizing:border-box;border:1px solid var(--line,#333);border-radius:8px;background:var(--field-bg,#211d18);color:var(--paper,#eee);font-family:inherit;font-size:12.5px;padding:8px 10px;outline:none}'
      + '.mb-set-rng{width:100%;accent-color:var(--gold,#E8B04B)}'
      + '.mb-set-col{width:48px;height:32px;border:1px solid var(--line,#333);border-radius:8px;background:transparent;cursor:pointer;padding:2px}'
      + '.mb-seg{display:inline-flex;border:1px solid var(--line,#333);border-radius:9px;overflow:hidden}'
      + '.mb-seg-b{display:inline-flex;align-items:center;justify-content:center;min-width:38px;height:32px;border:none;background:var(--field-bg,#211d18);color:var(--muted,#999);cursor:pointer;font-family:inherit;font-size:12px}'
      + '.mb-seg-b.wide{padding:0 12px}'
      + '.mb-seg-b+.mb-seg-b{border-left:1px solid var(--line,#333)}'
      + '.mb-seg-b.on{background:var(--gold,#E8B04B);color:#161310}'
      + '.mb-bgbox{display:flex;align-items:center;gap:8px}'
      + '.mb-foot{display:flex;justify-content:flex-end;gap:8px;padding:12px 16px;border-top:1px solid var(--line,#333)}'
      /* anteprima: pagina + foglio bianco (l'email resta chiara, e un'email) */
      + '.mb-page{padding:22px;border-radius:8px;width:100%}'
      + '.mb-paper{width:100%;max-width:var(--mw,600px);margin:0 auto;background:#fff;border:1px solid #e6e6e6;border-radius:12px;overflow:hidden;box-shadow:0 10px 34px -16px rgba(0,0,0,.45);color:#222}'
      + '.mb-stage.mobile .mb-paper{max-width:360px}'
      + '.mb-empty{color:#999;font-size:13px;text-align:center;padding:34px 18px;line-height:1.6}'
      + '.mb-prow{position:relative}'
      + '.mb-prow.sel{box-shadow:inset 0 0 0 2px ' + ACCENT_DEF + '}'
      + '.mb-prow-tools{position:absolute;top:2px;left:6px;display:none;gap:2px;background:#fff;border:1px solid #e2e2e2;border-radius:8px;box-shadow:0 3px 10px -4px rgba(0,0,0,.3);padding:2px;z-index:3}'
      + '.mb-prow:hover>.mb-prow-tools{display:inline-flex}'
      + '.mb-cols{display:flex}'
      + '.mb-stage.mobile .mb-cols{flex-direction:column}'
      + '.mb-col{flex:1;min-width:0;min-height:44px;padding:8px 14px;position:relative;border:1px dashed transparent}'
      + '.mb-col.sel{border-color:' + ACCENT_DEF + ';background:rgba(212,43,43,.03)}'
      + '.mb-col.drop{border-color:' + ACCENT_DEF + ';background:rgba(212,43,43,.07)}'
      + '.mb-col-empty{display:flex;align-items:center;justify-content:center;min-height:40px;color:#bbb;font:600 11px Arial,Helvetica,sans-serif;border:1px dashed #e0e0e0;border-radius:8px}'
      + '.mb-mrow{position:relative;border:1px solid transparent;border-radius:6px;padding-left:16px}'
      + '.mb-mrow:hover{background:#f6f7fb}'
      + '.mb-mrow.sel{border-color:' + ACCENT_DEF + ';box-shadow:0 0 0 2px rgba(212,43,43,.15)}'
      + '.mb-mrow.dragging{opacity:.4}'
      + '.mb-mrow-tools{position:absolute;top:2px;right:4px;display:none;gap:2px;background:#fff;border:1px solid #e2e2e2;border-radius:7px;box-shadow:0 3px 10px -4px rgba(0,0,0,.3);padding:2px;z-index:2}'
      + '.mb-mrow:hover .mb-mrow-tools{display:inline-flex}'
      + '.mb-mrow-grip{position:absolute;left:1px;top:50%;transform:translateY(-50%);color:#cfcfcf;cursor:grab;display:inline-flex;padding:2px;z-index:1}'
      + '.mb-mrow-grip:active{cursor:grabbing}'
      + '.mb-mrow:hover .mb-mrow-grip{color:#999}'
      + '.mb-ic{display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border:none;background:transparent;color:#888;cursor:pointer;border-radius:5px}'
      + '.mb-ic:hover{background:#f0f0f0;color:#333}'
      + '.mb-ic.danger:hover{color:' + ACCENT_DEF + '}'
      + '.mb-h1{font:700 20px/1.3 Arial,Helvetica,sans-serif;color:#1a1a1a;padding:8px 4px 3px;outline:none}'
      + '.mb-h1.big{font-size:25px}'
      + '.mb-txt{font:400 15px/1.65 Arial,Helvetica,sans-serif;color:#333;padding:5px 4px;outline:none;white-space:pre-wrap;word-break:break-word}'
      + '.mb-txt.big{font-size:17px}'
      + '.mb-h1:empty::before,.mb-txt:empty::before{content:attr(data-ph);color:#bbb}'
      + '.mb-btn-row{padding:12px 4px}'
      + '.mb-btn-prev{display:inline-block;background:' + ACCENT_DEF + ';color:#fff;font:700 15px Arial,Helvetica,sans-serif;padding:12px 28px;border-radius:8px;outline:none;cursor:text}'
      + '.mb-img-row{padding:8px 4px}'
      + '.mb-img-row img{max-width:100%;height:auto;border-radius:6px;display:inline-block}'
      + '.mb-img-drop{display:inline-flex;flex-direction:column;align-items:center;gap:7px;padding:22px 30px;border:1px dashed #cfcfcf;border-radius:10px;background:#fafafa;color:#888;cursor:pointer;font:600 12px Arial,Helvetica,sans-serif}'
      + '.mb-img-drop i{font-size:24px}'
      + '.mb-space-prev{background:repeating-linear-gradient(45deg,#f3f3f3,#f3f3f3 6px,#fafafa 6px,#fafafa 12px);border-radius:4px}'
      + '.mb-hr-prev{border-top:1px solid #e6e6e6;margin:12px 4px}'
      + '.mb-foot-prev{padding:16px 26px;border-top:1px solid #eee;font:400 12px Arial,Helvetica,sans-serif;color:#999}'
      + '@media(max-width:860px){.mb-main{flex-direction:column}.mb-side{width:auto;border-left:none;border-top:1px solid var(--line,#333)}}';
    var st = document.createElement('style'); st.id = 'mb-styles'; st.textContent = css; document.head.appendChild(st);
  }

  /* ══ RENDER EMAIL (porting JS di tm_evento_mail_html / _testo) ══ */
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;'); }
  function altAuto(alt) { alt = String(alt || '').trim(); return alt !== '' ? alt : 'POI•LOVE'; }
  function moduloHtml(b, accent) {
    var t = b.tipo || '', al = b.align || 'left';
    if (t === 'sep') return '<tr><td style="padding:8px 0;"><hr style="border:0;border-top:1px solid #e6e6e6;margin:0;"></td></tr>';
    if (t === 'spazio') { var hh = parseInt(b.h, 10) || 20; return '<tr><td style="height:' + hh + 'px;line-height:' + hh + 'px;font-size:0;">&nbsp;</td></tr>'; }
    if (t === 'immagine') {
      return '<tr><td align="' + al + '" style="padding:6px 0;"><img src="' + esc(b.url) + '" width="' + (parseInt(b.w, 10) || 200)
        + '" alt="' + esc(altAuto(b.alt)) + '" style="display:inline-block;max-width:100%;height:auto;border:0;"></td></tr>';
    }
    if (t === 'titolo') {
      var sz1 = (b.size === 'grande') ? '25px' : '20px';
      return '<tr><td align="' + al + '" style="padding:8px 0 3px;font:700 ' + sz1 + '/1.3 Arial,Helvetica,sans-serif;color:#1a1a1a;">' + esc(b.testo) + '</td></tr>';
    }
    if (t === 'testo') {
      var sz2 = (b.size === 'grande') ? '17px' : '15px';
      return '<tr><td align="' + al + '" style="padding:5px 0;font:400 ' + sz2 + '/1.65 Arial,Helvetica,sans-serif;color:#333;">' + esc(b.testo).replace(/\n/g, '<br>') + '</td></tr>';
    }
    if (t === 'pulsante') {
      var url = String(b.url || '').trim();
      // i segnaposto {{...}} restano: li sostituisce l'edge send-email all'invio
      if (!/^\{\{.+\}\}$/.test(url) && !/^https?:\/\//i.test(url)) url = 'https://poilove.com/';
      return '<tr><td align="' + al + '" style="padding:12px 0;"><a href="' + esc(url)
        + '" style="display:inline-block;background:' + accent + ';color:#fff;text-decoration:none;'
        + 'font:700 15px Arial,Helvetica,sans-serif;padding:12px 28px;border-radius:8px;">' + esc(b.testo || 'Apri') + '</a></td></tr>';
    }
    return '';
  }
  function renderEmailHtml(doc) {
    var st = doc.settings || {}, accent = st.accent || ACCENT_DEF;
    var rowsHtml = '';
    (doc.rows || []).forEach(function (row) {
      var cols = row.cols || [], tot = 0;
      cols.forEach(function (c) { tot += parseInt(c.w, 10) || 0; });
      if (tot < 1) tot = 12;
      var cells = '';
      cols.forEach(function (c) {
        var pct = Math.round(((parseInt(c.w, 10) || (12 / cols.length)) / tot) * 100) + '%';
        var mods = '';
        (c.blocks || []).forEach(function (b) { mods += moduloHtml(b, accent); });
        cells += '<td class="pl-col" width="' + pct + '" valign="top" style="padding:6px 12px;">'
          + '<table role="presentation" width="100%" cellpadding="0" cellspacing="0">' + mods + '</table></td>';
      });
      var rstyle = 'padding:6px 14px;' + (row.bg ? 'background:' + row.bg + ';' : '');
      rowsHtml += '<tr><td style="' + rstyle + '"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>' + cells + '</tr></table></td></tr>';
    });
    var bg = st.bg || '#f4f4f5', width = parseInt(st.width, 10) || 600;
    return '<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
      + '<style>@media (max-width:520px){.pl-col{display:block!important;width:100%!important;}}</style></head>'
      + '<body style="margin:0;padding:0;background:' + bg + ';">'
      + '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:' + bg + ';padding:26px 0;"><tr><td align="center">'
      + '<table role="presentation" width="' + width + '" cellpadding="0" cellspacing="0" style="width:' + width + 'px;max-width:100%;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e6e6e6;">'
      + rowsHtml
      + '<tr><td style="padding:16px 26px;border-top:1px solid #eee;font:400 12px Arial,Helvetica,sans-serif;color:#999;">' + BRAND.replace('•', '&bull;') + '</td></tr>'
      + '</table></td></tr></table></body></html>';
  }
  function renderEmailText(doc) {
    var out = [];
    (doc.rows || []).forEach(function (row) { (row.cols || []).forEach(function (c) { (c.blocks || []).forEach(function (b) {
      if (b.tipo === 'titolo' || b.tipo === 'testo') out.push(b.testo || '');
      else if (b.tipo === 'pulsante') out.push((b.testo || '') + (b.url ? ': ' + b.url : ''));
      else if (b.tipo === 'sep') out.push('----------------------');
    }); }); });
    return out.join('\n\n').trim() + '\n\nPOI•LOVE\n321.al / EVOLAB';
  }

  /* ══ EDITOR (porting di initMailEditor) ══ */
  function open(tpl) {
    ensureStyles();
    tpl = tpl || {};
    var doc = null;
    try { doc = (typeof tpl.design === 'string') ? JSON.parse(tpl.design) : tpl.design; } catch (e) { doc = null; }
    if (!doc || typeof doc !== 'object') doc = {};
    if (!doc.settings) doc.settings = { bg: '#f4f4f5', width: 600, accent: ACCENT_DEF };
    if (!Array.isArray(doc.rows)) doc.rows = [];

    var MODS = [
      { t: 'immagine', lab: 'Logo/Immagine', ic: 'ph-image' },
      { t: 'titolo', lab: 'Titolo', ic: 'ph-text-h-one' },
      { t: 'testo', lab: 'Testo', ic: 'ph-text-align-left' },
      { t: 'pulsante', lab: 'Pulsante', ic: 'ph-cursor-click' },
      { t: 'sep', lab: 'Separatore', ic: 'ph-minus' },
      { t: 'spazio', lab: 'Spazio', ic: 'ph-arrows-out-line-vertical' }
    ];
    var sel = null, selCol = null, selRow = null, tab = 'moduli', dragMod = null, dragBlk = null;

    // ── shell ──
    var keyIn = h('input', { type: 'text', placeholder: 'chiave (es. benvenuto)', value: tpl.key || '', style: 'width:150px' });
    var subjIn = h('input', { type: 'text', placeholder: 'Oggetto della mail', value: tpl.subject || '', style: 'flex:1;min-width:180px' });
    var langSel = h('select'); ['it', 'sq', 'en'].forEach(function (l) { langSel.appendChild(h('option', { value: l, text: l })); }); langSel.value = tpl.lang || 'it';
    var kindSel = h('select'); [['send', 'Da inviare'], ['auto', 'Automatica'], ['invite', 'Invito']].forEach(function (p) { kindSel.appendChild(h('option', { value: p[0], text: p[1] })); }); kindSel.value = tpl.kind || 'send';
    var canvas = h('div');
    var stage = h('div', { class: 'mb-stage' }, [canvas]);
    var sideBody = h('div', { class: 'mb-sbody' });
    var tabModuli = h('div', { class: 'mb-tab on', html: '<i class="ph-duotone ph-squares-four"></i> Moduli' });
    var tabImp = h('div', { class: 'mb-tab', html: '<i class="ph-duotone ph-sliders-horizontal"></i> Impostazioni' });
    tabModuli.addEventListener('click', function () { tab = 'moduli'; sel = null; selRow = null; syncTabs(); render(); });
    tabImp.addEventListener('click', function () { tab = 'impostazioni'; syncTabs(); render(); });
    function syncTabs() { tabModuli.classList.toggle('on', tab === 'moduli'); tabImp.classList.toggle('on', tab === 'impostazioni'); }

    function largDefault(n) { if (n === 2) return [6, 6]; if (n === 3) return [4, 4, 4]; return [12]; }
    function cambiaColonne(r, n) {
      var old = doc.rows[r].cols, nc = [];
      for (var k = 0; k < n; k++) nc.push({ blocks: old[k] ? old[k].blocks : [] });
      for (var j = n; j < old.length; j++) nc[n - 1].blocks = nc[n - 1].blocks.concat(old[j].blocks);
      var ws = largDefault(n);
      for (var i = 0; i < n; i++) nc[i].w = ws[i];
      doc.rows[r].cols = nc; render();
    }
    function regolaLarghezza(r, val) {
      var cols = doc.rows[r].cols;
      if (cols.length === 2) { cols[0].w = val; cols[1].w = 12 - val; }
      else if (cols.length === 3) { cols[1].w = val; var o = (12 - val) / 2; cols[0].w = o; cols[2].w = o; }
      render();
    }
    function blk(r, c) { return doc.rows[r].cols[c].blocks; }
    function nuovoMod(tipo) {
      if (tipo === 'immagine') return { tipo: 'immagine', url: '', w: 200, alt: '', align: 'center' };
      if (tipo === 'titolo') return { tipo: 'titolo', testo: 'Nuovo titolo', align: 'left', size: 'grande' };
      if (tipo === 'testo') return { tipo: 'testo', testo: 'Scrivi qui. Segnaposto: {{nome}} {{email}} {{link}}.', align: 'left', size: 'normale' };
      if (tipo === 'pulsante') return { tipo: 'pulsante', testo: 'Apri POI•LOVE', url: '{{link}}', align: 'center' };
      if (tipo === 'spazio') return { tipo: 'spazio', h: 20 };
      return { tipo: 'sep' };
    }
    function addRow(ncols) {
      var ws = largDefault(ncols), cols = [];
      for (var k = 0; k < ncols; k++) cols.push({ blocks: [], w: ws[k] });
      doc.rows.push({ cols: cols, bg: '' });
      selCol = { r: doc.rows.length - 1, c: 0 }; sel = null; selRow = null; tab = 'moduli'; syncTabs();
      render();
    }
    function addMod(tipo) {
      var tg = selCol;
      if (!tg || !doc.rows[tg.r] || !doc.rows[tg.r].cols[tg.c]) {
        if (!doc.rows.length) doc.rows.push({ cols: [{ blocks: [], w: 12 }] });
        var r = doc.rows.length - 1; tg = { r: r, c: doc.rows[r].cols.length - 1 };
      }
      blk(tg.r, tg.c).push(nuovoMod(tipo));
      selCol = tg; render();
    }
    function uploadImg(b) {
      if (window.POIMedia && window.POIMedia.pick) { window.POIMedia.pick({ kind: 'og', onPick: function (url) { if (url) { b.url = url; render(); } } }); return; }
      toast('Media manager non disponibile', 'err');
    }
    function moduloEl(b) {
      var el2;
      if (b.tipo === 'titolo') {
        el2 = h('div', { class: 'mb-h1' + (b.size === 'grande' ? ' big' : '') }); el2.style.textAlign = b.align || 'left';
        el2.contentEditable = 'true'; el2.setAttribute('data-ph', 'Titolo...'); el2.textContent = b.testo || '';
        el2.addEventListener('input', function () { b.testo = el2.innerText; });
      } else if (b.tipo === 'testo') {
        el2 = h('div', { class: 'mb-txt' + (b.size === 'grande' ? ' big' : '') }); el2.style.textAlign = b.align || 'left';
        el2.contentEditable = 'true'; el2.setAttribute('data-ph', 'Scrivi il testo. Segnaposto {{nome}} {{email}} {{link}}'); el2.textContent = b.testo || '';
        el2.addEventListener('input', function () { b.testo = el2.innerText; });
      } else if (b.tipo === 'pulsante') {
        el2 = h('div', { class: 'mb-btn-row' }); el2.style.textAlign = b.align || 'center';
        var btn = h('span', { class: 'mb-btn-prev' }); btn.style.background = doc.settings.accent || ACCENT_DEF;
        btn.contentEditable = 'true'; btn.textContent = b.testo || 'Apri';
        btn.addEventListener('input', function () { b.testo = btn.innerText; });
        el2.appendChild(btn);
      } else if (b.tipo === 'immagine') {
        el2 = h('div', { class: 'mb-img-row' }); el2.style.textAlign = b.align || 'center';
        if (b.url) { el2.appendChild(h('img', { src: b.url, alt: b.alt || '', style: 'width:' + (b.w || 200) + 'px' })); }
        else {
          var drop = h('button', { type: 'button', class: 'mb-img-drop', html: '<i class="ph-bold ph-image"></i><span>Carica il logo o un’immagine</span>' });
          drop.addEventListener('click', function (e) { e.stopPropagation(); uploadImg(b); });
          el2.appendChild(drop);
        }
      } else if (b.tipo === 'spazio') {
        el2 = h('div', { class: 'mb-space-prev' }); el2.style.height = (b.h || 20) + 'px';
      } else { el2 = h('div', { class: 'mb-hr-prev' }); }
      return el2;
    }
    function mkIc(icon, title, danger) {
      return h('button', { type: 'button', class: 'mb-ic' + (danger ? ' danger' : ''), title: title || '', html: '<i class="ph-bold ' + icon + '"></i>' });
    }
    function render() {
      canvas.innerHTML = '';
      var paper = h('div', { class: 'mb-paper' });
      var pageBg = h('div', { class: 'mb-page' }); pageBg.style.background = doc.settings.bg; pageBg.style.setProperty('--mw', (doc.settings.width || 600) + 'px');
      if (!doc.rows.length) paper.appendChild(h('p', { class: 'mb-empty', text: 'Email vuota: aggiungi una riga qui sopra, poi trascina o clicca i moduli dal pannello a destra.' }));
      doc.rows.forEach(function (row, r) {
        var rEl = h('div', { class: 'mb-prow' });
        if (selRow && selRow.r === r) rEl.classList.add('sel');
        if (row.bg) rEl.style.background = row.bg;
        var rt = h('div', { class: 'mb-prow-tools' });
        var rset = mkIc('ph-sliders-horizontal', 'Impostazioni riga'), rup = mkIc('ph-arrow-up', 'Su'), rdn = mkIc('ph-arrow-down', 'Giu'), rdel = mkIc('ph-trash', 'Elimina riga', true);
        rt.appendChild(rset); rt.appendChild(rup); rt.appendChild(rdn); rt.appendChild(rdel);
        rset.addEventListener('click', function (e) { e.stopPropagation(); selRow = { r: r }; sel = null; tab = 'impostazioni'; syncTabs(); render(); });
        rup.addEventListener('click', function () { if (r > 0) { doc.rows.splice(r - 1, 0, doc.rows.splice(r, 1)[0]); render(); } });
        rdn.addEventListener('click', function () { if (r < doc.rows.length - 1) { doc.rows.splice(r + 1, 0, doc.rows.splice(r, 1)[0]); render(); } });
        rdel.addEventListener('click', function () { doc.rows.splice(r, 1); sel = null; selCol = null; selRow = null; render(); });
        rEl.appendChild(rt);
        var cwrap = h('div', { class: 'mb-cols' });
        row.cols.forEach(function (col, c) {
          var cEl = h('div', { class: 'mb-col' });
          cEl.style.flex = '0 0 ' + Math.round(((col.w || (12 / row.cols.length)) / 12) * 100) + '%';
          if (selCol && selCol.r === r && selCol.c === c) cEl.classList.add('sel');
          cEl.addEventListener('click', function (e) { if (e.target === cEl || e.target.classList.contains('mb-col-empty')) { selCol = { r: r, c: c }; sel = null; selRow = null; render(); } });
          cEl.addEventListener('dragover', function (e) { if (dragMod || dragBlk) { e.preventDefault(); cEl.classList.add('drop'); } });
          cEl.addEventListener('dragleave', function () { cEl.classList.remove('drop'); });
          cEl.addEventListener('drop', function (e) {
            e.preventDefault(); cEl.classList.remove('drop');
            if (dragMod) { blk(r, c).push(nuovoMod(dragMod)); dragMod = null; selCol = { r: r, c: c }; render(); }
            else if (dragBlk) { var m = doc.rows[dragBlk.r].cols[dragBlk.c].blocks.splice(dragBlk.b, 1)[0]; blk(r, c).push(m); dragBlk = null; render(); }
          });
          if (!col.blocks.length) cEl.appendChild(h('div', { class: 'mb-col-empty', text: 'Colonna vuota' }));
          col.blocks.forEach(function (b, bi) {
            var mrow = h('div', { class: 'mb-mrow' });
            if (sel && sel.r === r && sel.c === c && sel.b === bi) mrow.classList.add('sel');
            var grip = h('span', { class: 'mb-mrow-grip', draggable: 'true', title: 'Trascina il modulo', html: '<i class="ph-bold ph-dots-six-vertical"></i>' });
            grip.addEventListener('dragstart', function (e) { dragBlk = { r: r, c: c, b: bi }; mrow.classList.add('dragging'); try { e.dataTransfer.effectAllowed = 'move'; } catch (ex) {} });
            grip.addEventListener('dragend', function () { dragBlk = null; mrow.classList.remove('dragging'); });
            mrow.appendChild(grip);
            mrow.addEventListener('click', function (e) { if (e.target.isContentEditable || e.target.closest('.mb-mrow-grip')) return; sel = { r: r, c: c, b: bi }; selCol = { r: r, c: c }; selRow = null; tab = 'impostazioni'; syncTabs(); render(); });
            var mt = h('div', { class: 'mb-mrow-tools' });
            var mup = mkIc('ph-arrow-up', 'Su'), mdn = mkIc('ph-arrow-down', 'Giu'), mdel = mkIc('ph-trash', 'Elimina', true);
            mt.appendChild(mup); mt.appendChild(mdn); mt.appendChild(mdel);
            mup.addEventListener('click', function (e) { e.stopPropagation(); if (bi > 0) { blk(r, c).splice(bi - 1, 0, blk(r, c).splice(bi, 1)[0]); render(); } });
            mdn.addEventListener('click', function (e) { e.stopPropagation(); if (bi < blk(r, c).length - 1) { blk(r, c).splice(bi + 1, 0, blk(r, c).splice(bi, 1)[0]); render(); } });
            mdel.addEventListener('click', function (e) { e.stopPropagation(); blk(r, c).splice(bi, 1); sel = null; render(); });
            mrow.appendChild(mt);
            mrow.appendChild(moduloEl(b));
            cEl.appendChild(mrow);
          });
          cwrap.appendChild(cEl);
        });
        rEl.appendChild(cwrap);
        paper.appendChild(rEl);
      });
      paper.appendChild(h('div', { class: 'mb-foot-prev', text: BRAND }));
      pageBg.appendChild(paper);
      canvas.appendChild(pageBg);
      renderSide();
    }
    function field(lab) { var w = h('label', { class: 'mb-set' }); w.appendChild(h('span', { class: 'mb-set-lab', text: lab })); return w; }
    function ctrlAlign(b) {
      var w = field('Allineamento'), g = h('div', { class: 'mb-seg' });
      ['left', 'center', 'right'].forEach(function (a) {
        var x = h('button', { type: 'button', class: 'mb-seg-b' + ((b.align || 'left') === a ? ' on' : ''), html: '<i class="ph-bold ph-text-align-' + a + '"></i>' });
        x.addEventListener('click', function () { b.align = a; render(); }); g.appendChild(x);
      });
      w.appendChild(g); return w;
    }
    function ctrlSize(b) {
      var w = field('Dimensione'), g = h('div', { class: 'mb-seg' });
      [['normale', 'Normale'], ['grande', 'Grande']].forEach(function (p) {
        var x = h('button', { type: 'button', class: 'mb-seg-b wide' + ((b.size || 'normale') === p[0] ? ' on' : ''), text: p[1] });
        x.addEventListener('click', function () { b.size = p[0]; render(); }); g.appendChild(x);
      });
      w.appendChild(g); return w;
    }
    function ctrlText(o, key, lab, ph) {
      var w = field(lab), i = h('input', { type: 'text', class: 'mb-set-in', placeholder: ph || '', value: o[key] || '' });
      i.addEventListener('input', function () { o[key] = i.value; }); w.appendChild(i); return w;
    }
    function ctrlRange(o, key, lab, mn, mx) {
      var w = field(lab), i = h('input', { type: 'range', class: 'mb-set-rng', min: String(mn), max: String(mx), value: String(o[key] || mn) });
      i.addEventListener('input', function () { o[key] = parseInt(i.value, 10) || mn; render(); }); w.appendChild(i); return w;
    }
    function ctrlColor(o, key, lab) {
      var w = field(lab), i = h('input', { type: 'color', class: 'mb-set-col', value: o[key] || '#000000' });
      i.addEventListener('input', function () { o[key] = i.value; render(); }); w.appendChild(i); return w;
    }
    function LAB(t) { for (var i = 0; i < MODS.length; i++) if (MODS[i].t === t) return MODS[i].lab; return t; }
    function renderSide() {
      sideBody.innerHTML = '';
      if (tab === 'moduli') {
        sideBody.appendChild(h('p', { class: 'mb-hint', text: 'Trascina un modulo in una colonna (o clicca una colonna, poi il modulo).' }));
        var pal = h('div', { class: 'mb-pal' });
        MODS.forEach(function (m) {
          var it = h('button', { type: 'button', class: 'mb-pal-it', draggable: 'true', html: '<i class="ph-bold ' + m.ic + '"></i><span>' + m.lab + '</span>' });
          it.addEventListener('click', function () { addMod(m.t); });
          it.addEventListener('dragstart', function (e) { dragMod = m.t; try { e.dataTransfer.effectAllowed = 'copy'; } catch (ex) {} });
          it.addEventListener('dragend', function () { dragMod = null; });
          pal.appendChild(it);
        });
        sideBody.appendChild(pal);
        return;
      }
      if (selRow && doc.rows[selRow.r]) {
        var rr = selRow.r, rw = doc.rows[rr];
        sideBody.appendChild(h('p', { class: 'mb-tit', text: 'Riga' }));
        var wc = field('Colonne'), seg = h('div', { class: 'mb-seg' });
        [1, 2, 3].forEach(function (n) {
          var x = h('button', { type: 'button', class: 'mb-seg-b' + (rw.cols.length === n ? ' on' : ''), text: String(n) });
          x.addEventListener('click', function () { cambiaColonne(rr, n); }); seg.appendChild(x);
        });
        wc.appendChild(seg); sideBody.appendChild(wc);
        if (rw.cols.length === 2) {
          var w2 = field("Larghezza colonna sinistra (l'altra si adatta)");
          var s2 = h('input', { type: 'range', class: 'mb-set-rng', min: '2', max: '10', step: '1', value: String(rw.cols[0].w || 6) });
          s2.addEventListener('input', function () { regolaLarghezza(rr, parseInt(s2.value, 10)); }); w2.appendChild(s2); sideBody.appendChild(w2);
        } else if (rw.cols.length === 3) {
          var w3 = field('Larghezza colonna centrale (le laterali si adattano)');
          var s3 = h('input', { type: 'range', class: 'mb-set-rng', min: '2', max: '8', step: '2', value: String(rw.cols[1].w || 4) });
          s3.addEventListener('input', function () { regolaLarghezza(rr, parseInt(s3.value, 10)); }); w3.appendChild(s3); sideBody.appendChild(w3);
        }
        var wbg = field('Sfondo della riga'), box = h('div', { class: 'mb-bgbox' });
        var ci = h('input', { type: 'color', class: 'mb-set-col', value: rw.bg || '#ffffff' });
        ci.addEventListener('input', function () { rw.bg = ci.value; render(); });
        var clr = h('button', { type: 'button', class: 'mb-add', text: 'Nessuno' });
        clr.addEventListener('click', function () { rw.bg = ''; render(); });
        box.appendChild(ci); box.appendChild(clr); wbg.appendChild(box); sideBody.appendChild(wbg);
        return;
      }
      if (sel && doc.rows[sel.r] && doc.rows[sel.r].cols[sel.c] && doc.rows[sel.r].cols[sel.c].blocks[sel.b]) {
        var b = doc.rows[sel.r].cols[sel.c].blocks[sel.b];
        sideBody.appendChild(h('p', { class: 'mb-tit', text: 'Modulo: ' + LAB(b.tipo) }));
        if (b.tipo === 'titolo' || b.tipo === 'testo') { sideBody.appendChild(ctrlAlign(b)); sideBody.appendChild(ctrlSize(b)); }
        else if (b.tipo === 'immagine') {
          sideBody.appendChild(ctrlText(b, 'alt', 'Testo alternativo', 'Vuoto = POI•LOVE'));
          sideBody.appendChild(ctrlAlign(b)); sideBody.appendChild(ctrlRange(b, 'w', 'Larghezza', 60, 600));
          var chg = field('Immagine'); var cb = h('button', { type: 'button', class: 'mb-add', text: 'Cambia immagine' });
          cb.addEventListener('click', function () { uploadImg(b); }); chg.appendChild(cb); sideBody.appendChild(chg);
        }
        else if (b.tipo === 'pulsante') { sideBody.appendChild(ctrlText(b, 'url', 'Link del pulsante', '{{link}} oppure https://...')); sideBody.appendChild(ctrlAlign(b)); }
        else if (b.tipo === 'spazio') { sideBody.appendChild(ctrlRange(b, 'h', 'Altezza', 4, 80)); }
        else sideBody.appendChild(h('p', { class: 'mb-hint', text: 'Questo modulo non ha impostazioni.' }));
        return;
      }
      sideBody.appendChild(h('p', { class: 'mb-tit', text: 'Impostazioni generali' }));
      sideBody.appendChild(ctrlColor(doc.settings, 'bg', 'Sfondo della mail'));
      sideBody.appendChild(ctrlColor(doc.settings, 'accent', 'Colore pulsanti'));
      sideBody.appendChild(ctrlRange(doc.settings, 'width', 'Larghezza email', 480, 700));
    }

    // ── comandi in testa + viste ──
    var top = h('div', { class: 'mb-top' });
    [[1, 'Riga 1 colonna', 'ph-rows'], [2, 'Riga 2 colonne', 'ph-columns'], [3, 'Riga 3 colonne', 'ph-columns']].forEach(function (p) {
      var b = h('button', { type: 'button', class: 'mb-add', html: '<i class="ph-bold ' + p[2] + '"></i> ' + p[1] });
      b.addEventListener('click', function () { addRow(p[0]); }); top.appendChild(b);
    });
    top.appendChild(h('span', { class: 'mb-sp' }));
    var view = h('div', { class: 'mb-view' });
    var vd = h('button', { type: 'button', class: 'mb-view-b on', title: 'Desktop', html: '<i class="ph-bold ph-desktop"></i>' });
    var vm = h('button', { type: 'button', class: 'mb-view-b', title: 'Telefono', html: '<i class="ph-bold ph-device-mobile"></i>' });
    vd.addEventListener('click', function () { vd.classList.add('on'); vm.classList.remove('on'); stage.classList.remove('mobile'); });
    vm.addEventListener('click', function () { vm.classList.add('on'); vd.classList.remove('on'); stage.classList.add('mobile'); });
    view.appendChild(vd); view.appendChild(vm); top.appendChild(view);

    // ── salvataggio reale su email_templates ──
    function close() { var o = document.getElementById('mb-ovl'); if (o) o.remove(); }
    var saveBtn = h('button', { class: 'btn gold', text: 'Salva il modello' });
    saveBtn.addEventListener('click', function () {
      var db = sb(); if (!db) return;
      var key = (keyIn.value || '').trim().toLowerCase().replace(/[^a-z0-9_\-]/g, '_');
      if (!key) { toast('Dai una chiave al modello (es. benvenuto)', 'err'); keyIn.focus(); return; }
      var rec = {
        key: key, lang: langSel.value, kind: kindSel.value,
        subject: (subjIn.value || '').trim() || key,
        body_html: renderEmailHtml(doc),
        body_text: renderEmailText(doc),
        design: doc, active: true, updated_at: new Date().toISOString()
      };
      saveBtn.disabled = true;
      var q = tpl.id ? db.from('email_templates').update(rec).eq('id', tpl.id).select('id')
                     : db.from('email_templates').insert(rec).select('id');
      q.then(function (r) {
        saveBtn.disabled = false;
        if (r.error || !r.data || !r.data.length) { toast((r.error && r.error.message) || 'Salvataggio non riuscito', 'err'); return; }
        toast('Modello salvato', 'ok');
        if (window.logAudit) window.logAudit('email_template_builder', 'email_template', key, {});
        close();
        if (window.renderMediaEmail) window.renderMediaEmail();
      });
    });

    var mod = h('div', { class: 'mb-mod' }, [
      h('div', { class: 'mb-head' }, [
        h('h3', { html: '<i class="ph-duotone ph-envelope-open"></i> Mail Builder' }),
        keyIn, subjIn, langSel, kindSel,
        h('button', { class: 'mb-x', html: '&times;', onclick: close })
      ]),
      top,
      h('div', { class: 'mb-main' }, [stage, h('div', { class: 'mb-side' }, [h('div', { class: 'mb-tabs' }, [tabModuli, tabImp]), sideBody])]),
      h('div', { class: 'mb-foot' }, [h('button', { class: 'btn', text: 'Annulla', onclick: close }), saveBtn])
    ]);
    var ovl = h('div', { class: 'mb-ovl', id: 'mb-ovl' }, [mod]);
    document.body.appendChild(ovl);
    render();
  }

  window.MailBuilder = { open: open, renderEmailHtml: renderEmailHtml, renderEmailText: renderEmailText };
})();
