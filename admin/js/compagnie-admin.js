/**
 * © Alessandro Castagna — 321.al / EVOLAB
 * Tutti i diritti riservati. Uso non autorizzato vietato.
 * info@321.it · https://321.al
 *
 * Le compagnie di viaggio, viste dall'amministrazione.
 *
 * Una compagnia e' un gruppo di persone che viaggiano insieme: hanno una
 * bacheca dove si lasciano messaggi vocali, i luoghi che si segnalano, gli
 * itinerari che portano avanti. Fino a oggi le vedeva solo chi ne faceva parte,
 * quindi se una andava male nessuno poteva intervenire.
 *
 * Da qui si guarda dentro e si modera: si toglie un vocale, si toglie una
 * persona, si corregge il nome, si chiude una compagnia. Niente di piu': una
 * compagnia resta di chi l'ha fatta.
 */
(function(){
  // I nomi delle compagnie e i vocali li scrivono le persone: si puliscono sempre.
  function esc(s){
    return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){
      return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c];
    });
  }
  function soloGiorno(t){
    if(!t) return '—';
    try{ return new Date(t).toLocaleDateString('it-IT', {day:'2-digit', month:'short', year:'numeric'}); }
    catch(_){ return String(t).slice(0,10); }
  }
  function quando(t){
    if(!t) return '—';
    try{
      const d = new Date(t);
      return d.toLocaleDateString('it-IT', {day:'2-digit', month:'short', year:'numeric'}) +
             ' ' + d.toLocaleTimeString('it-IT', {hour:'2-digit', minute:'2-digit'});
    }catch(_){ return String(t).slice(0,16); }
  }
  const TIPI = { forever:'per sempre', trip:'un viaggio', dinner:'una cena' };

  let box=null, righe=[], filtro='';

  async function dati(){
    try{
      const { data, error } = await sb.rpc('compagnie_quadro');
      if(error) throw error;
      righe = data || [];
    }catch(e){ righe = []; console.warn('compagnie:', e); }
  }

  function scheda(r){
    const morta = !r.vocali && r.entrati <= 1;
    return '<div class="panel" style="padding:14px;margin-bottom:10px" data-id="'+esc(r.id)+'">'+
      '<div style="display:flex;gap:14px;align-items:flex-start">'+
        '<div style="width:52px;height:52px;flex:0 0 52px;border-radius:14px;background:rgba(212,43,43,.14);'+
          'display:flex;align-items:center;justify-content:center;font-size:22px;color:var(--red,#D42B2B)">'+
          '<i class="ph-duotone ph-users-three"></i></div>'+
        '<div style="flex:1;min-width:0">'+
          '<div style="font-size:16px;font-weight:900">'+esc(r.nome)+
            '<span style="font-family:ui-monospace,monospace;font-size:12px;opacity:.55;margin-left:9px">'+esc(r.codice)+'</span></div>'+
          '<div style="font-size:12.5px;opacity:.7;margin-top:3px">'+
            (TIPI[r.tipo] || esc(r.tipo))+' · di '+esc(r.proprietario_nome)+' · nata il '+soloGiorno(r.creata)+
            (r.pubblica ? ' · <b>pubblica</b>' : '')+
          '</div>'+
          '<div style="font-size:12.5px;margin-top:6px;display:flex;gap:14px;flex-wrap:wrap">'+
            '<span><b>'+r.entrati+'</b> dentro'+(r.membri>r.entrati?(' <span style="opacity:.55">('+(r.membri-r.entrati)+' invitati)</span>'):'')+'</span>'+
            '<span><b>'+r.vocali+'</b> sulla bacheca</span>'+
            '<span><b>'+r.luoghi+'</b> luoghi</span>'+
            '<span><b>'+r.itinerari+'</b> itinerari</span>'+
            (r.ultimo_vocale ? '<span style="opacity:.6">ultimo: '+quando(r.ultimo_vocale)+'</span>' : '')+
          '</div>'+
          (morta ? '<div style="font-size:12px;margin-top:6px;color:#D8A93B"><i class="ph-duotone ph-moon"></i> nessuno e mai entrato e non ha mai parlato nessuno</div>' : '')+
        '</div>'+
        '<button class="btn sm" data-azione="apri"><i class="ph-duotone ph-magnifying-glass"></i> Guarda dentro</button>'+
      '</div>'+
      '<div class="comp-dentro" hidden style="margin-top:12px;border-top:1px solid var(--line,#3a3a3a);padding-top:12px"></div>'+
    '</div>';
  }

  function disegna(){
    const viste = filtro
      ? righe.filter(function(r){
          const t = (r.nome+' '+r.codice+' '+r.proprietario_nome).toLowerCase();
          return t.indexOf(filtro.toLowerCase()) >= 0;
        })
      : righe;
    const vocaliTot = righe.reduce(function(n,r){ return n + (r.vocali||0); }, 0);
    const vive = righe.filter(function(r){ return r.vocali > 0; }).length;

    box.innerHTML =
      '<div class="panel" style="margin-bottom:14px">'+
        '<div style="font-size:12.5px;opacity:.7;line-height:1.55;margin-bottom:10px">'+
          'Una compagnia e\' un gruppo che viaggia insieme: la bacheca dove si lasciano i messaggi vocali, '+
          'i luoghi che si segnalano, gli itinerari che portano avanti. Da qui si guarda dentro e si modera. '+
          'Una compagnia resta di chi l\'ha fatta: qui non si entra a farne parte.'+
        '</div>'+
        '<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">'+
          '<input id="compCerca" placeholder="Cerca per nome, codice o proprietario" value="'+esc(filtro)+'" '+
            'style="flex:1;min-width:220px;background:var(--bg,#181818);color:inherit;border:1.5px solid var(--line,#3a3a3a);'+
            'border-radius:10px;padding:9px 12px;font-family:inherit;font-size:13px">'+
          '<button class="btn sm" id="compRicarica"><i class="ph-duotone ph-arrows-clockwise"></i> Ricarica</button>'+
        '</div>'+
        '<div style="margin-top:10px;font-size:13px;font-weight:800">'+
          righe.length+' compagnie · '+vive+' con almeno un vocale · '+vocaliTot+' vocali in tutto</div>'+
      '</div>'+
      (viste.length ? viste.map(scheda).join('')
                    : '<div class="panel">Nessuna compagnia'+(filtro?' con questo nome':'')+'.</div>');

    const cerca = document.getElementById('compCerca');
    if(cerca){
      cerca.oninput = function(){ filtro = cerca.value; const p = cerca.selectionStart; disegna();
        const n = document.getElementById('compCerca'); if(n){ n.focus(); n.setSelectionRange(p,p); } };
    }
    const ric = document.getElementById('compRicarica');
    if(ric) ric.onclick = async function(){ await dati(); disegna(); };

    box.querySelectorAll('[data-id]').forEach(function(c){
      const r = righe.find(function(x){ return x.id === c.dataset.id; });
      c.querySelector('[data-azione=apri]').onclick = function(){ apri(c, r); };
    });
  }

  async function apri(c, r){
    const d = c.querySelector('.comp-dentro');
    if(!d.hidden){ d.hidden = true; return; }
    d.hidden = false;
    d.innerHTML = '<div style="opacity:.6;font-size:12.5px">Guardo dentro…</div>';
    let membri = [], bacheca = [];
    try{
      const [m, b] = await Promise.all([
        sb.rpc('compagnia_membri', { p_comp: r.id }),
        sb.rpc('compagnia_bacheca', { p_comp: r.id, p_quanti: 50 }),
      ]);
      membri = m.data || []; bacheca = b.data || [];
    }catch(e){
      d.innerHTML = '<div style="color:#E06A6A;font-size:12.5px">Non sono riuscito a leggere: '+esc(e.message||'')+'</div>';
      return;
    }

    d.innerHTML =
      '<div class="row2">'+
        '<div class="field"><label>Nome della compagnia</label><input class="f-nome" value="'+esc(r.nome)+'"></div>'+
        '<div class="field"><label>Codice per entrare</label><input value="'+esc(r.codice)+'" readonly style="opacity:.6"></div>'+
      '</div>'+
      '<div style="display:flex;gap:16px;flex-wrap:wrap;margin:4px 0 12px;font-size:13px;font-weight:700">'+
        '<label><input type="checkbox" class="f-pub"'+(r.pubblica?' checked':'')+'> visibile a tutti</label>'+
      '</div>'+
      '<div class="btn-row" style="margin-bottom:12px">'+
        '<button class="btn sm gold" data-azione="salva"><i class="ph-duotone ph-floppy-disk"></i> Salva</button>'+
        '<button class="btn sm" data-azione="chiudi"><i class="ph-duotone ph-trash"></i> Chiudi la compagnia</button>'+
      '</div>'+
      '<div class="comp-esito" style="margin-bottom:10px;font-size:12.5px;font-weight:700"></div>'+

      '<div style="font-size:13px;font-weight:900;margin:14px 0 6px">Chi c\'e\' dentro · '+membri.length+'</div>'+
      (membri.length
        ? '<div style="display:flex;flex-direction:column;gap:6px">'+membri.map(function(m){
            return '<div style="display:flex;align-items:center;gap:10px;font-size:13px;padding:7px 10px;'+
              'background:rgba(255,255,255,.03);border-radius:9px" data-membro="'+esc(m.id)+'">'+
              '<span style="flex:1;min-width:0">'+esc(m.nome)+
                (m.e_il_proprietario?' <span style="opacity:.6;font-size:11.5px">(l\'ha fatta lei)</span>':'')+
                (m.email && m.stato!=='joined' ? ' <span style="opacity:.5;font-size:11.5px">'+esc(m.email)+'</span>' : '')+
              '</span>'+
              '<span style="font-size:11.5px;opacity:.7">'+(m.stato==='joined'?'dentro':'invitata')+'</span>'+
              (m.e_il_proprietario ? '' :
                '<button class="btn sm" data-togli-membro="'+esc(m.id)+'" style="padding:4px 10px;font-size:11.5px">Togli</button>')+
            '</div>';
          }).join('')+'</div>'
        : '<div style="opacity:.6;font-size:12.5px">Nessuno, per ora.</div>')+

      '<div style="font-size:13px;font-weight:900;margin:16px 0 6px">La bacheca · '+bacheca.length+
        (bacheca.length>=50?' (ultimi 50)':'')+'</div>'+
      (bacheca.length
        ? '<div style="display:flex;flex-direction:column;gap:7px">'+bacheca.map(function(v){
            const testo = v.trascrizione || v.testo || '';
            return '<div style="font-size:13px;padding:9px 11px;background:rgba(255,255,255,.03);border-radius:9px" '+
              'data-vocale="'+esc(v.id)+'">'+
              '<div style="display:flex;gap:10px;align-items:baseline">'+
                '<b style="font-size:12.5px">'+esc(v.autore_nome)+'</b>'+
                '<span style="font-size:11px;opacity:.55">'+quando(v.quando)+
                  (v.secondi>0?(' · '+v.secondi+'s'):'')+
                  (v.luogo?(' · '+esc(v.luogo)):'')+'</span>'+
                '<button class="btn sm" data-togli-vocale="'+esc(v.id)+'" '+
                  'style="margin-left:auto;padding:3px 9px;font-size:11px">Togli</button>'+
              '</div>'+
              (testo
                ? '<div style="margin-top:5px;line-height:1.5">'+esc(testo)+'</div>'
                : '<div style="margin-top:5px;opacity:.5;font-size:12px">vocale senza trascrizione</div>')+
            '</div>';
          }).join('')+'</div>'
        : '<div style="opacity:.6;font-size:12.5px">Nessun messaggio.</div>');

    d.querySelector('[data-azione=salva]').onclick  = function(){ salva(d, r); };
    d.querySelector('[data-azione=chiudi]').onclick = function(){ chiudi(d, r); };
    d.querySelectorAll('[data-togli-vocale]').forEach(function(b){
      b.onclick = function(){ togliVocale(d, b.dataset.togliVocale, b); };
    });
    d.querySelectorAll('[data-togli-membro]').forEach(function(b){
      b.onclick = function(){ togliMembro(d, b.dataset.togliMembro, b); };
    });
  }

  // Ogni scrittura si fa restituire la riga: se una regola del database rifiuta,
  // non arriva nessun errore ma non cambia niente, e diremmo "salvato" a vuoto.
  async function salva(d, r){
    const e = d.querySelector('.comp-esito');
    const nome = d.querySelector('.f-nome').value.trim();
    const pub  = d.querySelector('.f-pub').checked;
    if(!nome){ e.textContent = 'Il nome non puo restare vuoto.'; e.style.color = '#E06A6A'; return; }
    e.textContent = 'Salvo…'; e.style.color = 'inherit';
    try{
      const { data, error } = await sb.from('companions')
        .update({ name: nome, is_public: pub }).eq('id', r.id).select('id');
      if(error) throw error;
      if(!data || !data.length) throw new Error('il database non ha accettato la modifica: se la sessione non ha il secondo fattore, esci e rientra col codice a sei cifre');
      e.textContent = 'Salvato.'; e.style.color = '#5BBE7E';
      r.nome = nome; r.pubblica = pub;
    }catch(err){ e.textContent = 'Non sono riuscito: '+(err.message||''); e.style.color = '#E06A6A'; }
  }

  async function togliVocale(d, id, bottone){
    if(!confirm('Tolgo questo messaggio dalla bacheca?\n\nLo vedranno sparire tutti quelli della compagnia.')) return;
    bottone.disabled = true;
    try{
      const { data, error } = await sb.from('companion_messages').delete().eq('id', id).select('id');
      if(error) throw error;
      if(!data || !data.length) throw new Error('il database non ha accettato');
      const riga = d.querySelector('[data-vocale="'+id+'"]');
      if(riga) riga.remove();
    }catch(err){
      bottone.disabled = false;
      d.querySelector('.comp-esito').textContent = 'Non sono riuscito: '+(err.message||'');
      d.querySelector('.comp-esito').style.color = '#E06A6A';
    }
  }

  async function togliMembro(d, id, bottone){
    if(!confirm('Tolgo questa persona dalla compagnia?\n\nPuo sempre rientrare col codice, se qualcuno glielo da.')) return;
    bottone.disabled = true;
    try{
      const { data, error } = await sb.from('companion_members').delete().eq('id', id).select('id');
      if(error) throw error;
      if(!data || !data.length) throw new Error('il database non ha accettato');
      const riga = d.querySelector('[data-membro="'+id+'"]');
      if(riga) riga.remove();
    }catch(err){
      bottone.disabled = false;
      d.querySelector('.comp-esito').textContent = 'Non sono riuscito: '+(err.message||'');
      d.querySelector('.comp-esito').style.color = '#E06A6A';
    }
  }

  async function chiudi(d, r){
    if(!confirm('Chiudo la compagnia "'+r.nome+'"?\n\nSpariscono la bacheca, i luoghi segnalati e chi ne faceva parte. Non si torna indietro.')) return;
    if(!confirm('Sicuro? Questa non si annulla.')) return;
    const e = d.querySelector('.comp-esito');
    e.textContent = 'Chiudo…'; e.style.color = 'inherit';
    try{
      const { data, error } = await sb.from('companions').delete().eq('id', r.id).select('id');
      if(error) throw error;
      if(!data || !data.length) throw new Error('il database non ha accettato');
      await dati(); disegna();
    }catch(err){ e.textContent = 'Non sono riuscito: '+(err.message||''); e.style.color = '#E06A6A'; }
  }

  async function load(contenitore){
    box = contenitore;
    box.innerHTML = '<div class="panel" style="padding:26px;opacity:.7">Carico le compagnie…</div>';
    await dati();
    disegna();
  }
  window.CompagnieAdmin = { load };
})();
