/**
 * © Alessandro Castagna — 321.al / EVOLAB
 * Tutti i diritti riservati. Uso non autorizzato vietato.
 * info@321.it · https://321.al
 *
 * La catena dei contenuti.
 * La macchina pesca candidati dai dati aperti e cerca una foto con licenza;
 * qui decide una persona. Approvare crea il luogo Ufficiale con la sua foto e
 * la sua licenza; scartare lo toglie di mezzo con un motivo scritto.
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

  let box=null, righe=[], viaggi=[];

  async function dati(){
    try{
      const [c, v] = await Promise.all([
        sb.from('candidati').select('*').eq('stato','proposto').order('fiducia',{ascending:false}).limit(60),
        sb.from('viaggi_piano').select('id,ordine,nome_it').order('ordine'),
      ]);
      righe = c.data || []; viaggi = v.data || [];
    }catch(_){ righe=[]; viaggi=[]; }
  }

  function card(r){
    const v = viaggi.find(x=>x.id===r.viaggio_id);
    const col = r.fiducia>=80 ? '#5BBE7E' : (r.fiducia>=60 ? '#D8A93B' : '#9A9A9A');
    return '<div class="panel" style="padding:14px;margin-bottom:10px;display:flex;gap:14px;align-items:flex-start" data-id="'+r.id+'">'+
      (r.foto_url
        ? '<img src="'+(/^https:\/\//i.test(r.foto_url||'') ? esc(r.foto_url) : '')+'" style="width:96px;height:96px;object-fit:cover;border-radius:12px;flex:0 0 96px">'
        : '<div style="width:96px;height:96px;border-radius:12px;flex:0 0 96px;border:1.5px dashed var(--line,#3a3a3a);'+
          'display:flex;align-items:center;justify-content:center;font-size:11px;opacity:.6;text-align:center;padding:6px">senza foto</div>')+
      '<div style="flex:1;min-width:0">'+
        '<div style="font-size:16px;font-weight:900">'+esc(r.nome)+'</div>'+
        '<div style="font-size:12.5px;opacity:.7;margin-top:2px">'+
          (v?('viaggio '+esc(v.ordine)+' · '+esc(v.nome_it)+' · '):'')+esc(r.categoria)+' · '+esc(r.prefettura)+'</div>'+
        '<div style="font-size:12px;opacity:.6;margin-top:4px">'+
          (r.wikidata?('Wikidata '+esc(r.wikidata)+' · '):'')+'fiducia <b style="color:'+col+'">'+Number(r.fiducia||0)+'</b>'+
          (r.foto_autore?(' · foto di '+esc(r.foto_autore)+' · '+esc(r.foto_licenza)):' · nessuna foto con licenza')+
        '</div>'+
        '<div style="font-size:11.5px;opacity:.5;margin-top:4px">'+(r.lat||0).toFixed(5)+', '+(r.lng||0).toFixed(5)+
          ' · <a href="https://www.openstreetmap.org/'+encodeURIComponent(r.fonte_id||'')+'" target="_blank" rel="noopener" style="color:inherit">dati aperti</a></div>'+
      '</div>'+
      '<div style="display:flex;flex-direction:column;gap:6px;min-width:120px">'+
        '<button data-azione="ok" style="border:none;border-radius:10px;background:#2E7D46;color:#fff;font-family:inherit;'+
          'font-weight:800;font-size:12.5px;padding:9px;cursor:pointer">Approva</button>'+
        '<button data-azione="no" style="border:1.5px solid var(--line,#3a3a3a);border-radius:10px;background:transparent;'+
          'color:inherit;font-family:inherit;font-weight:700;font-size:12px;padding:8px;cursor:pointer">Scarta</button>'+
      '</div></div>';
  }

  function disegna(){
    const conFoto = righe.filter(r=>r.foto_url).length;
    box.innerHTML =
      '<div class="panel" style="margin-bottom:16px">'+
        '<h3 style="margin:0 0 4px;font-size:17px">Candidati dai dati aperti</h3>'+
        '<div style="font-size:12.5px;opacity:.65;line-height:1.55">'+
          'La macchina propone, tu decidi. La foto viene attaccata solo se e\' l\'immagine di QUEL luogo su Wikidata: '+
          'mai per vicinanza, perche\' nelle citta\' la vicinanza sbaglia quasi sempre. '+
          'Approvare crea il luogo col bollino Ufficiale e la foto con la sua licenza.'+
        '</div>'+
        '<div style="margin-top:10px;font-size:13px;font-weight:800">'+righe.length+' da guardare · '+conFoto+' con foto</div>'+
      '</div>'+
      (righe.length ? righe.map(card).join('') : '<div class="panel">Nessun candidato in attesa.</div>');

    box.querySelectorAll('[data-id]').forEach(c=>{
      const id=c.dataset.id;
      c.querySelector('[data-azione=ok]').onclick=()=>approva(id, c);
      c.querySelector('[data-azione=no]').onclick=()=>scarta(id, c);
    });
  }

  async function approva(id, c){
    const nome = (righe.find(function(x){ return x.id===id; })||{}).nome || 'questo candidato';
    // Approvare non e' un gesto piccolo: crea un luogo pubblico col bollino
    // Ufficiale. Si chiede conferma, col nome davanti agli occhi.
    if(!confirm('Approvo "'+nome+'"?\n\nDiventa un luogo pubblico col bollino Ufficiale, con la sua foto e la sua licenza.')) return;
    const b=c.querySelector('[data-azione=ok]'); b.textContent='…'; b.disabled=true;
    try{
      const { data, error } = await sb.rpc('approva_candidato',{ p_id:id });
      if(error) throw error;
      c.style.opacity='.45';
      b.textContent='Approvato';
      c.querySelector('[data-azione=no]').remove();
    }catch(e){ b.disabled=false; b.textContent='Approva'; alert('Non sono riuscito: '+(e.message||'')); }
  }
  async function scarta(id, c){
    const motivo = prompt('Perche lo scarti? (resta scritto)') || null;
    try{
      const { error } = await sb.rpc('scarta_candidato',{ p_id:id, p_motivo:motivo });
      if(error) throw error;
      c.remove();
    }catch(e){ alert('Non sono riuscito: '+(e.message||'')); }
  }

  async function load(contenitore){
    box=contenitore;
    box.innerHTML='<div class="panel" style="padding:26px;opacity:.7">Carico i candidati…</div>';
    await dati();
    disegna();
  }
  window.CatenaAdmin = { load };
})();
