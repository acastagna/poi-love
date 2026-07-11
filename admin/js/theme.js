/*
 * © Alessandro Castagna — 321.al / EVOLAB
 * Tutti i diritti riservati. Uso non autorizzato vietato.
 * info@321.al · https://321.al
 *
 * A6 — Controller tema + palette (modulo condiviso, unica implementazione).
 * Espone window.AdminTheme. Le definizioni colore vivono in css/palette.css.
 *   data-theme   : 'dark' | 'light'   (persistito in localStorage 'admin_theme')
 *   data-palette : 'warm' | 'neutral' | 'cold'  (persistito in localStorage 'admin_palette')
 * Il set PRE-PAINT (anti-flash) avviene inline nel <head> di panel.html; qui c'è la logica
 * runtime (toggle, selezione, aggiornamento UI). Nessun colore hardcoded qui.
 */
(function () {
  var THEMES = ['dark', 'light'];
  var PALETTES = ['warm', 'neutral', 'cold'];
  var PAL_LABEL = { warm: 'Calda', neutral: 'Neutra', cold: 'Fredda' };

  function root() { return document.documentElement; }
  function safeGet(k, def) { try { var v = localStorage.getItem(k); return v || def; } catch (e) { return def; } }
  function safeSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  function applyTheme(theme) {
    var th = (theme === 'light') ? 'light' : 'dark';
    root().setAttribute('data-theme', th);
    safeSet('admin_theme', th);
    var btn = document.getElementById('themeToggle');
    if (btn) btn.setAttribute('aria-pressed', th === 'light' ? 'true' : 'false');
    return th;
  }

  function applyPalette(pal) {
    var p = (PALETTES.indexOf(pal) >= 0) ? pal : 'warm';
    root().setAttribute('data-palette', p);
    safeSet('admin_palette', p);
    // stato UI del selettore (le pastiglie)
    var dots = document.querySelectorAll('.pal-dot');
    for (var i = 0; i < dots.length; i++) {
      dots[i].classList.toggle('on', dots[i].getAttribute('data-pal') === p);
    }
    return p;
  }

  function currentTheme() { return root().getAttribute('data-theme') === 'light' ? 'light' : 'dark'; }
  function currentPalette() {
    var p = root().getAttribute('data-palette');
    return PALETTES.indexOf(p) >= 0 ? p : 'warm';
  }

  function toggleTheme() { return applyTheme(currentTheme() === 'light' ? 'dark' : 'light'); }

  // Riallinea gli attributi (già impostati pre-paint) e lo stato dei bottoni all'avvio.
  function sync() {
    applyTheme(safeGet('admin_theme', 'dark'));
    applyPalette(safeGet('admin_palette', 'warm'));
  }

  // Costruisce il selettore palette (tre pastiglie) dentro un contenitore dato.
  function mountPicker(container) {
    if (!container) return;
    container.innerHTML = '';
    container.classList.add('pal-picker');
    PALETTES.forEach(function (p) {
      var b = document.createElement('button');
      b.className = 'pal-dot';
      b.setAttribute('data-pal', p);
      b.setAttribute('type', 'button');
      b.setAttribute('title', PAL_LABEL[p]);
      b.setAttribute('aria-label', 'Palette ' + PAL_LABEL[p]);
      b.addEventListener('click', function () { applyPalette(p); });
      container.appendChild(b);
    });
    applyPalette(currentPalette());
  }

  window.AdminTheme = {
    THEMES: THEMES, PALETTES: PALETTES,
    applyTheme: applyTheme, applyPalette: applyPalette,
    toggleTheme: toggleTheme, currentTheme: currentTheme, currentPalette: currentPalette,
    sync: sync, mountPicker: mountPicker
  };
})();
