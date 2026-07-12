/*
 * © Alessandro Castagna — 321.al / EVOLAB
 * Tutti i diritti riservati. Uso non autorizzato vietato.
 * info@321.al · https://321.al
 *
 * Color picker EvoLab (portato da tools.evolab.it/colorpicker.js) + modalità GRADIENTE.
 * Sostituisce gli <input type=color> e i campi data-cp con un trigger che apre una modale:
 *   Tinta   → area SV + slider Hue + HEX/RGB + palette (colore singolo #rrggbb)
 *   Gradiente → 2 stop (ognuno con lo stesso editor) + slider Angolo → linear-gradient(...)
 * window.POIColorPicker. Il valore scritto sull'input è '#rrggbb' oppure 'linear-gradient(...)'.
 */
(function (root) {
  'use strict';
  var PALETTE_KEY = 'poi-badge-palette', MAX_PAL = 14, initDone = false;
  var S = { input: null, allowGrad: false, mode: 'tinta', origin: '#000000',
            tinta: { h: 0, s: 1, v: 1, exact: null, dirty: false },
            grad: { stops: [{ h: 30, s: .7, v: .8 }, { h: 270, s: .7, v: .8 }], angle: 135, active: 0 } };

  function hex2(n) { n = Math.max(0, Math.min(255, n | 0)); return ('0' + n.toString(16)).slice(-2); }
  function rgbToHex(r, g, b) { return '#' + hex2(r) + hex2(g) + hex2(b); }
  function hexToRgb(hex) { var h = String(hex || '#000000').replace('#', '').trim(); if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join(''); if (!/^[0-9a-f]{6}$/i.test(h)) return null; return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) }; }
  function rgbToHsv(r, g, b) { r /= 255; g /= 255; b /= 255; var mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn, h, s = mx === 0 ? 0 : d / mx, v = mx; if (d === 0) h = 0; else if (mx === r) h = ((g - b) / d) % 6; else if (mx === g) h = (b - r) / d + 2; else h = (r - g) / d + 4; h = Math.round(h * 60); if (h < 0) h += 360; return { h: h, s: s, v: v }; }
  function hsvToRgb(h, s, v) { var c = v * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = v - c, r = 0, g = 0, b = 0; if (h < 60) { r = c; g = x; } else if (h < 120) { r = x; g = c; } else if (h < 180) { g = c; b = x; } else if (h < 240) { g = x; b = c; } else if (h < 300) { r = c; b = x; } else { r = c; b = x; } return { r: Math.round((r + m) * 255), g: Math.round((g + m) * 255), b: Math.round((b + m) * 255) }; }
  function hsvHex(o) { var r = hsvToRgb(o.h, o.s, o.v); return rgbToHex(r.r, r.g, r.b); }

  function palGet() { try { var a = JSON.parse(localStorage.getItem(PALETTE_KEY) || '[]'); return Array.isArray(a) ? a.filter(function (c) { return /^#[0-9a-f]{6}$/i.test(c); }).slice(0, MAX_PAL) : []; } catch (e) { return []; } }
  function palSet(a) { try { localStorage.setItem(PALETTE_KEY, JSON.stringify(a.slice(0, MAX_PAL))); } catch (e) {} }
  function palAdd(hex) { if (!/^#[0-9a-f]{6}$/i.test(hex)) return; hex = hex.toLowerCase(); var p = palGet(); if (p.length >= MAX_PAL || p.indexOf(hex) !== -1) return; p.push(hex); palSet(p); }

  // stop attivo (in gradiente) o la tinta
  function active() { return S.mode === 'grad' ? S.grad.stops[S.grad.active] : S.tinta; }
  function curHex() { var a = active(); if (S.mode === 'tinta' && !a.dirty && a.exact) return a.exact; return hsvHex(a); }
  function curValue() {
    if (S.mode === 'tinta') return curHex();
    var a = hsvHex(S.grad.stops[0]), b = hsvHex(S.grad.stops[1]);
    return 'linear-gradient(' + S.grad.angle + 'deg, ' + a + ' 0%, ' + b + ' 100%)';
  }
  function setActiveHex(hex, fromUser) { var rgb = hexToRgb(hex); if (!rgb) return; var hsv = rgbToHsv(rgb.r, rgb.g, rgb.b); var a = active(); a.h = hsv.h; a.s = hsv.s; a.v = hsv.v; if (S.mode === 'tinta') { a.exact = fromUser ? null : hex.toLowerCase(); a.dirty = !!fromUser; } render(); }
  function markDirty() { var a = active(); if (S.mode === 'tinta') { a.dirty = true; a.exact = null; } }

  function $(id) { return document.getElementById(id); }
  function render() {
    var a = active(), hex = hsvHex(a), hueRgb = hsvToRgb(a.h, 1, 1);
    var sv = $('cpSv');
    sv.style.backgroundImage = 'linear-gradient(to top,#000,transparent),linear-gradient(to right,#fff,transparent)';
    sv.style.backgroundColor = 'rgb(' + hueRgb.r + ',' + hueRgb.g + ',' + hueRgb.b + ')';
    $('cpSvCur').style.left = (a.s * 100) + '%'; $('cpSvCur').style.top = ((1 - a.v) * 100) + '%'; $('cpSvCur').style.background = hex;
    $('cpHueCur').style.left = ((a.h / 360) * 100) + '%';
    var rgb = hsvToRgb(a.h, a.s, a.v);
    if (document.activeElement !== $('cpHex')) $('cpHex').value = (S.mode === 'tinta' ? curHex() : hex);
    if (document.activeElement !== $('cpR')) $('cpR').value = rgb.r;
    if (document.activeElement !== $('cpG')) $('cpG').value = rgb.g;
    if (document.activeElement !== $('cpB')) $('cpB').value = rgb.b;
    // preview = valore corrente (tinta o gradiente)
    $('cpPrevNew').style.background = curValue();
    // barra gradiente
    $('cpGradWrap').style.display = (S.mode === 'grad') ? 'block' : 'none';
    if (S.mode === 'grad') {
      $('cpStopA').style.background = hsvHex(S.grad.stops[0]); $('cpStopA').classList.toggle('on', S.grad.active === 0);
      $('cpStopB').style.background = hsvHex(S.grad.stops[1]); $('cpStopB').classList.toggle('on', S.grad.active === 1);
      $('cpAngle').value = S.grad.angle; $('cpAngleV').textContent = S.grad.angle + '°';
      $('cpGradBar').style.background = curValue();
    }
    // tab
    $('cpTabTinta').classList.toggle('on', S.mode === 'tinta');
    $('cpTabGrad').classList.toggle('on', S.mode === 'grad');
    // trigger live
    if (S.input) { var tr = document.querySelector('.cp-trigger[data-target="' + S.input.id + '"]'); if (tr) tr.style.setProperty('--cp-color', curValue()); }
    renderPal();
  }
  function renderPal() {
    var box = $('cpPal'); if (!box) return; var cur = curHex().toLowerCase(); box.innerHTML = '';
    palGet().forEach(function (hex) {
      var w = document.createElement('div'); w.className = 'cp-sw-wrap';
      var sw = document.createElement('button'); sw.type = 'button'; sw.className = 'cp-sw' + (hex.toLowerCase() === cur ? ' cur' : ''); sw.style.background = hex; sw.title = hex;
      sw.addEventListener('click', function () { setActiveHex(hex); });
      w.appendChild(sw); box.appendChild(w);
    });
  }

  function parseInitial(val) {
    val = String(val || '').trim();
    var m = val.match(/linear-gradient\(\s*([\-0-9.]+)deg\s*,\s*(#[0-9a-f]{3,6})[^,]*,\s*(#[0-9a-f]{3,6})/i);
    if (m && S.allowGrad) {
      S.mode = 'grad'; S.grad.angle = Math.round(parseFloat(m[1])) || 135; S.grad.active = 0;
      [m[2], m[3]].forEach(function (hx, i) { var rgb = hexToRgb(hx); if (rgb) { var h = rgbToHsv(rgb.r, rgb.g, rgb.b); S.grad.stops[i] = { h: h.h, s: h.s, v: h.v }; } });
    } else {
      S.mode = 'tinta'; setActiveHex(/^#[0-9a-f]{3,6}$/i.test(val) ? val : '#B4823C', false); S.tinta.exact = /^#[0-9a-f]{6}$/i.test(val) ? val.toLowerCase() : null; S.tinta.dirty = false;
    }
  }

  function open(input) {
    if (!input) return; ensureModal();
    S.input = input; S.allowGrad = input.getAttribute('data-cp-gradient') === '1' || input.dataset.cpGradient === '1';
    S.origin = input.value || '#B4823C';
    $('cpTabsRow').style.display = S.allowGrad ? 'flex' : 'none';
    $('cpPrevOld').style.background = S.origin;
    parseInitial(S.origin); render();
    $('cpOvl').classList.add('on');
  }
  function close(apply) {
    if (apply && S.input) {
      var v = curValue(); S.input.value = v;
      S.input.dispatchEvent(new Event('input', { bubbles: true })); S.input.dispatchEvent(new Event('change', { bubbles: true }));
      var tr = document.querySelector('.cp-trigger[data-target="' + S.input.id + '"]'); if (tr) tr.style.setProperty('--cp-color', v);
    }
    $('cpOvl').classList.remove('on'); S.input = null;
  }

  function ensureStyles() {
    if ($('cp-styles')) return;
    var css = ''
      + '.cp-ovl{position:fixed;inset:0;background:rgba(0,0,0,.55);backdrop-filter:blur(3px);z-index:900;display:none;align-items:center;justify-content:center;padding:18px}'
      + '.cp-ovl.on{display:flex}'
      + '.cp-mod{width:320px;max-width:100%;background:var(--bg-base,#161616);border:1px solid var(--line,#333);border-radius:18px;box-shadow:0 24px 60px rgba(0,0,0,.5);color:var(--paper,#eee);overflow:hidden}'
      + '.cp-head{display:flex;align-items:center;justify-content:space-between;padding:14px 16px 8px}.cp-head h3{font-size:15px;font-weight:800}'
      + '.cp-x{background:none;border:none;color:var(--muted,#999);font-size:22px;cursor:pointer}'
      + '.cp-tabs{display:flex;gap:6px;padding:0 16px 10px}.cp-tab{flex:1;border:1px solid var(--line,#333);background:transparent;color:var(--muted,#999);border-radius:10px;padding:7px;font-weight:700;font-size:12.5px;cursor:pointer;font-family:inherit}.cp-tab.on{background:var(--gold,#E8B04B);color:#161616;border-color:var(--gold,#E8B04B)}'
      + '.cp-body{padding:0 16px 14px}'
      + '.cp-sv{position:relative;width:100%;height:150px;border-radius:12px;cursor:crosshair;margin-bottom:12px;overflow:hidden}'
      + '.cp-sv-cur{position:absolute;width:16px;height:16px;border-radius:50%;border:2px solid #fff;box-shadow:0 0 0 1px rgba(0,0,0,.4);transform:translate(-50%,-50%);pointer-events:none}'
      + '.cp-hue{position:relative;height:16px;border-radius:8px;cursor:pointer;margin-bottom:12px;background:linear-gradient(to right,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)}'
      + '.cp-hue-cur{position:absolute;top:50%;width:16px;height:16px;border-radius:50%;background:#fff;border:2px solid #fff;box-shadow:0 0 0 1px rgba(0,0,0,.5);transform:translate(-50%,-50%);pointer-events:none}'
      + '.cp-grad{margin-bottom:12px}.cp-grad-bar{height:22px;border-radius:8px;margin-bottom:8px;border:1px solid var(--line,#333)}'
      + '.cp-stops{display:flex;gap:8px;align-items:center;margin-bottom:8px}'
      + '.cp-stop{width:34px;height:26px;border-radius:8px;border:2px solid transparent;cursor:pointer}.cp-stop.on{border-color:#fff;box-shadow:0 0 0 2px var(--gold,#E8B04B)}'
      + '.cp-ang{display:flex;align-items:center;gap:8px;font-size:12px;color:var(--muted,#999)}.cp-ang input{flex:1}'
      + '.cp-prev{display:flex;gap:0;height:30px;border-radius:9px;overflow:hidden;margin-bottom:10px;border:1px solid var(--line,#333)}.cp-prev>div{flex:1}'
      + '.cp-fields{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:6px;margin-bottom:10px}.cp-fields label{font-size:9px;font-weight:800;color:var(--muted,#999);display:flex;flex-direction:column;gap:2px}.cp-fields input{background:var(--field-bg,#222);border:1px solid var(--line,#333);color:var(--paper,#eee);border-radius:7px;padding:5px;font-size:12px;font-family:inherit;width:100%}'
      + '.cp-pal-h{display:flex;align-items:center;justify-content:space-between;font-size:10px;font-weight:800;color:var(--muted,#999);margin:2px 0 6px}.cp-pal-add-btn{background:none;border:none;color:var(--gold,#E8B04B);font-weight:700;cursor:pointer;font-size:11px}'
      + '.cp-pal{display:flex;flex-wrap:wrap;gap:6px}.cp-sw{width:24px;height:24px;border-radius:7px;border:1px solid rgba(255,255,255,.2);cursor:pointer}.cp-sw.cur{outline:2px solid var(--gold,#E8B04B);outline-offset:1px}'
      + '.cp-foot{display:flex;gap:8px;padding:12px 16px;border-top:1px solid var(--line,#333)}.cp-foot button{flex:1;border-radius:10px;padding:9px;font-weight:800;font-family:inherit;cursor:pointer;font-size:13px}.cp-cancel{background:transparent;border:1px solid var(--line,#333);color:var(--muted,#999)}.cp-apply{background:var(--gold,#E8B04B);border:none;color:#161616}'
      + '.cp-trigger{width:52px;height:40px;border-radius:10px;border:1px solid var(--line,#333);cursor:pointer;background:var(--cp-color,#000);box-shadow:inset 0 0 0 2px var(--bg-base,#161)}';
    var st = document.createElement('style'); st.id = 'cp-styles'; st.textContent = css; document.head.appendChild(st);
  }

  function ensureModal() {
    ensureStyles();
    if ($('cpOvl')) return;
    var d = document.createElement('div');
    d.innerHTML = '<div class="cp-ovl" id="cpOvl"><div class="cp-mod" role="dialog">'
      + '<div class="cp-head"><h3>Scegli colore</h3><button class="cp-x" type="button">&times;</button></div>'
      + '<div class="cp-tabs" id="cpTabsRow"><button class="cp-tab" id="cpTabTinta" type="button">Tinta</button><button class="cp-tab" id="cpTabGrad" type="button">Gradiente</button></div>'
      + '<div class="cp-body">'
      + '<div class="cp-sv" id="cpSv"><div class="cp-sv-cur" id="cpSvCur"></div></div>'
      + '<div class="cp-hue" id="cpHue"><div class="cp-hue-cur" id="cpHueCur"></div></div>'
      + '<div class="cp-grad" id="cpGradWrap" style="display:none"><div class="cp-grad-bar" id="cpGradBar"></div>'
      + '<div class="cp-stops"><span style="font-size:11px;color:var(--muted,#999)">Stop:</span><button class="cp-stop" id="cpStopA" type="button" title="Colore iniziale"></button><button class="cp-stop" id="cpStopB" type="button" title="Colore finale"></button></div>'
      + '<div class="cp-ang">Angolo <input type="range" id="cpAngle" min="0" max="360" value="135"><span id="cpAngleV">135°</span></div></div>'
      + '<div class="cp-prev"><div id="cpPrevOld" title="Originale"></div><div id="cpPrevNew" title="Nuovo"></div></div>'
      + '<div class="cp-fields"><label>HEX<input type="text" id="cpHex" maxlength="7" autocomplete="off" spellcheck="false"></label>'
      + '<label>R<input type="text" inputmode="numeric" id="cpR"></label><label>G<input type="text" inputmode="numeric" id="cpG"></label><label>B<input type="text" inputmode="numeric" id="cpB"></label></div>'
      + '<p class="cp-pal-h"><span>Palette</span><button type="button" class="cp-pal-add-btn" id="cpPalAdd">+ salva</button></p><div class="cp-pal" id="cpPal"></div>'
      + '</div><div class="cp-foot"><button type="button" class="cp-cancel" id="cpCancel">Annulla</button><button type="button" class="cp-apply" id="cpApply">Applica</button></div>'
      + '</div></div>';
    document.body.appendChild(d.firstElementChild);

    $('cpOvl').addEventListener('click', function (e) { if (e.target.id === 'cpOvl') close(false); });
    document.querySelector('.cp-x').addEventListener('click', function () { close(false); });
    $('cpCancel').addEventListener('click', function () { close(false); });
    $('cpApply').addEventListener('click', function () { palAdd(curHex()); close(true); });
    $('cpTabTinta').addEventListener('click', function () { S.mode = 'tinta'; render(); });
    $('cpTabGrad').addEventListener('click', function () { S.mode = 'grad'; render(); });
    $('cpStopA').addEventListener('click', function () { S.grad.active = 0; render(); });
    $('cpStopB').addEventListener('click', function () { S.grad.active = 1; render(); });
    $('cpAngle').addEventListener('input', function () { S.grad.angle = parseInt(this.value, 10) || 0; render(); });

    var sv = $('cpSv'), dragSv = false;
    function setSv(ev) { var r = sv.getBoundingClientRect(), t = (ev.touches && ev.touches[0]) || ev; var a = active(); a.s = Math.max(0, Math.min(1, (t.clientX - r.left) / r.width)); a.v = 1 - Math.max(0, Math.min(1, (t.clientY - r.top) / r.height)); markDirty(); render(); }
    sv.addEventListener('mousedown', function (e) { dragSv = true; setSv(e); e.preventDefault(); });
    sv.addEventListener('touchstart', function (e) { dragSv = true; setSv(e); e.preventDefault(); }, { passive: false });
    document.addEventListener('mousemove', function (e) { if (dragSv) setSv(e); });
    document.addEventListener('touchmove', function (e) { if (dragSv) setSv(e); }, { passive: false });
    document.addEventListener('mouseup', function () { dragSv = false; }); document.addEventListener('touchend', function () { dragSv = false; });

    var hue = $('cpHue'), dragHue = false;
    function setHue(ev) { var r = hue.getBoundingClientRect(), t = (ev.touches && ev.touches[0]) || ev; active().h = Math.round(Math.max(0, Math.min(1, (t.clientX - r.left) / r.width)) * 360); markDirty(); render(); }
    hue.addEventListener('mousedown', function (e) { dragHue = true; setHue(e); e.preventDefault(); });
    hue.addEventListener('touchstart', function (e) { dragHue = true; setHue(e); e.preventDefault(); }, { passive: false });
    document.addEventListener('mousemove', function (e) { if (dragHue) setHue(e); });
    document.addEventListener('touchmove', function (e) { if (dragHue) setHue(e); }, { passive: false });
    document.addEventListener('mouseup', function () { dragHue = false; }); document.addEventListener('touchend', function () { dragHue = false; });

    $('cpHex').addEventListener('input', function () { var v = this.value.trim(); if (v.charAt(0) !== '#') v = '#' + v; if (/^#[0-9a-f]{6}$/i.test(v)) setActiveHex(v, true); });
    ['cpR', 'cpG', 'cpB'].forEach(function (id) { $(id).addEventListener('input', function () { this.value = this.value.replace(/[^0-9]/g, ''); var r = parseInt($('cpR').value, 10) || 0, g = parseInt($('cpG').value, 10) || 0, b = parseInt($('cpB').value, 10) || 0; setActiveHex(rgbToHex(r, g, b), true); }); });
    $('cpPalAdd').addEventListener('click', function () { palAdd(curHex()); renderPal(); });
    document.addEventListener('keydown', function (e) { if (!$('cpOvl').classList.contains('on')) return; if (e.key === 'Escape') close(false); });
  }

  // Aggancia un trigger dopo l'input (input di tipo color o data-cp)
  function attach(scope) {
    (scope || document).querySelectorAll('input[type=color]:not([data-cp-attached]),input[data-cp]:not([data-cp-attached])').forEach(function (inp) {
      if (!inp.id) inp.id = 'cpin_' + Math.random().toString(36).slice(2, 8);
      inp.dataset.cpAttached = '1'; inp.style.display = 'none';
      var tr = document.createElement('button'); tr.type = 'button'; tr.className = 'cp-trigger'; tr.dataset.target = inp.id;
      tr.style.setProperty('--cp-color', inp.value || '#B4823C'); tr.title = 'Apri color picker';
      tr.addEventListener('click', function () { open(inp); });
      inp.addEventListener('input', function () { tr.style.setProperty('--cp-color', inp.value); });
      inp.parentNode.insertBefore(tr, inp.nextSibling);
    });
  }
  function init() { if (initDone) return; initDone = true; ensureModal(); attach(document); var ob = new MutationObserver(function (m) { m.forEach(function (x) { (x.addedNodes || []).forEach(function (n) { if (n.nodeType === 1) attach(n); }); }); }); ob.observe(document.body, { childList: true, subtree: true }); }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  root.POIColorPicker = { init: init, attach: attach, open: open, palGet: palGet, palAdd: palAdd };
})(typeof window !== 'undefined' ? window : globalThis);
