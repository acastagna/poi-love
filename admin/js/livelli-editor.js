/**
 * © Alessandro Castagna — 321.al / EVOLAB
 * Tutti i diritti riservati. Uso non autorizzato vietato.
 * info@321.it · https://321.al
 *
 * I livelli: cosa sono, quanto costano, cosa danno.
 *
 * Prima dal pannello si poteva solo registrare un abbonamento gia pagato. Il
 * nome di un livello, il prezzo, i vantaggi: stavano scritti nel codice e nelle
 * pagine, e per cambiare una frase bisognava toccare il programma. Adesso sono
 * dati: si scrivono qui e si vedono subito ovunque, nelle tre lingue.
 */
(function(){
  function esc(s){
    return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){
      return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c];
    });
  }
  const PERIODI = [['gratis','gratis'], ['mese','al mese'], ['anno','all anno'], ['una_volta','una volta sola']];

  // Le manopole vere del livello: ognuna e' una colonna del database e vale
  // davvero, non e' una scritta. Il nome accanto dice a cosa serve.
  const MANOPOLE = [
    ['foto_max',           'Foto per luogo',            'quante foto si possono mettere su un luogo'],
    ['video_max',          'Video per luogo',           '0 = niente video'],
    ['video_secondi',      'Secondi per video',         'quanto puo durare un video'],
    ['audio_secondi',      'Secondi di voce',           'la voce del proprietario sul luogo'],
    ['audioguide_max',     'Audioguide POI-VOICE',      'quante audioguide spettano'],
    ['evidenze_luoghi',    'Luoghi in evidenza',        'quanti se ne possono mettere in evidenza'],
    ['evidenze_itinerari', 'Itinerari in evidenza',     ''],
    ['evidenze_compagnie', 'Compagnie in evidenza',     ''],
    ['richiede_luoghi_mese','Luoghi al mese richiesti', 'la condizione da rispettare; 0 = nessuna'],
  ];
  const INTERRUTTORI = [
    ['ascolta_audioguide', 'Ascolta le audioguide da lontano'],
    ['muro',               'Compare sul Muro dei Sostenitori'],
    ['spunta',             'Ha la spunta accanto al nome'],
    ['richiede_rinnovo',   'Deve rinnovare per tenerlo'],
    ['visibile',           'Si mostra in giro'],
  ];

  let box=null, livelli=[], vantaggi={}, aperto=null;
  let preset=[], modelloVant=null, codaVant=[], proposteVant=[];
  let creaAperto=false, catalogoAperto=null, chatAperta=null;

  async function dati(){
    try{
      const [l, v, pr, mo, cd] = await Promise.all([
        sb.from('livelli').select('*').order('ordine'),
        sb.from('livello_vantaggi').select('*').order('ordine'),
        sb.from('vantaggi_preset').select('*').order('ordine'),
        sb.from('prompt_modelli').select('id,nome,testo').eq('fase','altro'),
        sb.from('ai_coda').select('id,domanda,risposta,stato,finita_il,contesto').eq('fase','altro')
          .order('chiesto_il', { ascending: false }).limit(30),
      ]);
      livelli = l.data || [];
      vantaggi = {};
      (v.data || []).forEach(function(x){ (vantaggi[x.livello] = vantaggi[x.livello] || []).push(x); });
      preset = pr.data || [];
      modelloVant = (mo.data || []).filter(function(m){ return /vantagg/i.test(m.nome); })[0] || null;
      codaVant = (cd.data || []).filter(function(c){ return c.contesto && c.contesto.argomento === 'vantaggi'; });
    }catch(e){ livelli = []; console.warn('livelli:', e); }
  }

  function riga(l){
    const v = vantaggi[l.chiave] || [];
    const prezzo = l.prezzo == null ? 'da concordare'
      : (Number(l.prezzo) === 0 ? 'gratis'
         : Number(l.prezzo).toLocaleString('it-IT',{minimumFractionDigits:2}) + ' ' + (l.valuta||'EUR') +
           ' ' + ((PERIODI.find(function(p){ return p[0]===l.periodo; })||['',''])[1]));
    return '<div class="panel" style="padding:14px;margin-bottom:10px" data-liv="'+esc(l.chiave)+'">'+
      '<div style="display:flex;gap:12px;align-items:flex-start">'+
        '<span style="width:12px;height:12px;border-radius:4px;margin-top:6px;flex:0 0 12px;background:'+
          esc(l.badge_colore || '#8a7a63')+'"></span>'+
        '<div style="flex:1;min-width:0">'+
          '<div style="font-size:16px;font-weight:900">'+esc(l.nome)+
            '<span style="font-family:ui-monospace,monospace;font-size:11.5px;opacity:.5;margin-left:9px">'+esc(l.chiave)+'</span>'+
            (l.visibile ? '' : '<span style="font-size:11px;opacity:.6;margin-left:9px">nascosto</span>')+
          '</div>'+
          '<div style="font-size:12.5px;opacity:.72;margin-top:3px">'+esc(prezzo)+
            ' · '+v.filter(function(x){ return x.attivo; }).length+' vantaggi'+
            ' · '+l.foto_max+' foto, '+l.audio_secondi+'s di voce'+
            (l.audioguide_max ? (', '+l.audioguide_max+' audioguide') : '')+
          '</div>'+
        '</div>'+
        '<button class="btn sm" data-azione="apri"><i class="ph-duotone ph-sliders-horizontal"></i> Regola</button>'+
      '</div>'+
      '<div class="liv-ed" hidden style="margin-top:12px;border-top:1px solid var(--line,#3a3a3a);padding-top:12px"></div>'+
    '</div>';
  }

  function disegna(){
    box.innerHTML =
      '<div class="panel" style="margin-bottom:14px">'+
        '<div class="card-h"><span class="ic"><i class="ph-duotone ph-medal"></i></span>I livelli'+
          '<button class="btn sm gold" id="livNuovo" style="margin-left:auto">'+
            '<i class="ph-duotone ph-plus-circle"></i> Crea un livello</button>'+
        '</div>'+
        '<div class="sm">Nome, prezzo, e cosa da\' ognuno. Le manopole sono quelle vere: cambiarle cambia '+
        'davvero cosa una persona puo\' fare, subito. I vantaggi scritti sono quelli che si leggono nelle pagine, '+
        'nelle tre lingue.</div>'+
        (creaAperto ? moduloCrea() : '')+
      '</div>'+
      livelli.map(riga).join('');

    const n = document.getElementById('livNuovo');
    if(n) n.onclick = function(){ creaAperto = !creaAperto; disegna(); };
    if(creaAperto) agganciaCrea();

    box.querySelectorAll('[data-liv]').forEach(function(c){
      const l = livelli.find(function(x){ return x.chiave === c.dataset.liv; });
      c.querySelector('[data-azione=apri]').onclick = function(){ apri(c, l); };
      if(aperto === l.chiave) apri(c, l);
    });
  }

  // ── CREARE UN LIVELLO ────────────────────────────────────────────────────
  // I livelli sono il modello di guadagno: devono nascere da qui, non dal codice.
  function moduloCrea(){
    return '<div style="margin-top:14px;border-top:1px solid var(--line,#3a3a3a);padding-top:14px">'+
      '<div style="font-size:13px;font-weight:900;margin-bottom:9px">Un livello nuovo</div>'+
      '<div class="row2">'+
        '<div class="field"><label>Come si chiama</label>'+
          '<input class="c-nome" placeholder="es. Locale Storico" autocomplete="off"></div>'+
        '<div class="field"><label>Chiave interna</label>'+
          '<input class="c-chiave" placeholder="locale_storico" autocomplete="off" '+
            'style="font-family:ui-monospace,monospace">'+
          '<div style="font-size:11px;opacity:.5;margin-top:2px">Solo lettere minuscole e trattini bassi. Non si cambia piu.</div></div>'+
      '</div>'+
      '<div class="field"><label>Come lo racconti in una riga</label>'+
        '<input class="c-descr" placeholder="Per i locali che raccontano la loro storia" autocomplete="off"></div>'+
      '<div class="row2">'+
        '<div class="field"><label>Quanto costa</label>'+
          '<input class="c-prezzo" type="number" step="0.01" min="0" placeholder="vuoto = da concordare"></div>'+
        '<div class="field"><label>Ogni quanto</label><div class="c-periodo"></div></div>'+
      '</div>'+
      '<div class="field"><label>Parti dalle regole di un livello che c\'e gia</label>'+
        '<div class="c-copia"></div>'+
        '<div style="font-size:11px;opacity:.5;margin-top:3px">Copia manopole e vantaggi. Lasciando vuoto parte da zero.</div></div>'+
      '<div class="btn-row" style="margin-top:6px">'+
        '<button class="btn gold" id="livCrea"><i class="ph-duotone ph-check"></i> Crea il livello</button>'+
      '</div>'+
      '<div id="livCreaEsito" style="margin-top:8px;font-size:12.5px;font-weight:700"></div>'+
    '</div>';
  }

  function agganciaCrea(){
    const pk = window.AdminUI;
    let periodoSel = null, copiaSel = null;
    if(pk){
      periodoSel = pk.pick(PERIODI.map(function(p){ return { v:p[0], label:p[1],
        icon: p[0]==='gratis' ? 'gift' : (p[0]==='mese' ? 'calendar-dot' : (p[0]==='anno' ? 'calendar' : 'coin')) };
      }), 'anno', { icon:'clock-countdown', cerca:false });
      box.querySelector('.c-periodo').appendChild(periodoSel);
      copiaSel = pk.pick([{ v:'', label:'Parti da zero', icon:'circle-dashed' }].concat(
        livelli.map(function(l){ return { v:l.chiave, label:l.nome, icon: l.badge_icona || 'medal' }; })),
        '', { icon:'copy', cerca:false });
      box.querySelector('.c-copia').appendChild(copiaSel);
    }
    // la chiave si scrive da sola dal nome, finche non la si tocca a mano
    const nome = box.querySelector('.c-nome'), chiave = box.querySelector('.c-chiave');
    let toccata = false;
    chiave.oninput = function(){ toccata = true; };
    nome.oninput = function(){
      if(toccata) return;
      chiave.value = nome.value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')
        .replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'');
    };
    const e = document.getElementById('livCreaEsito');
    document.getElementById('livCrea').onclick = async function(){
      const b = this; b.disabled = true;
      e.textContent = 'Creo…'; e.style.color = 'inherit';
      try{
        const pr = box.querySelector('.c-prezzo').value.trim();
        const { data, error } = await sb.rpc('crea_livello', {
          p_chiave: chiave.value.trim(),
          p_nome: nome.value.trim(),
          p_prezzo: pr === '' ? null : Number(pr),
          p_periodo: periodoSel ? periodoSel.value : 'anno',
          p_descrizione: box.querySelector('.c-descr').value.trim() || null,
          p_copia_da: (copiaSel && copiaSel.value) ? copiaSel.value : null,
        });
        if(error) throw error;
        e.textContent = 'Creato: ' + data; e.style.color = '#5BBE7E';
        creaAperto = false; aperto = data;
        await dati(); disegna();
      }catch(err){ e.textContent = 'Non sono riuscito: '+(err.message||''); e.style.color = '#E06A6A'; b.disabled = false; }
    };
  }

  function apri(c, l){
    const d = c.querySelector('.liv-ed');
    if(!d.hidden && aperto === l.chiave){ d.hidden = true; aperto = null; return; }
    aperto = l.chiave;
    d.hidden = false;
    const v = (vantaggi[l.chiave] || []).slice().sort(function(a,b){ return a.ordine - b.ordine; });

    d.innerHTML =
      '<div class="row2">'+
        '<div class="field"><label>Come si chiama</label><input class="f-nome" value="'+esc(l.nome)+'"></div>'+
        '<div class="field"><label>Colore del bollino</label><input class="f-colore" value="'+esc(l.badge_colore||'')+'" placeholder="#D42B2B"></div>'+
      '</div>'+
      '<div class="field"><label>Come lo racconti in una riga</label>'+
        '<input class="f-descr" value="'+esc(l.descrizione||'')+'" placeholder="Per chi tiene viva la mappa"></div>'+
      '<div class="row2">'+
        '<div class="field"><label>Quanto costa</label>'+
          '<input class="f-prezzo" type="number" step="0.01" min="0" value="'+(l.prezzo==null?'':l.prezzo)+'" placeholder="vuoto = da concordare"></div>'+
        '<div class="field"><label>Ogni quanto</label><div class="f-periodo-box"></div></div>'+
      '</div>'+

      '<div style="font-size:13px;font-weight:900;margin:14px 0 8px">Le manopole</div>'+
      '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:10px">'+
        MANOPOLE.map(function(m){
          return '<div class="field"><label>'+esc(m[1])+'</label>'+
            '<input class="f-num" data-campo="'+m[0]+'" type="number" min="0" value="'+Number(l[m[0]]||0)+'">'+
            (m[2] ? '<div style="font-size:11px;opacity:.5;margin-top:2px">'+esc(m[2])+'</div>' : '')+
          '</div>';
        }).join('')+
      '</div>'+

      '<div class="f-si-box" style="display:flex;gap:18px;flex-wrap:wrap;margin:14px 0"></div>'+

      '<div style="font-size:13px;font-weight:900;margin:16px 0 8px">I vantaggi, uno per uno ('+v.length+')</div>'+
      '<div class="liv-vant">'+v.map(vantaggioRiga).join('')+'</div>'+
      '<div class="btn-row" style="margin-top:8px">'+
        '<button class="btn sm" data-azione="nuovo"><i class="ph-duotone ph-plus"></i> Riga vuota da scrivere</button>'+
        '<button class="btn sm'+(catalogoAperto===l.chiave?' gold':'')+'" data-azione="catalogo">'+
          '<i class="ph-duotone ph-list-checks"></i> Scegli dal catalogo</button>'+
        '<button class="btn sm'+(chatAperta===l.chiave?' gold':'')+'" data-azione="chat">'+
          '<i class="ph-duotone ph-sparkle"></i> Ragiona con l\'AI</button>'+
      '</div>'+
      (catalogoAperto === l.chiave ? catalogo(l) : '')+
      (chatAperta === l.chiave ? chat(l) : '')+

      '<div class="btn-row" style="margin-top:14px">'+
        '<button class="btn gold" data-azione="salva"><i class="ph-duotone ph-floppy-disk"></i> Salva il livello</button>'+
        '<button class="btn sm" data-azione="togli" style="margin-left:auto">'+
          '<i class="ph-duotone ph-trash"></i> Elimina il livello</button>'+
      '</div>'+
      '<div class="liv-esito" style="margin-top:8px;font-size:12.5px;font-weight:700"></div>';

    // i comandi nostri al posto di quelli del sistema
    if(window.AdminUI){
      const pb = d.querySelector('.f-periodo-box');
      if(pb){
        const ps = window.AdminUI.pick(PERIODI.map(function(p){ return { v:p[0], label:p[1],
          icon: p[0]==='gratis' ? 'gift' : (p[0]==='mese' ? 'calendar-dot' : (p[0]==='anno' ? 'calendar' : 'coin')) };
        }), l.periodo || 'anno', { icon:'clock-countdown', cerca:false });
        ps.classList.add('f-periodo'); pb.appendChild(ps);
      }
      const sb2 = d.querySelector('.f-si-box');
      if(sb2) INTERRUTTORI.forEach(function(i){
        const sw = window.AdminUI.toggle(i[1], !!l[i[0]]);
        sw.classList.add('f-si'); sw.dataset.campo = i[0];
        sb2.appendChild(sw);
      });
    }

    d.querySelector('[data-azione=salva]').onclick = function(){ salva(d, l); };
    d.querySelector('[data-azione=nuovo]').onclick = function(){ nuovoVantaggio(d, l); };
    d.querySelector('[data-azione=catalogo]').onclick = function(){
      catalogoAperto = (catalogoAperto === l.chiave) ? null : l.chiave; riapri(c, l);
    };
    d.querySelector('[data-azione=chat]').onclick = function(){
      chatAperta = (chatAperta === l.chiave) ? null : l.chiave; riapri(c, l);
    };
    d.querySelector('[data-azione=togli]').onclick = function(){ eliminaLivello(d, l); };
    agganciaVantaggi(d, l);
    agganciaCatalogo(d, l);
    agganciaChat(d, l);
  }

  // ── IL CATALOGO DEI VANTAGGI ─────────────────────────────────────────────
  // Ogni voce dice a chiare lettere se e una regola che il programma fa
  // rispettare oppure una promessa che manteniamo a mano. Serve a non vendere
  // una cosa che nessuno controlla.
  function catalogo(l){
    const messi = (vantaggi[l.chiave] || []).map(function(x){ return x.preset; });
    const gruppi = {};
    preset.forEach(function(p){ (gruppi[p.gruppo] = gruppi[p.gruppo] || []).push(p); });
    return '<div style="margin-top:12px;background:rgba(255,255,255,.03);border-radius:12px;padding:13px">'+
      '<div class="sm" style="margin-bottom:11px">Le voci con <b style="color:#5BBE7E">regola</b> le fa '+
      'rispettare il programma da solo. Quelle con <b style="color:#E0A54A">promessa</b> sono impegni nostri: '+
      'nessuno le controlla al posto tuo.</div>'+
      Object.keys(gruppi).map(function(g){
        return '<div style="font-size:12px;font-weight:800;opacity:.7;margin:12px 0 7px">'+esc(g)+'</div>'+
          '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(255px,1fr));gap:9px">'+
          gruppi[g].map(function(p){
            const gia = messi.indexOf(p.chiave) >= 0;
            const numerico = p.testo_it.indexOf('{n}') >= 0;
            const ora = numerico && p.colonna ? Number(l[p.colonna] || 0) : null;
            return '<div style="border:1px solid var(--line,#3a3a3a);border-radius:11px;padding:11px'+
              (gia ? ';opacity:.55' : '')+'">'+
              '<div style="display:flex;gap:8px;align-items:flex-start">'+
                '<i class="ph-duotone ph-'+esc(String(p.icona).replace(/^ph-/,''))+'" '+
                  'style="font-size:19px;color:var(--gold,#E8B04B);flex-shrink:0"></i>'+
                '<div style="flex:1;min-width:0">'+
                  '<div style="font-size:13px;font-weight:800;line-height:1.35">'+esc(p.nome)+'</div>'+
                  '<div style="font-size:11.5px;opacity:.7;margin-top:3px;line-height:1.45">'+
                    esc(p.testo_it.replace('{n}', numerico ? (ora || 'n') : ''))+'</div>'+
                '</div>'+
              '</div>'+
              '<div style="font-size:11px;margin-top:8px;line-height:1.5;opacity:.72">'+
                '<b style="color:'+(p.tipo==='regola'?'#5BBE7E':'#E0A54A')+'">'+
                  (p.tipo==='regola'?'regola':'promessa')+'</b> · '+esc(p.cosa_fa)+'</div>'+
              '<div style="display:flex;gap:6px;align-items:center;margin-top:9px">'+
                (numerico ? '<input class="p-val" data-p="'+esc(p.chiave)+'" type="number" min="0" '+
                  'value="'+(ora || 3)+'" style="width:74px" title="quanti">' : '')+
                (gia ? '<span style="font-size:11.5px;opacity:.8">gia in questo livello</span>'
                     : '<button class="btn sm gold" data-metti="'+esc(p.chiave)+'" '+
                       'style="padding:5px 11px;font-size:11.5px">Aggiungi</button>')+
              '</div>'+
            '</div>';
          }).join('')+'</div>';
      }).join('')+
    '</div>';
  }

  function agganciaCatalogo(d, l){
    d.querySelectorAll('[data-metti]').forEach(function(b){
      b.onclick = async function(){
        b.disabled = true;
        const ch = b.dataset.metti;
        const campo = d.querySelector('.p-val[data-p="'+ch+'"]');
        try{
          const { error } = await sb.rpc('livello_metti_vantaggio', {
            p_livello: l.chiave, p_preset: ch,
            p_valore: campo ? (Number(campo.value) || 0) : null,
          });
          if(error) throw error;
          await dati(); disegna();
        }catch(e){ b.disabled = false; esito(d, 'Non sono riuscito: '+(e.message||''), false); }
      };
    });
  }

  // riapre l'editor gia aperto senza il gioco del chiudi-e-riapri
  function riapri(c, l){ aperto = null; c.querySelector('.liv-ed').hidden = true; apri(c, l); }

  // ── RAGIONARE SUI VANTAGGI CON L'AI ──────────────────────────────────────
  // La domanda va nella coda e risponde chi sta girando sul Mac: non costa
  // niente. La risposta torna in righe VANTAGGIO | … e diventa un'anteprima
  // che si puo mettere nella struttura con un tasto.
  function chat(l){
    const mie = codaVant.filter(function(c){ return c.contesto && c.contesto.livello === l.chiave; });
    const attesa = mie.filter(function(c){ return c.stato === 'in_attesa' || c.stato === 'in_corso'; });
    const fatte  = mie.filter(function(c){ return c.stato === 'fatta'; }).slice(0, 3);
    return '<div style="margin-top:12px;background:rgba(255,255,255,.03);border-radius:12px;padding:13px">'+
      (attesa.length
        ? '<div style="color:#D8A93B;font-weight:800;font-size:12.5px;margin-bottom:8px">'+
          attesa.length+' domanda in coda: risponde chi sta girando sul Mac, poi ricarica.</div>'
        : '')+
      '<div class="sm" style="margin-bottom:8px">Chiedi cosa manca a questo livello. L\'AI conosce il prezzo, '+
      'a chi si rivolge e i vantaggi che ha gia. Non costa niente: passa dalla coda.</div>'+
      '<div class="btn-row" style="flex-wrap:wrap;margin-bottom:8px">'+
        ['Cosa manca a questo livello per valere il prezzo?',
         'Proponi vantaggi che possiamo far rispettare davvero, non promesse.',
         'Quali vantaggi lo distinguono dal livello sotto?',
         'Cosa toglierei perche non serve a nessuno?'].map(function(q){
          return '<button class="btn sm" data-dom="'+esc(q)+'">'+esc(q.slice(0,38))+'…</button>';
        }).join('')+
      '</div>'+
      '<textarea class="ch-dom" rows="2" placeholder="Oppure scrivi tu…" '+
        'style="width:100%;box-sizing:border-box"></textarea>'+
      '<div class="btn-row" style="margin-top:7px">'+
        '<button class="btn sm gold" data-azione="chiedi"><i class="ph-duotone ph-paper-plane-tilt"></i> Metti in coda</button>'+
      '</div>'+
      fatte.map(function(c){
        const righe = leggiProposte(c.risposta);
        const testa = String(c.risposta||'').split(/^VANTAGGIO\s*\|/m)[0].trim();
        return '<div style="margin-top:12px;border-top:1px solid var(--line,#3a3a3a);padding-top:10px">'+
          '<div style="font-size:11.5px;opacity:.55;margin-bottom:6px">'+esc(String(c.domanda||'').split('\n').pop().slice(0,80))+'</div>'+
          (testa ? '<div style="font-size:12.5px;line-height:1.6;white-space:pre-wrap;opacity:.85;margin-bottom:9px">'+
            esc(testa.slice(0,700))+'</div>' : '')+
          (righe.length
            ? '<div style="font-size:12px;font-weight:800;opacity:.7;margin-bottom:6px">Anteprima: come si leggerebbero</div>'+
              righe.map(function(r, i){
                return '<div style="display:flex;gap:9px;align-items:flex-start;background:rgba(255,255,255,.03);'+
                  'border-radius:9px;padding:9px;margin-bottom:6px">'+
                  '<i class="ph-duotone ph-'+esc(r.icona)+'" style="font-size:18px;color:var(--gold,#E8B04B);margin-top:1px"></i>'+
                  '<div style="flex:1;min-width:0">'+
                    '<div style="font-size:13px;font-weight:700">'+esc(r.it)+'</div>'+
                    '<div style="font-size:11.5px;opacity:.6;margin-top:2px">'+esc(r.sq)+' · '+esc(r.en)+'</div>'+
                    '<div style="font-size:11px;margin-top:4px;color:'+(r.vero?'#5BBE7E':'#E0A54A')+';font-weight:700">'+
                      (r.vero ? 'si puo far rispettare' : 'promessa da mantenere a mano')+'</div>'+
                  '</div>'+
                  '<button class="btn sm gold" data-inserisci="'+esc(c.id)+'|'+i+'" '+
                    'style="padding:5px 11px;font-size:11.5px;flex-shrink:0">Inserisci</button>'+
                '</div>';
              }).join('')
            : '<div class="sm" style="opacity:.6">La risposta non aveva righe nel formato: si legge qui sopra.</div>')+
        '</div>';
      }).join('')+
    '</div>';
  }

  // VANTAGGIO | it | sq | en | icona | vero
  function leggiProposte(testo){
    return String(testo||'').split('\n').filter(function(r){ return /^\s*VANTAGGIO\s*\|/i.test(r); })
      .map(function(r){
        const p = r.replace(/^\s*VANTAGGIO\s*\|/i, '').split('|').map(function(x){ return x.trim(); });
        return { it: p[0]||'', sq: p[1]||'', en: p[2]||'', icona: (p[3]||'check-circle').replace(/^ph-/,''),
                 vero: /vero/i.test(p[4]||'') };
      }).filter(function(x){ return x.it; });
  }

  function agganciaChat(d, l){
    const area = d.querySelector('.ch-dom');
    d.querySelectorAll('[data-dom]').forEach(function(b){
      b.onclick = function(){ if(area){ area.value = b.dataset.dom; area.focus(); } };
    });
    const cd = d.querySelector('[data-azione=chiedi]');
    if(cd) cd.onclick = async function(){
      const testo = (area.value||'').trim();
      if(!testo){ esito(d, 'Scrivi prima cosa vuoi chiedere.', false); return; }
      if(!modelloVant){ esito(d, 'Manca il modello di domanda sui vantaggi.', false); return; }
      cd.disabled = true;
      try{
        const v = (vantaggi[l.chiave] || []).filter(function(x){ return x.attivo; });
        const regole = MANOPOLE.filter(function(m){ return Number(l[m[0]]||0) > 0; })
            .map(function(m){ return m[1] + ': ' + l[m[0]]; })
          .concat(INTERRUTTORI.filter(function(i){ return l[i[0]]; }).map(function(i){ return i[1]; }));
        const domanda = modelloVant.testo
          .replace('{nome}', l.nome)
          .replace('{prezzo}', l.prezzo == null ? 'da concordare' : (l.prezzo + ' ' + (l.valuta||'EUR') + ' ' + l.periodo))
          .replace('{descrizione}', l.descrizione || 'non ancora scritto')
          .replace('{vantaggi}', v.length ? v.map(function(x){ return '- ' + x.testo_it; }).join('\n') : 'nessuno')
          .replace('{regole}', regole.length ? regole.join('\n') : 'nessuna')
          .replace('{domanda}', testo);
        const { error } = await sb.rpc('coda_chiedi', {
          p_fase: 'altro', p_domanda: domanda, p_modello: modelloVant.id,
          p_contesto: { argomento: 'vantaggi', livello: l.chiave, chiesto: testo },
        });
        if(error) throw error;
        await dati(); disegna();
      }catch(e){ cd.disabled = false; esito(d, 'Non sono riuscito: '+(e.message||''), false); }
    };
    d.querySelectorAll('[data-inserisci]').forEach(function(b){
      b.onclick = async function(){
        b.disabled = true;
        const parti = b.dataset.inserisci.split('|');
        const c = codaVant.filter(function(x){ return x.id === parti[0]; })[0];
        if(!c) return;
        const r = leggiProposte(c.risposta)[Number(parti[1])];
        if(!r) return;
        try{
          const quanti = (vantaggi[l.chiave] || []).length;
          const { data, error } = await sb.from('livello_vantaggi').insert({
            livello: l.chiave, ordine: (quanti + 1) * 10,
            testo_it: r.it, testo_sq: r.sq || null, testo_en: r.en || null,
            icona: 'ph-' + r.icona, attivo: false,
          }).select('id');
          if(error) throw error;
          if(!data || !data.length) throw new Error('il database non ha accettato');
          await dati(); disegna();
        }catch(e){ b.disabled = false; esito(d, 'Non sono riuscito: '+(e.message||''), false); }
      };
    });
  }

  async function eliminaLivello(d, l){
    if(!confirm('Elimino il livello "'+l.nome+'"?\n\nSi puo fare solo se nessuno ce l ha.')) return;
    try{
      const { error } = await sb.rpc('elimina_livello', { p_chiave: l.chiave });
      if(error) throw error;
      aperto = null; await dati(); disegna();
    }catch(e){ esito(d, 'Non sono riuscito: '+(e.message||''), false); }
  }

  function vantaggioRiga(x){
    return '<div style="background:rgba(255,255,255,.03);border-radius:10px;padding:10px;margin-bottom:7px" data-vant="'+x.id+'">'+
      '<div style="display:flex;gap:8px;align-items:center;margin-bottom:7px">'+
        '<input class="v-ordine" type="number" min="1" value="'+Number(x.ordine||100)+'" style="width:62px" title="ordine">'+
        '<input class="v-icona" value="'+esc(x.icona||'ph-check-circle')+'" style="width:150px;font-family:ui-monospace,monospace;font-size:12px" title="icona">'+
        '<div class="v-sw" data-quale="evid" data-on="'+(x.in_evidenza?1:0)+'"></div>'+
        '<div class="v-sw" data-quale="attivo" data-on="'+(x.attivo?1:0)+'"></div>'+
        (x.preset ? '<span style="font-size:10.5px;font-weight:800;opacity:.65;background:rgba(255,255,255,.06);'+
          'padding:3px 8px;border-radius:999px">dal catalogo · '+esc(x.preset)+'</span>' : '')+
        '<button class="btn sm" data-togli-vant="'+x.id+'" style="margin-left:auto;padding:4px 10px;font-size:11.5px">Togli</button>'+
      '</div>'+
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:7px">'+
        '<input class="v-it" value="'+esc(x.testo_it)+'" placeholder="italiano">'+
        '<input class="v-sq" value="'+esc(x.testo_sq||'')+'" placeholder="shqip">'+
        '<input class="v-en" value="'+esc(x.testo_en||'')+'" placeholder="english">'+
      '</div></div>';
  }

  function agganciaVantaggi(d, l){
    if(window.AdminUI) d.querySelectorAll('.v-sw').forEach(function(posto){
      if(posto.firstChild) return;
      const quale = posto.dataset.quale;
      const sw = window.AdminUI.toggle(quale === 'evid' ? 'in vetrina' : 'attivo', posto.dataset.on === '1');
      sw.classList.add(quale === 'evid' ? 'v-evid' : 'v-attivo');
      posto.appendChild(sw);
    });
    d.querySelectorAll('[data-togli-vant]').forEach(function(b){
      b.onclick = async function(){
        if(!confirm('Tolgo questo vantaggio?')) return;
        b.disabled = true;
        try{
          const { data, error } = await sb.from('livello_vantaggi').delete().eq('id', Number(b.dataset.togliVant)).select('id');
          if(error) throw error;
          if(!data || !data.length) throw new Error('il database non ha accettato');
          const r = d.querySelector('[data-vant="'+b.dataset.togliVant+'"]'); if(r) r.remove();
          vantaggi[l.chiave] = (vantaggi[l.chiave]||[]).filter(function(x){ return String(x.id) !== b.dataset.togliVant; });
        }catch(e){ b.disabled = false; esito(d, 'Non sono riuscito: '+(e.message||''), false); }
      };
    });
  }

  async function nuovoVantaggio(d, l){
    try{
      const quanti = (vantaggi[l.chiave] || []).length;
      const { data, error } = await sb.from('livello_vantaggi').insert({
        livello: l.chiave, ordine: (quanti + 1) * 10,
        testo_it: 'Nuovo vantaggio: scrivilo qui', icona: 'ph-check-circle', attivo: false,
      }).select('*');
      if(error) throw error;
      if(!data || !data.length) throw new Error('il database non ha accettato');
      (vantaggi[l.chiave] = vantaggi[l.chiave] || []).push(data[0]);
      const cont = d.querySelector('.liv-vant');
      cont.insertAdjacentHTML('beforeend', vantaggioRiga(data[0]));
      agganciaVantaggi(d, l);
      esito(d, 'Aggiunto: scrivilo e poi salva.', true);
    }catch(e){ esito(d, 'Non sono riuscito: '+(e.message||''), false); }
  }

  function esito(d, testo, bene){
    const e = d.querySelector('.liv-esito');
    if(!e) return;
    e.textContent = testo;
    e.style.color = bene ? '#5BBE7E' : '#E06A6A';
  }

  async function salva(d, l){
    const b = d.querySelector('[data-azione=salva]');
    b.disabled = true;
    esito(d, 'Salvo…', true);
    d.querySelector('.liv-esito').style.color = 'inherit';
    try{
      const campi = {
        nome: d.querySelector('.f-nome').value.trim(),
        badge_colore: d.querySelector('.f-colore').value.trim() || null,
        descrizione: d.querySelector('.f-descr').value.trim() || null,
        periodo: d.querySelector('.f-periodo').value,
      };
      if(!campi.nome) throw new Error('il nome non puo restare vuoto');
      const pr = d.querySelector('.f-prezzo').value.trim();
      campi.prezzo = pr === '' ? null : Number(pr);
      d.querySelectorAll('.f-num').forEach(function(i){ campi[i.dataset.campo] = Number(i.value) || 0; });
      d.querySelectorAll('.f-si').forEach(function(i){ campi[i.dataset.campo] = i.checked; });

      const { data, error } = await sb.from('livelli').update(campi).eq('chiave', l.chiave).select('chiave');
      if(error) throw error;
      if(!data || !data.length) throw new Error('il database non ha accettato: se la sessione non ha il secondo fattore, esci e rientra col codice a sei cifre');

      // i vantaggi, uno per uno
      const righe = [...d.querySelectorAll('[data-vant]')];
      for(const r of righe){
        const id = Number(r.dataset.vant);
        const v = {
          ordine: Number(r.querySelector('.v-ordine').value) || 100,
          icona: r.querySelector('.v-icona').value.trim() || 'ph-check-circle',
          in_evidenza: !!(r.querySelector('.v-evid') || {}).checked,
          attivo: !!(r.querySelector('.v-attivo') || {}).checked,
          testo_it: r.querySelector('.v-it').value.trim(),
          testo_sq: r.querySelector('.v-sq').value.trim() || null,
          testo_en: r.querySelector('.v-en').value.trim() || null,
          aggiornato: new Date().toISOString(),
        };
        if(!v.testo_it) continue;
        const q = await sb.from('livello_vantaggi').update(v).eq('id', id).select('id');
        if(q.error) throw q.error;
      }
      esito(d, 'Salvato: livello e vantaggi.', true);
      setTimeout(async function(){ await dati(); disegna(); }, 900);
    }catch(e){ esito(d, 'Non sono riuscito: '+(e.message||''), false); b.disabled = false; }
  }

  async function load(contenitore){
    box = contenitore;
    box.innerHTML = '<div class="panel" style="padding:26px;opacity:.7">Carico i livelli…</div>';
    await dati();
    disegna();
  }
  window.LivelliEditor = { load };
})();
