/*
 * © Alessandro Castagna — 321.al / EVOLAB
 * Tutti i diritti riservati. Uso non autorizzato vietato.
 * info@321.al · https://321.al
 *
 * Editor immagini leggero e reale: ruota, zoom, sposta (pan) e ritaglia con proporzioni scelte,
 * poi esporta un Blob JPEG pronto per l'upload. window.POIImageEditor.open(url, {onSave, aspect}).
 * onSave riceve un Blob (l'immagine modificata). Nessuna libreria esterna: solo canvas.
 */
(function () {
  function h(tag, attrs, kids) {
    var n = document.createElement(tag);
    if (attrs) for (var k in attrs) { if (k === 'class') n.className = attrs[k]; else if (k === 'text') n.textContent = attrs[k]; else if (k.slice(0, 2) === 'on' && typeof attrs[k] === 'function') n.addEventListener(k.slice(2), attrs[k]); else if (attrs[k] != null) n.setAttribute(k, attrs[k]); }
    if (kids) (Array.isArray(kids) ? kids : [kids]).forEach(function (c) { if (c == null) return; n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return n;
  }
  function ensureStyles() {
    if (document.getElementById('ie-styles')) return;
    var css = ''
      + '.ie-ovl{position:fixed;inset:0;background:rgba(0,0,0,.72);backdrop-filter:blur(4px);z-index:940;display:flex;align-items:center;justify-content:center;padding:16px}'
      + '.ie-mod{width:560px;max-width:100%;background:var(--bg-base,#161310);border:1px solid var(--line,#333);border-radius:18px;overflow:hidden;color:var(--paper,#eee);display:flex;flex-direction:column;max-height:92vh}'
      + '.ie-head{display:flex;align-items:center;gap:10px;padding:12px 16px;border-bottom:1px solid var(--line,#333)}.ie-head h3{font-size:15px;font-weight:800;flex:1}'
      + '.ie-x{background:none;border:none;color:var(--muted,#999);font-size:22px;cursor:pointer}'
      + '.ie-stage{position:relative;background:#0d0d0d;display:flex;align-items:center;justify-content:center;overflow:hidden}'
      + '.ie-stage canvas{touch-action:none;cursor:grab;display:block;max-width:100%}'
      + '.ie-stage canvas:active{cursor:grabbing}'
      + '.ie-tools{display:flex;flex-wrap:wrap;gap:8px;align-items:center;padding:12px 16px}'
      + '.ie-btn{border:1px solid var(--line,#333);background:transparent;color:var(--paper,#eee);border-radius:9px;padding:7px 11px;font-weight:700;font-size:12.5px;cursor:pointer;font-family:inherit;display:inline-flex;align-items:center;gap:6px}'
      + '.ie-btn.on{background:var(--gold,#E8B04B);color:#161310;border-color:var(--gold,#E8B04B)}'
      + '.ie-zoom{flex:1;min-width:120px;display:flex;align-items:center;gap:8px;font-size:12px;color:var(--muted,#999)}.ie-zoom input{flex:1}'
      + '.ie-foot{display:flex;justify-content:flex-end;gap:8px;padding:12px 16px;border-top:1px solid var(--line,#333)}'
      + '.ie-foot .ie-btn.save{background:var(--gold,#E8B04B);color:#161310;border-color:var(--gold,#E8B04B)}';
    var st = document.createElement('style'); st.id = 'ie-styles'; st.textContent = css; document.head.appendChild(st);
  }
  function close() { var o = document.getElementById('ie-ovl'); if (o) o.remove(); }

  var ASPECTS = [{ k: '4:3', r: 4 / 3 }, { k: '1:1', r: 1 }, { k: '3:4', r: 3 / 4 }, { k: '16:9', r: 16 / 9 }];

  function open(url, opts) {
    opts = opts || {}; ensureStyles();
    var onSave = opts.onSave || function () {};
    // stato trasformazione
    var S = { scale: 1, min: 1, ox: 0, oy: 0, rot: 0, aspIdx: 0 };
    var VW = 512; // larghezza stage
    function VH() { return Math.round(VW / ASPECTS[S.aspIdx].r); }

    var canvas = h('canvas'); var ctx = canvas.getContext('2d');
    var stage = h('div', { class: 'ie-stage' }, [canvas]);
    var img = new Image(); img.crossOrigin = 'anonymous';

    function fit() {
      // rettangolo immagine dopo rotazione
      var iw = (S.rot % 180 === 0) ? img.naturalWidth : img.naturalHeight;
      var ih = (S.rot % 180 === 0) ? img.naturalHeight : img.naturalWidth;
      var vh = VH();
      S.min = Math.max(VW / iw, vh / ih);   // copre tutto il frame
      if (S.scale < S.min) S.scale = S.min;
      clampPan();
    }
    function clampPan() {
      var iw = (S.rot % 180 === 0) ? img.naturalWidth : img.naturalHeight;
      var ih = (S.rot % 180 === 0) ? img.naturalHeight : img.naturalWidth;
      var vh = VH();
      var w = iw * S.scale, hgt = ih * S.scale;
      var maxX = Math.max(0, (w - VW) / 2), maxY = Math.max(0, (hgt - vh) / 2);
      S.ox = Math.max(-maxX, Math.min(maxX, S.ox));
      S.oy = Math.max(-maxY, Math.min(maxY, S.oy));
    }
    function draw() {
      var vh = VH(); canvas.width = VW; canvas.height = vh;
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, VW, vh);
      ctx.save();
      ctx.translate(VW / 2 + S.ox, vh / 2 + S.oy);
      ctx.rotate(S.rot * Math.PI / 180);
      ctx.scale(S.scale, S.scale);
      ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
      ctx.restore();
    }
    img.onload = function () { S.scale = 1; S.ox = 0; S.oy = 0; fit(); draw(); };
    img.onerror = function () { stage.appendChild(h('div', { style: 'color:#999;padding:24px', text: 'Immagine non caricabile' })); };
    img.src = url;

    // pan con puntatore
    var drag = null;
    canvas.addEventListener('pointerdown', function (e) { drag = { x: e.clientX, y: e.clientY, ox: S.ox, oy: S.oy }; canvas.setPointerCapture(e.pointerId); });
    canvas.addEventListener('pointermove', function (e) { if (!drag) return; S.ox = drag.ox + (e.clientX - drag.x); S.oy = drag.oy + (e.clientY - drag.y); clampPan(); draw(); });
    canvas.addEventListener('pointerup', function () { drag = null; });
    canvas.addEventListener('wheel', function (e) { e.preventDefault(); S.scale *= (e.deltaY < 0 ? 1.08 : 0.92); if (S.scale < S.min) S.scale = S.min; if (S.scale > S.min * 6) S.scale = S.min * 6; clampPan(); draw(); zoomIn.value = String(S.scale); }, { passive: false });

    // controlli
    function rotate(dir) { S.rot = (S.rot + dir * 90 + 360) % 360; fit(); draw(); }
    var zoomIn = h('input', { type: 'range', min: '1', max: '6', step: '0.01', value: '1' });
    zoomIn.addEventListener('input', function () { S.scale = S.min * parseFloat(zoomIn.value); clampPan(); draw(); });

    var aspBtns = ASPECTS.map(function (a, i) { return h('button', { class: 'ie-btn' + (i === 0 ? ' on' : ''), text: a.k, onclick: function () { S.aspIdx = i; aspBtns.forEach(function (b) { b.classList.remove('on'); }); aspBtns[i].classList.add('on'); fit(); draw(); } }); });

    var tools = h('div', { class: 'ie-tools' }, [
      h('button', { class: 'ie-btn', onclick: function () { rotate(-1); }, title: 'Ruota a sinistra' }, [h('i', { class: 'ph-duotone ph-arrow-counter-clockwise' })]),
      h('button', { class: 'ie-btn', onclick: function () { rotate(1); }, title: 'Ruota a destra' }, [h('i', { class: 'ph-duotone ph-arrow-clockwise' })]),
      h('div', { class: 'ie-zoom' }, [h('i', { class: 'ph-duotone ph-magnifying-glass-plus' }), zoomIn])
    ]);
    var aspRow = h('div', { class: 'ie-tools', style: 'padding-top:0' }, [h('span', { style: 'font-size:12px;color:var(--muted,#999)', text: 'Proporzioni' })].concat(aspBtns));

    function exportBlob() {
      // esporta a risoluzione doppia del frame per qualità
      var vh = VH(); var out = document.createElement('canvas'); out.width = VW * 2; out.height = vh * 2;
      var o = out.getContext('2d'); o.scale(2, 2);
      o.fillStyle = '#000'; o.fillRect(0, 0, VW, vh);
      o.translate(VW / 2 + S.ox, vh / 2 + S.oy);
      o.rotate(S.rot * Math.PI / 180); o.scale(S.scale, S.scale);
      o.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
      return new Promise(function (res) { out.toBlob(function (b) { res(b); }, 'image/jpeg', 0.9); });
    }

    var saveBtn = h('button', { class: 'ie-btn save' }, [h('i', { class: 'ph-duotone ph-check' }), document.createTextNode(' Applica')]);
    saveBtn.addEventListener('click', function () {
      saveBtn.disabled = true; saveBtn.textContent = 'Salvo…';
      exportBlob().then(function (b) { close(); if (b) onSave(b); });
    });

    var mod = h('div', { class: 'ie-mod' }, [
      h('div', { class: 'ie-head' }, [h('h3', { text: 'Modifica immagine' }), h('button', { class: 'ie-x', text: '×', onclick: close })]),
      stage, tools, aspRow,
      h('div', { class: 'ie-foot' }, [h('button', { class: 'ie-btn', text: 'Annulla', onclick: close }), saveBtn])
    ]);
    var ovl = h('div', { class: 'ie-ovl', id: 'ie-ovl', onclick: function (e) { if (e.target === ovl) close(); } }, [mod]);
    document.body.appendChild(ovl);
  }

  window.POIImageEditor = { open: open, close: close };
})();
