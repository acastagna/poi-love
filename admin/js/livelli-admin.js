/**
 * © Alessandro Castagna — 321.al / EVOLAB
 * Tutti i diritti riservati. Uso non autorizzato vietato.
 * info@321.it · https://321.al
 *
 * Livelli, abbonamenti e ruoli.
 * Qui si cerca una persona, si vede a che punto sta col suo livello, si registra
 * un abbonamento pagato fuori dal sistema e si guarda la storia di cosa le e'
 * successo: quando ha preso il livello, quando e' stata avvisata, quando lo ha
 * perso. Niente di tutto questo si inventa: sono le righe del database.
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

  let box=null, livelli=[], scelto=null;

  function euro(){ return ''; }   // i prezzi non stanno qui: solo nella cartella riservata

  async function carica(){
    try{ const { data } = await sb.from('livelli').select('*').order('ordine'); livelli = data || []; }catch(_){ livelli=[]; }
  }

  function testata(){
    return '<div class="panel" style="margin-bottom:16px">'+
      '<h3 style="margin:0 0 4px;font-size:17px">Livelli e abbonamenti</h3>'+
      '<div style="font-size:12.5px;opacity:.65;line-height:1.55;margin-bottom:12px">'+
        'Il pagamento avviene fuori dal sistema. Qui si registra che e stato fatto, per quale livello e fino a quando: '+
        'da quel momento il livello vale davvero e il controllo della notte avvisa prima della scadenza.'+
      '</div>'+
      '<div style="display:flex;gap:8px;flex-wrap:wrap">'+
        '<input id="livCerca" placeholder="Cerca per nome utente o email" style="flex:1;min-width:220px;height:42px;'+
          'border:1.5px solid var(--line,#3a3a3a);border-radius:12px;background:transparent;color:inherit;'+
          'font-family:inherit;font-size:14px;padding:0 13px">'+
        '<button id="livVai" style="height:42px;padding:0 18px;border:none;border-radius:12px;background:var(--red,#D42B2B);'+
          'color:#fff;font-family:inherit;font-weight:900;font-size:13.5px;cursor:pointer">Cerca</button>'+
      '</div>'+
      '<div id="livRisultati" style="margin-top:12px"></div>'+
    '</div>';
  }

  function disegna(){
    box.innerHTML = testata() + '<div id="livScheda"></div>' +
      '<div class="panel" style="margin-top:16px">'+
        '<h3 style="margin:0 0 10px;font-size:16px">Chi ha un livello adesso</h3>'+
        '<div id="livElenco" style="font-size:13.5px">Carico…</div>'+
      '</div>';
    document.getElementById('livVai').onclick=cerca;
    document.getElementById('livCerca').addEventListener('keydown',e=>{ if(e.key==='Enter') cerca(); });
    elenco();
  }

  async function elenco(){
    const c=document.getElementById('livElenco');
    try{
      const { data } = await sb.from('profiles')
        .select('id,username,display_name,special_tier,livello_scadenza')
        .not('special_tier','is',null).order('livello_scadenza',{ascending:true}).limit(50);
      if(!data || !data.length){ c.textContent='Nessuno ha un livello, per ora.'; return; }
      c.innerHTML = data.map(u=>{
        const l = livelli.find(x=>x.chiave===u.special_tier);
        const gg = u.livello_scadenza ? Math.round((new Date(u.livello_scadenza)-Date.now())/864e5) : null;
        const col = gg===null ? '' : (gg<0 ? 'color:#E06A6A' : (gg<15 ? 'color:#D8A93B' : ''));
        return '<div style="display:flex;gap:10px;align-items:center;padding:8px 0;border-bottom:1px solid var(--line,#2a2a2a)">'+
          '<b style="flex:1">'+esc(u.display_name||u.username||'—')+'</b>'+
          '<span style="opacity:.8">'+esc((l&&l.nome)||u.special_tier)+'</span>'+
          '<span style="'+col+';font-size:12.5px;min-width:120px;text-align:right">'+
            (gg===null ? 'senza scadenza' : (gg<0 ? ('scaduto da '+Math.abs(gg)+' giorni') : ('restano '+gg+' giorni')))+'</span>'+
          '<button data-id="'+u.id+'" class="liv-apri" style="border:1.5px solid var(--line,#3a3a3a);background:transparent;'+
            'color:inherit;border-radius:9px;padding:5px 11px;font-family:inherit;font-weight:800;font-size:12px;cursor:pointer">Apri</button>'+
        '</div>';
      }).join('');
      c.querySelectorAll('.liv-apri').forEach(b=>b.onclick=()=>apri(b.dataset.id));
    }catch(e){ c.textContent='Non sono riuscito a leggere l elenco.'; }
  }

  async function cerca(){
    const q=(document.getElementById('livCerca').value||'').trim();
    const r=document.getElementById('livRisultati');
    if(q.length<2){ r.textContent='Scrivi almeno due lettere.'; return; }
    r.textContent='Cerco…';
    try{
      const { data } = await sb.from('profiles').select('id,username,display_name,special_tier')
        .or('username.ilike.%'+q+'%,display_name.ilike.%'+q+'%').limit(20);
      if(!data || !data.length){ r.textContent='Nessuno con questo nome.'; return; }
      r.innerHTML = data.map(u=>'<button class="liv-apri2" data-id="'+u.id+'" style="display:block;width:100%;text-align:left;'+
        'border:1.5px solid var(--line,#3a3a3a);background:transparent;color:inherit;border-radius:11px;padding:9px 12px;'+
        'margin-bottom:6px;font-family:inherit;font-weight:800;font-size:13.5px;cursor:pointer">'+
        esc(u.display_name||u.username||'—')+
        (u.special_tier?('<span style="opacity:.6;font-weight:600"> · '+u.special_tier+'</span>'):'')+'</button>').join('');
      r.querySelectorAll('.liv-apri2').forEach(b=>b.onclick=()=>apri(b.dataset.id));
    }catch(e){ r.textContent='Ricerca non riuscita.'; }
  }

  async function apri(id){
    scelto=id;
    const c=document.getElementById('livScheda');
    c.innerHTML='<div class="panel" style="opacity:.7">Carico la scheda…</div>';
    try{
      const [{ data:u }, { data:abb }, { data:ev }] = await Promise.all([
        sb.from('profiles').select('id,username,display_name,special_tier,livello_scadenza,is_admin,moderation_status').eq('id',id).maybeSingle(),
        sb.from('abbonamenti').select('id,livello,inizio,scadenza,stato,riferimento').eq('user_id',id).order('scadenza',{ascending:false}).limit(10),
        sb.from('livello_eventi').select('cosa,livello,motivo,quando').eq('user_id',id).order('quando',{ascending:false}).limit(12),
      ]);
      if(!u){ c.innerHTML='<div class="panel">Persona non trovata.</div>'; return; }
      c.innerHTML='<div class="panel">'+
        '<h3 style="margin:0 0 2px;font-size:17px">'+(esc(u.display_name||u.username||'—')+'')+'</h3>'+
        '<div style="font-size:12.5px;opacity:.6;margin-bottom:14px">'+
          'livello: <b>'+esc(u.special_tier||'nessuno')+'</b>'+
          (u.livello_scadenza?(' · rinnovo entro il '+new Date(u.livello_scadenza).toLocaleDateString('it-IT')):'')+
          (u.is_admin?' · amministratore':'')+
          (u.moderation_status && u.moderation_status!=='active'?(' · '+esc(u.moderation_status)):'')+
        '</div>'+
        '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:12px">'+
          '<select id="livSel" style="height:40px;border:1.5px solid var(--line,#3a3a3a);border-radius:11px;background:transparent;'+
            'color:inherit;font-family:inherit;font-size:13.5px;padding:0 10px">'+
            livelli.map(l=>'<option value="'+esc(l.chiave)+'"'+(u.special_tier===l.chiave?' selected':'')+'>'+esc(l.nome)+'</option>').join('')+
          '</select>'+
          '<select id="livMesi" style="height:40px;border:1.5px solid var(--line,#3a3a3a);border-radius:11px;background:transparent;'+
            'color:inherit;font-family:inherit;font-size:13.5px;padding:0 10px">'+
            [1,3,6,12,24].map(m=>'<option value="'+m+'"'+(m===12?' selected':'')+'>'+m+' mesi</option>').join('')+
          '</select>'+
          '<input id="livRif" placeholder="riferimento del pagamento" style="flex:1;min-width:200px;height:40px;'+
            'border:1.5px solid var(--line,#3a3a3a);border-radius:11px;background:transparent;color:inherit;'+
            'font-family:inherit;font-size:13.5px;padding:0 12px">'+
          '<button id="livReg" style="height:40px;padding:0 18px;border:none;border-radius:11px;background:var(--red,#D42B2B);'+
            'color:#fff;font-family:inherit;font-weight:900;font-size:13.5px;cursor:pointer">Registra abbonamento</button>'+
        '</div>'+
        '<div id="livEsito" style="font-size:13px;font-weight:700;min-height:18px;margin-bottom:12px"></div>'+
        '<h4 style="margin:14px 0 6px;font-size:14px">Abbonamenti</h4>'+
        '<div style="font-size:13px">'+((abb&&abb.length)?abb.map(a=>
          '<div style="padding:6px 0;border-bottom:1px solid var(--line,#2a2a2a);display:flex;align-items:center;gap:8px;flex-wrap:wrap">'+
          '<span style="flex:1;min-width:220px">'+esc(a.livello)+' · dal '+new Date(a.inizio).toLocaleDateString('it-IT')+' al '+new Date(a.scadenza).toLocaleDateString('it-IT')+
          ' · '+a.stato+(a.riferimento?(' · '+esc(a.riferimento)):'')+'</span>'+
          '<button class="btn sm" data-ricevuta="'+esc(a.id)+'"><i class="ph-duotone ph-receipt"></i> Carica ricevuta</button>'+
          '</div>').join(''):'<span style="opacity:.6">nessuno</span>')+'</div>'+
        '<input type="file" id="livRicFile" accept="application/pdf,image/*" hidden>'+
        '<h4 style="margin:14px 0 6px;font-size:14px">Cosa e successo</h4>'+
        '<div style="font-size:13px">'+((ev&&ev.length)?ev.map(e=>
          '<div style="padding:6px 0;border-bottom:1px solid var(--line,#2a2a2a)">'+
          new Date(e.quando).toLocaleDateString('it-IT')+' · <b>'+esc(e.cosa)+'</b>'+(e.livello?(' ('+esc(e.livello)+')'):'')+
          (e.motivo?(' · '+esc(e.motivo)):'')+'</div>').join(''):'<span style="opacity:.6">niente, per ora</span>')+'</div>'+
      '</div>';
      document.getElementById('livReg').onclick=registra;
      agganciaRicevute(id);
    }catch(e){ c.innerHTML='<div class="panel">Non sono riuscito a leggere la scheda.</div>'; }
  }

  async function registra(){
    const e=document.getElementById('livEsito');
    const b=document.getElementById('livReg');
    const livello=document.getElementById('livSel').value;
    const mesi=Number(document.getElementById('livMesi').value)||12;
    const rif=(document.getElementById('livRif').value||'').trim() || null;
    // Questa e' una registrazione di pagamento: si conferma con i numeri sotto
    // gli occhi, e il bottone si spegne, perche' due clic farebbero due
    // abbonamenti e una scadenza sbagliata.
    if(!confirm('Registro '+mesi+' mesi di '+livello+'?'+(rif?('\nRiferimento: '+rif):'\nSenza riferimento del pagamento.'))) return;
    if(b){ b.disabled=true; b.textContent='Registro…'; }
    e.textContent='Registro…'; e.style.color='inherit';
    try{
      const { data, error } = await sb.rpc('registra_abbonamento',
        { p_user: scelto, p_livello: livello, p_mesi: mesi, p_riferimento: rif });
      if(error) throw error;
      const r = Array.isArray(data) ? data[0] : data;
      e.textContent='Registrato: '+livello+' fino al '+new Date(r.r_scadenza).toLocaleDateString('it-IT');
      e.style.color='#5BBE7E';
      setTimeout(()=>{ apri(scelto); elenco(); }, 900);
    }catch(err){
      e.textContent='Non sono riuscito: '+(err.message||''); e.style.color='#E06A6A';
      if(b){ b.disabled=false; b.textContent='Registra abbonamento'; }
    }
  }

  async function load(contenitore){
    box=contenitore;
    box.innerHTML='<div class="panel" style="padding:26px;opacity:.7">Carico i livelli…</div>';
    await carica();
    disegna();
  }
  // La ricevuta: il documento va al server dei file (nome impossibile da
  // indovinare, cartella fuori dal web), la riga nel registro la scrive il
  // pannello con le sue regole. Il numero nasce progressivo per anno.
  function agganciaRicevute(userId){
    const fileIn=document.getElementById('livRicFile');
    let perAbbonamento=null;
    document.querySelectorAll('[data-ricevuta]').forEach(b=>b.onclick=()=>{
      perAbbonamento=b.dataset.ricevuta; fileIn.click();
    });
    fileIn.onchange=async()=>{
      const f=fileIn.files&&fileIn.files[0]; if(!f||!perAbbonamento) return;
      const esito=document.getElementById('livEsito');
      esito.textContent='Carico la ricevuta…'; esito.style.color='inherit';
      try{
        const importo=await chiedi('Importo in euro (vuoto per ometterlo)');
        if(importo===null){ esito.textContent=''; return; }
        const { data:{ session } } = await sb.auth.getSession();
        const fd=new FormData(); fd.append('file', f);
        const r=await fetch('https://media.poilove.com/ricevuta.php',{method:'POST',
          headers:{ Authorization:'Bearer '+(session&&session.access_token||'') }, body:fd});
        const j=await r.json();
        if(!r.ok||j.error) throw new Error(j.error||('errore '+r.status));
        // il numero: anno-progressivo, letto e incrementato qui
        const anno=new Date().getFullYear();
        const { data:ult } = await sb.from('ricevute').select('numero')
          .like('numero', anno+'-%').order('numero',{ascending:false}).limit(1);
        const prog=(ult&&ult[0])?(parseInt(ult[0].numero.split('-')[1],10)+1):1;
        const numero=anno+'-'+String(prog).padStart(4,'0');
        const { data:ins, error } = await sb.from('ricevute').insert({
          abbonamento_id: perAbbonamento, user_id: userId, numero,
          importo: importo===''?null:Number(importo),
          file_nome: j.file_nome, caricata_da: (session&&session.user&&session.user.id)||null,
        }).select('numero');
        if(error) throw error;
        if(!ins||!ins.length) throw new Error('il registro non ha accettato: serve la sessione col secondo fattore');
        esito.textContent='Ricevuta '+numero+' caricata: la persona la trova nel suo profilo.';
        esito.style.color='#5BBE7E';
      }catch(e){ esito.textContent='Non sono riuscito: '+(e.message||''); esito.style.color='#E06A6A'; }
      fileIn.value='';
    };
  }
  // una domanda con la nostra finestrella, non col prompt del browser
  function chiedi(testo){
    return new Promise(risolvi=>{
      const ov=document.createElement('div');
      ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:900;display:flex;align-items:center;justify-content:center';
      ov.innerHTML='<div class="panel" style="max-width:340px;width:92%"><div style="font-weight:800;margin-bottom:9px">'+testo+'</div>'+
        '<input id="chiediVal" type="number" step="0.01" min="0" style="width:100%;box-sizing:border-box;margin-bottom:10px">'+
        '<div class="btn-row"><button class="btn gold" id="chiediOk">Va bene</button>'+
        '<button class="btn" id="chiediNo">Annulla</button></div></div>';
      document.body.appendChild(ov);
      ov.querySelector('#chiediVal').focus();
      ov.querySelector('#chiediOk').onclick=()=>{ const v=ov.querySelector('#chiediVal').value.trim(); ov.remove(); risolvi(v); };
      ov.querySelector('#chiediNo').onclick=()=>{ ov.remove(); risolvi(null); };
    });
  }

  window.LivelliAdmin = { load };
})();
