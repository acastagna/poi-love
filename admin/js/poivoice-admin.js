/**
 * © Alessandro Castagna — 321.al / EVOLAB
 * Tutti i diritti riservati. Uso non autorizzato vietato.
 * info@321.it · https://321.al
 *
 * POI•VOICE: le tre fasi di una audioguida.
 *
 * Rifatto il 21/08/2026 su indicazione di Alessandro. Quello che e' cambiato:
 * il luogo si CERCA scrivendo, in italiano, non si sceglie da una tendina; ogni
 * risultato dice se l'audioguida e' gia' stata fatta; la lunghezza non si
 * imposta prima, si stima dopo e si accorcia o allunga a percentuali; il
 * copione e' un DIALOGO a due voci nel formato che vuole Google.
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
  function euro(v){ return v == null ? '—' : Number(v).toFixed(2) + ' $'; }
  function mmss(sec){
    const s = Math.max(0, Math.round(Number(sec)||0));
    const m = Math.floor(s/60);
    return m ? (m + ' min ' + String(s%60).padStart(2,'0') + ' s') : (s + ' secondi');
  }
  // Quanto dura un testo letto ad alta voce: centoquaranta parole al minuto,
  // che e' il passo di chi racconta, non di chi legge il notiziario.
  function stimaSecondi(testo){
    const parole = String(testo||'').trim().split(/\s+/).filter(Boolean).length;
    return Math.round(parole * 60 / 140);
  }
  const LINGUE = [['it','italiano'], ['sq','shqip'], ['en','english']];
  const PASSI  = [10, 20, 30, 40];

  let box=null, modelli=[], scelto=null, materiale=[], coda=[], lingua='it';
  let voci=[], imp={}, conto={};
  let copioneScelto=null;                  // quale taglio di copione ha scelto lui
  const vocePick = {};                     // le due tendine delle voci, montate dopo il disegno
  let lottiSw = null;                      // l'interruttore dei lotti
  function nomeLingua(c){ const l = LINGUE.filter(function(x){ return x[0]===c; })[0]; return l ? l[1] : c; }
  let dove='ufficiali', testoCerca='', risultati=[], proposte=[], cercando=false;

  async function dati(){
    try{
      const [m, v, i, c] = await Promise.all([
        sb.from('prompt_modelli').select('*').eq('attivo', true).order('ordine'),
        sb.from('voci').select('*').order('ordine'),
        sb.from('voce_impostazioni').select('*').eq('id',1).maybeSingle(),
        sb.rpc('voce_conto'),
      ]);
      modelli = m.data || [];
      voci = v.data || [];
      imp = i.data || {};
      conto = (c.data && c.data[0]) || {};
    }catch(e){ console.warn('poivoice:', e); }
  }

  async function cerca(){
    proposte = [];
    if(dove === 'ricerca'){ risultati = []; return; }
    try{
      const { data, error } = await sb.rpc('cerca_per_audioguida', {
        p_testo: testoCerca, p_dove: dove, p_quanti: 40,
      });
      if(error) throw error;
      risultati = data || [];
    }catch(e){ risultati = []; console.warn('cerca:', e); }
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

  function riempi(testo, extra){
    const v = Object.assign({
      luogo: scelto ? (scelto.nome_it || scelto.nome) : '',
      citta: scelto ? (scelto.citta || scelto.regione || 'Albania') : '',
      tema: 'i luoghi del cuore',
      lingua: (LINGUE.find(function(l){ return l[0]===lingua; })||['','italiano'])[1],
    }, extra || {});
    return String(testo||'').replace(/\{(\w+)\}/g, function(tutto, chiave){
      return v[chiave] != null ? String(v[chiave]) : tutto;
    });
  }

  /* ── Il pezzo in cima: si cerca il luogo ─────────────────────────────── */
  function testata(){
    const bollino = function(r){
      if(r.ha_voce) return '<span style="background:rgba(91,190,126,.18);color:#5BBE7E;font-size:11px;font-weight:800;padding:2px 9px;border-radius:999px">audioguida fatta'+
        (r.quante_lingue_pronte>1?(' · '+r.quante_lingue_pronte+' lingue'):'')+'</span>';
      if(r.ha_copione)  return '<span style="background:rgba(216,169,59,.18);color:#D8A93B;font-size:11px;font-weight:800;padding:2px 9px;border-radius:999px">copione pronto</span>';
      if(r.ha_materiale) return '<span style="background:rgba(40,94,167,.18);color:#5B8FD4;font-size:11px;font-weight:800;padding:2px 9px;border-radius:999px">ricerca fatta</span>';
      return '<span style="opacity:.45;font-size:11px;font-weight:700">mai fatta</span>';
    };

    return '<div class="panel" style="margin-bottom:14px">'+
      '<div class="card-h"><span class="ic"><i class="ph-duotone ph-headphones"></i></span>POI•VOICE, le audioguide</div>'+
      '<div class="sm" style="margin-bottom:10px">Tre fasi: si cerca, si scrive il copione a due voci, si da\' la voce. '+
      'Ricerca e copione passano dalla coda e non costano niente: risponde chi sta girando sul Mac.</div>'+

      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px">'+
        [['ufficiali','Ufficiali','della community, fatti da noi'],
         ['community','Community','fatti dagli utenti, i piu votati per primi'],
         ['ricerca','Ricerca','ricerca libera con l AI']].map(function(d){
          return '<button class="btn sm'+(dove===d[0]?' gold':'')+'" data-dove="'+d[0]+'" title="'+esc(d[2])+'">'+esc(d[1])+'</button>';
        }).join('')+
      '</div>'+

      '<div style="display:flex;gap:9px;flex-wrap:wrap;align-items:center">'+
        '<input id="pvCerca" value="'+esc(testoCerca)+'" '+
          'placeholder="'+(dove==='ricerca'
            ? 'Che luoghi cerchi? es. castelli sul mare, monasteri con affreschi…'
            : 'Cerca il luogo: nome, citta, zona… (in italiano)')+'" '+
          'style="flex:1;min-width:260px;background:var(--bg,#181818);color:inherit;border:1.5px solid var(--line,#3a3a3a);'+
          'border-radius:10px;padding:10px 13px;font-family:inherit;font-size:13.5px">'+
        (dove==='ricerca'
          ? '<button class="btn sm gold" id="pvChiediLuoghi"><i class="ph-duotone ph-sparkle"></i> Chiedi all AI</button>'
          : '<button class="btn sm" id="pvCercaVia"><i class="ph-duotone ph-magnifying-glass"></i> Cerca</button>')+
        '<div class="btn-row">'+LINGUE.map(function(l){
          return '<button class="btn sm'+(lingua===l[0]?' gold':'')+'" data-lingua="'+l[0]+'">'+esc(l[1])+'</button>';
        }).join('')+'</div>'+
      '</div>'+

      (scelto
        ? '<div style="margin-top:12px;padding:10px 12px;background:rgba(212,43,43,.10);border-radius:10px;'+
          'display:flex;gap:10px;align-items:center;flex-wrap:wrap">'+
          '<b style="font-size:14px">'+esc(scelto.nome_it || scelto.nome)+'</b>'+
          (scelto.citta?'<span style="opacity:.7;font-size:12.5px">'+esc(scelto.citta)+'</span>':'')+
          '<button class="btn sm" id="pvCambia" style="margin-left:auto">Cambia luogo</button>'+
        '</div>'
        : '')+

      (!scelto && dove!=='ricerca' && risultati.length
        ? '<div style="margin-top:12px;max-height:280px;overflow:auto">'+risultati.map(function(r){
            return '<div style="display:flex;gap:10px;align-items:center;padding:8px 10px;border-radius:9px;'+
              'background:rgba(255,255,255,.03);margin-bottom:5px;cursor:pointer" data-prendi="'+esc(r.id)+'">'+
              '<div style="flex:1;min-width:0">'+
                '<div style="font-weight:800;font-size:13.5px">'+esc(r.nome_it || r.nome)+'</div>'+
                '<div style="font-size:11.5px;opacity:.6">'+esc(r.citta || r.regione || '')+
                  (dove==='community'?(' · '+r.cuori+' cuori'):'')+'</div>'+
              '</div>'+ bollino(r) +
            '</div>';
          }).join('')+'</div>'
        : '')+

      (!scelto && dove!=='ricerca' && !risultati.length && !cercando
        ? '<div style="margin-top:12px;opacity:.6;font-size:12.5px">Nessun luogo'+(testoCerca?' con questo nome':'')+'.</div>'
        : '')+

      (dove==='ricerca' && proposte.length
        ? '<div style="margin-top:12px">'+
            '<div style="font-size:12.5px;font-weight:800;margin-bottom:6px">L AI propone: spunta quello giusto</div>'+
            proposte.map(function(p,i){
              return '<div style="padding:10px 12px;border-radius:9px;background:rgba(255,255,255,.03);margin-bottom:6px;'+
                'cursor:pointer" data-proposta="'+i+'">'+
                '<div style="font-weight:800;font-size:13.5px">'+esc(p.nome)+
                  '<span style="opacity:.6;font-weight:600;font-size:12px;margin-left:8px">'+esc(p.zona)+'</span></div>'+
                '<div style="font-size:12.5px;opacity:.75;margin-top:3px">'+esc(p.perche)+'</div>'+
                (p.gia ? '<div style="font-size:11.5px;color:#5BBE7E;margin-top:4px">c e gia sulla mappa: '+esc(p.gia.nome_it||p.gia.nome)+'</div>'
                       : '<div style="font-size:11.5px;color:#D8A93B;margin-top:4px">non e ancora sulla mappa</div>')+
              '</div>';
            }).join('')+
          '</div>'
        : '')+

      (dove==='ricerca' && cercando
        ? '<div style="margin-top:12px;opacity:.7;font-size:12.5px">Ho messo la domanda in coda. Risponde chi sta girando sul Mac: ricarica fra un momento.</div>'
        : '')+
    '</div>';
  }

  /* ── La riga per accorciare o allungare ──────────────────────────────── */
  function rigaLunghezza(m){
    const stima = m.secondi_stimati || stimaSecondi(m.testo);
    return '<div style="display:flex;gap:5px;align-items:center;justify-content:center;flex-wrap:wrap;margin-top:9px">'+
      PASSI.slice().reverse().map(function(p){
        return '<button class="btn sm" data-rifai="corto" data-perc="'+p+'" data-id="'+esc(m.id)+'" '+
               'style="padding:5px 9px;font-size:11.5px">'+p+'%</button>';
      }).join('')+
      '<span style="font-size:12px;font-weight:900;opacity:.75;padding:0 6px">ACCORCIA</span>'+
      '<span style="font-size:12.5px;font-weight:900;background:rgba(212,43,43,.14);color:var(--red,#D42B2B);'+
        'padding:5px 13px;border-radius:999px;white-space:nowrap">'+mmss(stima)+'</span>'+
      '<span style="font-size:12px;font-weight:900;opacity:.75;padding:0 6px">ALLUNGA</span>'+
      PASSI.map(function(p){
        return '<button class="btn sm" data-rifai="lungo" data-perc="'+p+'" data-id="'+esc(m.id)+'" '+
               'style="padding:5px 9px;font-size:11.5px">'+p+'%</button>';
      }).join('')+
    '</div>';
  }

  function corpo(){
    const ric = materiale.filter(function(m){ return m.fase==='ricerca'; });
    const cop = materiale.filter(function(m){ return m.fase==='copione' && m.lingua===lingua; });
    const inCoda = coda.filter(function(c){ return c.stato==='in_attesa' || c.stato==='in_corso'; });
    const fatte  = coda.filter(function(c){ return c.stato==='fatta' && c.fase!=='altro'; });

    return (inCoda.length
      ? '<div class="panel" style="margin-bottom:12px;border-color:#D8A93B">'+
        '<b style="color:#D8A93B">'+inCoda.length+' '+(inCoda.length===1?'domanda in coda':'domande in coda')+'</b>'+
        '<div class="sm" style="margin-top:4px">Rispondera\' chi sta girando sul Mac. La risposta compare quando ricarichi.</div></div>'
      : '')+

      '<div class="panel" style="margin-bottom:12px">'+
        '<div style="font-size:14px;font-weight:900;margin-bottom:4px">1 · La ricerca</div>'+
        '<div class="sm" style="margin-bottom:10px">Domande gia\' pronte, o la tua. Il materiale resta attaccato al luogo.</div>'+
        '<div class="btn-row" style="flex-wrap:wrap;margin-bottom:10px">'+
          modelli.filter(function(m){ return m.fase==='ricerca'; }).map(function(m){
            return '<button class="btn sm" data-chiedi="'+m.id+'" title="'+esc(m.descrizione||'')+'">'+esc(m.nome)+'</button>';
          }).join('')+
        '</div>'+
        '<textarea id="pvDomanda" rows="3" placeholder="Oppure scrivi tu la domanda…" style="width:100%;box-sizing:border-box"></textarea>'+
        '<div class="btn-row" style="margin-top:8px">'+
          '<button class="btn sm gold" id="pvChiedi"><i class="ph-duotone ph-paper-plane-tilt"></i> Metti in coda</button>'+
        '</div>'+
        (fatte.length
          ? '<div style="margin-top:14px">'+fatte.map(function(c){
              return '<div style="background:rgba(255,255,255,.03);border-radius:10px;padding:11px;margin-bottom:8px">'+
                '<div style="font-size:11.5px;opacity:.6;margin-bottom:5px">'+quando(c.finita_il)+' · '+
                  esc(String(c.domanda||'').slice(0,70))+'…</div>'+
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

      '<div class="panel" style="margin-bottom:12px">'+
        '<div style="font-size:14px;font-weight:900;margin-bottom:4px">2 · Il copione, a due voci</div>'+
        '<div class="sm" style="margin-bottom:10px">Un dialogo fra la voce femminile e quella maschile, nel formato '+
        '<code style="background:rgba(255,255,255,.07);padding:1px 5px;border-radius:4px">Speaker 1:</code> e '+
        '<code style="background:rgba(255,255,255,.07);padding:1px 5px;border-radius:4px">Speaker 2:</code>. '+
        'La durata non si imposta: si scrive, si legge la stima, e si accorcia o si allunga.</div>'+
        (ric.length
          ? '<div style="font-size:12px;font-weight:800;opacity:.75;margin-bottom:6px">Con che taglio lo scrivo</div>'+
            '<div class="btn-row" style="flex-wrap:wrap;margin-bottom:10px">'+
              modelli.filter(function(m){ return m.fase==='copione'; }).map(function(m){
                return '<button class="btn sm'+(m.id===copioneScelto?' gold':'')+'" data-modcop="'+m.id+'" '+
                       'title="'+esc(m.descrizione||'')+'">'+
                       (m.id===copioneScelto?'<i class="ph-duotone ph-check-circle"></i> ':'')+esc(m.nome)+'</button>';
              }).join('')+
            '</div>'+
            '<div class="sm" style="margin-bottom:9px">Uso '+ric.length+
              (ric.length===1?' pezzo':' pezzi')+' di materiale della fase uno, in '+nomeLingua(lingua)+'.</div>'+
            '<button class="btn sm gold" id="pvCopione"><i class="ph-duotone ph-pen-nib"></i> Scrivi il copione</button>'
          : '<div class="sm" style="opacity:.6">Prima serve del materiale dalla fase uno.</div>')+
        (cop.length
          ? '<div style="margin-top:12px">'+cop.map(function(m){
              return '<div style="background:rgba(255,255,255,.03);border-radius:10px;padding:11px;margin-bottom:10px'+
                (m.scelto?';border:1.5px solid #5BBE7E':'')+'">'+
                '<div style="font-size:11.5px;opacity:.6;margin-bottom:5px">'+quando(m.creato)+(m.scelto?' · scelto':'')+'</div>'+
                '<textarea rows="9" data-copione="'+esc(m.id)+'" '+
                  'style="width:100%;box-sizing:border-box;font-size:13px;line-height:1.65;font-family:ui-monospace,monospace">'+
                  esc(m.testo)+'</textarea>'+
                rigaLunghezza(m)+
                '<div class="btn-row" style="margin-top:9px;justify-content:center">'+
                  '<button class="btn sm" data-salva-copione="'+esc(m.id)+'">Salva le correzioni</button>'+
                  (m.scelto ? '' : '<button class="btn sm gold" data-scegli="'+esc(m.id)+'">Scegli questo</button>')+
                '</div></div>';
            }).join('')+'</div>'
          : '')+
      '</div>'+

      faseTre();
  }

  function faseTre(){
    return '<div class="panel">'+
      '<div style="font-size:14px;font-weight:900;margin-bottom:4px">3 · Le voci</div>'+
      '<div class="sm" style="margin-bottom:10px">Due voci, una femminile e una maschile: sono i due che parlano nel '+
      'copione. Valgono per tutte e tre le lingue, perche\' il modello riconosce la lingua dal testo. Il modello e\' '+
      '<b>'+esc(imp.modello||'gemini-2.5-pro-tts')+'</b>.</div>'+

      '<div style="display:flex;gap:14px;flex-wrap:wrap">'+
        [['femminile','Speaker 1'],['maschile','Speaker 2']].map(function(g){
          const usate = voci.filter(function(v){ return v.genere===g[0]; });
          const ora = usate.find(function(v){ return v.scelta_per===g[0]; });
          return '<div class="field" style="flex:1;min-width:230px">'+
            '<label>'+g[1]+' · voce '+g[0]+'</label>'+
            '<div style="display:flex;gap:7px;align-items:center">'+
              '<div data-mvoce="'+g[0]+'" style="flex:1;min-width:0"></div>'+
              '<button class="btn sm" data-ascolta="'+g[0]+'" title="ascolta poche parole" '+
                'style="flex-shrink:0"><i class="ph-fill ph-play"></i> Ascolta</button>'+
            '</div>'+
            '<div style="font-size:11.5px;opacity:.55;margin-top:4px">'+usate.length+' voci '+g[0]+' disponibili</div>'+
          '</div>';
        }).join('')+
      '</div>'+
      '<div id="pvAscolto" style="font-size:12px;opacity:.7;margin-top:5px"></div>'+

      '<div class="field" style="margin-top:10px"><label>La regia: come devono recitare</label>'+
        '<textarea id="pvRegia" rows="4" style="width:100%;box-sizing:border-box">'+esc(imp.regia||'')+'</textarea>'+
        '<div style="font-size:11.5px;opacity:.55;margin-top:3px">Campo separato dal testo: Google lo legge come '+
        'istruzione a chi recita, non come parole da leggere.</div></div>'+

      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin-top:8px">'+
        '<div class="field"><label>Luoghi famosi, secondi</label><input id="pvSecFam" type="number" min="30" max="900" value="'+Number(imp.secondi_famoso||360)+'"></div>'+
        '<div class="field"><label>Medi, secondi</label><input id="pvSecMed" type="number" min="30" max="900" value="'+Number(imp.secondi_medio||180)+'"></div>'+
        '<div class="field"><label>Normali, secondi</label><input id="pvSecNor" type="number" min="30" max="900" value="'+Number(imp.secondi_normale||60)+'"></div>'+
        '<div class="field"><label>Credito caricato, dollari</label><input id="pvCredito" type="number" step="0.01" min="0" value="'+(imp.credito_caricato==null?'':imp.credito_caricato)+'" placeholder="quanto hai messo"></div>'+
      '</div>'+
      '<div id="pvLottiBox" style="margin-top:10px"></div>'+

      // ── lo studio: dal copione all audio ──
      '<div style="margin-top:16px;border-top:1px solid var(--line,#3a3a3a);padding-top:13px">'+
        '<div style="font-size:13px;font-weight:900;margin-bottom:5px">Fai l\'audio</div>'+
        (haCopioneScelto()
          ? '<div class="sm" style="margin-bottom:9px">Il copione scelto in '+nomeLingua(lingua)+
            ' diventa un file da ascoltare. Ogni prova si paga, anche quella che poi butti: '+
            'per questo compare qui sotto col suo costo.</div>'+
            '<button class="btn sm gold" id="pvFaiAudio"><i class="ph-duotone ph-waveform"></i> Dai la voce al copione</button>'
          : '<div class="sm" style="opacity:.6">Prima serve un copione scelto in '+nomeLingua(lingua)+'.</div>')+
        '<div id="pvAudioEsito" style="margin-top:8px;font-size:12.5px;font-weight:700"></div>'+
        (function(){
          const vo = materiale.filter(function(m){ return m.fase==='voce' && m.lingua===lingua; });
          if(!vo.length) return '';
          return '<div style="margin-top:12px">'+vo.map(function(m){
            return '<div style="background:rgba(255,255,255,.03);border-radius:10px;padding:11px;margin-bottom:8px'+
              (m.scelto?';border:1.5px solid #5BBE7E':'')+'">'+
              '<div style="font-size:11.5px;opacity:.6;margin-bottom:6px">'+quando(m.creato)+
                ' · '+mmss(m.secondi)+' · '+euro(m.costo_eur)+
                (m.scelto?' · <b style="color:#5BBE7E">pubblicata: si sente nell app</b>':'')+'</div>'+
              (m.audio_url ? '<audio controls preload="none" src="'+esc(m.audio_url)+'" style="width:100%"></audio>' : '')+
              '<div class="btn-row" style="margin-top:8px">'+
                (m.scelto ? '' : '<button class="btn sm gold" data-usa-voce="'+esc(m.id)+'">'+
                  '<i class="ph-duotone ph-broadcast"></i> Pubblica questa</button>')+
                '<button class="btn sm" data-butta-voce="'+esc(m.id)+'">Butta</button>'+
              '</div></div>';
          }).join('')+'</div>';
        })()+
      '</div>'+

      '<div class="btn-row" style="margin-top:12px">'+
        '<button class="btn sm gold" id="pvSalvaVoce"><i class="ph-duotone ph-floppy-disk"></i> Salva le impostazioni</button>'+
        '<a class="btn sm" href="https://aistudio.google.com/apikey" target="_blank" rel="noopener">'+
          '<i class="ph-duotone ph-key"></i> Prendi la chiave di Google</a>'+
        '<a class="btn sm" href="https://aistudio.google.com/usage" target="_blank" rel="noopener">'+
          '<i class="ph-duotone ph-chart-line"></i> Il saldo vero, su Google</a>'+
      '</div>'+
      '<div id="pvVoceEsito" style="margin-top:8px;font-size:12.5px;font-weight:700"></div>'+

      '<div style="margin-top:14px;border-top:1px solid var(--line,#3a3a3a);padding-top:11px">'+
        '<div style="font-size:13px;font-weight:900;margin-bottom:5px">Quanto abbiamo speso (stima)</div>'+
        '<div class="sm" style="margin-bottom:8px">Google non ha nessuna chiamata che dica quanto credito resta: '+
        'quel numero sta solo sulla sua pagina. Questa e\' una stima nostra, coi gettoni che ogni generazione riporta.</div>'+
        '<div style="display:flex;gap:18px;flex-wrap:wrap;font-size:13px">'+
          '<span>oggi <b>'+euro(conto.oggi_eur)+'</b></span>'+
          '<span>questo mese <b>'+euro(conto.mese_eur)+'</b></span>'+
          '<span>in tutto <b>'+euro(conto.totale_eur)+'</b></span>'+
          '<span><b>'+(conto.quante_totale||0)+'</b> generazioni</span>'+
          (conto.resta_stimato!=null ? '<span>resta circa <b>'+euro(conto.resta_stimato)+'</b></span>' : '')+
        '</div>'+
        '<div style="margin-top:8px;font-size:12.5px;display:flex;gap:18px;flex-wrap:wrap">'+
          '<span style="color:#5BBE7E">tenute <b>'+(conto.quante_tenute||0)+'</b></span>'+
          '<span style="color:#E0A54A">buttate <b>'+(conto.quante_scartate||0)+'</b>'+
            ((conto.quante_scartate||0) ? ' · '+euro(conto.scartate_eur)+' pagati lo stesso' : '')+'</span>'+
        '</div>'+
        '<div class="sm" style="margin-top:5px">Nel totale c\'e anche quello che si e buttato: '+
        'ogni rifacimento e una generazione pagata, anche se il risultato non e piaciuto.</div>'+
      '</div>'+

      '<div style="margin-top:12px;font-size:12.5px;opacity:.7">'+
        'Manca solo la chiave: appena c\'e\', da qui si genera, si ascolta e si rifa\' finche\' non piace. '+
        'Anche il tasto di ascolto qui sopra parte da li\'.'+
      '</div>'+
    '</div>';
  }

  function disegna(){
    box.innerHTML = testata() + (scelto ? corpo() : '');
    aggancia();
  }

  function aggancia(){
    box.querySelectorAll('[data-dove]').forEach(function(b){
      b.onclick = async function(){ dove = b.dataset.dove; risultati = []; proposte = []; await cerca(); disegna(); };
    });
    box.querySelectorAll('[data-lingua]').forEach(function(b){
      b.onclick = function(){ lingua = b.dataset.lingua; disegna(); };
    });
    const c = document.getElementById('pvCerca');
    if(c){
      c.oninput = function(){ testoCerca = c.value; };
      c.onkeydown = function(e){ if(e.key === 'Enter'){ e.preventDefault(); avvia(); } };
    }
    const cv = document.getElementById('pvCercaVia');
    if(cv) cv.onclick = avvia;
    const cl = document.getElementById('pvChiediLuoghi');
    if(cl) cl.onclick = chiediLuoghi;
    const cam = document.getElementById('pvCambia');
    if(cam) cam.onclick = async function(){ scelto = null; await cerca(); disegna(); };

    box.querySelectorAll('[data-prendi]').forEach(function(r){
      r.onclick = async function(){
        scelto = risultati.find(function(x){ return x.id === r.dataset.prendi; }) || null;
        await datiLuogo(); disegna();
      };
    });
    box.querySelectorAll('[data-proposta]').forEach(function(r){
      r.onclick = async function(){
        const p = proposte[Number(r.dataset.proposta)];
        if(!p) return;
        if(!p.gia){ alert('Questo luogo non e ancora sulla mappa.\n\nVa creato prima, dalla sezione Luoghi o dalla Catena.'); return; }
        scelto = p.gia; await datiLuogo(); disegna();
      };
    });

    if(!scelto) return;
    box.querySelectorAll('[data-chiedi]').forEach(function(b){
      b.onclick = function(){
        const m = modelli.find(function(x){ return String(x.id) === b.dataset.chiedi; });
        if(!m) return;
        document.getElementById('pvDomanda').value = riempi(m.testo);
        chiedi(Number(m.id));
      };
    });
    const q = document.getElementById('pvChiedi');   if(q)  q.onclick = function(){ chiedi(null); };
    const cp = document.getElementById('pvCopione'); if(cp) cp.onclick = chiediCopione;
    box.querySelectorAll('[data-tieni]').forEach(function(b){ b.onclick = function(){ tieni(b.dataset.tieni, b); }; });
    box.querySelectorAll('[data-salva-copione]').forEach(function(b){ b.onclick = function(){ salvaCopione(b.dataset.salvaCopione, b); }; });
    box.querySelectorAll('[data-scegli]').forEach(function(b){ b.onclick = function(){ scegli(b.dataset.scegli, b); }; });
    box.querySelectorAll('[data-rifai]').forEach(function(b){
      b.onclick = function(){ rifai(b.dataset.id, b.dataset.rifai, Number(b.dataset.perc), b); };
    });
    box.querySelectorAll('[data-modcop]').forEach(function(b){
      b.onclick = function(){ copioneScelto = Number(b.dataset.modcop); disegna(); };
    });
    box.querySelectorAll('[data-ascolta]').forEach(function(b){ b.onclick = function(){ ascolta(b.dataset.ascolta); }; });
    montaComandi();
    const fa = document.getElementById('pvFaiAudio'); if(fa) fa.onclick = faiAudio;
    box.querySelectorAll('[data-usa-voce]').forEach(function(b){ b.onclick = function(){ usaVoce(b.dataset.usaVoce, b); }; });
    box.querySelectorAll('[data-butta-voce]').forEach(function(b){ b.onclick = function(){ buttaVoce(b.dataset.buttaVoce, b); }; });
    const sv = document.getElementById('pvSalvaVoce'); if(sv) sv.onclick = salvaVoce;
  }

  async function avvia(){ await cerca(); disegna(); }

  // La ricerca libera passa dalla coda come tutto il resto.
  async function chiediLuoghi(){
    const t = (testoCerca || '').trim();
    if(!t){ alert('Scrivi che luoghi cerchi.'); return; }
    const m = modelli.find(function(x){ return x.fase === 'altro'; });
    if(!m){ alert('Manca il modello di prompt per la ricerca.'); return; }
    try{
      const { error } = await sb.rpc('coda_chiedi', {
        p_fase: 'altro', p_domanda: riempi(m.testo, { richiesta: t }),
        p_modello: m.id, p_contesto: { ricerca: t },
      });
      if(error) throw error;
      cercando = true; disegna();
      await leggiProposte();
    }catch(e){ alert('Non sono riuscito: ' + (e.message||'')); }
  }

  // Le proposte arrivano in righe "LUOGO | nome | zona | perche": si leggono
  // e per ognuna si guarda se quel luogo c'e' gia' sulla mappa.
  async function leggiProposte(){
    try{
      const { data } = await sb.from('ai_coda').select('*')
        .eq('fase','altro').eq('stato','fatta').order('finita_il',{ascending:false}).limit(1);
      const r = data && data[0];
      if(!r || !r.risposta) return;
      const righe = String(r.risposta).split('\n')
        .map(function(x){ return x.trim(); })
        .filter(function(x){ return x.indexOf('LUOGO |') === 0 || x.indexOf('LUOGO|') === 0; });
      proposte = [];
      for(const riga of righe){
        const p = riga.replace(/^LUOGO\s*\|/, '').split('|').map(function(x){ return x.trim(); });
        if(p.length < 2) continue;
        const voce = { nome: p[0], zona: p[1] || '', perche: p[2] || '', gia: null };
        const q = await sb.rpc('cerca_per_audioguida', { p_testo: voce.nome, p_dove: 'ufficiali', p_quanti: 1 });
        if(q.data && q.data.length) voce.gia = q.data[0];
        else {
          const q2 = await sb.rpc('cerca_per_audioguida', { p_testo: voce.nome, p_dove: 'community', p_quanti: 1 });
          if(q2.data && q2.data.length) voce.gia = q2.data[0];
        }
        proposte.push(voce);
      }
      cercando = false;
      disegna();
    }catch(e){ console.warn('proposte:', e); }
  }

  async function chiedi(modelloId){
    const t = document.getElementById('pvDomanda');
    const domanda = (t.value || '').trim();
    if(!domanda){ alert('Scrivi la domanda, o scegline una gia pronta.'); return; }
    try{
      const { error } = await sb.rpc('coda_chiedi', {
        p_fase: 'ricerca', p_domanda: domanda, p_poi: scelto.id, p_modello: modelloId,
        p_contesto: { lingua: lingua, luogo: scelto.nome_it || scelto.nome },
      });
      if(error) throw error;
      t.value = '';
      await datiLuogo(); disegna();
    }catch(e){ alert('Non sono riuscito: ' + (e.message||'')); }
  }

  // La durata di partenza viene dalla fascia del luogo, non da una tendina:
  // e' una proposta, e poi si accorcia o si allunga sul testo vero.
  async function chiediCopione(){
    const ric = materiale.filter(function(m){ return m.fase==='ricerca'; });
    if(!ric.length){ alert('Prima serve del materiale dalla fase uno.'); return; }
    const modello = (copioneScelto && modelli.find(function(m){ return m.id === copioneScelto; }))
                 || modelli.find(function(m){ return m.fase==='copione' && m.predefinito; })
                 || modelli.find(function(m){ return m.fase==='copione'; });
    if(!modello){ alert('Manca il modello di prompt per il copione.'); return; }
    const secondi = scelto.ufficiale ? Number(imp.secondi_medio||180) : Number(imp.secondi_normale||60);
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

  async function rifai(id, verso, percento, bottone){
    const m = materiale.find(function(x){ return x.id === id; });
    if(!m) return;
    const modello = modelli.find(function(x){ return x.fase==='copione' && !x.predefinito; });
    if(!modello){ alert('Manca il modello per accorciare e allungare.'); return; }
    const testo = riempi(modello.testo, {
      verso: verso === 'corto' ? 'piu corto' : 'piu lungo',
      percento: percento,
      copione: (box.querySelector('[data-copione="'+id+'"]') || {}).value || m.testo,
      istruzione: verso === 'corto'
        ? 'Togli quello che si puo togliere senza perdere il fatto principale: le ripetizioni, gli aggettivi, le frasi di raccordo. Non togliere l apertura ne la chiusura.'
        : 'Aggiungi respiro dove serve: un dettaglio concreto che gia sta nel materiale, una battuta di reazione dell altra voce. Non allungare con parole vuote.',
    });
    bottone.disabled = true;
    try{
      const { error } = await sb.rpc('coda_chiedi', {
        p_fase: 'copione', p_domanda: testo, p_poi: scelto.id, p_modello: modello.id,
        p_contesto: { lingua: lingua, rifatto_da: id, verso: verso, percento: percento },
      });
      if(error) throw error;
      await datiLuogo(); disegna();
    }catch(e){ bottone.disabled = false; alert('Non sono riuscito: ' + (e.message||'')); }
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
        secondi_stimati: fase === 'copione' ? stimaSecondi(c.risposta) : null,
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
      const { data, error } = await sb.from('poi_materiale')
        .update({ testo: t.value, secondi_stimati: stimaSecondi(t.value) }).eq('id', id).select('id');
      if(error) throw error;
      if(!data || !data.length) throw new Error('il database non ha accettato');
      await datiLuogo(); disegna();
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

  // Le tendine delle voci e l'interruttore dei lotti: disegnati da noi, non dal
  // sistema operativo. Vanno montati dopo che l'HTML e' a posto.
  function montaComandi(){
    if(!window.AdminUI) return;
    ['femminile','maschile'].forEach(function(g){
      const posto = box.querySelector('[data-mvoce="'+g+'"]');
      if(!posto) return;
      const usate = voci.filter(function(v){ return v.genere===g; });
      const ora = usate.filter(function(v){ return v.scelta_per===g; })[0];
      const c = window.AdminUI.pick(usate.map(function(v){
        return { v:v.nome, label:v.nome + (v.carattere ? ' · ' + v.carattere : ''),
                 icon: g==='femminile' ? 'user-sound' : 'user-sound' };
      }), ora ? ora.nome : (usate[0]&&usate[0].nome), { icon:'waveform', cerca:true, vuoto:'Scegli la voce' });
      posto.innerHTML = ''; posto.appendChild(c);
      vocePick[g] = c;
    });
    const lb = document.getElementById('pvLottiBox');
    if(lb){
      lottiSw = window.AdminUI.toggle({ titolo:'A lotti: meta prezzo',
        nota:'consegna entro un giorno invece che subito' }, !!imp.a_lotti);
      lb.innerHTML = ''; lb.appendChild(lottiSw);
    }
  }

  function ascolta(genere){
    const e = document.getElementById('pvAscolto');
    const sel = vocePick[genere];
    if(!e || !sel) return;
    // L'anteprima e' audio: per farla sentire bisogna generarla, e generare
    // vuole la chiave. Meglio dirlo che far premere un tasto muto.
    e.textContent = 'Per sentire ' + sel.value + ' serve la chiave di Google: e un audio, e va generato.';
    e.style.color = '#D8A93B';
  }

  function haCopioneScelto(){
    return materiale.some(function(m){ return m.fase==='copione' && m.lingua===lingua && m.scelto; });
  }
  async function biglietto(){
    const s = await sb.auth.getSession();
    return (s.data && s.data.session && s.data.session.access_token) || '';
  }
  function dettaglio(t, testo, bene){
    if(!t) return;
    t.textContent = testo;
    t.style.color = bene === null ? 'inherit' : (bene ? '#5BBE7E' : '#E06A6A');
  }

  // Dal copione all audio, in tre passi: Google fa la voce, il server delle
  // immagini tiene il file, il database segna quello che e costato. La riga di
  // spesa si scrive comunque, anche se poi la prova non piace: e gia pagata.
  async function faiAudio(){
    const b = document.getElementById('pvFaiAudio');
    const e = document.getElementById('pvAudioEsito');
    b.disabled = true;
    dettaglio(e, 'Google sta leggendo il copione: su dieci minuti di audio ci vogliono minuti, non secondi…', null);
    try{
      const tok = await biglietto();
      const r = await fetch('https://poilove.com/db/functions/v1/poivoice-genera', {
        method:'POST', headers:{ 'Content-Type':'application/json', Authorization:'Bearer '+tok },
        body: JSON.stringify({ poi: scelto.id, lingua: lingua }),
      });
      const j = await r.json();
      if(!r.ok || j.errore){
        throw new Error((j.errore || ('errore '+r.status)) + (j.spiegazione ? ' — '+j.spiegazione : ''));
      }

      dettaglio(e, 'Voce pronta, '+mmss(j.secondi)+'. La sto mettendo al sicuro…', null);
      const grezzo = atob(j.wav);
      const bytes = new Uint8Array(grezzo.length);
      for(let i=0;i<grezzo.length;i++) bytes[i] = grezzo.charCodeAt(i);
      const fd = new FormData();
      fd.append('casa','poi'); fd.append('id', scelto.id); fd.append('lingua', lingua);
      fd.append('audio', new File([bytes], 'audioguida.wav', { type:'audio/wav' }));
      const u = await fetch('https://media.poilove.com/audioguida.php', {
        method:'POST', headers:{ Authorization:'Bearer '+tok }, body: fd,
      });
      const uj = await u.json();
      if(!u.ok || uj.error) throw new Error(uj.error || ('il file non si e salvato, errore '+u.status));

      const ins = await sb.from('poi_materiale').insert({
        poi_id: scelto.id, fase:'voce', lingua: lingua, testo:'(audio)',
        audio_url: uj.url, secondi: uj.secondi || j.secondi,
        voce: j.voce_f + (j.due_voci ? (' + '+j.voce_m) : ''),
        modello: j.modello, costo_eur: j.costo_stimato, scelto: false,
      }).select('id');
      if(ins.error) throw ins.error;

      // il conto: si segna sempre, anche prima di sapere se piacera
      const sp = await sb.rpc('voce_segna_spesa', {
        p_poi: scelto.id, p_lingua: lingua, p_secondi: j.secondi,
        p_gettoni_in: j.gettoni_in, p_gettoni_out: j.gettoni_out,
        p_costo: j.costo_stimato, p_voce_f: j.voce_f, p_voce_m: j.voce_m,
        p_esito: 'tenuta', p_motivo: null,
        p_materiale: (ins.data && ins.data[0] && ins.data[0].id) || null,
      });
      if(sp.error) console.warn('la spesa non si e segnata:', sp.error.message);

      dettaglio(e, 'Fatto: '+mmss(uj.secondi || j.secondi)+', costo stimato '+euro(j.costo_stimato)+'.', true);
      await datiLuogo(); await dati(); disegna();
    }catch(err){ dettaglio(e, 'Non sono riuscito: '+(err.message||''), false); b.disabled = false; }
  }

  // Scegliere una prova non basta: finche non finisce nella tabella che l app
  // legge, quella voce non la sente nessuno. Qui si pubblica davvero.
  async function usaVoce(id, bottone){
    bottone.disabled = true;
    try{
      const { error } = await sb.rpc('pubblica_audioguida', { p_materiale: id });
      if(error) throw error;
      dettaglio(document.getElementById('pvAudioEsito'),
        'Pubblicata: da adesso si sente nell app, sul luogo e nella sua pagina.', true);
      await datiLuogo(); disegna();
    }catch(e){ bottone.disabled = false; dettaglio(document.getElementById('pvAudioEsito'), 'Non sono riuscito: '+(e.message||''), false); }
  }

  // Niente finestrelle del browser: la domanda si apre qui dentro, coi motivi
  // gia pronti. Il motivo resta scritto nel conto, perche la prova e gia pagata.
  function buttaVoce(id, bottone){
    if(bottone.dataset.aperto) return;
    bottone.dataset.aperto = '1';
    const MOTIVI = ['non mi piace come suona','troppo lunga','troppo corta','sbaglia le parole','voce sbagliata'];
    const riga = document.createElement('div');
    riga.style.cssText = 'margin-top:8px;padding:9px;background:rgba(224,106,106,.08);border-radius:9px';
    riga.innerHTML = '<div style="font-size:12px;font-weight:800;margin-bottom:6px">Perche la butti? '+
      'Il costo resta nel conto: e gia pagata.</div>'+
      '<div class="btn-row" style="flex-wrap:wrap">'+
      MOTIVI.map(function(m){ return '<button class="btn sm" data-motivo="'+m+'">'+m+'</button>'; }).join('')+
      '<button class="btn sm" data-motivo="">annulla</button></div>';
    bottone.parentNode.appendChild(riga);
    riga.querySelectorAll('[data-motivo]').forEach(function(b){
      b.onclick = function(){
        const motivo = b.dataset.motivo;
        riga.remove(); delete bottone.dataset.aperto;
        if(motivo) buttaDavvero(id, bottone, motivo);
      };
    });
  }

  async function buttaDavvero(id, bottone, motivo){
    bottone.disabled = true;
    try{
      // se stava suonando nell app, prima la si toglie di li
      const rit = await sb.rpc('ritira_audioguida', { p_materiale: id });
      if(rit.error) console.warn('non ritirata dalla mappa:', rit.error.message);
      // poi il conto: la riga di spesa passa a "scartata" ma il costo resta
      const righe = await sb.from('voce_spesa').select('id').eq('materiale_id', id);
      for(const r of (righe.data || [])){
        const b = await sb.rpc('voce_butta', { p_id: r.id, p_motivo: motivo });
        if(b.error) throw b.error;
      }
      const d = await sb.from('poi_materiale').delete().eq('id', id).select('id');
      if(d.error) throw d.error;
      await datiLuogo(); await dati(); disegna();
    }catch(e){ bottone.disabled = false; dettaglio(document.getElementById('pvAudioEsito'), 'Non sono riuscito: '+(e.message||''), false); }
  }

  async function salvaVoce(){
    const e = document.getElementById('pvVoceEsito');
    e.textContent = 'Salvo…'; e.style.color = 'inherit';
    try{
      for(const g of ['femminile','maschile']){
        const sel = vocePick[g];
        if(!sel || !sel.value) continue;
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
        a_lotti: !!(lottiSw && lottiSw.checked),
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
    await cerca();
    disegna();
  }
  window.PoiVoiceAdmin = { load };
})();
