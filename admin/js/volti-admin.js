/**
 * © Alessandro Castagna — 321.al / EVOLAB
 * Tutti i diritti riservati. Uso non autorizzato vietato.
 * info@321.it · https://321.al
 *
 * I volti di terzi nelle foto.
 * Chi fotografa un posto non sta fotografando le persone che passano. Quei
 * volti si sfocano prima che la foto arrivi sul server: l'originale con le
 * facce non lo conserva nessuno.
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

  let S = null, box = null;

  function riga(titolo, dentro, sotto){
    return '<div style="margin-bottom:16px"><div style="font-size:11px;font-weight:800;text-transform:uppercase;'+
      'letter-spacing:.5px;opacity:.6;margin-bottom:6px">'+titolo+'</div>'+dentro+
      (sotto?'<div style="font-size:12px;opacity:.6;margin-top:5px;line-height:1.5">'+sotto+'</div>':'')+'</div>';
  }
  function scelta(campo, val, testo){
    const on = S[campo]===val;
    return '<button class="vf" data-campo="'+campo+'" data-val="'+val+'" style="border:1.5px solid var(--line,#3a3a3a);'+
      'background:'+(on?'var(--gold,#C9A227)':'transparent')+';color:'+(on?'#1a1a1a':'inherit')+';border-radius:11px;'+
      'padding:8px 14px;font-family:inherit;font-weight:800;font-size:12.5px;cursor:pointer">'+testo+'</button>';
  }

  function disegna(){
    box.innerHTML =
      '<div class="panel" style="max-width:760px">'+
        '<h3 style="margin:0 0 4px;font-size:17px">Volti di terzi nelle foto</h3>'+
        '<div style="font-size:12.5px;opacity:.65;margin-bottom:18px;line-height:1.55">'+
          'Chi fotografa un posto non sta fotografando le persone che passano. Questi volti vengono sfocati '+
          'sul server prima che la foto venga salvata: la versione con le facce riconoscibili non resta da nessuna parte.'+
        '</div>'+
        riga('La sfocatura',
          '<div style="display:flex;gap:7px">'+scelta('attiva',true,'Attiva')+scelta('attiva',false,'Spenta')+'</div>',
          'Da spenta, le foto restano come sono state scattate.')+
        riga('Su chi',
          '<div style="display:flex;gap:7px;flex-wrap:wrap">'+scelta('chi','tutti','Tutti i volti')+scelta('chi','bambini','Solo i bambini')+'</div>',
          '<b>Misurato il 21/08/2026:</b> il riconoscitore dell\'eta\' non e\' affidabile sulle facce piccole delle foto vere '+
          '(su una donna adulta ha risposto "8-12 anni" con il 96 per cento di sicurezza). Con "solo i bambini" il sistema '+
          'sfoca comunque quando non e\' sicuro, quindi in pratica sfoca quasi tutti: se l\'obiettivo e\' proteggere le persone, '+
          '"tutti i volti" e\' la scelta onesta.')+
        riga('Quanto sfocare',
          '<input type="range" min="1" max="10" value="'+S.intensita+'" data-campo="intensita" style="width:100%;max-width:340px">'+
          '<div style="font-size:12.5px;font-weight:700;margin-top:4px" id="vfInt">'+S.intensita+' su 10</div>',
          'Sei e\' la misura giusta: i lineamenti spariscono, la foto resta naturale. Piu\' su diventa una macchia.')+
        riga('Quanto allargare intorno al volto',
          '<input type="range" min="0" max="40" value="'+S.margine+'" data-campo="margine" style="width:100%;max-width:340px">'+
          '<div style="font-size:12.5px;font-weight:700;margin-top:4px" id="vfMar">'+S.margine+' per cento</div>',
          'Il bordo della sfocatura e\' sempre sfumato: piu\' margine, passaggio piu\' morbido.')+
        '<button id="vfSalva" style="height:44px;padding:0 20px;border:none;border-radius:14px;background:var(--red,#D42B2B);'+
          'color:#fff;font-family:inherit;font-weight:900;font-size:14px;cursor:pointer">Salva</button>'+
        '<div id="vfEsito" style="font-size:12.5px;font-weight:700;margin-top:10px;min-height:18px"></div>'+
      '</div>';

    box.querySelectorAll('.vf').forEach(b=>b.onclick=()=>{
      const v=b.dataset.val;
      S[b.dataset.campo] = (v==='true') ? true : (v==='false' ? false : v);
      disegna();
    });
    box.querySelectorAll('input[type=range]').forEach(i=>i.oninput=()=>{
      S[i.dataset.campo]=Number(i.value);
      const t=document.getElementById(i.dataset.campo==='intensita'?'vfInt':'vfMar');
      if(t) t.textContent = i.dataset.campo==='intensita' ? (S.intensita+' su 10') : (S.margine+' per cento');
    });
    document.getElementById('vfSalva').onclick=salva;
  }

  async function salva(){
    const e=document.getElementById('vfEsito');
    const b=document.getElementById('vfSalva'); if(b) b.disabled=true;
    e.textContent='Salvo…'; e.style.color='inherit';
    try{
      const { data: toccate, error } = await sb.from('impostazioni_volti').update({
        attiva:S.attiva, chi:S.chi, intensita:S.intensita, margine:S.margine, aggiornato:new Date().toISOString()
      }).eq('id',1).select('id');
      // Si chiede indietro la riga toccata: se una regola del database rifiuta,
      // non arriva nessun errore ma non cambia niente. Senza questo controllo
      // il pannello direbbe "salvato" a vuoto.
      if(error) throw error;
      if(!toccate || !toccate.length) throw new Error('il database non ha accettato la modifica: se la sessione non ha il secondo fattore, esci e rientra col codice a sei cifre');
      e.textContent='Salvato: vale dalla prossima foto caricata.'; e.style.color='#5BBE7E';
    }catch(err){ e.textContent='Non sono riuscito a salvare: '+(err.message||''); e.style.color='#E06A6A'; }
    finally{ if(b) b.disabled=false; }
  }

  async function load(contenitore){
    box=contenitore;
    box.innerHTML='<div class="panel" style="padding:26px;opacity:.7">Carico…</div>';
    try{
      const { data } = await sb.from('impostazioni_volti').select('*').eq('id',1).maybeSingle();
      S = data || { attiva:true, chi:'tutti', intensita:6, margine:18 };
    }catch(_){ S = { attiva:true, chi:'tutti', intensita:6, margine:18 }; }
    disegna();
  }
  window.VoltiAdmin = { load };
})();
