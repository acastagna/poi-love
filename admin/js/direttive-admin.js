/**
 * © Alessandro Castagna — 321.al / EVOLAB
 * Tutti i diritti riservati. Uso non autorizzato vietato.
 * info@321.it · https://321.al
 *
 * Le direttive della moderazione.
 * Non sono scritte nel programma: sono righe di database. Si cambiano qui, e
 * la moderazione le segue dal messaggio dopo. C'e' anche la prova a vuoto:
 * si incolla un testo e si vede cosa deciderebbe, senza toccare niente.
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

  let box=null, righe=[];

  function card(d){
    return '<div class="panel" style="padding:14px;margin-bottom:10px;display:flex;gap:12px;align-items:flex-start" data-id="'+d.id+'">'+
      '<div style="flex:1;min-width:0">'+
        '<textarea data-campo="regola" rows="2" style="width:100%;border:1.5px solid var(--line,#3a3a3a);border-radius:10px;'+
          'background:transparent;color:inherit;font-family:inherit;font-size:13.5px;padding:9px 11px;resize:vertical">'+
          esc(d.regola)+'</textarea>'+
        '<input data-campo="esempio" value="'+(d.esempio||'')+'" placeholder="esempio da fermare (facoltativo)" '+
          'style="width:100%;margin-top:6px;border:1.5px solid var(--line,#3a3a3a);border-radius:10px;background:transparent;'+
          'color:inherit;font-family:inherit;font-size:12.5px;padding:8px 11px">'+
      '</div>'+
      '<div style="display:flex;flex-direction:column;gap:6px;align-items:stretch;min-width:118px">'+
        '<label style="display:flex;align-items:center;gap:6px;font-size:12px;font-weight:800">'+
          '<input type="checkbox" data-campo="attiva"'+(d.attiva?' checked':'')+'> attiva</label>'+
        '<input type="number" data-campo="ordine" value="'+(d.ordine||100)+'" style="width:100%;border:1.5px solid var(--line,#3a3a3a);'+
          'border-radius:9px;background:transparent;color:inherit;font-family:inherit;font-size:12.5px;padding:6px 8px" title="ordine">'+
        '<button data-azione="salva" style="border:none;border-radius:10px;background:var(--red,#D42B2B);color:#fff;'+
          'font-family:inherit;font-weight:800;font-size:12.5px;padding:8px;cursor:pointer">Salva</button>'+
        '<button data-azione="togli" style="border:1.5px solid var(--line,#3a3a3a);border-radius:10px;background:transparent;'+
          'color:inherit;font-family:inherit;font-weight:700;font-size:12px;padding:7px;cursor:pointer">Togli</button>'+
      '</div></div>';
  }

  function disegna(){
    box.innerHTML =
      '<div class="panel" style="margin-bottom:16px">'+
        '<h3 style="margin:0 0 4px;font-size:17px">Direttive della moderazione</h3>'+
        '<div style="font-size:12.5px;opacity:.65;line-height:1.55">'+
          'Sono le regole che la moderazione segue per decidere se una recensione si pubblica. '+
          'Non stanno nel programma: si cambiano qui e valgono dal messaggio dopo. '+
          'Scrivile come le diresti a una persona, con un esempio di quello che vuoi fermare.'+
        '</div>'+
      '</div>'+
      '<div id="dirLista">'+righe.map(card).join('')+'</div>'+
      '<button id="dirNuova" style="height:42px;padding:0 18px;border:1.5px dashed var(--line,#3a3a3a);border-radius:13px;'+
        'background:transparent;color:inherit;font-family:inherit;font-weight:800;font-size:13.5px;cursor:pointer">'+
        '+ Nuova direttiva</button>'+
      '<div class="panel" style="margin-top:20px">'+
        '<h3 style="margin:0 0 4px;font-size:16px">Prova a vuoto</h3>'+
        '<div style="font-size:12.5px;opacity:.65;margin-bottom:10px;line-height:1.5">'+
          'Incolla un testo e guarda cosa deciderebbe la moderazione con le direttive di adesso. '+
          'Non tocca nessuna recensione vera.</div>'+
        '<textarea id="dirProvaTxt" rows="3" placeholder="Es. Il cuoco e un incapace, andate dal concorrente" '+
          'style="width:100%;border:1.5px solid var(--line,#3a3a3a);border-radius:12px;background:transparent;color:inherit;'+
          'font-family:inherit;font-size:13.5px;padding:10px 12px;resize:vertical"></textarea>'+
        '<button id="dirProva" style="margin-top:9px;height:42px;padding:0 18px;border:none;border-radius:13px;'+
          'background:var(--gold,#C9A227);color:#1a1a1a;font-family:inherit;font-weight:900;font-size:13.5px;cursor:pointer">Prova</button>'+
        '<div id="dirEsito" style="margin-top:12px;font-size:13.5px;font-weight:700;line-height:1.5"></div>'+
      '</div>';

    box.querySelectorAll('[data-id]').forEach(c=>{
      c.querySelector('[data-azione=salva]').onclick=()=>salva(c);
      c.querySelector('[data-azione=togli]').onclick=()=>togli(c);
    });
    document.getElementById('dirNuova').onclick=nuova;
    document.getElementById('dirProva').onclick=prova;
  }

  async function salva(c){
    const id=c.dataset.id;
    const dati={
      regola: c.querySelector('[data-campo=regola]').value.trim(),
      esempio: c.querySelector('[data-campo=esempio]').value.trim() || null,
      attiva: c.querySelector('[data-campo=attiva]').checked,
      ordine: Number(c.querySelector('[data-campo=ordine]').value)||100,
    };
    if(!dati.regola){ alert('La direttiva non puo restare vuota'); return; }
    const b=c.querySelector('[data-azione=salva]'); const prima=b.textContent; b.textContent='…';
    try{
      const { error } = await sb.from('direttive_moderazione').update(dati).eq('id', Number(id));
      if(error) throw error;
      b.textContent='Salvata'; setTimeout(()=>{ b.textContent=prima; },1400);
    }catch(e){ b.textContent=prima; alert('Non sono riuscito a salvare: '+(e.message||'')); }
  }
  async function togli(c){
    if(!confirm('Tolgo questa direttiva?')) return;
    try{
      const { error } = await sb.from('direttive_moderazione').delete().eq('id', Number(c.dataset.id));
      if(error) throw error;
      await carica();
    }catch(e){ alert('Non sono riuscito a toglierla: '+(e.message||'')); }
  }
  async function nuova(){
    try{
      const ordine = (righe.length ? Math.max.apply(null, righe.map(r=>r.ordine||100)) : 0) + 10;
      const { error } = await sb.from('direttive_moderazione').insert({ ambito:'recensioni', regola:'Nuova direttiva: scrivila qui', ordine, attiva:false });
      if(error) throw error;
      await carica();
    }catch(e){ alert('Non sono riuscito ad aggiungerla: '+(e.message||'')); }
  }

  async function prova(){
    const t=(document.getElementById('dirProvaTxt').value||'').trim();
    const e=document.getElementById('dirEsito');
    if(!t){ e.textContent='Scrivi prima un testo.'; return; }
    e.textContent='Chiedo alla moderazione…';
    try{
      const { data:{ session } } = await sb.auth.getSession();
      const r=await fetch('https://poilove.com/db/functions/v1/modera-recensione', {
        method:'POST',
        headers:{ 'Content-Type':'application/json', 'Authorization':'Bearer '+((session&&session.access_token)||'') },
        body: JSON.stringify({ prova:true, testo:t, voto:3, luogo:'prova' })
      });
      const j=await r.json();
      if(j.error){ e.textContent='Errore: '+String(j.error||''); e.style.color='#E06A6A'; return; }
      const colori={ pubblicata:'#5BBE7E', rifiutata:'#E06A6A', in_coda:'#D8A93B' };
      const parole={ pubblicata:'Si pubblica', rifiutata:'Non si pubblica', in_coda:'La guarda una persona' };
      e.style.color=colori[j.esito]||'inherit';
      e.innerHTML='<b>'+esc(parole[j.esito]||j.esito)+'</b><br><span style="font-weight:600;opacity:.85">'+
        esc(j.motivo)+(j.direttiva?(' · direttiva '+esc(j.direttiva)):'')+'</span>';
    }catch(err){ e.textContent='Non sono riuscito a provare: '+(err.message||''); e.style.color='#E06A6A'; }
  }

  async function carica(){
    box.innerHTML='<div class="panel" style="padding:26px;opacity:.7">Carico le direttive…</div>';
    try{
      const { data } = await sb.from('direttive_moderazione').select('*').eq('ambito','recensioni').order('ordine');
      righe = data || [];
    }catch(_){ righe = []; }
    disegna();
  }
  function load(contenitore){ box=contenitore; carica(); }
  window.DirettiveAdmin = { load };
})();
