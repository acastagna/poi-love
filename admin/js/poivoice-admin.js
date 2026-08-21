/**
 * © Alessandro Castagna — 321.al / EVOLAB
 * Tutti i diritti riservati. Uso non autorizzato vietato.
 * info@321.it · https://321.al
 *
 * POI•VOICE: le tre fasi di una audioguida.
 *
 * 1. Si cerca: domande gia' pronte piu' la chat libera. Il materiale resta
 *    attaccato al luogo, non si perde.
 * 2. Si scrive il copione, partendo da quel materiale, nella durata giusta.
 * 3. Si da' la voce (questa parte arriva quando c'e' la chiave di Google).
 *
 * Ricerca e copione passano dalla CODA: la domanda finisce in una tabella e
 * risponde chi sta girando sul Mac di Alessandro, con la sua connessione.
 * Cosi' non si consuma nessuna chiave a pagamento.
 */
(function(){
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
  const LINGUE = [['it','italiano'], ['sq','shqip'], ['en','english']];
  // Le fasce di durata decise da Alessandro: i famosi respirano, i normali no.
  const DURATE = [[60,'un minuto'], [180,'tre minuti'], [360,'sei minuti'], [600,'dieci minuti']];

  let box=null, luoghi=[], modelli=[], scelto=null, materiale=[], coda=[], lingua='it';

  async function dati(){
    try{
      const [p, m] = await Promise.all([
        sb.from('pois').select('id,title,title_it,city,region,description,lat,lng,badge_official')
          .eq('badge_official', true).order('title').limit(300),
        sb.from('prompt_modelli').select('*').eq('attivo', true).order('ordine'),
      ]);
      luoghi = p.data || [];
      modelli = m.data || [];
    }catch(e){ console.warn('poivoice:', e); }
  }

  async function datiLuogo(){
    materiale = []; coda = [];
    if(!scelto) return;
    try{
      const [m, c] = await Promise.all([
        sb.from('poi_materiale').select('*').eq('poi_id', scelto.id).order('creato', {ascending:false}),
        sb.from('ai_coda').select('*').eq('poi_id', scelto.id).order('chiesto_il', {ascending:false}).limit(20),
      ]);
      materiale = m.data || [];
      coda = c.data || [];
    }catch(e){ console.warn('materiale:', e); }
  }

  // Le parole fra graffe diventano quelle del luogo vero.
  function riempi(testo, extra){
    const v = Object.assign({
      luogo: scelto ? (scelto.title_it || scelto.title) : '',
      citta: scelto ? (scelto.city || scelto.region || 'Albania') : '',
      lat: scelto ? Number(scelto.lat||0).toFixed(4) : '',
      lng: scelto ? Number(scelto.lng||0).toFixed(4) : '',
      tema: (scelto && scelto._tema) || 'i luoghi del cuore',
      lingua: (LINGUE.find(function(l){ return l[0]===lingua; })||['','italiano'])[1],
    }, extra || {});
    return String(testo||'').replace(/\{(\w+)\}/g, function(tutto, chiave){
      return v[chiave] != null ? String(v[chiave]) : tutto;
    });
  }

  function disegna(){
    box.innerHTML =
      '<div class="panel" style="margin-bottom:14px">'+
        '<div class="card-h"><span class="ic"><i class="ph-duotone ph-headphones"></i></span>POI•VOICE, le audioguide</div>'+
        '<div class="sm">Tre fasi: si cerca, si scrive, si legge. Ricerca e copione passano dalla coda e '+
        'non costano niente: risponde chi sta girando sul Mac. La voce arrivera\' quando c\'e\' la chiave di Google.</div>'+
        '<div style="margin-top:12px;display:flex;gap:10px;flex-wrap:wrap;align-items:center">'+
          '<select id="pvLuogo" style="flex:1;min-width:260px;background:var(--bg,#181818);color:inherit;'+
            'border:1.5px solid var(--line,#3a3a3a);border-radius:10px;padding:9px 12px;font-family:inherit;font-size:13px">'+
            '<option value="">Scegli il luogo…</option>'+
            luoghi.map(function(p){
              return '<option value="'+esc(p.id)+'"'+(scelto&&scelto.id===p.id?' selected':'')+'>'+
                     esc(p.title_it || p.title)+(p.city?(' · '+esc(p.city)):'')+'</option>';
            }).join('')+
          '</select>'+
          '<div class="btn-row">'+LINGUE.map(function(l){
            return '<button class="btn sm'+(lingua===l[0]?' gold':'')+'" data-lingua="'+l[0]+'">'+esc(l[1])+'</button>';
          }).join('')+'</div>'+
        '</div>'+
      '</div>'+
      (scelto ? corpo() : '<div class="panel" style="padding:26px;opacity:.65">Scegli un luogo per cominciare.</div>');

    const sel = document.getElementById('pvLuogo');
    if(sel) sel.onchange = async function(){
      scelto = luoghi.find(function(p){ return p.id === sel.value; }) || null;
      await datiLuogo(); disegna();
    };
    box.querySelectorAll('[data-lingua]').forEach(function(b){
      b.onclick = function(){ lingua = b.dataset.lingua; disegna(); };
    });
    if(scelto) aggancia();
  }

  function corpo(){
    const ric = materiale.filter(function(m){ return m.fase==='ricerca'; });
    const cop = materiale.filter(function(m){ return m.fase==='copione' && m.lingua===lingua; });
    const inCoda = coda.filter(function(c){ return c.stato==='in_attesa' || c.stato==='in_corso'; });
    const fatte  = coda.filter(function(c){ return c.stato==='fatta'; });

    return (inCoda.length
      ? '<div class="panel" style="margin-bottom:12px;border-color:#D8A93B">'+
        '<b style="color:#D8A93B">'+inCoda.length+' '+(inCoda.length===1?'domanda in coda':'domande in coda')+'</b>'+
        '<div class="sm" style="margin-top:4px">Rispondera\' chi sta girando sul Mac. Non serve aspettare qui: '+
        'la risposta compare da sola quando ricarichi.</div></div>'
      : '')+

      // ── fase uno ──
      '<div class="panel" style="margin-bottom:12px">'+
        '<div style="font-size:14px;font-weight:900;margin-bottom:4px">1 · La ricerca</div>'+
        '<div class="sm" style="margin-bottom:10px">Domande gia\' pronte, o la tua. Il materiale resta attaccato al luogo.</div>'+
        '<div class="btn-row" style="flex-wrap:wrap;margin-bottom:10px">'+
          modelli.filter(function(m){ return m.fase==='ricerca'; }).map(function(m){
            return '<button class="btn sm" data-chiedi="'+m.id+'" title="'+esc(m.descrizione||'')+'">'+esc(m.nome)+'</button>';
          }).join('')+
        '</div>'+
        '<textarea id="pvDomanda" rows="3" placeholder="Oppure scrivi tu la domanda…" '+
          'style="width:100%;box-sizing:border-box"></textarea>'+
        '<div class="btn-row" style="margin-top:8px">'+
          '<button class="btn sm gold" id="pvChiedi"><i class="ph-duotone ph-paper-plane-tilt"></i> Metti in coda</button>'+
        '</div>'+
        (fatte.length
          ? '<div style="margin-top:14px">'+fatte.map(function(c){
              return '<div style="background:rgba(255,255,255,.03);border-radius:10px;padding:11px;margin-bottom:8px">'+
                '<div style="font-size:11.5px;opacity:.6;margin-bottom:5px">'+quando(c.finita_il)+
                  ' · '+esc(String(c.domanda||'').slice(0,70))+'…</div>'+
                '<div style="font-size:13px;line-height:1.6;white-space:pre-wrap">'+esc(String(c.risposta||'').slice(0,1400))+'</div>'+
                '<button class="btn sm" data-tieni="'+esc(c.id)+'" style="margin-top:8px">'+
                  '<i class="ph-duotone ph-archive"></i> Tieni questo materiale</button>'+
              '</div>';
            }).join('')+'</div>'
          : '')+
        (ric.length
          ? '<div style="margin-top:12px;font-size:12.5px;font-weight:800">Materiale tenuto ('+ric.length+')</div>'+
            ric.map(function(m){
              return '<div style="background:rgba(91,190,126,.08);border-radius:9px;padding:9px;margin-top:6px;font-size:12.5px">'+
                '<div style="opacity:.6;font-size:11px">'+quando(m.creato)+'</div>'+
                esc(String(m.testo).slice(0,300))+'…</div>';
            }).join('')
          : '')+
      '</div>'+

      // ── fase due ──
      '<div class="panel" style="margin-bottom:12px">'+
        '<div style="font-size:14px;font-weight:900;margin-bottom:4px">2 · Il copione</div>'+
        '<div class="sm" style="margin-bottom:10px">Dal materiale al racconto per chi e\' fermo davanti al luogo.</div>'+
        (ric.length
          ? '<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:10px">'+
              '<label style="font-size:12.5px;font-weight:700">quanto deve durare '+
                '<select id="pvDurata" style="background:var(--bg,#181818);color:inherit;border:1.5px solid var(--line,#3a3a3a);'+
                'border-radius:9px;padding:6px 9px;font-family:inherit;margin-left:5px">'+
                DURATE.map(function(d){ return '<option value="'+d[0]+'"'+(d[0]===180?' selected':'')+'>'+d[1]+'</option>'; }).join('')+
                '</select></label>'+
              '<button class="btn sm gold" id="pvCopione"><i class="ph-duotone ph-pen-nib"></i> Chiedi il copione</button>'+
            '</div>'
          : '<div class="sm" style="opacity:.6">Prima serve del materiale dalla fase uno.</div>')+
        (cop.length
          ? cop.map(function(m){
              return '<div style="background:rgba(255,255,255,.03);border-radius:10px;padding:11px;margin-bottom:8px'+
                (m.scelto?';border:1.5px solid #5BBE7E':'')+'">'+
                '<div style="font-size:11.5px;opacity:.6;margin-bottom:5px">'+quando(m.creato)+
                  (m.secondi?(' · '+m.secondi+' secondi'):'')+(m.scelto?' · scelto':'')+'</div>'+
                '<textarea rows="7" data-copione="'+esc(m.id)+'" style="width:100%;box-sizing:border-box;font-size:13px;line-height:1.6">'+
                  esc(m.testo)+'</textarea>'+
                '<div class="btn-row" style="margin-top:7px">'+
                  '<button class="btn sm" data-salva-copione="'+esc(m.id)+'">Salva le correzioni</button>'+
                  (m.scelto ? '' : '<button class="btn sm gold" data-scegli="'+esc(m.id)+'">Scegli questo</button>')+
                '</div></div>';
            }).join('')
          : '')+
      '</div>'+

      // ── fase tre ──
      '<div class="panel">'+
        '<div style="font-size:14px;font-weight:900;margin-bottom:4px">3 · La voce</div>'+
        '<div class="sm">Serve la chiave di Google. Quando c\'e\', da qui si sceglie la voce, si sente e si rifa\' '+
        'finche\' non piace. Il modello scelto e\' gemini-2.5-pro-tts: una voce femminile e una maschile valgono '+
        'per tutte e tre le lingue.</div>'+
        '<div class="btn-row" style="margin-top:10px">'+
          '<a class="btn sm" href="https://aistudio.google.com/apikey" target="_blank" rel="noopener">'+
            '<i class="ph-duotone ph-key"></i> Prendi la chiave di Google</a>'+
        '</div>'+
      '</div>';
  }

  function aggancia(){
    box.querySelectorAll('[data-chiedi]').forEach(function(b){
      b.onclick = function(){
        const m = modelli.find(function(x){ return String(x.id) === b.dataset.chiedi; });
        if(!m) return;
        document.getElementById('pvDomanda').value = riempi(m.testo);
        chiedi(Number(m.id));
      };
    });
    const c = document.getElementById('pvChiedi');
    if(c) c.onclick = function(){ chiedi(null); };
    const cp = document.getElementById('pvCopione');
    if(cp) cp.onclick = chiediCopione;
    box.querySelectorAll('[data-tieni]').forEach(function(b){
      b.onclick = function(){ tieni(b.dataset.tieni, b); };
    });
    box.querySelectorAll('[data-salva-copione]').forEach(function(b){
      b.onclick = function(){ salvaCopione(b.dataset.salvaCopione, b); };
    });
    box.querySelectorAll('[data-scegli]').forEach(function(b){
      b.onclick = function(){ scegli(b.dataset.scegli, b); };
    });
  }

  async function chiedi(modelloId){
    const t = document.getElementById('pvDomanda');
    const domanda = (t.value || '').trim();
    if(!domanda){ alert('Scrivi la domanda, o scegline una gia pronta.'); return; }
    try{
      const { error } = await sb.rpc('coda_chiedi', {
        p_fase: 'ricerca', p_domanda: domanda, p_poi: scelto.id, p_modello: modelloId,
        p_contesto: { lingua: lingua, luogo: scelto.title_it || scelto.title },
      });
      if(error) throw error;
      t.value = '';
      await datiLuogo(); disegna();
    }catch(e){ alert('Non sono riuscito: ' + (e.message||'')); }
  }

  async function chiediCopione(){
    const ric = materiale.filter(function(m){ return m.fase==='ricerca'; });
    if(!ric.length){ alert('Prima serve del materiale dalla fase uno.'); return; }
    const secondi = Number((document.getElementById('pvDurata')||{}).value || 180);
    const modello = modelli.find(function(m){ return m.fase==='copione'; });
    if(!modello){ alert('Manca il modello di prompt per il copione.'); return; }
    const parole = Math.round(secondi * 140 / 60);
    const testo = riempi(modello.testo, {
      durata: secondi, parole: parole,
      materiale: ric.map(function(m){ return m.testo; }).join('\n\n───\n\n'),
    });
    try{
      const { error } = await sb.rpc('coda_chiedi', {
        p_fase: 'copione', p_domanda: testo, p_poi: scelto.id, p_modello: modello.id,
        p_contesto: { lingua: lingua, secondi: secondi },
      });
      if(error) throw error;
      await datiLuogo(); disegna();
    }catch(e){ alert('Non sono riuscito: ' + (e.message||'')); }
  }

  async function tieni(codaId, bottone){
    const c = coda.find(function(x){ return x.id === codaId; });
    if(!c || !c.risposta) return;
    bottone.disabled = true;
    const fase = c.fase === 'copione' ? 'copione' : 'ricerca';
    try{
      const { data, error } = await sb.from('poi_materiale').insert({
        poi_id: scelto.id, fase: fase,
        lingua: (c.contesto && c.contesto.lingua) || lingua,
        testo: c.risposta,
        secondi: (c.contesto && c.contesto.secondi) || null,
        da_coda: c.id,
      }).select('id');
      if(error) throw error;
      if(!data || !data.length) throw new Error('il database non ha accettato');
      await datiLuogo(); disegna();
    }catch(e){ bottone.disabled = false; alert('Non sono riuscito: ' + (e.message||'')); }
  }

  async function salvaCopione(id, bottone){
    const t = box.querySelector('[data-copione="'+id+'"]');
    if(!t) return;
    bottone.disabled = true;
    try{
      const { data, error } = await sb.from('poi_materiale').update({ testo: t.value }).eq('id', id).select('id');
      if(error) throw error;
      if(!data || !data.length) throw new Error('il database non ha accettato');
      bottone.textContent = 'Salvato';
      setTimeout(function(){ bottone.textContent = 'Salva le correzioni'; bottone.disabled = false; }, 1400);
    }catch(e){ bottone.disabled = false; alert('Non sono riuscito: ' + (e.message||'')); }
  }

  async function scegli(id, bottone){
    bottone.disabled = true;
    try{
      const { error } = await sb.rpc('materiale_scegli', { p_id: id });
      if(error) throw error;
      await datiLuogo(); disegna();
    }catch(e){ bottone.disabled = false; alert('Non sono riuscito: ' + (e.message||'')); }
  }

  async function load(contenitore){
    box = contenitore;
    box.innerHTML = '<div class="panel" style="padding:26px;opacity:.7">Carico…</div>';
    await dati();
    disegna();
  }
  window.PoiVoiceAdmin = { load };
})();
