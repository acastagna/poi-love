/**
 * © Alessandro Castagna — 321.al / EVOLAB
 * Tutti i diritti riservati. Uso non autorizzato vietato.
 * info@321.al · https://321.al
 *
 * ══════════════════════════════════════════════════════════════════════════
 * EVOLAB BUILDER — motore unico per costruire EMAIL e PAGINE (landing)
 * a RIGHE > COLONNE > MODULI, stile Mailchimp, con regolazioni per OGNI
 * elemento: sfondo, padding, angoli arrotondati, spazio sopra/sotto le righe.
 *
 * QUESTA È LA SORGENTE UNICA (canonica: • EvoLab/evolab-builder/).
 * Le installazioni (POI•LOVE, Top Market, prossimi progetti) caricano questo
 * file: chi migliora QUI migliora tutti. Quando builder.321.al è attivo, le
 * installazioni puntano a https://builder.321.al/evolab-builder.js con
 * fallback locale, e l'aggiornamento diventa automatico ovunque.
 *
 * API:
 *   EvolabBuilder.mount(hostEl, opts)  → istanza {getDoc(), render()}
 *   EvolabBuilder.openModal(opts)      → editor in modale; opts.onSave(doc, html, text)
 *   EvolabBuilder.renderEmail(doc, brand) → HTML email responsive (tabelle+inline)
 *   EvolabBuilder.renderPage(doc, brand)  → pagina HTML5 standalone responsive
 *   opts: { mode:'email'|'page', doc, brand:{accent,footer,name}, pickImage(cb),
 *           placeholders:'{{nome}} …', title, saveLabel, headFields:[{key,label,value,width}] }
 * ══════════════════════════════════════════════════════════════════════════
 */
(function () {
  'use strict';
  var VERSION = '1.0';

  /* ── helpers DOM ── */
  function h(tag, attrs, kids) {
    var n = document.createElement(tag);
    if (attrs) for (var k in attrs) { if (k === 'class') n.className = attrs[k]; else if (k === 'html') n.innerHTML = attrs[k]; else if (k === 'text') n.textContent = attrs[k]; else if (k.slice(0, 2) === 'on' && typeof attrs[k] === 'function') n.addEventListener(k.slice(2), attrs[k]); else if (attrs[k] != null) n.setAttribute(k, attrs[k]); }
    if (kids) (Array.isArray(kids) ? kids : [kids]).forEach(function (c) { if (c == null) return; n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return n;
  }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;'); }

  /* ── stile per-elemento: {bg, pad, radius, mt, mb} (tutti facoltativi) ── */
  function stCss(st, forEmail) {
    if (!st) return '';
    var s = '';
    if (st.bg) s += 'background:' + st.bg + ';';
    if (st.pad != null && st.pad !== '') s += 'padding:' + (parseInt(st.pad, 10) || 0) + 'px;';
    if (st.radius) s += 'border-radius:' + (parseInt(st.radius, 10) || 0) + 'px;' + (forEmail ? '' : 'overflow:hidden;');
    return s;
  }
  function defDoc(mode) {
    return { v: 2, settings: { bg: mode === 'page' ? '#EAE4D8' : '#f4f4f5', accent: '#D42B2B', width: mode === 'page' ? 960 : 600 }, rows: [] };
  }
  function normDoc(doc, mode) {
    if (!doc || typeof doc !== 'object') doc = {};
    if (!doc.settings) doc.settings = defDoc(mode).settings;
    if (!doc.settings.accent) doc.settings.accent = '#D42B2B';
    if (!doc.settings.width) doc.settings.width = (mode === 'page' ? 960 : 600);
    if (!doc.settings.bg) doc.settings.bg = (mode === 'page' ? '#EAE4D8' : '#f4f4f5');
    if (!Array.isArray(doc.rows)) doc.rows = [];
    doc.rows.forEach(function (r) { if (!r.st) r.st = {}; if (r.bg && !r.st.bg) { r.st.bg = r.bg; } if (!Array.isArray(r.cols)) r.cols = [{ blocks: [], w: 12 }]; r.cols.forEach(function (c) { if (!c.st) c.st = {}; if (!Array.isArray(c.blocks)) c.blocks = []; c.blocks.forEach(function (b) { if (!b.st) b.st = {}; }); }); });
    return doc;
  }

  /* ══ RENDER EMAIL (tabelle + stili inline, responsive @520px) ══ */
  function moduloEmail(b, accent, brand) {
    var t = b.tipo || '', al = b.align || 'left', bst = stCss(b.st, true);
    var tdOpen = '<tr><td align="' + al + '" style="' + bst;
    if (t === 'sep') return '<tr><td style="padding:8px 0;' + bst + '"><hr style="border:0;border-top:1px solid #e6e6e6;margin:0;"></td></tr>';
    if (t === 'spazio') { var hh = parseInt(b.h, 10) || 20; return '<tr><td style="height:' + hh + 'px;line-height:' + hh + 'px;font-size:0;">&nbsp;</td></tr>'; }
    if (t === 'immagine') return tdOpen + 'padding:6px 0;"><img src="' + esc(b.url) + '" width="' + (parseInt(b.w, 10) || 200) + '" alt="' + esc((b.alt || '').trim() || (brand && brand.name) || 'EVOLAB') + '" style="display:inline-block;max-width:100%;height:auto;border:0;' + (b.st && b.st.radius ? 'border-radius:' + parseInt(b.st.radius, 10) + 'px;' : '') + '"></td></tr>';
    if (t === 'titolo') { var s1 = (b.size === 'grande') ? '25px' : '20px'; return tdOpen + 'padding:8px 0 3px;font:700 ' + s1 + '/1.3 Arial,Helvetica,sans-serif;color:' + (b.st && b.st.color || '#1a1a1a') + ';">' + esc(b.testo) + '</td></tr>'; }
    if (t === 'testo') { var s2 = (b.size === 'grande') ? '17px' : '15px'; return tdOpen + 'padding:5px 0;font:400 ' + s2 + '/1.65 Arial,Helvetica,sans-serif;color:' + (b.st && b.st.color || '#333') + ';">' + esc(b.testo).replace(/\n/g, '<br>') + '</td></tr>'; }
    if (t === 'pulsante') {
      var url = String(b.url || '').trim();
      if (!/^\{\{.+\}\}$/.test(url) && !/^https?:\/\//i.test(url)) url = (brand && brand.linkBase) || 'https://321.al/';
      return tdOpen + 'padding:12px 0;"><a href="' + esc(url) + '" style="display:inline-block;background:' + accent + ';color:#fff;text-decoration:none;font:700 15px Arial,Helvetica,sans-serif;padding:12px 28px;border-radius:' + (b.st && b.st.radius != null && b.st.radius !== '' ? parseInt(b.st.radius, 10) : 8) + 'px;">' + esc(b.testo || 'Apri') + '</a></td></tr>';
    }
    if (t === 'mascotte') {
      var msz = parseInt(b.size, 10) || 140;
      return tdOpen + 'padding:10px 0;"><img src="' + esc(b.img) + '" width="' + msz + '" height="' + msz + '" alt="' + esc((brand && brand.name) || 'Mascotte') + '" style="display:inline-block;width:' + msz + 'px;height:' + msz + 'px;border-radius:50%;border:0;"></td></tr>';
    }
    if (t === 'video') { // in email: pulsante-link al video (le email non riproducono video)
      var vu = String(b.url || '').trim(); if (!/^https?:\/\//i.test(vu)) return '';
      return tdOpen + 'padding:12px 0;"><a href="' + esc(vu) + '" style="display:inline-block;background:' + accent + ';color:#fff;text-decoration:none;font:700 15px Arial,Helvetica,sans-serif;padding:12px 28px;border-radius:8px;">&#9658; ' + esc(b.testo || 'Guarda il video') + '</a></td></tr>';
    }
    return '';
  }
  function renderEmail(doc, brand) {
    doc = normDoc(JSON.parse(JSON.stringify(doc || {})), 'email');
    brand = brand || {};
    var st = doc.settings, accent = st.accent, rowsHtml = '';
    doc.rows.forEach(function (row) {
      var cols = row.cols, tot = 0;
      cols.forEach(function (c) { tot += parseInt(c.w, 10) || 0; });
      if (tot < 1) tot = 12;
      var cells = '';
      cols.forEach(function (c) {
        var pct = Math.round(((parseInt(c.w, 10) || (12 / cols.length)) / tot) * 100) + '%';
        var mods = '';
        c.blocks.forEach(function (b) { mods += moduloEmail(b, accent, brand); });
        var cpad = (c.st && c.st.pad != null && c.st.pad !== '') ? (parseInt(c.st.pad, 10) + 'px') : '6px 12px';
        cells += '<td class="eb-col" width="' + pct + '" valign="top" style="padding:' + cpad + ';' + (c.st && c.st.bg ? 'background:' + c.st.bg + ';' : '') + (c.st && c.st.radius ? 'border-radius:' + parseInt(c.st.radius, 10) + 'px;' : '') + '">'
          + '<table role="presentation" width="100%" cellpadding="0" cellspacing="0">' + mods + '</table></td>';
      });
      if (row.st && row.st.mt) rowsHtml += '<tr><td style="height:' + parseInt(row.st.mt, 10) + 'px;font-size:0;">&nbsp;</td></tr>';
      var rpad = (row.st && row.st.pad != null && row.st.pad !== '') ? (parseInt(row.st.pad, 10) + 'px') : '6px 14px';
      rowsHtml += '<tr><td style="padding:' + rpad + ';' + (row.st && row.st.bg ? 'background:' + row.st.bg + ';' : '') + (row.st && row.st.radius ? 'border-radius:' + parseInt(row.st.radius, 10) + 'px;' : '') + '"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>' + cells + '</tr></table></td></tr>';
      if (row.st && row.st.mb) rowsHtml += '<tr><td style="height:' + parseInt(row.st.mb, 10) + 'px;font-size:0;">&nbsp;</td></tr>';
    });
    var footer = brand.footer || 'EVOLAB · 321.al';
    return '<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
      + '<style>@media (max-width:520px){.eb-col{display:block!important;width:100%!important;}}</style></head>'
      + '<body style="margin:0;padding:0;background:' + st.bg + ';">'
      + '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:' + st.bg + ';padding:26px 0;"><tr><td align="center">'
      + '<table role="presentation" width="' + parseInt(st.width, 10) + '" cellpadding="0" cellspacing="0" style="width:' + parseInt(st.width, 10) + 'px;max-width:100%;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e6e6e6;">'
      + rowsHtml
      + '<tr><td style="padding:16px 26px;border-top:1px solid #eee;font:400 12px Arial,Helvetica,sans-serif;color:#999;">' + esc(footer).replace(/•/g, '&bull;') + '</td></tr>'
      + '</table></td></tr></table></body></html>';
  }
  function renderText(doc) {
    var out = [];
    (doc && doc.rows || []).forEach(function (row) { (row.cols || []).forEach(function (c) { (c.blocks || []).forEach(function (b) {
      if (b.tipo === 'titolo' || b.tipo === 'testo') out.push(b.testo || '');
      else if (b.tipo === 'pulsante' || b.tipo === 'video') out.push((b.testo || '') + (b.url ? ': ' + b.url : ''));
      else if (b.tipo === 'sep') out.push('----------------------');
    }); }); });
    return out.join('\n\n').trim();
  }

  /* ══ RENDER PAGINA (HTML5 standalone, responsive) ══ */
  function ytEmbed(u) {
    var m = String(u || '').match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w\-]{6,})/);
    return m ? 'https://www.youtube-nocookie.com/embed/' + m[1] : null;
  }
  function moduloPage(b, accent, brand) {
    var t = b.tipo || '', al = b.align || 'left', bst = stCss(b.st, false);
    if (t === 'sep') return '<hr style="border:0;border-top:1px solid rgba(0,0,0,.12);margin:14px 0;' + bst + '">';
    if (t === 'spazio') return '<div style="height:' + (parseInt(b.h, 10) || 20) + 'px"></div>';
    if (t === 'immagine') return '<div style="text-align:' + al + ';padding:6px 0;' + bst + '"><img src="' + esc(b.url) + '" alt="' + esc((b.alt || '').trim() || (brand && brand.name) || '') + '" style="width:' + (parseInt(b.w, 10) || 200) + 'px;max-width:100%;height:auto;' + (b.st && b.st.radius ? 'border-radius:' + parseInt(b.st.radius, 10) + 'px;' : '') + '"></div>';
    if (t === 'titolo') { var s1 = (b.size === 'grande') ? 'clamp(28px,5vw,44px)' : 'clamp(20px,3.4vw,28px)'; return '<h2 style="margin:.35em 0 .2em;text-align:' + al + ';font-size:' + s1 + ';line-height:1.15;font-weight:800;color:' + (b.st && b.st.color || '#1a1a1a') + ';' + bst + '">' + esc(b.testo) + '</h2>'; }
    if (t === 'testo') { var s2 = (b.size === 'grande') ? '18px' : '15.5px'; return '<p style="margin:.4em 0;text-align:' + al + ';font-size:' + s2 + ';line-height:1.7;color:' + (b.st && b.st.color || '#333') + ';white-space:pre-wrap;' + bst + '">' + esc(b.testo) + '</p>'; }
    if (t === 'pulsante') {
      var url = String(b.url || '').trim();
      if (!/^\{\{.+\}\}$/.test(url) && !/^https?:\/\//i.test(url) && url.charAt(0) !== '#') url = (brand && brand.linkBase) || 'https://321.al/';
      return '<div style="text-align:' + al + ';padding:12px 0;"><a href="' + esc(url) + '" style="display:inline-block;background:' + accent + ';color:#fff;text-decoration:none;font-weight:800;font-size:16px;padding:14px 34px;border-radius:' + (b.st && b.st.radius != null && b.st.radius !== '' ? parseInt(b.st.radius, 10) : 12) + 'px;box-shadow:0 6px 18px -6px ' + accent + '99;">' + esc(b.testo || 'Apri') + '</a></div>';
    }
    if (t === 'mascotte') {
      var ps = parseInt(b.size, 10) || 200;
      return '<style>@keyframes eb-illi-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}</style>'
        + '<div style="text-align:' + al + ';padding:10px 0;' + bst + '"><div style="display:inline-flex;align-items:center;justify-content:center;width:' + ps + 'px;height:' + ps + 'px;border-radius:50%;overflow:hidden;background:linear-gradient(135deg,' + accent + '1f,' + accent + '0a);box-shadow:0 24px 70px -12px ' + accent + '59, inset 0 0 0 1px ' + accent + '1a;border:4px solid #fff;animation:eb-illi-float 4s ease-in-out infinite;"><img src="' + esc(b.img) + '" alt="' + esc((brand && brand.name) || 'Mascotte') + '" style="width:86%;height:86%;object-fit:contain;"></div></div>';
    }
    if (t === 'video') {
      var em = ytEmbed(b.url);
      if (em) return '<div style="position:relative;padding-top:56.25%;border-radius:' + ((b.st && b.st.radius) ? parseInt(b.st.radius, 10) : 12) + 'px;overflow:hidden;margin:8px 0;"><iframe src="' + esc(em) + '" title="video" loading="lazy" allowfullscreen style="position:absolute;inset:0;width:100%;height:100%;border:0;"></iframe></div>';
      if (/^https?:\/\/.+\.(mp4|webm)$/i.test(b.url || '')) return '<video controls style="width:100%;border-radius:12px;margin:8px 0;" src="' + esc(b.url) + '"></video>';
      return '';
    }
    return '';
  }
  function renderPage(doc, brand) {
    doc = normDoc(JSON.parse(JSON.stringify(doc || {})), 'page');
    brand = brand || {};
    var st = doc.settings, accent = st.accent, rowsHtml = '';
    doc.rows.forEach(function (row) {
      var cols = row.cols, tot = 0;
      cols.forEach(function (c) { tot += parseInt(c.w, 10) || 0; });
      if (tot < 1) tot = 12;
      var cells = '';
      cols.forEach(function (c) {
        var pct = Math.round(((parseInt(c.w, 10) || (12 / cols.length)) / tot) * 1000) / 10;
        var mods = '';
        c.blocks.forEach(function (b) { mods += moduloPage(b, accent, brand); });
        var cpad = (c.st && c.st.pad != null && c.st.pad !== '') ? (parseInt(c.st.pad, 10) + 'px') : '10px 16px';
        cells += '<div class="ebp-col" style="flex:0 0 ' + pct + '%;max-width:' + pct + '%;box-sizing:border-box;padding:' + cpad + ';' + (c.st && c.st.bg ? 'background:' + c.st.bg + ';' : '') + (c.st && c.st.radius ? 'border-radius:' + parseInt(c.st.radius, 10) + 'px;' : '') + '">' + mods + '</div>';
      });
      var rpad = (row.st && row.st.pad != null && row.st.pad !== '') ? (parseInt(row.st.pad, 10) + 'px') : '10px 14px';
      rowsHtml += '<section class="ebp-row" style="' + (row.st && row.st.mt ? 'margin-top:' + parseInt(row.st.mt, 10) + 'px;' : '') + (row.st && row.st.mb ? 'margin-bottom:' + parseInt(row.st.mb, 10) + 'px;' : '') + 'padding:' + rpad + ';' + (row.st && row.st.bg ? 'background:' + row.st.bg + ';' : '') + (row.st && row.st.radius ? 'border-radius:' + parseInt(row.st.radius, 10) + 'px;' : '') + '"><div class="ebp-cols" style="display:flex;flex-wrap:wrap;align-items:flex-start;">' + cells + '</div></section>';
    });
    var footer = brand.footer || 'EVOLAB · 321.al';
    var title = esc(brand.title || brand.name || 'Landing');
    return '<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
      + '<title>' + title + '</title>'
      + '<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;-webkit-font-smoothing:antialiased}'
      + '@media(max-width:640px){.ebp-col{flex:0 0 100%!important;max-width:100%!important}}</style></head>'
      + '<body style="background:' + st.bg + ';">'
      + '<main style="max-width:' + parseInt(st.width, 10) + 'px;margin:0 auto;padding:24px 14px;">' + rowsHtml
      + '<footer style="padding:22px 8px;font-size:12px;color:rgba(0,0,0,.45);text-align:center;">' + esc(footer) + '</footer>'
      + '</main></body></html>';
  }

  /* ══ CSS EDITOR (una volta sola) ══ */
  function ensureStyles() {
    if (document.getElementById('eb-styles')) return;
    var A = 'var(--eb-accent,#E8B04B)', INK = 'var(--eb-ink,#eee)', MUT = 'var(--eb-muted,#999)', LINE = 'var(--eb-line,#3a352e)', FLD = 'var(--eb-field,#211d18)', BGD = 'var(--eb-bg,#161310)';
    var css = ''
      + '.eb-ovl{position:fixed;inset:0;background:rgba(0,0,0,.66);backdrop-filter:blur(5px);z-index:950;display:flex;align-items:center;justify-content:center;padding:14px}'
      + '.eb-mod{width:1160px;max-width:100%;height:93vh;display:flex;flex-direction:column;background:' + BGD + ';border:1px solid ' + LINE + ';border-radius:18px;overflow:hidden;color:' + INK + '}'
      + '.eb-head{display:flex;flex-wrap:wrap;align-items:center;gap:10px;padding:12px 44px 12px 16px;border-bottom:1px solid ' + LINE + ';position:relative}'
      + '.eb-head h3{font-size:15px;font-weight:800;display:flex;align-items:center;gap:8px;white-space:nowrap}'
      + '.eb-head input,.eb-head select{padding:8px 10px;border:1px solid ' + LINE + ';border-radius:9px;background:' + FLD + ';color:' + INK + ';font-family:inherit;font-size:13px;box-sizing:border-box}'
      + '.eb-x{position:absolute;top:10px;right:12px;background:none;border:none;color:' + MUT + ';font-size:22px;cursor:pointer}'
      + '.eb-top{display:flex;flex-wrap:wrap;align-items:center;gap:8px;padding:8px 16px;border-bottom:1px solid ' + LINE + '}'
      + '.eb-add{display:inline-flex;align-items:center;gap:5px;cursor:pointer;font-family:inherit;font-size:12px;font-weight:600;color:' + INK + ';background:' + FLD + ';border:1px solid ' + LINE + ';border-radius:999px;padding:6px 11px}'
      + '.eb-add:hover{border-color:' + A + ';color:' + A + '}'
      + '.eb-sp{flex:1}'
      + '.eb-view{display:inline-flex;border:1px solid ' + LINE + ';border-radius:9px;overflow:hidden}'
      + '.eb-view-b{display:inline-flex;align-items:center;justify-content:center;width:34px;height:30px;border:none;background:transparent;color:' + MUT + ';cursor:pointer}'
      + '.eb-view-b.on{background:' + A + ';color:#161310}'
      + '.eb-main{display:flex;align-items:stretch;flex:1;min-height:0}'
      + '.eb-stage{flex:1;min-width:0;padding:18px;overflow:auto;display:flex;justify-content:center;background:repeating-conic-gradient(rgba(255,255,255,.03) 0% 25%, transparent 0% 50%) 0 0/16px 16px}'
      + '.eb-side{width:270px;flex-shrink:0;border-left:1px solid ' + LINE + ';display:flex;flex-direction:column;background:rgba(255,255,255,.02)}'
      + '.eb-tabs{display:flex;border-bottom:1px solid ' + LINE + '}'
      + '.eb-tab{flex:1;display:inline-flex;align-items:center;justify-content:center;gap:5px;padding:10px 6px;border:none;background:transparent;color:' + MUT + ';font-family:inherit;font-size:12px;font-weight:700;cursor:pointer;border-bottom:2px solid transparent}'
      + '.eb-tab.on{color:' + INK + ';border-bottom-color:' + A + '}'
      + '.eb-sbody{padding:12px;overflow:auto;flex:1}'
      + '.eb-hint{font-size:12px;color:' + MUT + ';line-height:1.5;margin:0 0 10px}'
      + '.eb-tit{font-size:12.5px;font-weight:800;color:' + INK + ';margin:0 0 12px}'
      + '.eb-pal{display:grid;grid-template-columns:1fr 1fr;gap:8px}'
      + '.eb-pal-it{display:flex;flex-direction:column;align-items:center;gap:6px;padding:14px 6px;border:1px solid ' + LINE + ';border-radius:10px;background:' + FLD + ';color:' + INK + ';font-family:inherit;font-size:11.5px;font-weight:600;cursor:grab}'
      + '.eb-pal-it:hover{border-color:' + A + ';color:' + A + '}'
      + '.eb-pal-it i{font-size:19px}'
      + '.eb-set{display:flex;flex-direction:column;gap:6px;margin-bottom:13px}'
      + '.eb-set-lab{font-size:11.5px;font-weight:700;color:' + MUT + '}'
      + '.eb-set-in{width:100%;box-sizing:border-box;border:1px solid ' + LINE + ';border-radius:8px;background:' + FLD + ';color:' + INK + ';font-family:inherit;font-size:12.5px;padding:8px 10px;outline:none}'
      + '.eb-set-rng{width:100%;accent-color:' + A + '}'
      + '.eb-set-col{width:48px;height:32px;border:1px solid ' + LINE + ';border-radius:8px;background:transparent;cursor:pointer;padding:2px}'
      + '.eb-seg{display:inline-flex;border:1px solid ' + LINE + ';border-radius:9px;overflow:hidden}'
      + '.eb-seg-b{display:inline-flex;align-items:center;justify-content:center;min-width:38px;height:32px;border:none;background:' + FLD + ';color:' + MUT + ';cursor:pointer;font-family:inherit;font-size:12px}'
      + '.eb-seg-b.wide{padding:0 12px}'
      + '.eb-seg-b+.eb-seg-b{border-left:1px solid ' + LINE + '}'
      + '.eb-seg-b.on{background:' + A + ';color:#161310}'
      + '.eb-bgbox{display:flex;align-items:center;gap:8px}'
      + '.eb-foot{display:flex;justify-content:flex-end;gap:8px;padding:12px 16px;border-top:1px solid ' + LINE + '}'
      + '.eb-btn{display:inline-flex;align-items:center;gap:6px;padding:10px 18px;border-radius:10px;border:1px solid ' + LINE + ';background:' + FLD + ';color:' + INK + ';font-weight:800;font-size:13px;cursor:pointer;font-family:inherit}'
      + '.eb-btn.primary{background:' + A + ';color:#161310;border-color:' + A + '}'
      + '.eb-sec-h{font-size:10.5px;font-weight:800;letter-spacing:.5px;text-transform:uppercase;color:' + MUT + ';margin:16px 0 8px;border-top:1px dashed ' + LINE + ';padding-top:12px}'
      /* anteprima */
      + '.eb-page{padding:22px;border-radius:8px;width:100%}'
      + '.eb-paper{width:100%;max-width:var(--mw,600px);margin:0 auto;background:#fff;border:1px solid #e6e6e6;border-radius:12px;overflow:hidden;box-shadow:0 10px 34px -16px rgba(0,0,0,.45);color:#222}'
      + '.eb-paper.page{border-radius:4px}'
      + '.eb-stage.mobile .eb-paper{max-width:375px}'
      + '.eb-empty{color:#999;font-size:13px;text-align:center;padding:34px 18px;line-height:1.6}'
      + '.eb-prow{position:relative}'
      + '.eb-prow.sel{box-shadow:inset 0 0 0 2px #D42B2B}'
      + '.eb-prow-tools{position:absolute;top:2px;left:6px;display:none;gap:2px;background:#fff;border:1px solid #e2e2e2;border-radius:8px;box-shadow:0 3px 10px -4px rgba(0,0,0,.3);padding:2px;z-index:3}'
      + '.eb-prow:hover>.eb-prow-tools{display:inline-flex}'
      + '.eb-cols{display:flex;flex-wrap:wrap}'
      + '.eb-stage.mobile .eb-cols{flex-direction:column}'
      + '.eb-stage.mobile .eb-cols>.eb-col{flex:0 0 100%!important;max-width:100%!important}'
      + '.eb-col{flex:1;min-width:0;min-height:44px;padding:8px 14px;position:relative;border:1px dashed transparent;box-sizing:border-box}'
      + '.eb-col.sel{border-color:#D42B2B;background:rgba(212,43,43,.03)}'
      + '.eb-col.drop{border-color:#D42B2B;background:rgba(212,43,43,.07)}'
      + '.eb-col-tools{position:absolute;top:2px;right:4px;display:none;z-index:2}'
      + '.eb-col:hover>.eb-col-tools{display:inline-flex}'
      + '.eb-col-empty{display:flex;align-items:center;justify-content:center;min-height:40px;color:#bbb;font:600 11px Arial,Helvetica,sans-serif;border:1px dashed #e0e0e0;border-radius:8px}'
      + '.eb-mrow{position:relative;border:1px solid transparent;border-radius:6px;padding-left:16px}'
      + '.eb-mrow:hover{background:rgba(120,130,180,.06)}'
      + '.eb-mrow.sel{border-color:#D42B2B;box-shadow:0 0 0 2px rgba(212,43,43,.15)}'
      + '.eb-mrow.dragging{opacity:.4}'
      + '.eb-mrow-tools{position:absolute;top:2px;right:4px;display:none;gap:2px;background:#fff;border:1px solid #e2e2e2;border-radius:7px;box-shadow:0 3px 10px -4px rgba(0,0,0,.3);padding:2px;z-index:2}'
      + '.eb-mrow:hover .eb-mrow-tools{display:inline-flex}'
      + '.eb-mrow-grip{position:absolute;left:1px;top:50%;transform:translateY(-50%);color:#cfcfcf;cursor:grab;display:inline-flex;padding:2px;z-index:1}'
      + '.eb-mrow-grip:active{cursor:grabbing}'
      + '.eb-mrow:hover .eb-mrow-grip{color:#999}'
      + '.eb-ic{display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border:none;background:transparent;color:#888;cursor:pointer;border-radius:5px}'
      + '.eb-ic:hover{background:#f0f0f0;color:#333}'
      + '.eb-ic.danger:hover{color:#D42B2B}'
      + '.eb-h1{font:700 20px/1.3 Arial,Helvetica,sans-serif;color:#1a1a1a;padding:8px 4px 3px;outline:none}'
      + '.eb-h1.big{font-size:25px}'
      + '.eb-txt{font:400 15px/1.65 Arial,Helvetica,sans-serif;color:#333;padding:5px 4px;outline:none;white-space:pre-wrap;word-break:break-word}'
      + '.eb-txt.big{font-size:17px}'
      + '.eb-h1:empty::before,.eb-txt:empty::before{content:attr(data-ph);color:#bbb}'
      + '.eb-btn-row{padding:12px 4px}'
      + '.eb-btn-prev{display:inline-block;background:#D42B2B;color:#fff;font:700 15px Arial,Helvetica,sans-serif;padding:12px 28px;border-radius:8px;outline:none;cursor:text}'
      + '.eb-img-row{padding:8px 4px}'
      + '.eb-img-row img{max-width:100%;height:auto;border-radius:6px;display:inline-block}'
      + '.eb-img-drop{display:inline-flex;flex-direction:column;align-items:center;gap:7px;padding:22px 30px;border:1px dashed #cfcfcf;border-radius:10px;background:#fafafa;color:#888;cursor:pointer;font:600 12px Arial,Helvetica,sans-serif}'
      + '.eb-img-drop i{font-size:24px}'
      + '.eb-space-prev{background:repeating-linear-gradient(45deg,#f3f3f3,#f3f3f3 6px,#fafafa 6px,#fafafa 12px);border-radius:4px}'
      + '.eb-hr-prev{border-top:1px solid #e6e6e6;margin:12px 4px}'
      + '.eb-video-prev{position:relative;background:#111;border-radius:10px;aspect-ratio:16/9;display:flex;align-items:center;justify-content:center;color:#fff;font:700 13px Arial;gap:8px;margin:8px 0}'
      + '.eb-foot-prev{padding:16px 26px;border-top:1px solid #eee;font:400 12px Arial,Helvetica,sans-serif;color:#999}'
      + '@media(max-width:860px){.eb-main{flex-direction:column}.eb-side{width:auto;border-left:none;border-top:1px solid ' + LINE + '}}';
    var st = document.createElement('style'); st.id = 'eb-styles'; st.textContent = css; document.head.appendChild(st);
  }

  /* ══ EDITOR ══ */
  function mount(hostEl, opts) {
    ensureStyles();
    opts = opts || {};
    var mode = opts.mode === 'page' ? 'page' : 'email';
    var brand = opts.brand || {};
    var doc = normDoc((typeof opts.doc === 'string' ? (function () { try { return JSON.parse(opts.doc); } catch (e) { return null; } })() : opts.doc) || defDoc(mode), mode);
    var PH = opts.placeholders || '{{nome}} {{email}} {{link}}';
    var MODS = [
      { t: 'immagine', lab: 'Immagine', ic: 'ph-image' },
      { t: 'titolo', lab: 'Titolo', ic: 'ph-text-h-one' },
      { t: 'testo', lab: 'Testo', ic: 'ph-text-align-left' },
      { t: 'pulsante', lab: 'Pulsante', ic: 'ph-cursor-click' },
      { t: 'mascotte', lab: 'Mascotte', ic: 'ph-smiley' },
      { t: 'sep', lab: 'Separatore', ic: 'ph-minus' },
      { t: 'spazio', lab: 'Spazio', ic: 'ph-arrows-out-line-vertical' },
      { t: 'video', lab: 'Video', ic: 'ph-youtube-logo' }
    ];
    if (mode === 'email') MODS = MODS.filter(function (m) { return m.t !== 'video'; }); // niente video-embed nelle email
    var sel = null, selCol = null, selRow = null, tab = 'moduli', dragMod = null, dragBlk = null;

    var canvas = h('div');
    var stage = h('div', { class: 'eb-stage' }, [canvas]);
    var sideBody = h('div', { class: 'eb-sbody' });
    var tabModuli = h('button', { type: 'button', class: 'eb-tab on', html: '<i class="ph-duotone ph-squares-four"></i> Moduli' });
    var tabImp = h('button', { type: 'button', class: 'eb-tab', html: '<i class="ph-duotone ph-sliders-horizontal"></i> Impostazioni' });
    tabModuli.addEventListener('click', function () { tab = 'moduli'; sel = null; selRow = null; syncTabs(); render(); });
    tabImp.addEventListener('click', function () { tab = 'impostazioni'; syncTabs(); render(); });
    function syncTabs() { tabModuli.classList.toggle('on', tab === 'moduli'); tabImp.classList.toggle('on', tab === 'impostazioni'); }

    function largDefault(n) { if (n === 2) return [6, 6]; if (n === 3) return [4, 4, 4]; return [12]; }
    function cambiaColonne(r, n) {
      var old = doc.rows[r].cols, nc = [];
      for (var k = 0; k < n; k++) nc.push(old[k] ? old[k] : { blocks: [], st: {} });
      for (var j = n; j < old.length; j++) nc[n - 1].blocks = nc[n - 1].blocks.concat(old[j].blocks);
      var ws = largDefault(n);
      for (var i = 0; i < n; i++) nc[i].w = ws[i];
      doc.rows[r].cols = nc.slice(0, n); render();
    }
    function regolaLarghezza(r, val) {
      var cols = doc.rows[r].cols;
      if (cols.length === 2) { cols[0].w = val; cols[1].w = 12 - val; }
      else if (cols.length === 3) { cols[1].w = val; var o = (12 - val) / 2; cols[0].w = o; cols[2].w = o; }
      render();
    }
    function blk(r, c) { return doc.rows[r].cols[c].blocks; }
    function nuovoMod(tipo) {
      if (tipo === 'immagine') return { tipo: 'immagine', url: '', w: mode === 'page' ? 420 : 200, alt: '', align: 'center', st: {} };
      if (tipo === 'titolo') return { tipo: 'titolo', testo: 'Nuovo titolo', align: mode === 'page' ? 'center' : 'left', size: 'grande', st: {} };
      if (tipo === 'testo') return { tipo: 'testo', testo: mode === 'page' ? 'Racconta qui la tua offerta.' : ('Scrivi qui. Segnaposto: ' + PH + '.'), align: 'left', size: 'normale', st: {} };
      if (tipo === 'pulsante') return { tipo: 'pulsante', testo: 'Scopri di più', url: (opts.defaults && opts.defaults.buttonUrl) || (mode === 'page' ? ((brand.linkBase || 'https://321.al/')) : '{{link}}'), align: 'center', st: {} };
      if (tipo === 'spazio') return { tipo: 'spazio', h: 20, st: {} };
      if (tipo === 'mascotte') return { tipo: 'mascotte', img: (brand.mascot || 'https://poilove.com/img/illi-ai.png'), size: mode === 'page' ? 200 : 140, align: 'center', st: {} };
      if (tipo === 'video') return { tipo: 'video', testo: 'Guarda il video', url: '', st: {} };
      return { tipo: 'sep', st: {} };
    }
    function addRow(ncols) {
      var ws = largDefault(ncols), cols = [];
      for (var k = 0; k < ncols; k++) cols.push({ blocks: [], w: ws[k], st: {} });
      doc.rows.push({ cols: cols, st: {} });
      selCol = { r: doc.rows.length - 1, c: 0 }; sel = null; selRow = null; tab = 'moduli'; syncTabs();
      render();
    }
    function addMod(tipo) {
      var tg = selCol;
      if (!tg || !doc.rows[tg.r] || !doc.rows[tg.r].cols[tg.c]) {
        if (!doc.rows.length) doc.rows.push({ cols: [{ blocks: [], w: 12, st: {} }], st: {} });
        var r = doc.rows.length - 1; tg = { r: r, c: doc.rows[r].cols.length - 1 };
      }
      blk(tg.r, tg.c).push(nuovoMod(tipo));
      selCol = tg; render();
    }
    function pickImage2(b) {
      if (typeof opts.pickImage === 'function') { opts.pickImage(function (url) { if (url) { b.img = url; render(); } }); return; }
      var u = prompt('URL immagine'); if (u) { b.img = u; render(); }
    }
    function pickImage(b) {
      if (typeof opts.pickImage === 'function') { opts.pickImage(function (url) { if (url) { b.url = url; render(); } }); return; }
      var u = prompt('URL immagine'); if (u) { b.url = u; render(); }
    }
    function applySt(el2, st) { if (!st) return; if (st.bg) el2.style.background = st.bg; if (st.pad != null && st.pad !== '') el2.style.padding = (parseInt(st.pad, 10) || 0) + 'px'; if (st.radius) el2.style.borderRadius = (parseInt(st.radius, 10) || 0) + 'px'; }
    function moduloEl(b) {
      var el2;
      if (b.tipo === 'titolo') {
        el2 = h('div', { class: 'eb-h1' + (b.size === 'grande' ? ' big' : '') }); el2.style.textAlign = b.align || 'left';
        el2.contentEditable = 'true'; el2.setAttribute('data-ph', 'Titolo...'); el2.textContent = b.testo || '';
        el2.addEventListener('input', function () { b.testo = el2.innerText; });
      } else if (b.tipo === 'testo') {
        el2 = h('div', { class: 'eb-txt' + (b.size === 'grande' ? ' big' : '') }); el2.style.textAlign = b.align || 'left';
        el2.contentEditable = 'true'; el2.setAttribute('data-ph', 'Scrivi il testo…'); el2.textContent = b.testo || '';
        el2.addEventListener('input', function () { b.testo = el2.innerText; });
      } else if (b.tipo === 'pulsante') {
        el2 = h('div', { class: 'eb-btn-row' }); el2.style.textAlign = b.align || 'center';
        var btn = h('span', { class: 'eb-btn-prev' }); btn.style.background = doc.settings.accent;
        if (b.st && b.st.radius != null && b.st.radius !== '') btn.style.borderRadius = parseInt(b.st.radius, 10) + 'px';
        btn.contentEditable = 'true'; btn.textContent = b.testo || 'Apri';
        btn.addEventListener('input', function () { b.testo = btn.innerText; });
        el2.appendChild(btn);
        return wrapSt(el2, b, true);
      } else if (b.tipo === 'immagine') {
        el2 = h('div', { class: 'eb-img-row' }); el2.style.textAlign = b.align || 'center';
        if (b.url) { var im = h('img', { src: b.url, alt: b.alt || '' }); im.style.width = (b.w || 200) + 'px'; if (b.st && b.st.radius) im.style.borderRadius = parseInt(b.st.radius, 10) + 'px'; el2.appendChild(im); }
        else {
          var drop = h('button', { type: 'button', class: 'eb-img-drop', html: '<i class="ph-bold ph-image"></i><span>Scegli un’immagine</span>' });
          drop.addEventListener('click', function (e) { e.stopPropagation(); pickImage(b); });
          el2.appendChild(drop);
        }
      } else if (b.tipo === 'spazio') {
        el2 = h('div', { class: 'eb-space-prev' }); el2.style.height = (b.h || 20) + 'px';
      } else if (b.tipo === 'mascotte') {
        el2 = h('div'); el2.style.textAlign = b.align || 'center'; el2.style.padding = '10px 0';
        var mc = h('div'); var msz2 = (b.size || 160);
        mc.style.cssText = 'display:inline-flex;align-items:center;justify-content:center;width:' + msz2 + 'px;height:' + msz2 + 'px;border-radius:50%;overflow:hidden;background:linear-gradient(135deg,rgba(212,43,43,.12),rgba(212,43,43,.04));border:4px solid #fff;box-shadow:0 14px 40px -10px rgba(212,43,43,.35);animation:eb-illi-float 4s ease-in-out infinite';
        mc.appendChild(h('img', { src: b.img || '', alt: '', style: 'width:86%;height:86%;object-fit:contain' }));
        el2.appendChild(mc);
        if (!document.getElementById('eb-float-kf')) { var kf = document.createElement('style'); kf.id = 'eb-float-kf'; kf.textContent = '@keyframes eb-illi-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}'; document.head.appendChild(kf); }
      } else if (b.tipo === 'video') {
        el2 = h('div', { class: 'eb-video-prev', html: '<i class="ph-fill ph-play-circle" style="font-size:34px"></i><span>' + esc(b.url ? 'Video: ' + b.url.slice(0, 42) : 'Incolla il link YouTube nelle impostazioni') + '</span>' });
      } else { el2 = h('div', { class: 'eb-hr-prev' }); }
      return wrapSt(el2, b, false);
    }
    function wrapSt(el2, b, isBtn) { if (b.st && (b.st.bg || (b.st.pad != null && b.st.pad !== '') || (!isBtn && b.st.radius))) { var w = h('div'); applySt(w, isBtn ? { bg: b.st.bg, pad: b.st.pad } : b.st); w.appendChild(el2); return w; } return el2; }
    function mkIc(icon, title, danger) { return h('button', { type: 'button', class: 'eb-ic' + (danger ? ' danger' : ''), title: title || '', html: '<i class="ph-bold ' + icon + '"></i>' }); }

    function render() {
      canvas.innerHTML = '';
      var paper = h('div', { class: 'eb-paper' + (mode === 'page' ? ' page' : '') });
      var pageBg = h('div', { class: 'eb-page' }); pageBg.style.background = doc.settings.bg; pageBg.style.setProperty('--mw', (doc.settings.width || 600) + 'px');
      if (!doc.rows.length) paper.appendChild(h('p', { class: 'eb-empty', text: (mode === 'page' ? 'Pagina vuota' : 'Email vuota') + ': aggiungi una riga qui sopra, poi trascina o clicca i moduli dal pannello a destra.' }));
      doc.rows.forEach(function (row, r) {
        var rEl = h('div', { class: 'eb-prow' });
        if (selRow && selRow.r === r) rEl.classList.add('sel');
        applySt(rEl, row.st);
        if (row.st && row.st.mt) rEl.style.marginTop = parseInt(row.st.mt, 10) + 'px';
        if (row.st && row.st.mb) rEl.style.marginBottom = parseInt(row.st.mb, 10) + 'px';
        var rt = h('div', { class: 'eb-prow-tools' });
        var rset = mkIc('ph-sliders-horizontal', 'Impostazioni riga'), rup = mkIc('ph-arrow-up', 'Su'), rdn = mkIc('ph-arrow-down', 'Giu'), rdup = mkIc('ph-copy', 'Duplica riga'), rdel = mkIc('ph-trash', 'Elimina riga', true);
        rt.appendChild(rset); rt.appendChild(rup); rt.appendChild(rdn); rt.appendChild(rdup); rt.appendChild(rdel);
        rset.addEventListener('click', function (e) { e.stopPropagation(); selRow = { r: r }; sel = null; selCol = null; tab = 'impostazioni'; syncTabs(); render(); });
        rup.addEventListener('click', function () { if (r > 0) { doc.rows.splice(r - 1, 0, doc.rows.splice(r, 1)[0]); render(); } });
        rdn.addEventListener('click', function () { if (r < doc.rows.length - 1) { doc.rows.splice(r + 1, 0, doc.rows.splice(r, 1)[0]); render(); } });
        rdup.addEventListener('click', function () { doc.rows.splice(r + 1, 0, JSON.parse(JSON.stringify(doc.rows[r]))); render(); });
        rdel.addEventListener('click', function () { doc.rows.splice(r, 1); sel = null; selCol = null; selRow = null; render(); });
        rEl.appendChild(rt);
        var cwrap = h('div', { class: 'eb-cols' });
        row.cols.forEach(function (col, c) {
          var cEl = h('div', { class: 'eb-col' });
          var pct = Math.round(((col.w || (12 / row.cols.length)) / 12) * 100);
          cEl.style.flex = '0 0 ' + pct + '%'; cEl.style.maxWidth = pct + '%';
          applySt(cEl, col.st);
          if (selCol && selCol.r === r && selCol.c === c && !sel) cEl.classList.add('sel');
          var ct = h('div', { class: 'eb-col-tools' });
          var cset = mkIc('ph-paint-brush', 'Stile colonna');
          cset.addEventListener('click', function (e) { e.stopPropagation(); selCol = { r: r, c: c }; sel = null; selRow = null; tab = 'impostazioni'; syncTabs(); render(); });
          ct.appendChild(cset); cEl.appendChild(ct);
          cEl.addEventListener('click', function (e) { if (e.target === cEl || e.target.classList.contains('eb-col-empty')) { selCol = { r: r, c: c }; sel = null; selRow = null; render(); } });
          cEl.addEventListener('dragover', function (e) { if (dragMod || dragBlk) { e.preventDefault(); cEl.classList.add('drop'); } });
          cEl.addEventListener('dragleave', function () { cEl.classList.remove('drop'); });
          cEl.addEventListener('drop', function (e) {
            e.preventDefault(); cEl.classList.remove('drop');
            if (dragMod) { blk(r, c).push(nuovoMod(dragMod)); dragMod = null; selCol = { r: r, c: c }; render(); }
            else if (dragBlk) { var m = doc.rows[dragBlk.r].cols[dragBlk.c].blocks.splice(dragBlk.b, 1)[0]; blk(r, c).push(m); dragBlk = null; render(); }
          });
          if (!col.blocks.length) cEl.appendChild(h('div', { class: 'eb-col-empty', text: 'Colonna vuota' }));
          col.blocks.forEach(function (b, bi) {
            var mrow = h('div', { class: 'eb-mrow' });
            if (sel && sel.r === r && sel.c === c && sel.b === bi) mrow.classList.add('sel');
            var grip = h('span', { class: 'eb-mrow-grip', draggable: 'true', title: 'Trascina il modulo', html: '<i class="ph-bold ph-dots-six-vertical"></i>' });
            grip.addEventListener('dragstart', function (e) { dragBlk = { r: r, c: c, b: bi }; mrow.classList.add('dragging'); try { e.dataTransfer.effectAllowed = 'move'; } catch (ex) {} });
            grip.addEventListener('dragend', function () { dragBlk = null; mrow.classList.remove('dragging'); });
            mrow.appendChild(grip);
            mrow.addEventListener('click', function (e) { if (e.target.isContentEditable || e.target.closest('.eb-mrow-grip')) return; sel = { r: r, c: c, b: bi }; selCol = { r: r, c: c }; selRow = null; tab = 'impostazioni'; syncTabs(); render(); });
            var mt = h('div', { class: 'eb-mrow-tools' });
            var mup = mkIc('ph-arrow-up', 'Su'), mdn = mkIc('ph-arrow-down', 'Giu'), mdup = mkIc('ph-copy', 'Duplica'), mdel = mkIc('ph-trash', 'Elimina', true);
            mt.appendChild(mup); mt.appendChild(mdn); mt.appendChild(mdup); mt.appendChild(mdel);
            mup.addEventListener('click', function (e) { e.stopPropagation(); if (bi > 0) { blk(r, c).splice(bi - 1, 0, blk(r, c).splice(bi, 1)[0]); render(); } });
            mdn.addEventListener('click', function (e) { e.stopPropagation(); if (bi < blk(r, c).length - 1) { blk(r, c).splice(bi + 1, 0, blk(r, c).splice(bi, 1)[0]); render(); } });
            mdup.addEventListener('click', function (e) { e.stopPropagation(); blk(r, c).splice(bi + 1, 0, JSON.parse(JSON.stringify(b))); render(); });
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
      paper.appendChild(h('div', { class: 'eb-foot-prev', text: brand.footer || 'EVOLAB · 321.al' }));
      pageBg.appendChild(paper);
      canvas.appendChild(pageBg);
      renderSide();
    }

    /* pannello impostazioni: blocchetto stile riusabile (sfondo/padding/angoli) */
    function field(lab) { var w = h('label', { class: 'eb-set' }); w.appendChild(h('span', { class: 'eb-set-lab', text: lab })); return w; }
    function ctrlColorNul(o, key, lab) {
      var w = field(lab), box = h('div', { class: 'eb-bgbox' });
      var i = h('input', { type: 'color', class: 'eb-set-col', value: o[key] || '#ffffff' });
      i.addEventListener('input', function () { o[key] = i.value; render(); });
      var clr = h('button', { type: 'button', class: 'eb-add', text: 'Nessuno' });
      clr.addEventListener('click', function () { delete o[key]; render(); });
      box.appendChild(i); box.appendChild(clr); w.appendChild(box); return w;
    }
    function ctrlRange(o, key, lab, mn, mx, step) {
      var w = field(lab), i = h('input', { type: 'range', class: 'eb-set-rng', min: String(mn), max: String(mx), step: String(step || 1), value: String(o[key] != null && o[key] !== '' ? o[key] : mn) });
      i.addEventListener('input', function () { o[key] = parseInt(i.value, 10); render(); });
      w.appendChild(i); return w;
    }
    function ctrlText(o, key, lab, ph) {
      var w = field(lab), i = h('input', { type: 'text', class: 'eb-set-in', placeholder: ph || '', value: o[key] || '' });
      i.addEventListener('input', function () { o[key] = i.value; }); i.addEventListener('change', function () { render(); });
      w.appendChild(i); return w;
    }
    function ctrlAlign(b) {
      var w = field('Allineamento'), g = h('div', { class: 'eb-seg' });
      ['left', 'center', 'right'].forEach(function (a) {
        var x = h('button', { type: 'button', class: 'eb-seg-b' + ((b.align || 'left') === a ? ' on' : ''), html: '<i class="ph-bold ph-text-align-' + a + '"></i>' });
        x.addEventListener('click', function () { b.align = a; render(); }); g.appendChild(x);
      });
      w.appendChild(g); return w;
    }
    function ctrlSize(b) {
      var w = field('Dimensione'), g = h('div', { class: 'eb-seg' });
      [['normale', 'Normale'], ['grande', 'Grande']].forEach(function (p) {
        var x = h('button', { type: 'button', class: 'eb-seg-b wide' + ((b.size || 'normale') === p[0] ? ' on' : ''), text: p[1] });
        x.addEventListener('click', function () { b.size = p[0]; render(); }); g.appendChild(x);
      });
      w.appendChild(g); return w;
    }
    function styleSection(host, st, withSpacing) {
      host.appendChild(h('div', { class: 'eb-sec-h', text: 'Stile' }));
      host.appendChild(ctrlColorNul(st, 'bg', 'Colore di fondo'));
      host.appendChild(ctrlRange(st, 'pad', 'Padding interno', 0, 48));
      host.appendChild(ctrlRange(st, 'radius', 'Angoli arrotondati', 0, 32));
      if (withSpacing) {
        host.appendChild(h('div', { class: 'eb-sec-h', text: 'Spazio tra le righe' }));
        host.appendChild(ctrlRange(st, 'mt', 'Spazio sopra', 0, 80));
        host.appendChild(ctrlRange(st, 'mb', 'Spazio sotto', 0, 80));
      }
    }
    function LAB(t) { for (var i = 0; i < MODS.length; i++) if (MODS[i].t === t) return MODS[i].lab; return t; }
    function renderSide() {
      sideBody.innerHTML = '';
      if (tab === 'moduli') {
        sideBody.appendChild(h('p', { class: 'eb-hint', text: 'Trascina un modulo in una colonna (o clicca una colonna, poi il modulo).' }));
        var pal = h('div', { class: 'eb-pal' });
        MODS.forEach(function (m) {
          var it = h('button', { type: 'button', class: 'eb-pal-it', draggable: 'true', html: '<i class="ph-bold ' + m.ic + '"></i><span>' + m.lab + '</span>' });
          it.addEventListener('click', function () { addMod(m.t); });
          it.addEventListener('dragstart', function (e) { dragMod = m.t; try { e.dataTransfer.effectAllowed = 'copy'; } catch (ex) {} });
          it.addEventListener('dragend', function () { dragMod = null; });
          pal.appendChild(it);
        });
        sideBody.appendChild(pal);
        return;
      }
      // RIGA
      if (selRow && doc.rows[selRow.r]) {
        var rr = selRow.r, rw = doc.rows[rr];
        sideBody.appendChild(h('p', { class: 'eb-tit', text: 'Riga' }));
        var wc = field('Colonne'), seg = h('div', { class: 'eb-seg' });
        [1, 2, 3].forEach(function (n) {
          var x = h('button', { type: 'button', class: 'eb-seg-b' + (rw.cols.length === n ? ' on' : ''), text: String(n) });
          x.addEventListener('click', function () { cambiaColonne(rr, n); }); seg.appendChild(x);
        });
        wc.appendChild(seg); sideBody.appendChild(wc);
        if (rw.cols.length === 2) {
          var w2 = field("Larghezza colonna sinistra (l'altra si adatta)");
          var s2 = h('input', { type: 'range', class: 'eb-set-rng', min: '2', max: '10', step: '1', value: String(rw.cols[0].w || 6) });
          s2.addEventListener('input', function () { regolaLarghezza(rr, parseInt(s2.value, 10)); }); w2.appendChild(s2); sideBody.appendChild(w2);
        } else if (rw.cols.length === 3) {
          var w3 = field('Larghezza colonna centrale (le laterali si adattano)');
          var s3 = h('input', { type: 'range', class: 'eb-set-rng', min: '2', max: '8', step: '2', value: String(rw.cols[1].w || 4) });
          s3.addEventListener('input', function () { regolaLarghezza(rr, parseInt(s3.value, 10)); }); w3.appendChild(s3); sideBody.appendChild(w3);
        }
        styleSection(sideBody, rw.st, true);
        return;
      }
      // MODULO
      if (sel && doc.rows[sel.r] && doc.rows[sel.r].cols[sel.c] && doc.rows[sel.r].cols[sel.c].blocks[sel.b]) {
        var b = doc.rows[sel.r].cols[sel.c].blocks[sel.b];
        sideBody.appendChild(h('p', { class: 'eb-tit', text: 'Modulo: ' + LAB(b.tipo) }));
        if (b.tipo === 'titolo' || b.tipo === 'testo') { sideBody.appendChild(ctrlAlign(b)); sideBody.appendChild(ctrlSize(b)); sideBody.appendChild(ctrlColorNul(b.st, 'color', 'Colore del testo')); }
        else if (b.tipo === 'immagine') {
          sideBody.appendChild(ctrlText(b, 'alt', 'Testo alternativo', 'Vuoto = nome del progetto'));
          sideBody.appendChild(ctrlAlign(b)); sideBody.appendChild(ctrlRange(b, 'w', 'Larghezza', 60, mode === 'page' ? 960 : 600));
          var chg = field('Immagine'); var cb = h('button', { type: 'button', class: 'eb-add', text: 'Cambia immagine' });
          cb.addEventListener('click', function () { pickImage(b); }); chg.appendChild(cb); sideBody.appendChild(chg);
        }
        else if (b.tipo === 'pulsante') { sideBody.appendChild(ctrlText(b, 'url', 'Link del pulsante', '{{link}} oppure https://...')); sideBody.appendChild(ctrlAlign(b)); }
        else if (b.tipo === 'spazio') { sideBody.appendChild(ctrlRange(b, 'h', 'Altezza', 4, 120)); }
        else if (b.tipo === 'mascotte') {
          sideBody.appendChild(ctrlAlign(b)); sideBody.appendChild(ctrlRange(b, 'size', 'Grandezza', 80, 320, 10));
          var mchg = field('Immagine mascotte'); var mcb = h('button', { type: 'button', class: 'eb-add', text: 'Cambia immagine' });
          mcb.addEventListener('click', function () { pickImage2(b); }); mchg.appendChild(mcb); sideBody.appendChild(mchg);
        }
        else if (b.tipo === 'video') { sideBody.appendChild(ctrlText(b, 'url', 'Link YouTube o file .mp4', 'https://youtube.com/watch?v=…')); sideBody.appendChild(ctrlText(b, 'testo', 'Etichetta (usata nelle email)', 'Guarda il video')); }
        if (b.tipo !== 'sep' && b.tipo !== 'spazio') styleSection(sideBody, b.st, false);
        return;
      }
      // COLONNA
      if (selCol && doc.rows[selCol.r] && doc.rows[selCol.r].cols[selCol.c]) {
        var cc = doc.rows[selCol.r].cols[selCol.c];
        sideBody.appendChild(h('p', { class: 'eb-tit', text: 'Colonna' }));
        sideBody.appendChild(h('p', { class: 'eb-hint', text: 'Aggiungi moduli dalla scheda Moduli. Qui regoli lo stile della colonna.' }));
        styleSection(sideBody, cc.st, false);
        return;
      }
      // GENERALI
      sideBody.appendChild(h('p', { class: 'eb-tit', text: 'Impostazioni generali' }));
      sideBody.appendChild(ctrlColorNul(doc.settings, 'bg', 'Sfondo ' + (mode === 'page' ? 'della pagina' : 'della mail')));
      sideBody.appendChild(ctrlColorNul(doc.settings, 'accent', 'Colore pulsanti'));
      sideBody.appendChild(ctrlRange(doc.settings, 'width', 'Larghezza contenuto', mode === 'page' ? 640 : 480, mode === 'page' ? 1280 : 700, 10));
    }

    /* comandi in testa */
    var top = h('div', { class: 'eb-top' });
    [[1, 'Riga 1 colonna', 'ph-rows'], [2, 'Riga 2 colonne', 'ph-columns'], [3, 'Riga 3 colonne', 'ph-columns']].forEach(function (p) {
      var b = h('button', { type: 'button', class: 'eb-add', html: '<i class="ph-bold ' + p[2] + '"></i> ' + p[1] });
      b.addEventListener('click', function () { addRow(p[0]); }); top.appendChild(b);
    });
    top.appendChild(h('span', { class: 'eb-sp' }));
    var view = h('div', { class: 'eb-view' });
    var vd = h('button', { type: 'button', class: 'eb-view-b on', title: 'Desktop', html: '<i class="ph-bold ph-desktop"></i>' });
    var vm = h('button', { type: 'button', class: 'eb-view-b', title: 'Telefono', html: '<i class="ph-bold ph-device-mobile"></i>' });
    vd.addEventListener('click', function () { vd.classList.add('on'); vm.classList.remove('on'); stage.classList.remove('mobile'); });
    vm.addEventListener('click', function () { vm.classList.add('on'); vd.classList.remove('on'); stage.classList.add('mobile'); });
    view.appendChild(vd); view.appendChild(vm); top.appendChild(view);

    var main = h('div', { class: 'eb-main' }, [stage, h('div', { class: 'eb-side' }, [h('div', { class: 'eb-tabs' }, [tabModuli, tabImp]), sideBody])]);
    hostEl.innerHTML = '';
    hostEl.appendChild(top);
    hostEl.appendChild(main);
    render();

    return {
      getDoc: function () { return doc; },
      render: render,
      mode: mode
    };
  }

  /* ══ MODALE pronta (per admin): openModal({..., headFields, onSave}) ══ */
  function openModal(opts) {
    ensureStyles();
    opts = opts || {};
    function close() { var o = document.getElementById('eb-ovl'); if (o) o.remove(); }
    var headWrap = h('div', { class: 'eb-head' });
    headWrap.appendChild(h('h3', { html: '<i class="ph-duotone ph-' + (opts.mode === 'page' ? 'browser' : 'envelope-open') + '"></i> ' + esc(opts.title || 'Builder') }));
    var fields = {};
    (opts.headFields || []).forEach(function (f) {
      if (f.type === 'select') {
        var s = h('select'); (f.options || []).forEach(function (o) { s.appendChild(h('option', { value: o[0], text: o[1] })); }); s.value = f.value || (f.options && f.options[0] && f.options[0][0]) || '';
        fields[f.key] = s; headWrap.appendChild(s);
      } else {
        var i = h('input', { type: 'text', placeholder: f.label || f.key, value: f.value || '', style: f.width ? ('width:' + f.width) : 'flex:1;min-width:140px' });
        fields[f.key] = i; headWrap.appendChild(i);
      }
    });
    headWrap.appendChild(h('button', { class: 'eb-x', html: '&times;', onclick: close }));
    var body = h('div', { style: 'display:flex;flex-direction:column;flex:1;min-height:0' });
    var inst = null;
    var saveBtn = h('button', { class: 'eb-btn primary', text: opts.saveLabel || 'Salva' });
    saveBtn.addEventListener('click', function () {
      var doc = inst.getDoc();
      var vals = {}; for (var k in fields) vals[k] = fields[k].value;
      var html = (opts.mode === 'page') ? renderPage(doc, opts.brand) : renderEmail(doc, opts.brand);
      var text = renderText(doc);
      if (typeof opts.onSave === 'function') {
        saveBtn.disabled = true;
        Promise.resolve(opts.onSave(doc, html, text, vals)).then(function (ok) { saveBtn.disabled = false; if (ok !== false) close(); });
      } else close();
    });
    var mod = h('div', { class: 'eb-mod' }, [headWrap, body, h('div', { class: 'eb-foot' }, [h('button', { class: 'eb-btn', text: 'Annulla', onclick: close }), saveBtn])]);
    var ovl = h('div', { class: 'eb-ovl', id: 'eb-ovl' }, [mod]);
    document.body.appendChild(ovl);
    inst = mount(body, opts);
    return { close: close, instance: inst, fields: fields };
  }

  window.EvolabBuilder = { version: VERSION, mount: mount, openModal: openModal, renderEmail: renderEmail, renderPage: renderPage, renderText: renderText };
})();
