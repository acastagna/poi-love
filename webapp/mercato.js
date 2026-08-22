/**
 * © Alessandro Castagna — 321.al / EVOLAB
 * Tutti i diritti riservati. Uso non autorizzato vietato.
 * info@321.it · https://321.al
 *
 * Il mercato delle collaborazioni (direttiva 20/08/2026).
 *
 * L'influencer apre la vetrina, scrive il listino e risponde alle proposte.
 * Il professionista e il locale guardano la vetrina coi numeri veri, aprono un
 * profilo e mandano la proposta. La trattativa vive qui dentro: messaggio,
 * accordo, consegna, pagamento. La piattaforma trattiene il 33 per cento.
 *
 * La regola di visibilita' NON sta in questo file: sta sul server (mig 160).
 * Questo file mostra soltanto quello che il server accetta di dare.
 * Modulo separato: il file unico dell'app non deve crescere ancora.
 */
(function(){
  'use strict';

  // ── Le tre lingue ─────────────────────────────────────────────────────────
  const M = {
    it: {
      titolo:'Mercato delle collaborazioni',
      card_inf:'Collaborazioni', card_inf_sub:'La tua vetrina, il listino e le proposte ricevute',
      card_pro:'Mercato influencer', card_pro_sub:'Trova chi racconta i posti, guarda i numeri veri, proponi',
      disp:'Disponibile per collaborazioni', disp_sub:'Spenta, la tua vetrina non la vede nessuno',
      zona:'Dove lavori', zona_ph:'Tirana, la costa, tutta l’Albania…',
      temi:'I tuoi temi (separati da virgola)', temi_ph:'cibo, natura, vita notturna…',
      pres:'Due righe su di te', pres_ph:'Racconto i posti veri di Tirana a chi viaggia.',
      salva:'Salva la vetrina', salvata:'Vetrina salvata',
      listino:'Il tuo listino', listino_sub:'Lo vedono solo professionisti e locali: mai un altro influencer.',
      voce_nuova:'Aggiungi una voce', voce_titolo:'Cosa offri', voce_prezzo:'Prezzo',
      unita:{contenuto:'un contenuto',storia:'una storia',video:'un video',visita:'una visita',pacchetto:'un pacchetto',mese:'al mese'},
      attiva:'attiva', spenta:'spenta', togli:'Togli',
      proposte:'Le proposte', proposte_vuote:'Nessuna proposta per ora: quando arriva, la trovi qui.',
      accetta:'Accetta', rifiuta:'Rifiuta', consegna:'Segna consegnato', paga:'Conferma il pagamento', annulla:'Annulla',
      stato:{inviata:'in attesa',accettata:'accettata',rifiutata:'rifiutata',consegnata:'consegnata',pagata:'pagata',annullata:'annullata'},
      commissione:'POI•LOVE trattiene il 33% sulla trattativa',
      vetrina_vuota:'Nessun influencer disponibile in questo momento.',
      luoghi:'luoghi', cuori:'cuori', seguaci:'seguaci', servizi:'servizi',
      proponi:'Manda una proposta', prop_titolo:'Cosa chiedi', prop_titolo_ph:'Racconta la nostra pizzeria di Blloku',
      prop_importo:'Compenso proposto (euro)', prop_msg:'Il primo messaggio', prop_msg_ph:'Ci farebbe piacere un contenuto sul forno a legna…',
      prop_manda:'Manda la proposta', prop_mandata:'Proposta mandata: la trovi qui sotto.',
      scrivi:'Scrivi…', manda:'Manda', chiudi:'Chiudi', indietro:'Indietro',
      mie_proposte:'Le tue trattative', con:'con', errore:'Non sono riuscito: ',
    },
    sq: {
      titolo:'Tregu i bashkepunimeve',
      card_inf:'Bashkepunimet', card_inf_sub:'Vitrina jote, lista e cmimeve dhe propozimet e marra',
      card_pro:'Tregu i influencerave', card_pro_sub:'Gjej kush i tregon vendet, shiko numrat e vertete, propozo',
      disp:'I disponueshem per bashkepunime', disp_sub:'E fikur, vitrinen tende nuk e sheh askush',
      zona:'Ku punon', zona_ph:'Tirana, bregdeti, gjithe Shqiperia…',
      temi:'Temat e tua (ndare me presje)', temi_ph:'ushqim, natyre, jete nate…',
      pres:'Dy rreshta per ty', pres_ph:'Tregoj vendet e verteta te Tiranes per udhetaret.',
      salva:'Ruaj vitrinen', salvata:'Vitrina u ruajt',
      listino:'Lista jote e cmimeve', listino_sub:'E shohin vetem profesionistet dhe lokalet: kurre nje influencer tjeter.',
      voce_nuova:'Shto nje ze', voce_titolo:'Cfare ofron', voce_prezzo:'Cmimi',
      unita:{contenuto:'nje permbajtje',storia:'nje histori',video:'nje video',visita:'nje vizite',pacchetto:'nje paket',mese:'ne muaj'},
      attiva:'aktive', spenta:'e fikur', togli:'Hiq',
      proposte:'Propozimet', proposte_vuote:'Asnje propozim per tani: kur vjen, e gjen ketu.',
      accetta:'Prano', rifiuta:'Refuzo', consegna:'Sheno te dorezuar', paga:'Konfirmo pagesen', annulla:'Anulo',
      stato:{inviata:'ne pritje',accettata:'pranuar',rifiutata:'refuzuar',consegnata:'dorezuar',pagata:'paguar',annullata:'anuluar'},
      commissione:'POI•LOVE mban 33% te marreveshjes',
      vetrina_vuota:'Asnje influencer i disponueshem tani.',
      luoghi:'vende', cuori:'zemra', seguaci:'ndjekes', servizi:'sherbime',
      proponi:'Dergo nje propozim', prop_titolo:'Cfare kerkon', prop_titolo_ph:'Trego picerine tone ne Bllok',
      prop_importo:'Shperblimi i propozuar (euro)', prop_msg:'Mesazhi i pare', prop_msg_ph:'Do te na pelqente nje permbajtje per furren me dru…',
      prop_manda:'Dergo propozimin', prop_mandata:'Propozimi u dergua: e gjen ketu poshte.',
      scrivi:'Shkruaj…', manda:'Dergo', chiudi:'Mbyll', indietro:'Prapa',
      mie_proposte:'Marreveshjet e tua', con:'me', errore:'Nuk arrita: ',
    },
    en: {
      titolo:'Collaboration market',
      card_inf:'Collaborations', card_inf_sub:'Your shop window, your price list and the proposals you receive',
      card_pro:'Influencer market', card_pro_sub:'Find who tells the places, see real numbers, propose',
      disp:'Available for collaborations', disp_sub:'Switched off, nobody sees your window',
      zona:'Where you work', zona_ph:'Tirana, the coast, all of Albania…',
      temi:'Your themes (comma separated)', temi_ph:'food, nature, nightlife…',
      pres:'Two lines about you', pres_ph:'I tell the real places of Tirana to travellers.',
      salva:'Save the window', salvata:'Window saved',
      listino:'Your price list', listino_sub:'Only professionals and venues see it: never another influencer.',
      voce_nuova:'Add an entry', voce_titolo:'What you offer', voce_prezzo:'Price',
      unita:{contenuto:'one piece',storia:'one story',video:'one video',visita:'one visit',pacchetto:'a package',mese:'per month'},
      attiva:'active', spenta:'off', togli:'Remove',
      proposte:'Proposals', proposte_vuote:'No proposals yet: when one arrives, it lands here.',
      accetta:'Accept', rifiuta:'Decline', consegna:'Mark delivered', paga:'Confirm payment', annulla:'Cancel',
      stato:{inviata:'waiting',accettata:'accepted',rifiutata:'declined',consegnata:'delivered',pagata:'paid',annullata:'cancelled'},
      commissione:'POI•LOVE keeps 33% of the deal',
      vetrina_vuota:'No influencer available right now.',
      luoghi:'places', cuori:'hearts', seguaci:'followers', servizi:'services',
      proponi:'Send a proposal', prop_titolo:'What you ask', prop_titolo_ph:'Tell our pizzeria in Blloku',
      prop_importo:'Proposed fee (euro)', prop_msg:'The first message', prop_msg_ph:'We would love a piece on the wood oven…',
      prop_manda:'Send the proposal', prop_mandata:'Proposal sent: you find it below.',
      scrivi:'Write…', manda:'Send', chiudi:'Close', indietro:'Back',
      mie_proposte:'Your deals', con:'with', errore:'I could not: ',
    },
  };
  function mt(chiave){
    const l = (typeof lang !== 'undefined' && M[lang]) ? lang : 'it';
    const parti = chiave.split('.');
    let v = M[l];
    for (const p of parti) v = v && v[p];
    if (v == null) { v = M.it; for (const p of parti) v = v && v[p]; }
    return v == null ? chiave : v;
  }
  function esc(s){
    return String(s == null ? '' : s).replace(/[&<>"']/g, c =>
      ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
  }
  function avviso(testo){ if (typeof showToast === 'function') showToast(testo); else alert(testo); }
  // Il pattern delle scritture, in un posto solo: PostgREST risponde bene anche
  // quando le regole per-utente scartano tutto, e zero righe = rifiuto.
  function scritto(data, error){
    if (error) throw error;
    if (!data || !data.length) throw new Error('il server non ha accettato');
    return data;
  }
  // Solo l'ultima richiesta vince: chi apre due profili di fila non deve
  // vedere la risposta lenta del primo scavalcare quella del secondo.
  let _gettone = 0;
  // I soldi come li scrive la lingua di chi guarda (formatori del blocco 51)
  function soldi(v, val){
    if (typeof fsoldi === 'function') return fsoldi(v, val);
    return Number(v).toFixed(0) + ' ' + (val === 'ALL' ? 'Lek' : '€');
  }

  // ── Stato ─────────────────────────────────────────────────────────────────
  let mioTier = null, mioId = null;
  let vetrina = null, listino = [], proposte = [], vetrine = [];
  let vista = 'casa';            // casa | influencer:<id> | trattativa:<id>
  let box = null;

  async function chiSono(){
    if (!currentUser) return null;
    mioId = currentUser.id;
    const { data } = await sb.from('profiles').select('special_tier').eq('id', mioId).maybeSingle();
    mioTier = (data && data.special_tier) || '';
    return mioTier;
  }
  const sonoInfluencer = () => mioTier === 'influencer';
  const sonoCompratore = () => mioTier === 'professionista' || mioTier === 'professionista_plus';

  // ── La carta nel profilo: compare solo a chi il mercato riguarda ──────────
  async function montaCard(){
    const posto = document.getElementById('mercatoCard');
    if (!posto) return;
    await chiSono();
    if (!sonoInfluencer() && !sonoCompratore()) { posto.style.display = 'none'; return; }
    posto.style.display = '';
    const inf = sonoInfluencer();
    posto.innerHTML =
      '<button class="mercato-card" onclick="Mercato.apri()">' +
        '<i class="ph-duotone ' + (inf ? 'ph-handshake' : 'ph-storefront') + '"></i>' +
        '<span class="mc-testi"><b>' + esc(inf ? mt('card_inf') : mt('card_pro')) + '</b>' +
        '<small>' + esc(inf ? mt('card_inf_sub') : mt('card_pro_sub')) + '</small></span>' +
        '<i class="ph-bold ph-caret-right"></i>' +
      '</button>';
  }

  // ── Dati ──────────────────────────────────────────────────────────────────
  async function carica(){
    if (sonoInfluencer()) {
      const [v, l, p] = await Promise.all([
        sb.from('mercato_vetrine').select('*').eq('user_id', mioId).maybeSingle(),
        sb.from('mercato_listino').select('*').eq('influencer', mioId).order('ordine'),
        sb.from('mercato_proposte').select('*, profiles!mercato_proposte_compratore_fkey(username,display_name,avatar_url)')
          .order('creato', { ascending: false }),
      ]);
      vetrina = v.data; listino = l.data || []; proposte = p.data || [];
    } else {
      const [ve, p] = await Promise.all([
        sb.rpc('mercato_vetrina'),
        sb.from('mercato_proposte').select('*, profiles!mercato_proposte_influencer_fkey(username,display_name,avatar_url)')
          .order('creato', { ascending: false }),
      ]);
      vetrine = ve.data || []; proposte = p.data || [];
    }
  }

  // ── Il foglio ─────────────────────────────────────────────────────────────
  async function apri(){
    await chiSono();
    if (!sonoInfluencer() && !sonoCompratore()) return;
    if (!box) {
      box = document.createElement('div');
      box.className = 'mercato-ov';
      box.addEventListener('click', e => { if (e.target === box) chiudi(); });
      document.body.appendChild(box);
    }
    box.innerHTML = '<div class="mercato-sheet"><div class="mercato-body" style="padding:40px;text-align:center;opacity:.6">…</div></div>';
    box.classList.add('on');
    document.body.style.overflow = 'hidden';
    try { await carica(); } catch (e) { avviso(mt('errore') + (e.message || '')); }
    vista = 'casa';
    disegna();
  }
  function chiudi(){
    if (box) box.classList.remove('on');
    document.body.style.overflow = '';
  }

  function testata(titolo, conIndietro){
    return '<div class="mercato-head">' +
      (conIndietro
        ? '<button class="mk-icona" onclick="Mercato.torna()"><i class="ph-bold ph-caret-left"></i></button>'
        : '<i class="ph-duotone ph-handshake" style="font-size:22px;color:var(--red)"></i>') +
      '<b>' + esc(titolo) + '</b>' +
      '<button class="mk-icona" onclick="Mercato.chiudi()" title="' + esc(mt('chiudi')) + '"><i class="ph-bold ph-x"></i></button>' +
    '</div>';
  }

  function disegna(){
    if (!box) return;
    let corpo = '';
    if (vista === 'casa') corpo = sonoInfluencer() ? vistaInfluencer() : vistaCompratore();
    else if (vista.startsWith('influencer:')) corpo = vistaProfilo(vista.slice(11));
    else if (vista.startsWith('trattativa:')) corpo = vistaTrattativa(vista.slice(11));
    box.innerHTML = '<div class="mercato-sheet">' + corpo + '</div>';
    aggancia();
  }

  // ── Vista dell'influencer: vetrina, listino, proposte ─────────────────────
  function vistaInfluencer(){
    const v = vetrina || {};
    return testata(mt('card_inf'), false) +
      '<div class="mercato-body">' +
      '<label class="mk-switch">' +
        '<input type="checkbox" id="mkDisp"' + (v.disponibile ? ' checked' : '') + '>' +
        '<span class="mk-track"></span>' +
        '<span><b>' + esc(mt('disp')) + '</b><small>' + esc(mt('disp_sub')) + '</small></span>' +
      '</label>' +
      '<div class="mk-campo"><label>' + esc(mt('zona')) + '</label>' +
        '<input id="mkZona" value="' + esc(v.zona || '') + '" placeholder="' + esc(mt('zona_ph')) + '"></div>' +
      '<div class="mk-campo"><label>' + esc(mt('temi')) + '</label>' +
        '<input id="mkTemi" value="' + esc((v.temi || []).join(', ')) + '" placeholder="' + esc(mt('temi_ph')) + '"></div>' +
      '<div class="mk-campo"><label>' + esc(mt('pres')) + '</label>' +
        '<textarea id="mkPres" rows="2" placeholder="' + esc(mt('pres_ph')) + '">' + esc(v.presentazione || '') + '</textarea></div>' +
      '<button class="mk-btn oro" id="mkSalvaVetrina">' + esc(mt('salva')) + '</button>' +

      '<div class="mk-sez">' + esc(mt('listino')) + '</div>' +
      '<div class="mk-nota">' + esc(mt('listino_sub')) + '</div>' +
      listino.map(r =>
        '<div class="mk-riga">' +
          '<span class="mk-riga-t"><b>' + esc(r.titolo) + '</b>' +
            '<small>' + soldi(r.prezzo, r.valuta) + ' · ' + esc(mt('unita.' + r.unita)) +
            ' · ' + (r.attivo ? mt('attiva') : mt('spenta')) + '</small></span>' +
          '<button class="mk-mini" data-voce-onoff="' + r.id + '">' + (r.attivo ? esc(mt('spenta')) : esc(mt('attiva'))) + '</button>' +
          '<button class="mk-mini" data-voce-via="' + r.id + '">' + esc(mt('togli')) + '</button>' +
        '</div>').join('') +
      '<div class="mk-nuova">' +
        '<input id="mkVoceTitolo" placeholder="' + esc(mt('voce_titolo')) + '" style="flex:2">' +
        '<input id="mkVocePrezzo" type="number" min="0" placeholder="€" style="flex:1;min-width:70px">' +
        '<select id="mkVoceUnita">' +
          Object.keys(mt('unita')).map(u => '<option value="' + u + '">' + esc(mt('unita.' + u)) + '</option>').join('') +
        '</select>' +
        '<button class="mk-btn" id="mkVoceAggiungi" style="flex:0 0 auto">' + esc(mt('voce_nuova')) + '</button>' +
      '</div>' +

      '<div class="mk-sez">' + esc(mt('proposte')) + '</div>' +
      (proposte.length ? proposte.map(cartaProposta).join('')
        : '<div class="mk-nota">' + esc(mt('proposte_vuote')) + '</div>') +
      '</div>';
  }

  // ── Vista del compratore: la vetrina degli influencer + le mie trattative ─
  function vistaCompratore(){
    return testata(mt('card_pro'), false) +
      '<div class="mercato-body">' +
      (vetrine.length ? vetrine.map(v =>
        '<button class="mk-vetrina" data-apri-inf="' + esc(v.user_id) + '">' +
          (v.avatar_url ? '<img src="' + esc(v.avatar_url) + '" alt="">' :
            '<span class="mk-av"><i class="ph-duotone ph-user"></i></span>') +
          '<span class="mk-vetrina-t"><b>' + esc(v.display_name || v.username || '?') + '</b>' +
            '<small>' + esc(v.zona || '') + (v.temi && v.temi.length ? ' · ' + esc(v.temi.join(', ')) : '') + '</small>' +
            '<small>' + v.luoghi + ' ' + mt('luoghi') + ' · ' + v.cuori + ' ' + mt('cuori') +
              ' · ' + v.seguaci + ' ' + mt('seguaci') + ' · ' + v.servizi + ' ' + mt('servizi') + '</small></span>' +
          '<i class="ph-bold ph-caret-right"></i>' +
        '</button>').join('')
        : '<div class="mk-nota">' + esc(mt('vetrina_vuota')) + '</div>') +
      '<div class="mk-sez">' + esc(mt('mie_proposte')) + '</div>' +
      (proposte.length ? proposte.map(cartaProposta).join('')
        : '<div class="mk-nota">' + esc(mt('proposte_vuote')) + '</div>') +
      '</div>';
  }

  // ── Il profilo di un influencer col listino e il modulo della proposta ────
  function vistaProfilo(id){
    const v = vetrine.find(x => x.user_id === id);
    if (!v) return testata(mt('card_pro'), true) + '<div class="mercato-body mk-nota">?</div>';
    const lis = (window._mkListino && window._mkListino.chi === id) ? window._mkListino.voci : null;
    return testata(v.display_name || v.username || '?', true) +
      '<div class="mercato-body">' +
      '<div class="mk-nota">' + esc(v.presentazione || '') + '</div>' +
      '<div class="mk-numeri">' +
        '<span><b>' + v.luoghi + '</b>' + mt('luoghi') + '</span>' +
        '<span><b>' + v.cuori + '</b>' + mt('cuori') + '</span>' +
        '<span><b>' + v.seguaci + '</b>' + mt('seguaci') + '</span>' +
      '</div>' +
      '<div class="mk-sez">' + esc(mt('listino')) + '</div>' +
      (lis === null ? '<div class="mk-nota">…</div>'
        : lis.length ? lis.map(r =>
            '<label class="mk-riga mk-scegli"><input type="radio" name="mkScelta" value="' + r.id + '">' +
              '<span class="mk-riga-t"><b>' + esc(r.titolo) + '</b>' +
              '<small>' + soldi(r.prezzo, r.valuta) + ' · ' + esc(mt('unita.' + r.unita)) + '</small></span></label>').join('')
          : '<div class="mk-nota">—</div>') +
      '<div class="mk-sez">' + esc(mt('proponi')) + '</div>' +
      '<div class="mk-campo"><label>' + esc(mt('prop_titolo')) + '</label>' +
        '<input id="mkPropTitolo" placeholder="' + esc(mt('prop_titolo_ph')) + '"></div>' +
      '<div class="mk-campo"><label>' + esc(mt('prop_importo')) + '</label>' +
        '<input id="mkPropImporto" type="number" min="0" placeholder="80"></div>' +
      '<div class="mk-campo"><label>' + esc(mt('prop_msg')) + '</label>' +
        '<textarea id="mkPropMsg" rows="2" placeholder="' + esc(mt('prop_msg_ph')) + '"></textarea></div>' +
      '<div class="mk-nota" style="opacity:.75"><i class="ph-duotone ph-percent"></i> ' + esc(mt('commissione')) + '</div>' +
      '<button class="mk-btn oro" id="mkPropManda" data-inf="' + esc(id) + '">' + esc(mt('prop_manda')) + '</button>' +
      '</div>';
  }

  // ── La carta di una trattativa nell'elenco ────────────────────────────────
  function cartaProposta(p){
    const altro = p.profiles || {};
    return '<button class="mk-vetrina" data-apri-tratt="' + esc(p.id) + '">' +
      (altro.avatar_url ? '<img src="' + esc(altro.avatar_url) + '" alt="">' :
        '<span class="mk-av"><i class="ph-duotone ph-user"></i></span>') +
      '<span class="mk-vetrina-t"><b>' + esc(p.titolo) + '</b>' +
        '<small>' + esc(mt('con')) + ' @' + esc(altro.username || '?') +
        (p.importo != null ? ' · ' + soldi(p.importo, p.valuta) : '') + '</small></span>' +
      '<span class="mk-stato s-' + esc(p.stato) + '">' + esc(mt('stato.' + p.stato)) + '</span>' +
    '</button>';
  }

  // ── La trattativa aperta: stato, azioni lecite, messaggi ──────────────────
  function vistaTrattativa(id){
    const p = proposte.find(x => x.id === id);
    if (!p) return testata(mt('titolo'), true) + '<div class="mercato-body mk-nota">?</div>';
    const altro = p.profiles || {};
    const msgs = (window._mkMsgs && window._mkMsgs.di === id) ? window._mkMsgs.righe : null;
    const mie = [];
    if (sonoInfluencer()) {
      if (p.stato === 'inviata') { mie.push(['accettata', mt('accetta'), 'oro'], ['rifiutata', mt('rifiuta'), '']); }
      if (p.stato === 'accettata') mie.push(['consegnata', mt('consegna'), 'oro'], ['annullata', mt('annulla'), '']);
    } else {
      if (p.stato === 'consegnata') mie.push(['pagata', mt('paga'), 'oro']);
      if (p.stato === 'inviata' || p.stato === 'accettata') mie.push(['annullata', mt('annulla'), '']);
    }
    const aperta = p.stato === 'inviata' || p.stato === 'accettata' || p.stato === 'consegnata';
    return testata(p.titolo, true) +
      '<div class="mercato-body">' +
      '<div class="mk-nota">' + esc(mt('con')) + ' @' + esc(altro.username || '?') +
        (p.importo != null ? ' · ' + soldi(p.importo, p.valuta) : '') +
        ' · <b>' + esc(mt('stato.' + p.stato)) + '</b></div>' +
      '<div class="mk-nota" style="opacity:.7"><i class="ph-duotone ph-percent"></i> ' + esc(mt('commissione')) + '</div>' +
      (mie.length ? '<div class="mk-azioni">' + mie.map(a =>
        '<button class="mk-btn ' + a[2] + '" data-stato="' + a[0] + '" data-tratt="' + esc(p.id) + '">' + esc(a[1]) + '</button>').join('') + '</div>' : '') +
      '<div class="mk-sez">' + esc(mt('scrivi')).replace('…','') + '</div>' +
      '<div class="mk-chat" id="mkChat">' +
        (msgs === null ? '<div class="mk-nota">…</div>'
          : msgs.map(m =>
              '<div class="mk-msg' + (m.da === mioId ? ' mio' : '') + '">' + esc(m.testo) + '</div>').join('')) +
      '</div>' +
      (aperta
        ? '<div class="mk-nuova"><input id="mkMsgTesto" placeholder="' + esc(mt('scrivi')) + '" style="flex:1">' +
          '<button class="mk-btn oro" id="mkMsgManda" data-tratt="' + esc(p.id) + '">' + esc(mt('manda')) + '</button></div>'
        : '') +
      '</div>';
  }

  // ── Gli agganci ───────────────────────────────────────────────────────────
  // Un solo punto d'ingresso, quattro mani: ognuna aggancia la sua sezione.
  function aggancia(){
    const q = s => box.querySelector(s);
    agganciaVetrinaMia(q);
    agganciaListinoMio(q);
    agganciaCompratore(q);
    agganciaTrattativa(q);
  }

  // La vetrina dell'influencer: la levetta, la zona, i temi, il salva.
  function agganciaVetrinaMia(q){
    const salva = q('#mkSalvaVetrina');
    if (salva) salva.onclick = async () => {
      salva.disabled = true;
      try {
        const riga = {
          user_id: mioId,
          disponibile: q('#mkDisp').checked,
          zona: q('#mkZona').value.trim() || null,
          temi: q('#mkTemi').value.split(',').map(x => x.trim().toLowerCase()).filter(Boolean),
          presentazione: q('#mkPres').value.trim() || null,
          aggiornato: new Date().toISOString(),
        };
        const { data, error } = await sb.from('mercato_vetrine')
          .upsert(riga, { onConflict: 'user_id' }).select('user_id');
        scritto(data, error);
        avviso(mt('salvata')); await carica(); disegna();
      } catch (e) { salva.disabled = false; avviso(mt('errore') + (e.message || '')); }
    };

  }

  // Il listino dell'influencer: aggiungi, accendi e spegni, togli.
  function agganciaListinoMio(q){
    const agg = q('#mkVoceAggiungi');
    if (agg) agg.onclick = async () => {
      const titolo = q('#mkVoceTitolo').value.trim();
      const prezzo = Number(q('#mkVocePrezzo').value);
      if (!titolo || !(prezzo >= 0)) { avviso(mt('voce_titolo') + ' + ' + mt('voce_prezzo')); return; }
      agg.disabled = true;
      try {
        const { data, error } = await sb.from('mercato_listino').insert({
          influencer: mioId, titolo, prezzo,
          unita: q('#mkVoceUnita').value, ordine: (listino.length + 1) * 10,
        }).select('id');
        scritto(data, error);
        await carica(); disegna();
      } catch (e) { agg.disabled = false; avviso(mt('errore') + (e.message || '')); }
    };
    box.querySelectorAll('[data-voce-onoff]').forEach(b => b.onclick = async () => {
      try {
        const r = listino.find(x => String(x.id) === b.dataset.voceOnoff);
        const { data, error } = await sb.from('mercato_listino')
          .update({ attivo: !r.attivo }).eq('id', r.id).select('id');
        scritto(data, error);
        await carica(); disegna();
      } catch (e) { avviso(mt('errore') + (e.message || '')); }
    });
    box.querySelectorAll('[data-voce-via]').forEach(b => b.onclick = async () => {
      try {
        const { data, error } = await sb.from('mercato_listino')
          .delete().eq('id', Number(b.dataset.voceVia)).select('id');
        scritto(data, error);
        await carica(); disegna();
      } catch (e) { avviso(mt('errore') + (e.message || '')); }
    });

  }

  // Il lato di chi compra: aprire un profilo e mandare la proposta.
  function agganciaCompratore(q){
    box.querySelectorAll('[data-apri-inf]').forEach(b => b.onclick = async () => {
      const id = b.dataset.apriInf;
      const mio = ++_gettone;
      vista = 'influencer:' + id;
      window._mkListino = { chi: id, voci: null };
      disegna();
      const { data } = await sb.from('mercato_listino').select('*')
        .eq('influencer', id).eq('attivo', true).order('ordine');
      if (mio !== _gettone) return;          // nel frattempo ha aperto altro
      window._mkListino = { chi: id, voci: data || [] };
      disegna();
    });

    const manda = q('#mkPropManda');
    if (manda) manda.onclick = async () => {
      const titolo = q('#mkPropTitolo').value.trim();
      if (!titolo) { avviso(mt('prop_titolo')); return; }
      manda.disabled = true;
      try {
        const scelta = box.querySelector('input[name=mkScelta]:checked');
        const importo = q('#mkPropImporto').value.trim();
        // la valuta viaggia con la voce di listino scelta: Lek resta Lek
        const voce = scelta && window._mkListino && window._mkListino.voci
          ? window._mkListino.voci.find(x => String(x.id) === scelta.value) : null;
        const { data, error } = await sb.from('mercato_proposte').insert({
          compratore: mioId, influencer: manda.dataset.inf, titolo,
          listino_id: scelta ? Number(scelta.value) : null,
          importo: importo === '' ? null : Number(importo),
          valuta: (voce && voce.valuta) || 'EUR',
        }).select('id');
        scritto(data, error);
        const msg = q('#mkPropMsg').value.trim();
        if (msg) {
          // anche il primo messaggio ha la sua guardia: perderlo in silenzio
          // e' mandare una proposta muta credendola accompagnata
          const m = await sb.from('mercato_messaggi')
            .insert({ proposta_id: data[0].id, da: mioId, testo: msg }).select('id');
          scritto(m.data, m.error);
        }
        avviso(mt('prop_mandata'));
        await carica(); vista = 'casa'; disegna();
      } catch (e) { manda.disabled = false; avviso(mt('errore') + (e.message || '')); }
    };

  }

  // La trattativa aperta: le azioni lecite e la chat.
  function agganciaTrattativa(q){
    box.querySelectorAll('[data-apri-tratt]').forEach(b => b.onclick = async () => {
      const id = b.dataset.apriTratt;
      const mio = ++_gettone;
      vista = 'trattativa:' + id;
      window._mkMsgs = { di: id, righe: null };
      disegna();
      const { data } = await sb.from('mercato_messaggi').select('*').eq('proposta_id', id).order('creato');
      if (mio !== _gettone) return;
      window._mkMsgs = { di: id, righe: data || [] };
      disegna();
      const c = box.querySelector('#mkChat'); if (c) c.scrollTop = c.scrollHeight;
    });

    box.querySelectorAll('[data-stato]').forEach(b => b.onclick = async () => {
      b.disabled = true;
      try {
        const { error } = await sb.rpc('mercato_rispondi', { p_proposta: b.dataset.tratt, p_stato: b.dataset.stato });
        if (error) throw error;
        await carica(); disegna();
      } catch (e) { b.disabled = false; avviso(mt('errore') + (e.message || '')); }
    });

    const mm = q('#mkMsgManda');
    if (mm) mm.onclick = async () => {
      const inp = q('#mkMsgTesto');
      const testo = inp.value.trim();
      if (!testo) return;
      mm.disabled = true;
      try {
        const { data, error } = await sb.from('mercato_messaggi')
          .insert({ proposta_id: mm.dataset.tratt, da: mioId, testo }).select('id');
        if (error) throw error;
        if (!data || !data.length) throw new Error('il server non ha accettato');
        inp.value = '';
        const { data: righe } = await sb.from('mercato_messaggi').select('*')
          .eq('proposta_id', mm.dataset.tratt).order('creato');
        window._mkMsgs = { di: mm.dataset.tratt, righe: righe || [] };
        disegna();
        const c = box.querySelector('#mkChat'); if (c) c.scrollTop = c.scrollHeight;
      } catch (e) { mm.disabled = false; avviso(mt('errore') + (e.message || '')); }
    };
  }

  function torna(){ vista = 'casa'; disegna(); }

  window.Mercato = { apri, chiudi, torna, montaCard };
})();
