/**
 * © Alessandro Castagna — 321.al / EVOLAB
 * Tutti i diritti riservati. Uso non autorizzato vietato.
 * info@321.it · https://321.al
 *
 * Lo stile dei codici QR.
 *
 * Rifatto il 21/08/2026 insieme al generatore. Il codice adesso nasce
 * vettoriale: quello che si vede qui e' esattamente quello che esce, a
 * qualunque dimensione, e si scarica in quattro modi diversi.
 *
 * Ogni forma qui dentro e' stata provata con un lettore vero: settantacinque
 * combinazioni, si leggono tutte. Se un giorno se ne aggiunge una, si prova
 * prima di metterla, perche' un QR bello che non si legge non vale niente.
 */
(function(){
  const MEDIA = 'https://media.poilove.com/qr.php';
  const PROVA = 'https://poilove.com/p/550e8400-e29b-41d4-a716-446655440000';

  function esc(s){
    return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){
      return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c];
    });
  }
  function colore(v, difetto){
    const c = String(v || '').replace(/[^0-9a-fA-F]/g, '').toUpperCase();
    return c.length === 6 ? c : difetto;
  }

  const PUNTI = [
    ['tondo','Tondo'], ['arrotondato','Arrotondato'], ['quadrato','Quadrato'],
    ['rombo','Rombo'], ['goccia','Goccia'],
  ];
  const ANGOLI = [
    ['arrotondato','Arrotondato'], ['cuscino','Cuscino'], ['tondo','Tondo'],
    ['foglia','Foglia'], ['quadrato','Quadrato'],
  ];
  const MARCHI = [['poilove','Il cuore POI•LOVE'], ['poivoice','POI•VOICE'], ['nessuno','Nessuno']];

  let box=null, st={};

  async function dati(){
    try{
      const q = await sb.from('qr_stile').select('*').eq('id',1).maybeSingle();
      st = q.data || {};
    }catch(e){ st = {}; console.warn('stile qr:', e); }
    st.colore         = colore(st.colore, 'D42B2B');
    st.colore_angoli  = colore(st.colore_angoli, st.colore);
    st.colore_pupilla = String(st.colore_pupilla || '').replace(/[^0-9a-fA-F]/g,'').toUpperCase();
    st.colore2        = String(st.colore2 || '').replace(/[^0-9a-fA-F]/g,'').toUpperCase();
    st.sfondo         = colore(st.sfondo, 'FFFFFF');
    st.sfondo_tipo    = st.sfondo_tipo || 'bianco';
    st.forma_punti    = st.forma_punti || 'tondo';
    st.forma_angoli   = st.forma_angoli || 'arrotondato';
    st.logo           = (st.logo === 'nostro' ? 'poilove' : (st.logo || 'poilove'));
    st.logo_quota     = Number(st.logo_quota || 24);
    st.margine        = Number(st.margine == null ? 2 : st.margine);
  }

  // L'indirizzo del codice, con lo stile che si sta guardando adesso.
  function indirizzo(formato, lato, sfondo){
    const p = new URLSearchParams();
    p.set('d', PROVA);
    p.set('f', formato);
    if(lato) p.set('s', String(lato));
    p.set('fp', st.forma_punti);
    p.set('fa', st.forma_angoli);
    p.set('c',  st.colore);
    if(st.colore2)        p.set('c2', st.colore2);
    p.set('ca', st.colore_angoli);
    if(st.colore_pupilla) p.set('cp', st.colore_pupilla);
    p.set('lg', st.logo);
    p.set('lq', String(st.logo_quota));
    p.set('m',  String(st.margine));
    p.set('sf', sfondo || (st.sfondo_tipo === 'colore' ? st.sfondo : st.sfondo_tipo));
    return MEDIA + '?' + p.toString();
  }

  function scelta(nome, voci, valore){
    return voci.map(function(v){
      const on = valore === v[0];
      return '<button type="button" class="btn sm'+(on?' gold':'')+'" data-scelta="'+nome+'" data-valore="'+v[0]+'" '+
             'style="padding:6px 12px;font-size:12px">'+esc(v[1])+'</button>';
    }).join('');
  }
  function campoColore(etichetta, chiave, valore, puoEsserVuoto){
    const v = valore || '';
    return '<div class="field" style="min-width:150px">'+
      '<label>'+esc(etichetta)+'</label>'+
      '<div style="display:flex;gap:7px;align-items:center">'+
        '<input type="color" data-colore="'+chiave+'" value="#'+(v || 'D42B2B')+'" '+
          'style="width:38px;height:34px;padding:2px;border:1.5px solid var(--line,#3a3a3a);border-radius:9px;background:transparent;cursor:pointer">'+
        '<input type="text" data-testo="'+chiave+'" value="'+esc(v)+'" placeholder="'+(puoEsserVuoto?'vuoto = niente':'D42B2B')+'" '+
          'maxlength="6" style="flex:1;min-width:0;font-family:ui-monospace,monospace;text-transform:uppercase">'+
        (puoEsserVuoto ? '<button type="button" class="btn sm" data-svuota="'+chiave+'" style="padding:5px 9px;font-size:11px">togli</button>' : '')+
      '</div></div>';
  }

  function disegna(){
    box.innerHTML =
      '<div class="panel" style="margin-bottom:16px">'+
        '<div class="card-h"><span class="ic"><i class="ph-duotone ph-qr-code"></i></span>Lo stile dei nostri codici</div>'+
        '<div class="sm" style="margin-bottom:4px">'+
          'Il codice nasce vettoriale: quello che vedi e\' esattamente quello che esce, a qualunque dimensione, '+
          'anche su un cartello grande un metro. Tutte le forme qui dentro sono state provate con un lettore vero.'+
        '</div>'+
      '</div>'+

      '<div style="display:flex;gap:18px;flex-wrap:wrap;align-items:flex-start">'+

        // ── l'anteprima ──
        '<div class="panel" style="flex:0 0 340px;padding:16px;text-align:center">'+
          '<div id="qrTelo" style="border-radius:14px;padding:14px;display:inline-block;background:'+
            (st.sfondo_tipo === 'trasparente'
              ? 'repeating-conic-gradient(#00000018 0% 25%, transparent 0% 50%) 50%/18px 18px'
              : '#'+(st.sfondo_tipo === 'colore' ? st.sfondo : 'FFFFFF'))+'">'+
            '<img id="qrVedi" alt="anteprima" style="width:290px;height:auto;display:block">'+
          '</div>'+
          '<div style="font-size:11.5px;opacity:.6;margin-top:9px">porta a un luogo di prova</div>'+
          '<div class="btn-row" style="margin-top:12px;justify-content:center;flex-wrap:wrap">'+
            '<a class="btn sm" id="scPngT" download="poilove-qr.png"><i class="ph-duotone ph-download-simple"></i> PNG trasparente</a>'+
            '<a class="btn sm" id="scPngB" download="poilove-qr.png"><i class="ph-duotone ph-download-simple"></i> PNG bianco</a>'+
          '</div>'+
          '<div class="btn-row" style="margin-top:7px;justify-content:center;flex-wrap:wrap">'+
            '<a class="btn sm" id="scJpgB" download="poilove-qr.jpg"><i class="ph-duotone ph-download-simple"></i> JPG bianco</a>'+
            '<a class="btn sm" id="scJpgC" download="poilove-qr.jpg"><i class="ph-duotone ph-download-simple"></i> JPG col tuo fondo</a>'+
            '<a class="btn sm gold" id="scSvg" download="poilove-qr.svg"><i class="ph-duotone ph-vector-two"></i> SVG</a>'+
          '</div>'+
          '<div style="font-size:11.5px;opacity:.55;margin-top:9px;line-height:1.5">'+
            'PNG e JPG escono a 2048 punti. L\'SVG non ha dimensione: si stampa grande quanto vuoi senza perdere niente.'+
          '</div>'+
        '</div>'+

        // ── i comandi ──
        '<div style="flex:1;min-width:320px">'+
          '<div class="panel" style="margin-bottom:12px">'+
            '<div style="font-size:13px;font-weight:900;margin-bottom:8px">La forma dei punti</div>'+
            '<div class="btn-row" style="flex-wrap:wrap">'+scelta('forma_punti', PUNTI, st.forma_punti)+'</div>'+
            '<div style="font-size:13px;font-weight:900;margin:14px 0 8px">La forma dei tre angoli</div>'+
            '<div class="btn-row" style="flex-wrap:wrap">'+scelta('forma_angoli', ANGOLI, st.forma_angoli)+'</div>'+
          '</div>'+

          '<div class="panel" style="margin-bottom:12px">'+
            '<div style="font-size:13px;font-weight:900;margin-bottom:10px">I colori</div>'+
            '<div style="display:flex;gap:12px;flex-wrap:wrap">'+
              campoColore('Punti', 'colore', st.colore, false)+
              campoColore('Secondo colore (sfumatura)', 'colore2', st.colore2, true)+
              campoColore('Angoli', 'colore_angoli', st.colore_angoli, false)+
              campoColore('Pupilla degli angoli', 'colore_pupilla', st.colore_pupilla, true)+
            '</div>'+
            '<div style="font-size:13px;font-weight:900;margin:14px 0 8px">Lo sfondo</div>'+
            '<div class="btn-row" style="flex-wrap:wrap">'+
              scelta('sfondo_tipo', [['bianco','Bianco'],['trasparente','Trasparente'],['colore','Un colore']], st.sfondo_tipo)+
            '</div>'+
            (st.sfondo_tipo === 'colore'
              ? '<div style="margin-top:10px;max-width:220px">'+campoColore('Quale colore', 'sfondo', st.sfondo, false)+'</div>' : '')+
          '</div>'+

          '<div class="panel" style="margin-bottom:12px">'+
            '<div style="font-size:13px;font-weight:900;margin-bottom:8px">Il marchio in mezzo</div>'+
            '<div class="btn-row" style="flex-wrap:wrap">'+scelta('logo', MARCHI, st.logo)+'</div>'+
            (st.logo !== 'nessuno'
              ? '<div style="margin-top:12px">'+
                '<label style="font-size:12.5px;font-weight:700">quanto e\' grande: <b id="qrLqV">'+st.logo_quota+'%</b></label>'+
                '<input type="range" min="10" max="30" step="1" value="'+st.logo_quota+'" data-cursore="logo_quota" style="width:100%;margin-top:6px">'+
                '<div style="font-size:11.5px;opacity:.55">Oltre il venticinque per cento il codice regge lo stesso, ma il lettore fatica di piu\' con la luce bassa.</div>'+
                '</div>' : '')+
            '<div style="margin-top:14px">'+
              '<label style="font-size:12.5px;font-weight:700">margine attorno: <b id="qrMgV">'+st.margine+'</b> moduli</label>'+
              '<input type="range" min="0" max="6" step="1" value="'+st.margine+'" data-cursore="margine" style="width:100%;margin-top:6px">'+
              '<div style="font-size:11.5px;opacity:.55">Sotto due, alcuni lettori vecchi faticano. Per la stampa lascia almeno due.</div>'+
            '</div>'+
          '</div>'+

          '<div class="btn-row">'+
            '<button class="btn gold" id="qrSalva"><i class="ph-duotone ph-floppy-disk"></i> Salva come stile di tutti i QR</button>'+
            '<button class="btn sm" id="qrRimetti"><i class="ph-duotone ph-arrow-counter-clockwise"></i> Rimetti come era</button>'+
          '</div>'+
          '<div id="qrEsito" style="margin-top:9px;font-size:12.5px;font-weight:700"></div>'+
        '</div>'+
      '</div>';

    aggiornaAnteprima();

    box.querySelectorAll('[data-scelta]').forEach(function(b){
      b.onclick = function(){ st[b.dataset.scelta] = b.dataset.valore; disegna(); };
    });
    box.querySelectorAll('[data-colore]').forEach(function(i){
      i.oninput = function(){
        const k = i.dataset.colore;
        st[k] = i.value.replace('#','').toUpperCase();
        const t = box.querySelector('[data-testo="'+k+'"]'); if(t) t.value = st[k];
        aggiornaAnteprima();
      };
    });
    box.querySelectorAll('[data-testo]').forEach(function(i){
      i.oninput = function(){
        const k = i.dataset.testo;
        const v = i.value.replace(/[^0-9a-fA-F]/g,'').toUpperCase();
        if(v.length === 6){
          st[k] = v;
          const c = box.querySelector('[data-colore="'+k+'"]'); if(c) c.value = '#'+v;
          aggiornaAnteprima();
        } else if(v.length === 0){ st[k] = ''; aggiornaAnteprima(); }
      };
    });
    box.querySelectorAll('[data-svuota]').forEach(function(b){
      b.onclick = function(){ st[b.dataset.svuota] = ''; disegna(); };
    });
    box.querySelectorAll('[data-cursore]').forEach(function(i){
      i.oninput = function(){
        st[i.dataset.cursore] = Number(i.value);
        const e = document.getElementById(i.dataset.cursore === 'margine' ? 'qrMgV' : 'qrLqV');
        if(e) e.textContent = i.dataset.cursore === 'margine' ? i.value : i.value + '%';
        aggiornaAnteprima();
      };
    });
    document.getElementById('qrSalva').onclick   = salva;
    document.getElementById('qrRimetti').onclick = async function(){ await dati(); disegna(); };
  }

  let attesa = null;
  function aggiornaAnteprima(){
    clearTimeout(attesa);
    attesa = setTimeout(function(){
      const img = document.getElementById('qrVedi');
      if(img) img.src = indirizzo('png', 600);
      const telo = document.getElementById('qrTelo');
      if(telo){
        telo.style.background = st.sfondo_tipo === 'trasparente'
          ? 'repeating-conic-gradient(#00000018 0% 25%, transparent 0% 50%) 50%/18px 18px'
          : '#' + (st.sfondo_tipo === 'colore' ? st.sfondo : 'FFFFFF');
      }
      const g = function(id, f, lato, sf){ const a = document.getElementById(id); if(a) a.href = indirizzo(f, lato, sf); };
      g('scPngT','png',2048,'trasparente');
      g('scPngB','png',2048,'bianco');
      g('scJpgB','jpg',2048,'bianco');
      g('scJpgC','jpg',2048, st.sfondo_tipo === 'colore' ? st.sfondo : 'EAE4D8');
      g('scSvg','svg',0, st.sfondo_tipo === 'colore' ? st.sfondo : st.sfondo_tipo);
    }, 220);
  }

  async function salva(){
    const e = document.getElementById('qrEsito');
    const b = document.getElementById('qrSalva');
    if(!confirm('Salvo questo come stile di TUTTI i codici QR?\n\nVale per i QR dei luoghi, dei profili e delle attivita.')) return;
    b.disabled = true;
    e.textContent = 'Salvo…'; e.style.color = 'inherit';
    try{
      const { data, error } = await sb.from('qr_stile').update({
        colore: st.colore, colore2: st.colore2 || null,
        colore_angoli: st.colore_angoli, colore_pupilla: st.colore_pupilla || null,
        sfondo: st.sfondo, sfondo_tipo: st.sfondo_tipo,
        forma_punti: st.forma_punti, forma_angoli: st.forma_angoli,
        logo: st.logo, logo_quota: st.logo_quota, margine: st.margine,
        aggiornato: new Date().toISOString(),
      }).eq('id', 1).select('id');
      if(error) throw error;
      if(!data || !data.length) throw new Error('il database non ha accettato: se la sessione non ha il secondo fattore, esci e rientra col codice a sei cifre');
      e.textContent = 'Salvato. Da adesso tutti i QR nuovi escono cosi.'; e.style.color = '#5BBE7E';
    }catch(err){ e.textContent = 'Non sono riuscito: '+(err.message||''); e.style.color = '#E06A6A'; }
    finally{ b.disabled = false; }
  }

  async function load(contenitore){
    box = contenitore;
    box.innerHTML = '<div class="panel" style="padding:26px;opacity:.7">Carico lo stile…</div>';
    await dati();
    disegna();
  }
  window.QrEditor = { load };
})();
