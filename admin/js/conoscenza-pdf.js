/*
 * © Alessandro Castagna — 321.al / EVOLAB
 * Tutti i diritti riservati. Uso non autorizzato vietato.
 * info@321.it · https://321.al
 *
 * Caricare documenti nella testa degli assistenti.
 *
 * Le conoscenze scritte a mano qui sopra sono schede corte, buone per i fatti
 * secchi. Un manuale, una guida, uno statuto, invece, sono decine di pagine:
 * si caricano qui in PDF. Il documento viene spezzato in pezzi corti e a ogni
 * pezzo si mette accanto una fila di numeri che ne descrive il significato.
 * Da quel momento ILLI e il copilota, quando arriva una domanda, trovano il
 * pezzo giusto anche se la domanda usa parole diverse dal documento.
 *
 * Le tre cose che si vedono: carica, stato dei documenti, prova di ricerca.
 */
(function(){
  const CARICA = 'https://media.poilove.com/conoscenza.php';
  const VETTORI = 'https://poilove.com/db/functions/v1/conoscenza-vettori';

  function esc(s){
    return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){
      return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c];
    });
  }
  function quando(t){
    if(!t) return '';
    try{ return new Date(t).toLocaleString('it-IT',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}); }
    catch(_){ return String(t).slice(0,16); }
  }
  const AMBITI = [
    { v:'entrambi', label:'ILLI e il copilota', icon:'users-three' },
    { v:'illi',     label:'Solo ILLI',          icon:'sparkle' },
    { v:'copilota', label:'Solo il copilota',   icon:'robot' },
  ];
  const LINGUE = [
    { v:'it', label:'italiano', icon:'translate' },
    { v:'sq', label:'shqip',    icon:'translate' },
    { v:'en', label:'english',  icon:'translate' },
  ];

  let box=null, docs=[], ambitoSel=null, linguaSel=null, fileScelto=null;

  async function dati(){
    try{
      const r = await sb.from('conoscenza_documenti').select('*').order('creato', { ascending:false });
      docs = r.data || [];
    }catch(e){ docs = []; }
  }

  async function token(){
    const s = await sb.auth.getSession();
    return (s.data && s.data.session && s.data.session.access_token) || '';
  }

  function statoDoc(d){
    if(d.stato === 'fallito') return '<span style="color:#E06A6A;font-weight:800">non riuscito'+
      (d.motivo ? ' · '+esc(d.motivo) : '')+'</span>';
    if(d.stato === 'pronto')  return '<span style="color:#5BBE7E;font-weight:800">pronto, si puo cercare</span>';
    const q = d.pezzi ? Math.round(100 * (d.pezzi_pronti||0) / d.pezzi) : 0;
    return '<span style="color:#D8A93B;font-weight:800">testo pronto, numeri '+q+'%</span>';
  }

  function disegna(){
    const daFare = docs.filter(function(d){ return d.stato === 'in_lavorazione'; }).length;
    box.innerHTML =
      '<div class="panel" style="margin-bottom:14px">'+
        '<div class="card-h"><span class="ic"><i class="ph-duotone ph-file-pdf"></i></span>Documenti caricati</div>'+
        '<div class="sm" style="margin-bottom:12px">Un PDF con testo dentro, fino a venticinque mega e '+
        'quattrocento pagine. Viene spezzato in pezzi corti e ogni pezzo prende un suo significato: da li '+
        'in poi gli assistenti lo trovano a domanda fatta, anche con parole diverse. '+
        'Un PDF fatto di sole fotografie non ha testo e non si puo usare.</div>'+
        '<div class="row2">'+
          '<div class="field"><label>Titolo del documento</label>'+
            '<input id="cnTitolo" placeholder="lo prende dal nome del file se lo lasci vuoto" autocomplete="off"></div>'+
          '<div class="field"><label>A chi serve</label><div id="cnAmbito"></div></div>'+
        '</div>'+
        '<div class="row2">'+
          '<div class="field"><label>In che lingua e scritto</label><div id="cnLingua"></div></div>'+
          '<div class="field"><label>Il file</label>'+
            '<button class="btn" id="cnScegli" style="width:100%;justify-content:flex-start">'+
              '<i class="ph-duotone ph-paperclip"></i> <span id="cnNomeFile">Scegli il PDF…</span></button>'+
            '<input type="file" id="cnFile" accept="application/pdf" hidden></div>'+
        '</div>'+
        '<div class="btn-row" style="margin-top:4px">'+
          '<button class="btn gold" id="cnCarica"><i class="ph-duotone ph-upload-simple"></i> Carica e spezza</button>'+
          (daFare
            ? '<button class="btn" id="cnVettori"><i class="ph-duotone ph-brain"></i> Dai il significato ai pezzi</button>'
            : '')+
        '</div>'+
        '<div id="cnEsito" style="margin-top:9px;font-size:12.5px;font-weight:700"></div>'+
      '</div>'+

      (docs.length
        ? '<div class="panel" style="margin-bottom:14px">'+
          '<div class="card-h"><span class="ic"><i class="ph-duotone ph-books"></i></span>'+
            docs.length+(docs.length===1?' documento':' documenti')+'</div>'+
          docs.map(function(d){
            return '<div style="display:flex;gap:12px;align-items:flex-start;padding:11px 0;'+
              'border-bottom:1px solid var(--line,#3a3a3a)">'+
              '<i class="ph-duotone ph-file-pdf" style="font-size:22px;color:var(--gold,#E8B04B);margin-top:2px"></i>'+
              '<div style="flex:1;min-width:0">'+
                '<div style="font-weight:800;font-size:13.5px">'+esc(d.titolo)+'</div>'+
                '<div style="font-size:12px;opacity:.7;margin-top:3px">'+
                  d.pagine+' pagine · '+d.pezzi+' pezzi · '+
                  esc((AMBITI.filter(function(a){ return a.v===d.ambito; })[0]||{}).label||d.ambito)+
                  ' · '+esc(d.lingua)+' · '+quando(d.creato)+'</div>'+
                '<div style="font-size:12px;margin-top:4px">'+statoDoc(d)+'</div>'+
              '</div>'+
              (d.file_url ? '<a class="btn sm" href="'+esc(d.file_url)+'" target="_blank" rel="noopener" '+
                'style="flex-shrink:0"><i class="ph-duotone ph-arrow-square-out"></i></a>' : '')+
              '<button class="btn sm" data-togli="'+esc(d.id)+'" style="flex-shrink:0">Togli</button>'+
            '</div>';
          }).join('')+
        '</div>'
        : '')+

      '<div class="panel">'+
        '<div class="card-h"><span class="ic"><i class="ph-duotone ph-magnifying-glass"></i></span>Prova la ricerca</div>'+
        '<div class="sm" style="margin-bottom:10px">Fai una domanda come la farebbe una persona: qui sotto '+
        'compaiono i pezzi che gli assistenti userebbero per rispondere, col documento e la pagina.</div>'+
        '<div style="display:flex;gap:7px">'+
          '<input id="cnDomanda" placeholder="es. quanto dura l abbonamento?" autocomplete="off" style="flex:1">'+
          '<button class="btn gold" id="cnCerca" style="flex-shrink:0">Cerca</button>'+
        '</div>'+
        '<div id="cnTrovati" style="margin-top:12px"></div>'+
      '</div>';
    aggancia();
  }

  function aggancia(){
    if(window.AdminUI){
      ambitoSel = window.AdminUI.pick(AMBITI, 'entrambi', { icon:'target', cerca:false });
      document.getElementById('cnAmbito').appendChild(ambitoSel);
      linguaSel = window.AdminUI.pick(LINGUE, 'it', { icon:'translate', cerca:false });
      document.getElementById('cnLingua').appendChild(linguaSel);
    }
    const f = document.getElementById('cnFile');
    document.getElementById('cnScegli').onclick = function(){ f.click(); };
    f.onchange = function(){
      fileScelto = f.files && f.files[0];
      document.getElementById('cnNomeFile').textContent = fileScelto
        ? (fileScelto.name + ' · ' + Math.round(fileScelto.size/1024) + ' KB')
        : 'Scegli il PDF…';
    };
    document.getElementById('cnCarica').onclick = carica;
    const v = document.getElementById('cnVettori');
    if(v) v.onclick = vettorizza;
    document.getElementById('cnCerca').onclick = cerca;
    document.getElementById('cnDomanda').onkeydown = function(e){ if(e.key==='Enter'){ e.preventDefault(); cerca(); } };
    box.querySelectorAll('[data-togli]').forEach(function(b){
      b.onclick = async function(){
        if(!confirm('Tolgo questo documento e tutti i suoi pezzi?')) return;
        b.disabled = true;
        try{
          const { data, error } = await sb.from('conoscenza_documenti').delete().eq('id', b.dataset.togli).select('id');
          if(error) throw error;
          if(!data || !data.length) throw new Error('il database non ha accettato');
          await dati(); disegna();
        }catch(e){ b.disabled = false; esito('Non sono riuscito: '+(e.message||''), false); }
      };
    });
  }

  function esito(testo, bene){
    const e = document.getElementById('cnEsito');
    if(!e) return;
    e.textContent = testo;
    e.style.color = bene === null ? 'inherit' : (bene ? '#5BBE7E' : '#E06A6A');
  }

  async function carica(){
    if(!fileScelto){ esito('Scegli prima il file.', false); return; }
    const b = document.getElementById('cnCarica');
    b.disabled = true;
    esito('Carico e spezzo: su un PDF lungo ci vuole qualche secondo…', null);
    try{
      const fd = new FormData();
      fd.append('file', fileScelto);
      fd.append('titolo', document.getElementById('cnTitolo').value.trim());
      fd.append('ambito', ambitoSel ? ambitoSel.value : 'entrambi');
      fd.append('lingua', linguaSel ? linguaSel.value : 'it');
      const r = await fetch(CARICA, { method:'POST', headers:{ Authorization: 'Bearer ' + (await token()) }, body: fd });
      const j = await r.json();
      if(!r.ok || j.error) throw new Error(j.error || ('errore ' + r.status));
      esito('Caricato: ' + j.pagine + ' pagine, ' + j.pezzi + ' pezzi. Ora dai il significato ai pezzi.', true);
      fileScelto = null;
      await dati(); disegna();
    }catch(e){ esito('Non sono riuscito: '+(e.message||''), false); b.disabled = false; }
  }

  async function vettorizza(){
    const b = document.getElementById('cnVettori');
    b.disabled = true;
    esito('Ci sto lavorando: un pezzo alla volta, a gruppi di quaranta…', null);
    try{
      let giri = 0, totale = 0, restano = 'si';
      while(restano === 'si' && giri < 20){
        const r = await fetch(VETTORI, {
          method:'POST',
          headers:{ 'Content-Type':'application/json', Authorization:'Bearer ' + (await token()) },
          body: JSON.stringify({ azione:'lavora' }),
        });
        const j = await r.json();
        if(!r.ok || j.errore) throw new Error(j.errore || ('errore ' + r.status));
        totale += j.sistemati || 0;
        restano = j.restano;
        giri++;
        esito('Sistemati ' + totale + ' pezzi…', null);
      }
      esito('Fatto: ' + totale + ' pezzi hanno il loro significato.', true);
      await dati(); disegna();
    }catch(e){ esito('Non sono riuscito: '+(e.message||''), false); b.disabled = false; }
  }

  async function cerca(){
    const d = document.getElementById('cnDomanda').value.trim();
    const out = document.getElementById('cnTrovati');
    if(!d){ out.innerHTML = ''; return; }
    out.innerHTML = '<div class="sm">Cerco…</div>';
    try{
      const r = await fetch(VETTORI, {
        method:'POST',
        headers:{ 'Content-Type':'application/json', Authorization:'Bearer ' + (await token()) },
        body: JSON.stringify({ azione:'cerca', domanda:d, quanti:6 }),
      });
      const j = await r.json();
      if(!r.ok || j.errore) throw new Error(j.errore || ('errore ' + r.status));
      const t = j.trovati || [];
      if(!t.length){ out.innerHTML = '<div class="sm">Nessun pezzo risponde a questa domanda.</div>'; return; }
      out.innerHTML = t.map(function(x){
        const per = Math.round((x.vicinanza || 0) * 100);
        return '<div style="background:rgba(255,255,255,.03);border-radius:10px;padding:11px;margin-bottom:8px">'+
          '<div style="font-size:11.5px;opacity:.65;margin-bottom:5px">'+esc(x.documento)+
            ' · pagina '+x.pagina+' · <b>'+per+'%</b> vicino</div>'+
          '<div style="font-size:12.5px;line-height:1.6">'+esc(x.testo)+'</div>'+
        '</div>';
      }).join('');
    }catch(e){ out.innerHTML = '<div class="sm" style="color:#E06A6A">Non sono riuscito: '+esc(e.message||'')+'</div>'; }
  }

  async function load(contenitore){
    box = contenitore;
    box.innerHTML = '<div class="panel" style="padding:26px;opacity:.7">Carico i documenti…</div>';
    await dati();
    disegna();
  }
  window.ConoscenzaPdf = { load };
})();
