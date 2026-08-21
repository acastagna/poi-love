/**
 * © Alessandro Castagna — 321.al / EVOLAB
 * Tutti i diritti riservati. Uso non autorizzato vietato.
 * info@321.it · https://321.al
 *
 * Editor di stile dei QR.
 * I codici li disegniamo noi (media.poilove.com/qr.php), quindi possiamo dargli
 * la nostra faccia: forma dei punti, forma dei tre angoli, colori, marchio in
 * mezzo, margine. Qui si prova dal vivo e si salva: da quel momento tutti i QR
 * dell'app nascono cosi'.
 */
(function(){
  // I dati che finiscono nel pannello li scrivono gli utenti, o addirittura
  // chiunque su OpenStreetMap. Qui si puliscono SEMPRE prima di metterli nella
  // pagina, altrimenti un nome scritto apposta esegue codice dentro la sessione
  // di chi modera.
  function esc(s){
    return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){
      return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c];
    });
  }

  const QR = 'https://media.poilove.com/qr.php';
  const ESEMPIO = 'https://poilove.com/@alessandro';
  let S = null, box = null;

  const FORME = [
    { k:'quadrato',    n:'Quadrati' },
    { k:'arrotondato', n:'Arrotondati' },
    { k:'tondo',       n:'Tondi' },
  ];

  function url(extra){
    const p = new URLSearchParams({
      d: (extra && extra.d) || ESEMPIO,
      s: (extra && extra.s) || 420,
      c: S.colore, ca: S.colore_angoli, bg: S.sfondo,
      fp: S.forma_punti, fa: S.forma_angoli,
      lg: S.logo, lq: S.logo_quota, m: S.margine,
      _: Date.now(),
    });
    if (extra && extra.t) p.set('t', extra.t);
    return QR + '?' + p.toString();
  }

  function riga(titolo, dentro){
    return '<div style="margin-bottom:14px"><div style="font-size:11px;font-weight:800;text-transform:uppercase;'+
           'letter-spacing:.5px;opacity:.6;margin-bottom:6px">'+titolo+'</div>'+dentro+'</div>';
  }
  function bottoniForma(campo){
    return '<div style="display:flex;gap:6px;flex-wrap:wrap">'+FORME.map(f=>
      '<button class="qr-f" data-campo="'+campo+'" data-val="'+f.k+'" style="border:1.5px solid var(--line,#3a3a3a);'+
      'background:'+(S[campo]===f.k?'var(--gold,#C9A227)':'transparent')+';color:'+(S[campo]===f.k?'#1a1a1a':'inherit')+';'+
      'border-radius:11px;padding:7px 13px;font-family:inherit;font-weight:800;font-size:12.5px;cursor:pointer">'+f.n+'</button>').join('')+'</div>';
  }
  function colore(campo, titolo){
    return riga(titolo, '<div style="display:flex;align-items:center;gap:9px">'+
      '<input type="color" data-campo="'+campo+'" value="#'+S[campo]+'" style="width:46px;height:34px;border:none;'+
      'background:none;cursor:pointer;padding:0">'+
      '<input type="text" data-campo="'+campo+'" data-testo="1" value="'+S[campo]+'" maxlength="6" '+
      'style="width:96px;height:34px;border:1.5px solid var(--line,#3a3a3a);border-radius:9px;background:transparent;'+
      'color:inherit;font-family:ui-monospace,monospace;font-size:13px;padding:0 10px;text-transform:uppercase"></div>');
  }

  function disegna(){
    box.innerHTML =
      '<div class="panel" style="display:grid;grid-template-columns:minmax(280px,1fr) minmax(300px,420px);gap:22px;align-items:start">'+
        '<div>'+
          '<h3 style="margin:0 0 4px;font-size:17px">Stile dei QR</h3>'+
          '<div style="font-size:12.5px;opacity:.65;margin-bottom:16px;line-height:1.5">'+
            'I codici sono nostri: qui si decide come sono fatti. Lo stile vale per tutti i QR dell\'app, '+
            'quelli dei locali, dei professionisti e degli influencer.</div>'+
          riga('Forma dei punti', bottoniForma('forma_punti'))+
          riga('Forma dei tre angoli', bottoniForma('forma_angoli'))+
          colore('colore','Colore dei punti')+
          colore('colore_angoli','Colore degli angoli')+
          colore('sfondo','Sfondo')+
          riga('Marchio in mezzo',
            '<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center">'+
            '<button class="qr-f" data-campo="logo" data-val="nostro" style="border:1.5px solid var(--line,#3a3a3a);'+
              'background:'+(S.logo==='nostro'?'var(--gold,#C9A227)':'transparent')+';color:'+(S.logo==='nostro'?'#1a1a1a':'inherit')+';'+
              'border-radius:11px;padding:7px 13px;font-family:inherit;font-weight:800;font-size:12.5px;cursor:pointer">Il nostro segno</button>'+
            '<button class="qr-f" data-campo="logo" data-val="nessuno" style="border:1.5px solid var(--line,#3a3a3a);'+
              'background:'+(S.logo==='nessuno'?'var(--gold,#C9A227)':'transparent')+';color:'+(S.logo==='nessuno'?'#1a1a1a':'inherit')+';'+
              'border-radius:11px;padding:7px 13px;font-family:inherit;font-weight:800;font-size:12.5px;cursor:pointer">Nessuno</button>'+
            '</div>')+
          riga('Quanto e\' grande il marchio',
            '<input type="range" min="10" max="30" value="'+S.logo_quota+'" data-campo="logo_quota" style="width:100%">'+
            '<div style="font-size:12px;opacity:.6" id="qrQuotaTxt">'+S.logo_quota+' per cento del lato</div>')+
          riga('Margine bianco',
            '<input type="range" min="0" max="6" value="'+S.margine+'" data-campo="margine" style="width:100%">'+
            '<div style="font-size:12px;opacity:.6" id="qrMargTxt">'+S.margine+' moduli</div>')+
          '<div style="display:flex;gap:9px;flex-wrap:wrap;margin-top:6px">'+
            '<button id="qrSalva" style="height:44px;padding:0 20px;border:none;border-radius:14px;background:var(--red,#D42B2B);'+
              'color:#fff;font-family:inherit;font-weight:900;font-size:14px;cursor:pointer">Salva lo stile</button>'+
            '<button id="qrProva" style="height:44px;padding:0 18px;border:1.5px solid var(--line,#3a3a3a);border-radius:14px;'+
              'background:transparent;color:inherit;font-family:inherit;font-weight:800;font-size:13.5px;cursor:pointer">Scarica per la stampa</button>'+
          '</div>'+
          '<div id="qrEsito" style="font-size:12.5px;font-weight:700;margin-top:10px;min-height:18px"></div>'+
        '</div>'+
        '<div style="text-align:center">'+
          '<div style="border:1.5px solid var(--line,#3a3a3a);border-radius:18px;padding:16px;background:#fff">'+
            '<img id="qrAnteprima" src="'+url()+'" alt="anteprima" style="width:100%;max-width:360px;display:block;margin:0 auto">'+
          '</div>'+
          '<div style="font-size:12px;opacity:.6;margin-top:9px;line-height:1.5">'+
            'Anteprima dal vivo. La correzione d\'errore e\' alta: il codice resta leggibile anche col marchio in mezzo '+
            'e con una macchia sul cartello. Prova sempre a inquadrarlo prima di mandarlo in stampa.</div>'+
        '</div>'+
      '</div>';

    box.querySelectorAll('.qr-f').forEach(b=>b.onclick=()=>{ S[b.dataset.campo]=b.dataset.val; disegna(); });
    box.querySelectorAll('input[type=color]').forEach(i=>i.oninput=()=>{ S[i.dataset.campo]=i.value.replace('#','').toUpperCase(); aggiorna(); sincronizza(); });
    box.querySelectorAll('input[data-testo]').forEach(i=>i.oninput=()=>{
      const v=i.value.replace(/[^0-9a-fA-F]/g,'').toUpperCase(); if(v.length===6){ S[i.dataset.campo]=v; aggiorna(); sincronizza(); }
    });
    box.querySelectorAll('input[type=range]').forEach(i=>i.oninput=()=>{
      S[i.dataset.campo]=Number(i.value);
      const t=document.getElementById(i.dataset.campo==='margine'?'qrMargTxt':'qrQuotaTxt');
      if(t) t.textContent = i.dataset.campo==='margine' ? (S.margine+' moduli') : (S.logo_quota+' per cento del lato');
      aggiorna();
    });
    document.getElementById('qrSalva').onclick = salva;
    document.getElementById('qrProva').onclick = ()=>{
      const a=document.createElement('a');
      a.href=url({s:1800, t:'poilove.com/@alessandro'}); a.download='poilove-qr-stile.png'; a.target='_blank'; a.click();
    };
  }
  function sincronizza(){
    box.querySelectorAll('input[type=color]').forEach(i=>{ i.value='#'+S[i.dataset.campo]; });
    box.querySelectorAll('input[data-testo]').forEach(i=>{ if(i.value.toUpperCase()!==S[i.dataset.campo]) i.value=S[i.dataset.campo]; });
  }
  let attesa=null;
  function aggiorna(){
    clearTimeout(attesa);
    attesa=setTimeout(()=>{ const img=document.getElementById('qrAnteprima'); if(img) img.src=url(); }, 220);
  }
  async function salva(){
    const e=document.getElementById('qrEsito');
    const b=document.getElementById('qrSalva'); if(b) b.disabled=true;
    e.textContent='Salvo…'; e.style.color='inherit';
    try{
      const { error } = await sb.from('qr_stile').update({
        colore:S.colore, colore_angoli:S.colore_angoli, sfondo:S.sfondo,
        forma_punti:S.forma_punti, forma_angoli:S.forma_angoli,
        logo:S.logo, logo_quota:S.logo_quota, margine:S.margine, aggiornato:new Date().toISOString()
      }).eq('id',1);
      if(error) throw error;
      e.textContent='Salvato: da adesso tutti i QR nascono cosi\'.'; e.style.color='#5BBE7E';
    }catch(err){ e.textContent='Non sono riuscito a salvare: '+(err.message||''); e.style.color='#E06A6A'; }
    finally{ if(b) b.disabled=false; }
  }

  async function load(contenitore){
    box=contenitore;
    box.innerHTML='<div class="panel" style="padding:26px;opacity:.7">Carico lo stile…</div>';
    try{
      const { data } = await sb.from('qr_stile').select('*').eq('id',1).maybeSingle();
      S = data || { colore:'D42B2B', colore_angoli:'D42B2B', sfondo:'FFFFFF', forma_punti:'quadrato',
                    forma_angoli:'quadrato', logo:'nostro', logo_quota:22, margine:2 };
    }catch(_){
      S = { colore:'D42B2B', colore_angoli:'D42B2B', sfondo:'FFFFFF', forma_punti:'quadrato',
            forma_angoli:'quadrato', logo:'nostro', logo_quota:22, margine:2 };
    }
    disegna();
  }
  window.QrEditor = { load };
})();
