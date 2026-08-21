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

  async function dati(){
    try{
      const [l, v] = await Promise.all([
        sb.from('livelli').select('*').order('ordine'),
        sb.from('livello_vantaggi').select('*').order('ordine'),
      ]);
      livelli = l.data || [];
      vantaggi = {};
      (v.data || []).forEach(function(x){ (vantaggi[x.livello] = vantaggi[x.livello] || []).push(x); });
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
        '<div class="card-h"><span class="ic"><i class="ph-duotone ph-medal"></i></span>I livelli</div>'+
        '<div class="sm">Nome, prezzo, e cosa da\' ognuno. Le manopole sono quelle vere: cambiarle cambia '+
        'davvero cosa una persona puo\' fare, subito. I vantaggi scritti sono quelli che si leggono nelle pagine, '+
        'nelle tre lingue.</div>'+
      '</div>'+
      livelli.map(riga).join('');

    box.querySelectorAll('[data-liv]').forEach(function(c){
      const l = livelli.find(function(x){ return x.chiave === c.dataset.liv; });
      c.querySelector('[data-azione=apri]').onclick = function(){ apri(c, l); };
      if(aperto === l.chiave) apri(c, l);
    });
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
        '<div class="field"><label>Ogni quanto</label><select class="f-periodo">'+
          PERIODI.map(function(p){ return '<option value="'+p[0]+'"'+(l.periodo===p[0]?' selected':'')+'>'+p[1]+'</option>'; }).join('')+
        '</select></div>'+
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

      '<div style="display:flex;gap:16px;flex-wrap:wrap;margin:12px 0;font-size:13px;font-weight:700">'+
        INTERRUTTORI.map(function(i){
          return '<label><input type="checkbox" class="f-si" data-campo="'+i[0]+'"'+(l[i[0]]?' checked':'')+'> '+esc(i[1])+'</label>';
        }).join('')+
      '</div>'+

      '<div style="font-size:13px;font-weight:900;margin:16px 0 8px">I vantaggi, uno per uno ('+v.length+')</div>'+
      '<div class="liv-vant">'+v.map(vantaggioRiga).join('')+'</div>'+
      '<button class="btn sm" data-azione="nuovo" style="margin-top:8px"><i class="ph-duotone ph-plus"></i> Aggiungi un vantaggio</button>'+

      '<div class="btn-row" style="margin-top:14px">'+
        '<button class="btn gold" data-azione="salva"><i class="ph-duotone ph-floppy-disk"></i> Salva il livello</button>'+
      '</div>'+
      '<div class="liv-esito" style="margin-top:8px;font-size:12.5px;font-weight:700"></div>';

    d.querySelector('[data-azione=salva]').onclick = function(){ salva(d, l); };
    d.querySelector('[data-azione=nuovo]').onclick = function(){ nuovoVantaggio(d, l); };
    agganciaVantaggi(d, l);
  }

  function vantaggioRiga(x){
    return '<div style="background:rgba(255,255,255,.03);border-radius:10px;padding:10px;margin-bottom:7px" data-vant="'+x.id+'">'+
      '<div style="display:flex;gap:8px;align-items:center;margin-bottom:7px">'+
        '<input class="v-ordine" type="number" min="1" value="'+Number(x.ordine||100)+'" style="width:62px" title="ordine">'+
        '<input class="v-icona" value="'+esc(x.icona||'ph-check-circle')+'" style="width:150px;font-family:ui-monospace,monospace;font-size:12px" title="icona">'+
        '<label style="font-size:12px;font-weight:700"><input type="checkbox" class="v-evid"'+(x.in_evidenza?' checked':'')+'> in vetrina</label>'+
        '<label style="font-size:12px;font-weight:700"><input type="checkbox" class="v-attivo"'+(x.attivo?' checked':'')+'> attivo</label>'+
        '<button class="btn sm" data-togli-vant="'+x.id+'" style="margin-left:auto;padding:4px 10px;font-size:11.5px">Togli</button>'+
      '</div>'+
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:7px">'+
        '<input class="v-it" value="'+esc(x.testo_it)+'" placeholder="italiano">'+
        '<input class="v-sq" value="'+esc(x.testo_sq||'')+'" placeholder="shqip">'+
        '<input class="v-en" value="'+esc(x.testo_en||'')+'" placeholder="english">'+
      '</div></div>';
  }

  function agganciaVantaggi(d, l){
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
          in_evidenza: r.querySelector('.v-evid').checked,
          attivo: r.querySelector('.v-attivo').checked,
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
