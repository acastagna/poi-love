/**
 * © Alessandro Castagna — 321.al / EVOLAB
 * Tutti i diritti riservati. Uso non autorizzato vietato.
 * info@321.it · https://321.al
 *
 * Gli itinerari, tutti e tre i tipi.
 *
 * Ufficiali: li facciamo noi, non sono di nessuna persona. Sono di due specie,
 *   le Rotte Storiche e gli Itinerari Culturali.
 * Personali: quelli che le persone si costruiscono per i loro viaggi.
 *
 * Da qui si guarda, si corregge e si sposta un itinerario da una specie
 * all'altra. Tutto scrive sul database: niente resta a schermo.
 */
(function(){
  // Quello che arriva dal database lo scrivono gli utenti: si pulisce sempre.
  function esc(s){
    return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){
      return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c];
    });
  }

  const SPECIE = {
    storica:   { nome:'Rotte Storiche',      icona:'ph-path',       colore:'#7B4FBF' },
    culturale: { nome:'Itinerari Culturali', icona:'ph-bank',       colore:'#285EA7' },
    personale: { nome:'Itinerari Personali', icona:'ph-navigation', colore:'#8a7a63' },
  };

  let box=null, righe=[], vista='culturale', persone={};

  async function dati(){
    try{
      const q = await sb.from('trips')
        .select('id,name,description,badge,cover_url,tipo,is_published,is_featured,visibility,'+
                'badge_official,badge_essential,archived,owner_id,created_at,trip_stops(id)')
        .eq('tipo', vista).order('name');
      righe = q.data || [];
      const chi = [...new Set(righe.map(r=>r.owner_id).filter(Boolean))];
      if(chi.length){
        const p = await sb.from('profiles').select('id,username,display_name').in('id', chi);
        persone = {}; (p.data||[]).forEach(function(x){ persone[x.id]=x; });
      }
    }catch(e){ righe=[]; console.warn('itinerari admin:', e); }
  }

  function chi(id){
    const p = persone[id];
    if(!p) return '—';
    return esc(p.display_name || ('@'+(p.username||'')));
  }

  function scheda(r){
    const sp = SPECIE[r.tipo] || SPECIE.personale;
    const nTappe = (r.trip_stops||[]).length;
    return '<div class="panel" style="padding:14px;margin-bottom:10px" data-id="'+esc(r.id)+'">'+
      '<div style="display:flex;gap:14px;align-items:flex-start">'+
        (r.cover_url
          ? '<img src="'+(/^https:\/\//i.test(r.cover_url||'') ? esc(r.cover_url) : '')+'" style="width:88px;height:88px;object-fit:cover;border-radius:12px;flex:0 0 88px">'
          : '<div style="width:88px;height:88px;border-radius:12px;flex:0 0 88px;border:1.5px dashed var(--line,#3a3a3a);display:flex;align-items:center;justify-content:center;font-size:11px;opacity:.55;text-align:center;padding:6px">senza copertina</div>')+
        '<div style="flex:1;min-width:0">'+
          '<div style="font-size:16px;font-weight:900">'+esc(r.name)+'</div>'+
          '<div style="font-size:12px;margin-top:4px;display:flex;gap:6px;flex-wrap:wrap;align-items:center">'+
            '<span style="background:'+sp.colore+'22;color:'+sp.colore+';font-weight:800;padding:3px 9px;border-radius:999px">'+
              '<i class="ph-fill '+sp.icona+'"></i> '+sp.nome+'</span>'+
            (r.badge_official  ? '<span style="background:#B8860B22;color:#D8A93B;font-weight:800;padding:3px 9px;border-radius:999px"><i class="ph-fill ph-seal-check"></i> Ufficiale</span>' : '')+
            (r.badge_essential ? '<span style="background:#7B4FBF22;color:#9B7FDF;font-weight:800;padding:3px 9px;border-radius:999px"><i class="ph-fill ph-star"></i> Indispensabile</span>' : '')+
            (r.is_published    ? '<span style="background:#2E7D4622;color:#5BBE7E;font-weight:800;padding:3px 9px;border-radius:999px">pubblicato</span>'
                               : '<span style="background:#88888822;opacity:.75;font-weight:800;padding:3px 9px;border-radius:999px">non pubblicato</span>')+
            (r.archived ? '<span style="opacity:.6;font-weight:700">archiviato</span>' : '')+
          '</div>'+
          '<div style="font-size:12px;opacity:.65;margin-top:5px">'+
            nTappe+' tappe'+
            (r.tipo==='personale' ? (' · di '+chi(r.owner_id)) : ' · di nessuno: lo facciamo noi')+
            (r.badge ? (' · '+esc(r.badge)) : '')+
          '</div>'+
        '</div>'+
        '<button class="btn sm" data-azione="apri"><i class="ph-duotone ph-pencil-simple"></i> Modifica</button>'+
      '</div>'+
      '<div class="itin-ed" hidden style="margin-top:12px;border-top:1px solid var(--line,#3a3a3a);padding-top:12px"></div>'+
    '</div>';
  }

  function editor(r){
    const opz = Object.keys(SPECIE).map(function(k){
      return '<option value="'+k+'"'+(r.tipo===k?' selected':'')+'>'+SPECIE[k].nome+'</option>';
    }).join('');
    return '<div class="row2">'+
        '<div class="field"><label>Nome</label><input class="f-nome" value="'+esc(r.name)+'"></div>'+
        '<div class="field"><label>Etichetta breve</label><input class="f-badge" value="'+esc(r.badge)+'" placeholder="es. architettura"></div>'+
      '</div>'+
      '<div class="field"><label>Racconto</label><textarea class="f-desc" rows="3">'+esc(r.description)+'</textarea></div>'+
      '<div class="field"><label>Copertina (indirizzo dell immagine)</label><input class="f-cover" value="'+esc(r.cover_url)+'" placeholder="https://…"></div>'+
      '<div class="row2">'+
        '<div class="field"><label>Che cosa e</label><select class="f-tipo">'+opz+'</select></div>'+
        '<div class="field"><label>Di chi e</label><input class="f-owner" value="'+esc(r.owner_id)+'" placeholder="identificativo della persona"></div>'+
      '</div>'+
      '<div style="display:flex;gap:16px;flex-wrap:wrap;margin:6px 0 12px;font-size:13px;font-weight:700">'+
        '<label><input type="checkbox" class="f-pub"'+(r.is_published?' checked':'')+'> pubblicato</label>'+
        '<label><input type="checkbox" class="f-off"'+(r.badge_official?' checked':'')+'> bollino Ufficiale</label>'+
        '<label><input type="checkbox" class="f-ess"'+(r.badge_essential?' checked':'')+'> Indispensabile</label>'+
        '<label><input type="checkbox" class="f-arc"'+(r.archived?' checked':'')+'> archiviato</label>'+
      '</div>'+
      '<div class="btn-row">'+
        '<button class="btn sm gold" data-azione="salva"><i class="ph-duotone ph-floppy-disk"></i> Salva</button>'+
        '<button class="btn sm" data-azione="copertina"><i class="ph-duotone ph-image"></i> Copertina dalla prima tappa</button>'+
        '<button class="btn sm" data-azione="tappe"><i class="ph-duotone ph-list-numbers"></i> Vedi le tappe</button>'+
        '<a class="btn sm" href="https://poilove.com/trip.php?id='+encodeURIComponent(r.id)+'" target="_blank" rel="noopener"><i class="ph-duotone ph-arrow-square-out"></i> Come si vede</a>'+
      '</div>'+
      '<div class="itin-esito" style="margin-top:8px;font-size:12.5px;font-weight:700"></div>'+
      '<div class="itin-tappe" style="margin-top:10px"></div>';
  }

  function disegna(){
    const conta = righe.length;
    box.innerHTML =
      '<div class="panel" style="margin-bottom:14px">'+
        '<div style="font-size:12.5px;opacity:.7;line-height:1.55;margin-bottom:10px">'+
          'Gli itinerari <b>Ufficiali</b> li costruiamo noi, con ILLI e i dati aperti: non appartengono a nessuna persona. '+
          'Sono di due specie, le <b>Rotte Storiche</b> e gli <b>Itinerari Culturali</b>. '+
          'Gli <b>Itinerari Personali</b> sono quelli che ogni persona si costruisce per i suoi viaggi: '+
          'si guardano e si moderano, ma restano suoi.'+
        '</div>'+
        '<div class="btn-row">'+
          Object.keys(SPECIE).map(function(k){
            return '<button class="btn sm'+(vista===k?' gold':'')+'" data-vista="'+k+'">'+
                   '<i class="ph-duotone '+SPECIE[k].icona+'"></i> '+SPECIE[k].nome+'</button>';
          }).join('')+
        '</div>'+
        '<div style="margin-top:10px;font-size:13px;font-weight:800">'+conta+' '+
          (conta===1?'itinerario':'itinerari')+'</div>'+
      '</div>'+
      (righe.length ? righe.map(scheda).join('')
                    : '<div class="panel">Nessun itinerario di questa specie.</div>');

    box.querySelectorAll('[data-vista]').forEach(function(b){
      b.onclick = async function(){ vista=b.dataset.vista; await dati(); disegna(); };
    });
    box.querySelectorAll('[data-id]').forEach(function(c){
      const r = righe.find(function(x){ return x.id===c.dataset.id; });
      c.querySelector('[data-azione=apri]').onclick = function(){ apri(c, r); };
    });
  }

  function apri(c, r){
    const ed = c.querySelector('.itin-ed');
    if(!ed.hidden){ ed.hidden = true; return; }
    ed.innerHTML = editor(r);
    ed.hidden = false;
    ed.querySelector('[data-azione=salva]').onclick     = function(){ salva(ed, r); };
    ed.querySelector('[data-azione=copertina]').onclick = function(){ copertina(ed, r); };
    ed.querySelector('[data-azione=tappe]').onclick     = function(){ tappe(ed, r); };
  }

  async function salva(ed, r){
    const e = ed.querySelector('.itin-esito');
    const v = function(cls){ return ed.querySelector(cls).value.trim(); };
    const b = function(cls){ return ed.querySelector(cls).checked; };
    const nuovoTipo = v('.f-tipo') || ed.querySelector('.f-tipo').value;
    if(!v('.f-nome')){ e.textContent='Il nome non puo restare vuoto.'; e.style.color='#E06A6A'; return; }
    if(nuovoTipo !== r.tipo){
      if(!confirm('Sposto "'+r.name+'" fra '+SPECIE[nuovoTipo].nome+'?\n\n'+
        (nuovoTipo==='personale'
          ? 'Torna a essere di una persona e sparisce dagli itinerari Ufficiali.'
          : 'Diventa nostro: non appartiene piu a nessuna persona e si vede nella sua scheda.'))) return;
    }
    const bottone = ed.querySelector('[data-azione=salva]');
    bottone.disabled = true;
    e.textContent = 'Salvo…'; e.style.color='inherit';
    const campi = {
      name: v('.f-nome'), badge: v('.f-badge') || null,
      description: ed.querySelector('.f-desc').value.trim() || null,
      cover_url: v('.f-cover') || null,
      tipo: nuovoTipo,
      owner_id: v('.f-owner') || null,
      is_published: b('.f-pub'), badge_official: b('.f-off'),
      badge_essential: b('.f-ess'), archived: b('.f-arc'),
      is_historic: (nuovoTipo === 'storica'),
    };
    try{
      // Si chiede indietro la riga toccata: se il database rifiuta per regola,
      // non manda errore, tocca zero righe. Senza questo controllo il pannello
      // diceva "Salvato" e non era vero.
      const { data, error } = await sb.from('trips').update(campi).eq('id', r.id).select('id');
      if(error) throw error;
      if(!data || !data.length){
        throw new Error('il database non ha accettato la modifica. Di solito e la sessione senza secondo fattore: esci e rientra col codice a sei cifre.');
      }
      e.textContent = 'Salvato.'; e.style.color = '#5BBE7E';
      setTimeout(async function(){ await dati(); disegna(); }, 700);
    }catch(err){
      e.textContent = 'Non sono riuscito: ' + (err.message||''); e.style.color = '#E06A6A';
      bottone.disabled = false;
    }
  }

  async function copertina(ed, r){
    const e = ed.querySelector('.itin-esito');
    e.textContent = 'Cerco una foto vera fra le tappe…'; e.style.color='inherit';
    try{
      const { data, error } = await sb.rpc('copertina_dal_viaggio', { p_trip: r.id });
      if(error) throw error;
      if(!data){ e.textContent='Nessuna tappa ha una foto con licenza.'; e.style.color='#D8A93B'; return; }
      ed.querySelector('.f-cover').value = data;
      e.textContent = 'Trovata. Premi Salva per tenerla.'; e.style.color='#5BBE7E';
    }catch(err){ e.textContent='Non sono riuscito: '+(err.message||''); e.style.color='#E06A6A'; }
  }

  async function tappe(ed, r){
    const dove = ed.querySelector('.itin-tappe');
    if(dove.innerHTML){ dove.innerHTML=''; return; }
    dove.innerHTML = '<div style="opacity:.6;font-size:12.5px">Carico le tappe…</div>';
    try{
      const { data, error } = await sb.from('trip_stops')
        .select('id,name,sort_order,region,poi_id').eq('trip_id', r.id).order('sort_order');
      if(error) throw error;
      if(!data.length){ dove.innerHTML='<div style="opacity:.6;font-size:12.5px">Nessuna tappa.</div>'; return; }
      dove.innerHTML = '<ol style="margin:0;padding-left:20px;font-size:13px;line-height:1.7">'+
        data.map(function(s){
          return '<li>'+esc(s.name)+(s.region?(' <span style="opacity:.55">· '+esc(s.region)+'</span>'):'')+
                 (s.poi_id?'':' <span style="opacity:.5">(senza luogo collegato)</span>')+'</li>';
        }).join('')+'</ol>';
    }catch(err){ dove.innerHTML='<div style="color:#E06A6A;font-size:12.5px">'+esc(err.message||'')+'</div>'; }
  }

  async function load(contenitore){
    box = contenitore;
    box.innerHTML = '<div class="panel" style="padding:26px;opacity:.7">Carico gli itinerari…</div>';
    await dati();
    disegna();
  }
  window.ItinerariAdmin = { load };
})();
