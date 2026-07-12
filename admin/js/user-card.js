/*
 * © Alessandro Castagna — 321.al / EVOLAB
 * Tutti i diritti riservati. Uso non autorizzato vietato.
 * info@321.al · https://321.al
 *
 * A2 — Scheda UTENTE riusabile (drawer). window.AdminUserCard.open(u) apre un pannello laterale
 * col profilo (avatar, @username, tier, punti, stato, data, motivo moderazione) e i comandi admin
 * (messaggia, cambia livello, sospendi/banna/riattiva). I comandi riusano le funzioni già presenti
 * nel pannello (moderateUser, setUserTier/tierSelect, startSupportWith): un solo posto per le azioni.
 * Richiamabile da Utenti, Dashboard, Moderazione, Messaggi (basta passare l'oggetto profilo).
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
    if (kids) (Array.isArray(kids) ? kids : [kids]).forEach(function (c) { if (c == null) return; n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return n;
  }
  function initials(s) { s = String(s || '?').trim(); return (s[0] || '?').toUpperCase(); }
  function fmtDate(d) { try { return new Date(d).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' }); } catch (e) { return '—'; } }
  // usa il traduttore del pannello se c'è, altrimenti il fallback italiano
  function t(k, def) { try { return (typeof window.t === 'function') ? window.t(k, def) : def; } catch (e) { return def; } }

  function ensureStyles() {
    if (document.getElementById('uc-styles')) return;
    var css = ''
      + '.uc-ov{position:fixed;inset:0;background:rgba(0,0,0,.5);backdrop-filter:blur(3px);z-index:700;display:flex;justify-content:flex-end;opacity:0;transition:opacity .2s}'
      + '.uc-ov.on{opacity:1}'
      + '.uc-drawer{width:min(440px,100%);height:100%;background:var(--bg-base);border-left:1px solid var(--line);box-shadow:var(--shadow-soft);overflow:auto;transform:translateX(24px);transition:transform .22s cubic-bezier(.2,.8,.2,1)}'
      + '.uc-ov.on .uc-drawer{transform:none}'
      + '.uc-hd{display:flex;align-items:center;gap:14px;padding:22px 22px 16px;border-bottom:1px solid var(--line)}'
      + '.uc-ava{width:58px;height:58px;border-radius:50%;object-fit:cover;flex:none;background:color-mix(in srgb,var(--gold) 22%,transparent);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:22px;color:var(--paper)}'
      + '.uc-nm{font-size:19px;font-weight:800}.uc-sub{font-size:12.5px;color:var(--muted);margin-top:2px}'
      + '.uc-close{margin-left:auto;background:none;border:none;color:var(--muted);font-size:26px;line-height:1;cursor:pointer;padding:2px 6px}'
      + '.uc-close:hover{color:var(--red)}'
      + '.uc-body{padding:18px 22px 30px}'
      + '.uc-facts{list-style:none;border:1px solid var(--line);border-radius:14px;overflow:hidden;margin:0 0 18px}'
      + '.uc-facts li{display:flex;gap:10px;padding:11px 14px;font-size:13.5px;border-bottom:1px solid var(--line)}'
      + '.uc-facts li:last-child{border-bottom:none}.uc-facts .k{color:var(--muted);min-width:120px;font-weight:700}'
      + '.uc-sect{font-size:11.5px;font-weight:800;letter-spacing:.5px;text-transform:uppercase;color:var(--muted);margin:8px 0 10px}'
      + '.uc-actions{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:8px}'
      + '.uc-chip{display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:800;padding:4px 10px;border-radius:20px;border:1px solid var(--line)}'
      + '.uc-chip.green{color:var(--ok);border-color:color-mix(in srgb,var(--ok) 45%,transparent);background:color-mix(in srgb,var(--ok) 12%,transparent)}'
      + '.uc-chip.gold{color:var(--gold);border-color:color-mix(in srgb,var(--gold) 45%,transparent);background:color-mix(in srgb,var(--gold) 12%,transparent)}'
      + '.uc-chip.red{color:var(--bad);border-color:color-mix(in srgb,var(--bad) 45%,transparent);background:color-mix(in srgb,var(--bad) 12%,transparent)}'
      + '.uc-btn{border:1px solid var(--line);background:var(--glass-soft);color:var(--paper);border-radius:11px;padding:8px 13px;font-size:12.5px;font-weight:700;font-family:inherit;cursor:pointer}'
      + '.uc-btn.gold{background:var(--gold);color:var(--on-accent,#16110d);border-color:var(--gold)}'
      + '.uc-btn.red{background:var(--red);color:#fff;border-color:var(--red)}'
      + '.uc-btn.green{background:var(--ok);color:#12321a;border-color:var(--ok)}';
    var st = document.createElement('style'); st.id = 'uc-styles'; st.textContent = css; document.head.appendChild(st);
  }

  function close() {
    var ov = document.getElementById('uc-ov'); if (!ov) return;
    ov.classList.remove('on'); setTimeout(function () { if (ov.parentNode) ov.parentNode.removeChild(ov); }, 220);
  }

  function statusChip(st) {
    st = st || 'active';
    var cls = st === 'active' ? 'green' : (st === 'suspended' ? 'gold' : 'red');
    var lbl = st === 'active' ? t('st_active', 'Attivo') : (st === 'suspended' ? t('st_suspended', 'Sospeso') : t('st_banned', 'Bannato'));
    return h('span', { class: 'uc-chip ' + cls, text: lbl });
  }

  function open(u) {
    if (!u) return;
    ensureStyles();
    close();
    var st = u.moderation_status || 'active';
    var ava = u.avatar_url ? h('img', { class: 'uc-ava', src: u.avatar_url, alt: '' }) : h('div', { class: 'uc-ava', text: initials(u.username) });

    // Comandi (riusano le funzioni globali del pannello, se presenti)
    var actions = h('div', { class: 'uc-actions' });
    actions.appendChild(h('button', { class: 'uc-btn', text: t('a_message', 'Messaggia'), onclick: function () { if (window.startSupportWith) { close(); window.startSupportWith(u.id, u.username, u.avatar_url); } } }));
    if (st === 'active') {
      actions.appendChild(h('button', { class: 'uc-btn gold', text: t('a_suspend', 'Sospendi'), onclick: function () { if (window.moderateUser) { window.moderateUser(u.id, 'suspended', 'from_card', new Date(Date.now() + 7 * 864e5).toISOString()); close(); } } }));
      actions.appendChild(h('button', { class: 'uc-btn red', text: t('a_ban', 'Banna'), onclick: function () { if (window.adminConfirm) { window.adminConfirm(t('confirm_ban', 'Bannare definitivamente questo utente?')).then(function (ok) { if (ok && window.moderateUser) { window.moderateUser(u.id, 'banned', 'from_card', null); close(); } }); } } }));
    } else {
      actions.appendChild(h('button', { class: 'uc-btn green', text: t('a_reactivate', 'Riattiva'), onclick: function () { if (window.moderateUser) { window.moderateUser(u.id, 'active', 'from_card', null); close(); } } }));
    }

    // Selettore tier (riusa tierSelect del pannello se disponibile)
    var tierNode = (typeof window.tierSelect === 'function') ? window.tierSelect(u.id, u.special_tier) : h('span', { class: 'uc-chip gold', text: u.special_tier || 'free' });

    var facts = h('ul', { class: 'uc-facts' }, [
      h('li', null, [h('span', { class: 'k', text: t('c_tier', 'Livello') }), tierNode]),
      (u.points != null ? h('li', null, [h('span', { class: 'k', text: 'Punti' }), h('span', { text: String(u.points) })]) : null),
      h('li', null, [h('span', { class: 'k', text: t('c_date', 'Iscritto') }), h('span', { text: fmtDate(u.created_at) })]),
      (u.moderation_reason ? h('li', null, [h('span', { class: 'k', text: 'Motivo' }), h('span', { text: u.moderation_reason })]) : null)
    ]);

    var drawer = h('div', { class: 'uc-drawer' }, [
      h('div', { class: 'uc-hd' }, [
        ava,
        h('div', null, [h('div', { class: 'uc-nm', text: '@' + (u.username || 'utente') }), h('div', { class: 'uc-sub' }, [statusChip(st)])]),
        h('button', { class: 'uc-close', text: '×', title: 'Chiudi', onclick: close })
      ]),
      h('div', { class: 'uc-body' }, [
        h('div', { class: 'uc-sect', text: t('nav_users', 'Profilo') }),
        facts,
        h('div', { class: 'uc-sect', text: t('c_actions', 'Azioni') }),
        actions
      ])
    ]);

    var ov = h('div', { class: 'uc-ov', id: 'uc-ov', onclick: function (e) { if (e.target === ov) close(); } }, [drawer]);
    document.body.appendChild(ov);
    requestAnimationFrame(function () { ov.classList.add('on'); });
    document.addEventListener('keydown', function esc(e) { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc); } });
  }

  window.AdminUserCard = { open: open, close: close };
})();
