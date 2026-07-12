/*
 * © Alessandro Castagna — 321.al / EVOLAB
 * Tutti i diritti riservati. Uso non autorizzato vietato.
 * info@321.al · https://321.al
 *
 * A2 — Scheda UTENTE ricca, come il profilo dell'app: copertina, avatar, nome + @handle, stato,
 * livello (tier), punti, bio, statistiche REALI (luoghi creati) e la lista dei suoi luoghi (cliccabili
 * → scheda POI). Sotto, i comandi admin (messaggia, cambia livello, sospendi/banna/riattiva), che
 * riusano le funzioni del pannello. Dati veri caricati da Supabase all'apertura (mai numeri finti).
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
  function initials(s) { s = String(s || '?').trim(); var p = s.split(/\s+/); return ((p[0][0] || '?') + (p[1] ? p[1][0] : '')).toUpperCase(); }
  function fmtDate(d) { try { return new Date(d).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' }); } catch (e) { return '—'; } }
  function t(k, def) { try { return (typeof window.t === 'function') ? window.t(k, def) : def; } catch (e) { return def; } }
  function sb() { return window.sb || null; }
  function img(u) { return /^https?:\/\//i.test(u || '') ? u : ''; }

  function ensureStyles() {
    if (document.getElementById('uc-styles')) return;
    var css = ''
      + '.uc-ov{position:fixed;inset:0;background:rgba(0,0,0,.5);backdrop-filter:blur(3px);z-index:720;display:flex;justify-content:flex-end;opacity:0;transition:opacity .2s}'
      + '.uc-ov.on{opacity:1}'
      + '.uc-drawer{--red:#D42B2B;--blue:#285EA7;--card:#FDFAF5;--text:#1C1C1C;--muted:#6B6B6B;--border:rgba(0,0,0,.09);width:min(430px,100%);height:100%;overflow:auto;background:#EAE4D8;box-shadow:-8px 0 40px rgba(0,0,0,.35);transform:translateX(28px);transition:transform .22s cubic-bezier(.2,.8,.2,1);color:var(--text)}'
      + '.uc-ov.on .uc-drawer{transform:none}'
      + '.uc-cover{position:relative;height:120px;background:linear-gradient(135deg,#D42B2B,#7C3AED)}'
      + '.uc-cover img{width:100%;height:100%;object-fit:cover}'
      + '.uc-close{position:absolute;top:10px;right:12px;width:34px;height:34px;border-radius:50%;background:#fff;border:none;cursor:pointer;font-size:18px;color:#444;box-shadow:0 2px 14px rgba(0,0,0,.26)}'
      + '.uc-avatar{width:78px;height:78px;border-radius:50%;border:4px solid #FDFAF5;object-fit:cover;background:#D42B2B;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:28px;margin:-42px 0 0 20px;position:relative;box-shadow:0 6px 18px rgba(0,0,0,.2)}'
      + '.uc-head{padding:8px 20px 0}'
      + '.uc-nm{font-size:21px;font-weight:900;line-height:1.1}'
      + '.uc-handle{font-size:13px;color:var(--muted);margin-top:1px}'
      + '.uc-badges{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}'
      + '.uc-chip{display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:800;padding:4px 11px;border-radius:20px}'
      + '.uc-chip.green{background:#E7F6EC;color:#1a7f3c}.uc-chip.gold{background:#FCEFCF;color:#8a6516}.uc-chip.red{background:#FBE3E3;color:#b3261e}.uc-chip.blue{background:#EBF2FC;color:#285EA7}'
      + '.uc-stats{display:flex;gap:10px;padding:16px 20px 6px}'
      + '.uc-stat{flex:1;background:var(--card);border:1px solid var(--border);border-radius:14px;padding:11px;text-align:center}'
      + '.uc-stat b{display:block;font-size:19px;font-weight:900;color:var(--text)}.uc-stat span{font-size:10.5px;color:var(--muted);font-weight:700}'
      + '.uc-bio{margin:8px 20px 0;font-size:13.5px;line-height:1.5;color:var(--text);background:var(--card);border:1px solid var(--border);border-radius:14px;padding:12px}'
      + '.uc-sec{font-size:10px;font-weight:800;letter-spacing:.7px;text-transform:uppercase;color:var(--muted);margin:18px 20px 8px}'
      + '.uc-poi{margin:0 20px}'
      + '.uc-poi-row{display:flex;align-items:center;gap:10px;background:var(--card);border:1px solid var(--border);border-radius:12px;padding:9px 11px;margin-bottom:7px;cursor:pointer}'
      + '.uc-poi-row:hover{border-color:var(--red)}'
      + '.uc-poi-th{width:38px;height:38px;border-radius:9px;object-fit:cover;background:#eee;flex:none;display:flex;align-items:center;justify-content:center;color:var(--red)}'
      + '.uc-poi-nm{font-weight:700;font-size:13.5px;flex:1;min-width:0}.uc-poi-love{font-size:12px;color:var(--red);font-weight:800}'
      + '.uc-empty{color:var(--muted);font-size:13px;padding:4px 20px}'
      + '.uc-admin{margin:16px 20px 30px}'
      + '.uc-actions{display:flex;flex-wrap:wrap;gap:8px;align-items:center}'
      + '.uc-btn{border:1px solid rgba(0,0,0,.12);background:#fff;color:#241f18;border-radius:11px;padding:9px 13px;font-size:12.5px;font-weight:700;font-family:inherit;cursor:pointer}'
      + '.uc-btn.gold{background:#e0a52b;color:#3a2600;border-color:#e0a52b}.uc-btn.red{background:#D42B2B;color:#fff;border-color:#D42B2B}.uc-btn.green{background:#1a7f3c;color:#fff;border-color:#1a7f3c}'
      + '.uc-drawer .tier-select{background:#fff;color:#241f18;border:1px solid rgba(0,0,0,.15);border-radius:10px;padding:8px 10px;font-family:inherit}';
    var st = document.createElement('style'); st.id = 'uc-styles'; st.textContent = css; document.head.appendChild(st);
  }

  function close() {
    var ov = document.getElementById('uc-ov'); if (!ov) return;
    ov.classList.remove('on'); setTimeout(function () { if (ov.parentNode) ov.parentNode.removeChild(ov); }, 220);
  }

  function statusChip(stt) {
    stt = stt || 'active';
    var cls = stt === 'active' ? 'green' : (stt === 'suspended' ? 'gold' : 'red');
    var lbl = stt === 'active' ? t('st_active', 'Attivo') : (stt === 'suspended' ? t('st_suspended', 'Sospeso') : t('st_banned', 'Bannato'));
    return h('span', { class: 'uc-chip ' + cls, text: lbl });
  }

  function open(u) {
    if (!u) return;
    ensureStyles();
    close();
    var stt = u.moderation_status || 'active';

    // ── cover + avatar ──
    var cover = h('div', { class: 'uc-cover' });
    var closeBtn = h('button', { class: 'uc-close', text: '×', title: 'Chiudi', onclick: close });
    var avatar = img(u.avatar_url) ? h('img', { class: 'uc-avatar', src: u.avatar_url, alt: '' }) : h('div', { class: 'uc-avatar', text: initials(u.username) });

    var badges = h('div', { class: 'uc-badges' }, [
      statusChip(stt),
      h('span', { class: 'uc-chip blue', text: u.special_tier ? u.special_tier : 'free' })
    ]);
    if (u.moderation_reason) badges.appendChild(h('span', { class: 'uc-chip red', text: u.moderation_reason }));

    var head = h('div', { class: 'uc-head' }, [
      h('div', { class: 'uc-nm', text: u.username || 'utente' }),
      h('div', { class: 'uc-handle', text: '@' + (u.username || 'utente') }),
      badges
    ]);

    // ── statistiche (POI reali caricati dopo) ──
    var statPoi = h('b', { text: '…' });
    var stats = h('div', { class: 'uc-stats' }, [
      h('div', { class: 'uc-stat' }, [statPoi, h('span', { text: 'Luoghi creati' })]),
      h('div', { class: 'uc-stat' }, [h('b', { text: (u.points != null ? String(u.points) : '0') }), h('span', { text: 'Punti' })]),
      h('div', { class: 'uc-stat' }, [h('b', { text: fmtDate(u.created_at).slice(0, 5) }), h('span', { text: 'Iscritto ' + (fmtDate(u.created_at).slice(-4)) })])
    ]);

    var bioEl = h('div', { class: 'uc-bio', style: 'display:none' });

    // ── luoghi creati (lista) ──
    var poiSec = h('div', { class: 'uc-sec', text: 'Luoghi creati', style: 'display:none' });
    var poiList = h('div', { class: 'uc-poi' });

    // ── azioni admin ──
    var actions = h('div', { class: 'uc-actions' });
    actions.appendChild(h('button', { class: 'uc-btn', text: t('a_message', 'Messaggia'), onclick: function () { if (window.startSupportWith) { close(); window.startSupportWith(u.id, u.username, u.avatar_url); } } }));
    var tierNode = (typeof window.tierSelect === 'function') ? window.tierSelect(u.id, u.special_tier) : null;
    if (tierNode) actions.appendChild(tierNode);
    if (stt === 'active') {
      actions.appendChild(h('button', { class: 'uc-btn gold', text: t('a_suspend', 'Sospendi'), onclick: function () { if (window.moderateUser) { window.moderateUser(u.id, 'suspended', 'from_card', new Date(Date.now() + 7 * 864e5).toISOString()); close(); } } }));
      actions.appendChild(h('button', { class: 'uc-btn red', text: t('a_ban', 'Banna'), onclick: function () { if (window.adminConfirm) window.adminConfirm(t('confirm_ban', 'Bannare definitivamente questo utente?')).then(function (ok) { if (ok && window.moderateUser) { window.moderateUser(u.id, 'banned', 'from_card', null); close(); } }); } }));
    } else {
      actions.appendChild(h('button', { class: 'uc-btn green', text: t('a_reactivate', 'Riattiva'), onclick: function () { if (window.moderateUser) { window.moderateUser(u.id, 'active', 'from_card', null); close(); } } }));
    }
    var admin = h('div', { class: 'uc-admin' }, [h('div', { class: 'uc-sec', style: 'margin:0 0 8px', text: t('c_actions', 'Azioni amministratore') }), actions]);

    var drawer = h('div', { class: 'uc-drawer' }, [
      h('div', null, [cover, closeBtn, avatar]),
      head, stats, bioEl, poiSec, poiList, admin
    ]);
    var ov = h('div', { class: 'uc-ov', id: 'uc-ov', onclick: function (e) { if (e.target === ov) close(); } }, [drawer]);
    document.body.appendChild(ov);
    requestAnimationFrame(function () { ov.classList.add('on'); });
    document.addEventListener('keydown', function esc(e) { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc); } });

    // ── dati reali: profilo (bio/cover) + conteggio POI + luoghi creati ──
    var db = sb();
    if (!db) return;
    db.from('profiles').select('bio,cover_url,cover_type').eq('id', u.id).maybeSingle().then(function (r) {
      var pr = r && r.data; if (!pr) return;
      if (pr.cover_url && pr.cover_type === 'image' && img(pr.cover_url)) cover.appendChild(h('img', { src: pr.cover_url, alt: '' }));
      else if (pr.cover_url && /^linear-gradient|^radial-gradient|^#/.test(pr.cover_url)) cover.style.background = pr.cover_url;
      if (pr.bio) { bioEl.textContent = pr.bio; bioEl.style.display = 'block'; }
    });
    db.from('pois').select('id,title,description,category,subcategory,categories,tags,photos,cover_photo,address,city,country,lat,lng,love_count,visibility,is_approved,created_via,removed_at,badge_official,badge_essential,badge_tier,created_at')
      .eq('author_id', u.id).is('removed_at', null).order('created_at', { ascending: false }).limit(12)
      .then(function (r) {
        var rows = (r && r.data) || [];
        statPoi.textContent = String(rows.length) + (rows.length >= 12 ? '+' : '');
        if (!rows.length) { poiSec.style.display = 'block'; poiList.appendChild(h('div', { class: 'uc-empty', text: 'Nessun luogo pubblico.' })); return; }
        poiSec.style.display = 'block';
        rows.forEach(function (p) {
          var th = img((p.photos && p.photos[0]) || p.cover_photo);
          var thumb = th ? h('img', { class: 'uc-poi-th', src: th, alt: '' }) : h('div', { class: 'uc-poi-th' }, h('i', { class: 'ph-duotone ph-map-pin' }));
          poiList.appendChild(h('div', { class: 'uc-poi-row', onclick: function () { if (window.AdminPoiCard) AdminPoiCard.open(p); } }, [
            thumb, h('div', { class: 'uc-poi-nm', text: p.title || '—' }),
            h('div', { class: 'uc-poi-love' }, [h('i', { class: 'ph-duotone ph-heart' }), document.createTextNode(' ' + (p.love_count || 0))])
          ]));
        });
      });
  }

  window.AdminUserCard = { open: open, close: close };
})();
