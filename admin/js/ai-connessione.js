/**
 * © Alessandro Castagna — 321.al / EVOLAB
 * Tutti i diritti riservati. Uso non autorizzato vietato.
 * info@321.it · https://321.al
 *
 * Le connessioni AI: chi risponde a ILLI e al copilota.
 *
 * Ogni fornitore ha la sua scheda: se la chiave c'e' sulla macchina, se e'
 * acceso, quale modello usa, quanto costa e dove si va a prendere la chiave.
 * Il pallino verde si accende solo quando tutte e due le cose sono vere:
 * la chiave esiste E il fornitore e' acceso.
 *
 * L'ordine conta: si prova il primo acceso, e se non risponde si scende.
 */
(function(){
  function esc(s){
    return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){
      return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c];
    });
  }
  function indirizzoSicuro(u){
    const t = String(u || '');
    return /^https:\/\//i.test(t) ? t : '';
  }

  let box=null, fornitori=[], chiavi={}, attivo=null;

  async function dati(){
    try{
      const q = await sb.from('ai_fornitori').select('*').order('ordine');
      fornitori = q.data || [];
    }catch(e){ fornitori = []; console.warn('fornitori:', e); }

    // Quali chiavi esistono davvero lo sa solo il server: lo si chiede a lui.
    chiavi = {}; attivo = null;
    try{
      const { data:{ session } } = await sb.auth.getSession();
      if(session){
        const r = await fetch(SUPABASE_URL + '/functions/v1/illi-chat', {
          method:'POST',
          headers:{'Content-Type':'application/json','Authorization':'Bearer '+session.access_token,'apikey':SUPABASE_ANON},
          body: JSON.stringify({ mode:'engine_status' }),
        });
        if(r.ok){ const j = await r.json(); chiavi = j.providers || {}; attivo = j.active || null; }
      }
    }catch(e){ console.warn('stato chiavi:', e); }
  }

  function pallino(f){
    // Quello che gira sulla nostra macchina non ha nessuna chiave da avere:
    // dirgli "senza chiave" era falso e faceva sembrare rotto quello che funziona.
    if(f.locale){
      return f.acceso
        ? { colore:'#5BBE7E', testo:'acceso, gira sulla nostra macchina' }
        : { colore:'#8a8a8a', testo:'pronto sulla nostra macchina, spento' };
    }
    const haChiave = chiavi[f.chiave] === true;
    if(haChiave && f.acceso) return { colore:'#5BBE7E', testo:'connesso e acceso' };
    if(haChiave && !f.acceso) return { colore:'#8a8a8a', testo:'chiave presente, spento' };
    if(!haChiave && f.acceso) return { colore:'#E06A6A', testo:'acceso ma senza chiave' };
    return { colore:'#5a5a5a', testo:'senza chiave' };
  }

  function scheda(f, posto){
    const p = pallino(f);
    const opz = (f.modelli || []).map(function(m){
      return '<option value="'+esc(m)+'"'+(f.modello===m?' selected':'')+'>'+esc(m)+'</option>';
    }).join('');
    const usatoDaIlli = attivo && attivo.provider === f.chiave;
    return '<div class="panel" style="padding:14px;margin-bottom:10px" data-chi="'+esc(f.chiave)+'">'+
      '<div style="display:flex;gap:12px;align-items:flex-start">'+
        '<span style="width:11px;height:11px;border-radius:50%;background:'+p.colore+';flex:0 0 11px;margin-top:6px;'+
          'box-shadow:0 0 9px '+p.colore+'66"></span>'+
        '<div style="flex:1;min-width:0">'+
          '<div style="font-size:16px;font-weight:900">'+esc(f.nome)+
            '<span style="font-size:11.5px;font-weight:700;opacity:.6;margin-left:9px">'+esc(p.testo)+'</span>'+
            (usatoDaIlli ? '<span style="font-size:11px;font-weight:800;margin-left:9px;background:rgba(212,43,43,.16);'+
              'color:var(--red,#D42B2B);padding:2px 9px;border-radius:999px">lo usa ILLI</span>' : '')+
            (f.fa_voce ? '<span style="font-size:11px;font-weight:800;margin-left:6px;background:rgba(40,94,167,.16);'+
              'color:#5B8FD4;padding:2px 9px;border-radius:999px">fa anche la voce</span>' : '')+
          '</div>'+
          (f.prezzo_nota ? '<div style="font-size:12.5px;opacity:.7;margin-top:4px">'+esc(f.prezzo_nota)+'</div>' : '')+
          (f.note ? '<div style="font-size:12px;opacity:.55;margin-top:3px">'+esc(f.note)+'</div>' : '')+
          '<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-top:10px">'+
            '<label style="font-size:12.5px;font-weight:700">modello '+
              '<select class="f-modello" style="background:var(--bg,#181818);color:inherit;border:1.5px solid var(--line,#3a3a3a);'+
                'border-radius:9px;padding:6px 9px;font-family:inherit;font-size:12.5px;margin-left:5px">'+opz+'</select></label>'+
            '<label style="font-size:12.5px;font-weight:700">si prova per '+
              '<input class="f-ordine" type="number" min="1" max="999" value="'+Number(f.ordine||100)+'" '+
              'style="width:64px;background:var(--bg,#181818);color:inherit;border:1.5px solid var(--line,#3a3a3a);'+
              'border-radius:9px;padding:6px;font-family:inherit;margin-left:5px"> ('+posto+'&ordm;)</label>'+
            '<label style="font-size:12.5px;font-weight:800"><input type="checkbox" class="f-acceso"'+
              (f.acceso?' checked':'')+'> acceso</label>'+
          '</div>'+
        '</div>'+
        '<div style="display:flex;flex-direction:column;gap:6px;min-width:150px">'+
          (indirizzoSicuro(f.indirizzo_chiave)
            ? '<a class="btn sm" href="'+esc(f.indirizzo_chiave)+'" target="_blank" rel="noopener">'+
              '<i class="ph-duotone ph-key"></i> Prendi la chiave</a>' : '')+
          '<button class="btn sm gold" data-azione="salva"><i class="ph-duotone ph-floppy-disk"></i> Salva</button>'+
          '<button class="btn sm" data-azione="prova"><i class="ph-duotone ph-plugs"></i> Prova</button>'+
        '</div>'+
      '</div>'+
      (chiavi[f.chiave] !== true && f.nome_segreto
        ? '<div style="margin-top:10px;font-size:12px;opacity:.65;border-top:1px solid var(--line,#3a3a3a);padding-top:9px">'+
          'La chiave non c\'e\' sulla macchina. Quando la prendi, mandala ad Alessandro: si carica nel segreto '+
          '<code style="background:rgba(255,255,255,.06);padding:1px 6px;border-radius:5px">'+esc(f.nome_segreto)+'</code>. '+
          'Non si incolla qui: una chiave scritta in una pagina web la vede troppa gente.</div>'
        : '')+
      '<div class="ai-esito" style="margin-top:8px;font-size:12.5px;font-weight:700"></div>'+
    '</div>';
  }

  function disegna(){
    const accesi = fornitori.filter(function(f){ return f.acceso && chiavi[f.chiave] === true; });
    const ordinati = fornitori.slice().sort(function(a,b){ return (a.ordine||100) - (b.ordine||100); });

    box.innerHTML =
      '<div class="panel" style="margin-bottom:14px">'+
        '<div style="font-size:12.5px;opacity:.75;line-height:1.6">'+
          'Ogni riga e\' un fornitore di intelligenza artificiale. Il pallino e\' verde solo quando '+
          '<b>la chiave c\'e\' sulla macchina</b> e il fornitore e\' <b>acceso</b>. '+
          'Si prova il primo acceso, e se non risponde si scende al successivo: il numero "si prova per" decide l\'ordine. '+
          'La chiave non si scrive qui dentro: si prende dal sito del fornitore e si carica nel segreto del server.'+
        '</div>'+
        '<div style="margin-top:10px;font-size:13px;font-weight:800">'+
          (accesi.length
            ? accesi.length+' '+(accesi.length===1?'connessione pronta':'connessioni pronte')+': '+
              accesi.map(function(f){ return esc(f.nome); }).join(', ')
            : '<span style="color:#E06A6A">nessuna connessione pronta</span>')+
        '</div>'+
      '</div>'+
      ordinati.map(function(f,i){ return scheda(f, i+1); }).join('');

    box.querySelectorAll('[data-chi]').forEach(function(c){
      const f = fornitori.find(function(x){ return x.chiave === c.dataset.chi; });
      c.querySelector('[data-azione=salva]').onclick = function(){ salva(c, f); };
      c.querySelector('[data-azione=prova]').onclick = function(){ prova(c, f); };
    });
  }

  async function salva(c, f){
    const e = c.querySelector('.ai-esito');
    const campi = {
      modello: c.querySelector('.f-modello').value,
      ordine: Number(c.querySelector('.f-ordine').value) || 100,
      acceso: c.querySelector('.f-acceso').checked,
      aggiornato: new Date().toISOString(),
    };
    if(campi.acceso && chiavi[f.chiave] !== true){
      if(!confirm('Accendo '+f.nome+' anche se la chiave non c\'e\'?\n\nResta acceso ma non rispondera finche la chiave non arriva sulla macchina.')) return;
    }
    e.textContent = 'Salvo…'; e.style.color = 'inherit';
    try{
      const { data, error } = await sb.from('ai_fornitori').update(campi).eq('chiave', f.chiave).select('chiave');
      if(error) throw error;
      if(!data || !data.length) throw new Error('il database non ha accettato: se la sessione non ha il secondo fattore, esci e rientra col codice a sei cifre');
      e.textContent = 'Salvato.'; e.style.color = '#5BBE7E';
      Object.assign(f, campi);
      setTimeout(function(){ disegna(); }, 800);
    }catch(err){ e.textContent = 'Non sono riuscito: '+(err.message||''); e.style.color = '#E06A6A'; }
  }

  // Provare sul serio: si manda una domanda vera e si guarda se torna qualcosa.
  async function prova(c, f){
    const e = c.querySelector('.ai-esito');
    if(chiavi[f.chiave] !== true){
      e.textContent = 'Non posso provare: la chiave non c\'e\' sulla macchina.'; e.style.color = '#D8A93B'; return;
    }
    e.textContent = 'Provo…'; e.style.color = 'inherit';
    const inizio = Date.now();
    try{
      const { data:{ session } } = await sb.auth.getSession();
      const r = await fetch(SUPABASE_URL + '/functions/v1/illi-chat', {
        method:'POST',
        headers:{'Content-Type':'application/json','Authorization':'Bearer '+session.access_token,'apikey':SUPABASE_ANON},
        body: JSON.stringify({
          model: f.modello,
          messages: [{ role:'user', content:'Rispondi con una parola sola: pronto' }],
          max_completion_tokens: 16,
        }),
      });
      const j = await r.json().catch(function(){ return {}; });
      const quanto = Date.now() - inizio;
      if(!r.ok){
        e.textContent = 'Ha risposto male: '+(j.error || r.status); e.style.color = '#E06A6A'; return;
      }
      const testo = (j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content) || '';
      e.textContent = 'Risponde, in '+quanto+' millesimi: "'+String(testo).trim().slice(0,40)+'"';
      e.style.color = '#5BBE7E';
    }catch(err){ e.textContent = 'Non ha risposto: '+(err.message||''); e.style.color = '#E06A6A'; }
  }

  async function load(contenitore){
    box = contenitore;
    box.innerHTML = '<div class="panel" style="padding:26px;opacity:.7">Guardo quali connessioni ci sono…</div>';
    await dati();
    disegna();
  }
  window.AiConnessione = { load };
})();
