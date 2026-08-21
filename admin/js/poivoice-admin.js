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
  let voci=[], imp={}, conto={};
  function euro(v){ return v==null ? '—' : Number(v).toFixed(2)+' $'; }

  async function dati(){
    try{
      const [p, m] = await Promise.all([
        sb.from('pois').select('id,title,title_it,city,region,description,lat,lng,badge_official')
          .eq('badge_official', true).order('title').limit(300),
        sb.from('prompt_modelli').select('*').eq('attivo', true).order('ordine'),
      ]);
      luoghi = p.data || [];
      modelli = m.data || [];
      const [v, i, c] = await Promise.all([
        sb.from('voci').select('*').order('ordine'),
        sb.from('voce_impostazioni').select('*').eq('id',1).maybeSingle(),
        sb.rpc('voce_conto'),
      ]);
      voci = v.data || [];
      imp = i.data || {};
      conto = (c.data && c.data[0]) || {};
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
        '<div class="sm" style="margin-bottom:10px">Una voce femminile e una maschile bastano per tutte e tre le '+
        'lingue: il modello riconosce la lingua dal testo, non dalla voce. Il modello e\' '+
        '<b>'+esc(imp.modello||'gemini-2.5-pro-tts')+'</b>.</div>'+

        '<div style="display:flex;gap:14px;flex-wrap:wrap">'+
          ['femminile','maschile'].map(function(g){
            const usate = voci.filter(function(v){ return v.genere===g; });
            const ora = usate.find(function(v){ return v.scelta_per===g; });
            return '<div class="field" style="flex:1;min-width:220px"><label>Voce '+g+'</label>'+
              '<select data-voce="'+g+'">'+usate.map(function(v){
                return '<option value="'+esc(v.nome)+'"'+(ora&&ora.nome===v.nome?' selected':'')+'>'+
                       esc(v.nome)+(v.carattere?(' · '+esc(v.carattere)):'')+'</option>';
              }).join('')+'</select></div>';
          }).join('')+
        '</div>'+

        '<div class="field" style="margin-top:8px"><label>La regia: come deve recitare</label>'+
          '<textarea id="pvRegia" rows="4" style="width:100%;box-sizing:border-box">'+esc(imp.regia||'')+'</textarea>'+
          '<div style="font-size:11.5px;opacity:.55;margin-top:3px">Questo campo e\' separato dal testo: Google lo '+
          'legge come istruzione a chi recita, non come parole da leggere.</div></div>'+

        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin-top:8px">'+
          '<div class="field"><label>Luoghi famosi, secondi</label><input id="pvSecFam" type="number" min="30" max="900" value="'+Number(imp.secondi_famoso||360)+'"></div>'+
          '<div class="field"><label>Medi, secondi</label><input id="pvSecMed" type="number" min="30" max="900" value="'+Number(imp.secondi_medio||180)+'"></div>'+
          '<div class="field"><label>Normali, secondi</label><input id="pvSecNor" type="number" min="30" max="900" value="'+Number(imp.secondi_normale||60)+'"></div>'+
          '<div class="field"><label>Credito caricato, dollari</label><input id="pvCredito" type="number" step="0.01" min="0" value="'+(imp.credito_caricato==null?'':imp.credito_caricato)+'" placeholder="quanto hai messo"></div>'+
        '</div>'+
        '<label style="font-size:12.5px;font-weight:700;display:block;margin-top:6px">'+
          '<input type="checkbox" id="pvLotti"'+(imp.a_lotti?' checked':'')+'> a lotti: meta prezzo, consegna entro un giorno</label>'+

        '<div class="btn-row" style="margin-top:12px">'+
          '<button class="btn sm gold" id="pvSalvaVoce"><i class="ph-duotone ph-floppy-disk"></i> Salva le impostazioni</button>'+
          '<a class="btn sm" href="https://aistudio.google.com/apikey" target="_blank" rel="noopener">'+
            '<i class="ph-duotone ph-key"></i> Prendi la chiave di Google</a>'+
          '<a class="btn sm" href="https://aistudio.google.com/usage" target="_blank" rel="noopener">'+
            '<i class="ph-duotone ph-chart-line"></i> Il saldo vero, su Google</a>'+
        '</div>'+
        '<div id="pvVoceEsito" style="margin-top:8px;font-size:12.5px;font-weight:700"></div>'+

        '<div style="margin-top:14px;border-top:1px solid var(--line,#3a3a3a);padding-top:11px">'+
          '<div style="font-size:13px;font-weight:900;margin-bottom:5px">Quanto abbiamo speso</div>'+
          '<div class="sm" style="margin-bottom:8px">Google non ha nessuna chiamata che dica quanto credito resta: '+
          'quel numero sta solo sulla sua pagina. Questo conto lo teniamo noi, coi gettoni che ogni generazione riporta.</div>'+
          '<div style="display:flex;gap:18px;flex-wrap:wrap;font-size:13px">'+
            '<span>oggi <b>'+euro(conto.oggi_eur)+'</b></span>'+
            '<span>questo mese <b>'+euro(conto.mese_eur)+'</b></span>'+
            '<span>in tutto <b>'+euro(conto.totale_eur)+'</b></span>'+
            '<span><b>'+(conto.quante_totale||0)+'</b> audioguide</span>'+
            (conto.resta_stimato!=null ? '<span>resta circa <b>'+euro(conto.resta_stimato)+'</b></span>' : '')+
          '</div>'+
        '</div>'+

        '<div style="margin-top:12px;font-size:12.5px;opacity:.7">'+
          'Manca solo la chiave: appena c\'e\', da qui si genera, si ascolta e si rifa\' finche\' non piace.'+
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
    const sv = document.getElementById('pvSalvaVoce');
    if(sv) sv.onclick = salvaVoce;
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

  async function salvaVoce(){
    const e = document.getElementById('pvVoceEsito');
    e.textContent = 'Salvo…'; e.style.color = 'inherit';
    try{
      // prima le due voci scelte: una per genere, e si toglie la scelta all'altra
      for(const g of ['femminile','maschile']){
        const sel = box.querySelector('[data-voce="'+g+'"]');
        if(!sel) continue;
        const via = await sb.from('voci').update({ scelta_per: null }).eq('scelta_per', g).select('nome');
        if(via.error) throw via.error;
        const messa = await sb.from('voci').update({ scelta_per: g }).eq('nome', sel.value).select('nome');
        if(messa.error) throw messa.error;
        if(!messa.data || !messa.data.length) throw new Error('il database non ha accettato la voce '+g);
      }
      const credito = document.getElementById('pvCredito').value.trim();
      const { data, error } = await sb.from('voce_impostazioni').update({
        regia: document.getElementById('pvRegia').value.trim() || null,
        secondi_famoso: Number(document.getElementById('pvSecFam').value) || 360,
        secondi_medio: Number(document.getElementById('pvSecMed').value) || 180,
        secondi_normale: Number(document.getElementById('pvSecNor').value) || 60,
        a_lotti: document.getElementById('pvLotti').checked,
        credito_caricato: credito === '' ? null : Number(credito),
        aggiornato: new Date().toISOString(),
      }).eq('id', 1).select('id');
      if(error) throw error;
      if(!data || !data.length) throw new Error('il database non ha accettato: se la sessione non ha il secondo fattore, esci e rientra col codice a sei cifre');
      e.textContent = 'Salvato.'; e.style.color = '#5BBE7E';
      await dati();
    }catch(err){ e.textContent = 'Non sono riuscito: '+(err.message||''); e.style.color = '#E06A6A'; }
  }

  async function load(contenitore){
    box = contenitore;
    box.innerHTML = '<div class="panel" style="padding:26px;opacity:.7">Carico…</div>';
    await dati();
    disegna();
  }
  window.PoiVoiceAdmin = { load };
})();
