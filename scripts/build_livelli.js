/**
 * © Alessandro Castagna — 321.al / EVOLAB
 * Tutti i diritti riservati. Uso non autorizzato vietato.
 * info@321.it · https://321.al
 *
 * Costruisce la pagina dei livelli in tre lingue, una pagina per lingua
 * (l'indirizzo cambia, il testo e' scritto dentro la pagina: e' cosi' che i
 * motori di ricerca e gli assistenti leggono davvero il contenuto).
 *
 *   node scripts/build_livelli.js
 *
 * Scrive:  web/livelli.html · web/en/livelli.html · web/sq/livelli.html
 *          sal/livelli.html · sal/en/livelli.html · sal/sq/livelli.html
 * Le copie sul SAL puntano (canonical) alla pagina di project.poilove.com.
 */
const fs = require('fs');
const path = require('path');

const RADICE = path.join(__dirname, '..');
const BASE = 'https://project.poilove.com';
const OG = l => `https://project.poilove.com/img/og-livelli-${l}.jpg`;

/* ── Livelli personali: le soglie vere stanno nel database (pannello admin,
      gamification_config.level_thresholds). Qui la fotografia di oggi, che la
      pagina aggiorna da sola all'apertura. ── */
const PERSONALI = [
  { ico:'ph-fill ph-star',                  col:'#F59E0B', min:0,     it:'Amatore',      sq:'Amator',     en:'Amateur' },
  { ico:'ph-fill ph-airplane-tilt',         col:'#059669', min:100,   it:'Viaggiatore',  sq:'Udhëtar',    en:'Traveller' },
  { ico:'ph-fill ph-globe-hemisphere-west', col:'#0891B2', min:1000,  it:'Giramondo',    sq:'Endacak',    en:'Globetrotter' },
  { ico:'ph-fill ph-fire',                  col:'#EA580C', min:5000,  it:'Instancabile', sq:'I palodhur', en:'Tireless' },
  { ico:'ph-fill ph-crown',                 col:'#7C3AED', min:25000, it:'Leggenda',     sq:'Legjendë',   en:'Legend' }
];

const SCELTI = [
  { id:'sostenitore', gruppo:'sostegno', ico:'ph-fill ph-hand-heart', prezzo:10, periodo:'MONTH',
    stile:'background:linear-gradient(135deg,#1e3a8a 0%,#0b1226 52%,#1d4ed8 100%);color:#dbeafe;border-color:rgba(147,197,253,.6)',
    it:{n:'Sostenitore', f:'Sostieni la mappa culturale libera. In cambio, vantaggi concreti: non solo un distintivo.',
        q:'Quota libera, da 10 € al mese in su', k:'Se il sostegno si ferma, i vantaggi si fermano con lui.',
        v:['ILLI•AI potenziata, 20 consigli al giorno','Spunta di verifica sul profilo','I tuoi POI in evidenza sulla mappa','Copertine e temi profilo esclusivi','Accesso anticipato alle nuove funzioni','Il tuo nome nel Muro dei Sostenitori']},
    sq:{n:'Mbështetës', f:'Mbështet hartën kulturore të lirë. Në këmbim, përfitime konkrete: jo vetëm një shenjë.',
        q:'Shumë e lirë, nga 10 € në muaj e lart', k:'Nëse mbështetja ndalon, ndalojnë edhe përfitimet.',
        v:['ILLI•AI e fuqizuar, 20 këshilla në ditë','Shenjë verifikimi në profil','POI-t e tu në pah në hartë','Kopertina dhe tema ekskluzive për profilin','Qasje e hershme te funksionet e reja','Emri yt në Murin e Mbështetësve']},
    en:{n:'Supporter', f:'Back the free cultural map. In return, real benefits: not just a badge.',
        q:'Free amount, from €10 a month up', k:'If the support stops, the benefits stop with it.',
        v:['Boosted ILLI•AI, 20 tips a day','Verification check on the profile','Your POIs highlighted on the map','Exclusive covers and profile themes','Early access to new features','Your name on the Supporters Wall']} },

  { id:'mecenate', gruppo:'sostegno', ico:'ph-fill ph-crown', prezzo:25, periodo:'MONTH',
    stile:'background:linear-gradient(135deg,#6d28d9 0%,#0f0a1e 50%,#7c3aed 100%);color:#ede9fe;border-color:rgba(196,181,253,.7)',
    it:{n:'Mecenate', f:'Il gradino più alto del sostegno: tutto di Sostenitore, più i privilegi esclusivi.',
        q:'25 € al mese', k:'Se il sostegno si ferma, i vantaggi si fermano con lui.',
        v:['Audioguide ovunque, navigando, senza scansionare il QR sul posto','Segnala e proponi nuove rotte storiche','Un tuo itinerario nella sezione In Evidenza','5 dei tuoi POI in evidenza sulla mappa','Amministratore di una compagnia in evidenza']},
    sq:{n:'Mecen', f:'Shkalla më e lartë e mbështetjes: gjithçka e Mbështetësit, plus privilegjet ekskluzive.',
        q:'25 € në muaj', k:'Nëse mbështetja ndalon, ndalojnë edhe përfitimet.',
        v:['Audioudhëzues kudo, pa skanuar QR-in në vend','Propozo rrugë të reja historike','Një itinerar i yti te seksioni Në Pah','5 POI-t e tu në pah në hartë','Administrator i një shoqërie në pah']},
    en:{n:'Patron', f:'The top step of support: everything in Supporter, plus exclusive privileges.',
        q:'€25 a month', k:'If the support stops, the benefits stop with it.',
        v:['Audio guides anywhere, while moving, without scanning the QR on site','Suggest and propose new historic routes','One of your itineraries in the Featured section','5 of your POIs highlighted on the map','Admin of a featured companion group']} },

  { id:'influencer', gruppo:'pro', ico:'ph-fill ph-megaphone', prezzo:0,
    stile:'background:linear-gradient(135deg,#be185d 0%,#2a0a1a 52%,#ec4899 100%);color:#fce7f3;border-color:rgba(249,168,212,.65)',
    it:{n:'Influencer', f:'Per chi porta la community: visibilità e punti moltiplicati.',
        q:'Gratuito', k:'Servono almeno 30 POI al mese: sotto quella soglia si perdono vantaggi e spunta.',
        v:['Punti raddoppiati su ogni azione','Spunta e profilo in evidenza','I tuoi itinerari consigliati alla community']},
    sq:{n:'Influencer', f:'Për ata që sjellin komunitetin: dukshmëri dhe pikë të shumëfishuara.',
        q:'Falas', k:'Duhen të paktën 30 POI në muaj: nën atë prag humbasin përfitimet dhe shenja.',
        v:['Pikë të dyfishuara në çdo veprim','Shenjë dhe profil në pah','Itineraret e tua të rekomanduara komunitetit']},
    en:{n:'Influencer', f:'For those who bring the community: visibility and multiplied points.',
        q:'Free', k:'At least 30 POIs a month: below that, benefits and check mark are lost.',
        v:['Double points on every action','Check mark and featured profile','Your itineraries recommended to the community']} },

  { id:'professionista', gruppo:'pro', ico:'ph-fill ph-briefcase', prezzo:100, periodo:'YEAR',
    stile:'background:linear-gradient(135deg,#334155 0%,#0b1220 52%,#475569 100%);color:#e2e8f0;border-color:rgba(148,163,184,.6)',
    it:{n:'Professionista', f:'Il profilo professionale della persona: gli strumenti al massimo.',
        q:'100 € all’anno', k:'Alla scadenza, senza rinnovo, i vantaggi si fermano.',
        v:['ILLI•AI senza limiti, ogni giorno','Profilo influencer: punti raddoppiati','Adotta una rotta culturale con la tua dedica','Un QR business incluso per la tua attività','Inviti agli eventi POI•LOVE dal vivo','La tua voce sulla roadmap del progetto']},
    sq:{n:'Profesionist', f:'Profili profesional i personit: mjetet në maksimum.',
        q:'100 € në vit', k:'Në mbarim, pa rinovim, përfitimet ndalen.',
        v:['ILLI•AI pa kufij, çdo ditë','Profil influencer: pikë të dyfishuara','Adopto një rrugë kulturore me dedikimin tënd','Një QR biznesi i përfshirë për aktivitetin tënd','Ftesa në eventet POI•LOVE','Zëri yt në planin e projektit']},
    en:{n:'Professional', f:'The professional profile of the person: tools at their fullest.',
        q:'€100 a year', k:'Once expired, without renewal, the benefits stop.',
        v:['Unlimited ILLI•AI, every day','Influencer profile: double points','Adopt a cultural route with your dedication','One business QR included for your activity','Invitations to live POI•LOVE events','Your voice on the project roadmap']} },

  { id:'plus', gruppo:'pro', ico:'ph-fill ph-storefront', lavori:true,
    stile:'background:linear-gradient(135deg,#0f766e 0%,#052e2b 52%,#14b8a6 100%);color:#ccfbf1;border-color:rgba(94,234,212,.6)',
    it:{n:'Plus · Locali e attività', f:'Per ristoranti, bar e locali: la scheda completa della tua attività.',
        q:'250 € all\'anno', k:'Alla scadenza, senza rinnovo, la scheda del locale torna normale.',
        w:'In costruzione: le funzioni del locale arrivano una alla volta',
        v:['Fino a 20 foto del locale','Listino e menu con i prezzi','Sistemi di pagamento collegati','Orari di apertura, giorno per giorno','QR del locale da stampare e mettere in vetrina','Statistiche avanzate del tuo locale']},
    sq:{n:'Plus · Lokale dhe biznese', f:'Për restorante, bare dhe lokale: skeda e plotë e biznesit tënd.',
        q:'250 € në vit', k:'Në mbarim, pa rinovim, skeda e lokalit kthehet normale.',
        w:'Në ndërtim: funksionet e lokalit vijnë një nga një',
        v:['Deri në 20 foto të lokalit','Listë çmimesh dhe menu','Sisteme pagese të lidhura','Orari i hapjes, ditë për ditë','QR i lokalit për ta vënë në vitrinë','Statistika të avancuara të lokalit']},
    en:{n:'Plus · Venues and business', f:'For restaurants, bars and venues: the full card of your business.',
        q:'€250 a year', k:'Once expired, without renewal, the venue card goes back to normal.',
        w:'Being built: the venue tools arrive one at a time',
        v:['Up to 20 photos of the venue','Price list and menu','Connected payment systems','Opening hours, day by day','Venue QR to print and put in the window','Advanced statistics of your venue']} }
];

const P = {
  it:{ lang:'it', file:'livelli.html', dir:'it',
    titolo:'Livelli POI•LOVE: personali, di sostegno, professionali',
    descr:'I livelli di POI•LOVE spiegati: i livelli personali si guadagnano con i punti, Sostenitore e Mecenate sostengono il progetto, Influencer, Professionista e Plus sono per chi lavora. Quota e condizione di ogni livello.',
    occhiello:'POI•LOVE', h1:'I livelli',
    sommario:'Tre famiglie di livelli. I <strong>livelli personali</strong> si guadagnano usando l\'app, punto dopo punto. I <strong>livelli di sostegno</strong> e quelli <strong>professionali</strong> si scelgono: hanno una quota e una condizione per tenerli.',
    h2a:'Livelli personali · si guadagnano', h2b:'Livelli di sostegno · a chi sostiene il progetto', h2c:'Professionisti',
    punti:'punti', tenuta:'Per tenerlo', apri:'Apri i livelli nell\'app',
    nota:'Non si paga dentro l\'app: si scrive a Alessandro e il livello viene assegnato a mano. I punti di ogni azione e i vantaggi di ogni livello si impostano dal pannello di amministrazione.',
    cta:'Scrivimi per un livello', ctaSub:'Rispondo io, di persona.',
    faq:[
      ['Come si sale di livello su POI•LOVE?','I livelli personali si guadagnano con i punti: ogni luogo salvato, ogni condivisione e ogni azione nella community valgono punti. Le soglie sono cinque, da Amatore a Leggenda.'],
      ['Quanto costa diventare Sostenitore?','La quota è libera, da 10 € al mese in su. Se il sostegno si ferma, i vantaggi si fermano con lui.'],
      ['Quanto costa Mecenate?','25 € al mese. Dà tutto quello di Sostenitore più i privilegi esclusivi: audioguide ovunque, rotte storiche, itinerario in evidenza.'],
      ['Il livello Influencer è gratuito?','Sì, è gratuito, ma servono almeno 30 POI al mese: sotto quella soglia si perdono i vantaggi e la spunta.'],
      ['Quanto costa il livello Professionista?','100 € all\'anno. È il profilo professionale della persona: ILLI•AI senza limiti, punti raddoppiati, QR business, adozione di una rotta culturale.'],
      ['Cosa dà il livello Plus ai ristoranti e ai locali?','Fino a 20 foto del locale, listino e menu, sistemi di pagamento, orari di apertura, QR del locale e statistiche avanzate. È in costruzione: le funzioni arrivano una alla volta.']
    ]},
  sq:{ lang:'sq', file:'livelli.html', dir:'sq',
    titolo:'Nivelet POI•LOVE: personale, mbështetjeje, profesionale',
    descr:'Nivelet e POI•LOVE të shpjeguara: nivelet personale fitohen me pikë, Mbështetës dhe Mecen mbështesin projektin, Influencer, Profesionist dhe Plus janë për ata që punojnë. Tarifa dhe kushti i secilit nivel.',
    occhiello:'POI•LOVE', h1:'Nivelet',
    sommario:'Tri familje nivelesh. <strong>Nivelet personale</strong> fitohen duke përdorur aplikacionin, pikë pas pike. <strong>Nivelet e mbështetjes</strong> dhe ato <strong>profesionale</strong> zgjidhen: kanë një tarifë dhe një kusht për t\'i mbajtur.',
    h2a:'Nivelet personale · fitohen', h2b:'Nivele mbështetjeje · për ata që mbështesin projektin', h2c:'Profesionistët',
    punti:'pikë', tenuta:'Për ta mbajtur', apri:'Hap nivelet në aplikacion',
    nota:'Nuk paguhet brenda aplikacionit: i shkruhet Alessandros dhe niveli caktohet me dorë. Pikët e çdo veprimi dhe përfitimet e çdo niveli caktohen nga paneli i administrimit.',
    cta:'Më shkruaj për një nivel', ctaSub:'Përgjigjem unë, personalisht.',
    faq:[
      ['Si ngjitet niveli në POI•LOVE?','Nivelet personale fitohen me pikë: çdo vend i ruajtur, çdo ndarje dhe çdo veprim në komunitet vlen pikë. Pragjet janë pesë, nga Amator te Legjendë.'],
      ['Sa kushton të bëhesh Mbështetës?','Tarifa është e lirë, nga 10 € në muaj e lart. Nëse mbështetja ndalon, ndalojnë edhe përfitimet.'],
      ['Sa kushton Mecen?','25 € në muaj. Jep gjithçka të Mbështetësit plus privilegjet ekskluzive: audioudhëzues kudo, rrugë historike, itinerar në pah.'],
      ['A është falas niveli Influencer?','Po, është falas, por duhen të paktën 30 POI në muaj: nën atë prag humbasin përfitimet dhe shenja.'],
      ['Sa kushton niveli Profesionist?','100 € në vit. Është profili profesional i personit: ILLI•AI pa kufij, pikë të dyfishuara, QR biznesi, adoptim i një rruge kulturore.'],
      ['Çfarë jep niveli Plus për restorantet dhe lokalet?','Deri në 20 foto të lokalit, listë çmimesh dhe menu, sisteme pagese, orar hapjeje, QR i lokalit dhe statistika të avancuara. Është në ndërtim: funksionet vijnë një nga një.']
    ]},
  en:{ lang:'en', file:'livelli.html', dir:'en',
    titolo:'POI•LOVE levels: personal, support, professional',
    descr:'The POI•LOVE levels explained: personal levels are earned with points, Supporter and Patron back the project, Influencer, Professional and Plus are for those who work with it. Fee and condition of every level.',
    occhiello:'POI•LOVE', h1:'The levels',
    sommario:'Three families of levels. <strong>Personal levels</strong> are earned by using the app, point after point. <strong>Support levels</strong> and <strong>professional levels</strong> are chosen: they have a fee and a condition to keep them.',
    h2a:'Personal levels · earned', h2b:'Support levels · for those who back the project', h2c:'Professionals',
    punti:'points', tenuta:'To keep it', apri:'Open the levels in the app',
    nota:'No payment inside the app: you write to Alessandro and the level is assigned by hand. The points of each action and the benefits of each level are set from the admin panel.',
    cta:'Write to me about a level', ctaSub:'I answer personally.',
    faq:[
      ['How do you level up on POI•LOVE?','Personal levels are earned with points: every place saved, every share and every community action is worth points. There are five thresholds, from Amateur to Legend.'],
      ['How much does Supporter cost?','The amount is free, from €10 a month up. If the support stops, the benefits stop with it.'],
      ['How much does Patron cost?','€25 a month. It gives everything in Supporter plus exclusive privileges: audio guides anywhere, historic routes, featured itinerary.'],
      ['Is the Influencer level free?','Yes, it is free, but it needs at least 30 POIs a month: below that, benefits and check mark are lost.'],
      ['How much does the Professional level cost?','€100 a year. It is the professional profile of the person: unlimited ILLI•AI, double points, business QR, adoption of a cultural route.'],
      ['What does the Plus level give to restaurants and venues?','Up to 20 photos of the venue, price list and menu, payment systems, opening hours, venue QR and advanced statistics. It is being built: the tools arrive one at a time.']
    ]}
};

const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));
const url = (l) => BASE + (P[l].dir ? '/' + P[l].dir : '') + '/livelli.html';
const fmt = (n, l) => {
  if (n >= 1000 && n % 1000 === 0) return (n / 1000) + 'k';
  const sep = l === 'en' ? ',' : '.';
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, sep);
};

function soglie(l) {
  return PERSONALI.map((p, i) => {
    const succ = PERSONALI[i + 1];
    const testo = succ ? `${fmt(p.min, l)} – ${fmt(succ.min - 1, l)}` : `${fmt(p.min, l)}+`;
    return `      <div class="liv" data-liv="${i}">
        <div class="ico" style="background:${p.col}22;color:${p.col}"><i class="${p.ico}"></i></div>
        <div><div class="nome">${esc(p[l])}</div><div class="soglia">${testo} ${esc(P[l].punti)}</div></div>
      </div>`;
  }).join('\n');
}

function scheda(s, l) {
  const d = s[l];
  return `      <article class="scheda" style="${s.stile}">
        <div class="cima">
          <div class="distintivo"><i class="${s.ico}"></i></div>
          <div><h3 class="titolo">${esc(d.n)}</h3><p class="frase">${esc(d.f)}</p></div>
        </div>
        <div class="quota"><i class="ph-fill ph-tag"></i>${esc(d.q)}</div>
        <ul class="vantaggi">${d.v.map(v => `<li><i class="ph-duotone ph-check-circle"></i>${esc(v)}</li>`).join('')}</ul>
        ${s.lavori ? `<div class="lavori"><i class="ph-duotone ph-hammer"></i>${esc(d.w)}</div>` : ''}
        <p class="tenuta"><i class="ph-duotone ph-warning-circle"></i><span><strong>${esc(P[l].tenuta)}:</strong> ${esc(d.k)}</span></p>
      </article>`;
}

function datiStrutturati(l) {
  const t = P[l];
  const offerte = SCELTI.filter(s => s.prezzo !== undefined).map(s => ({
    '@type': 'Offer', name: s[l].n, description: s[l].f,
    price: String(s.prezzo), priceCurrency: 'EUR',
    ...(s.periodo ? { priceSpecification: { '@type': 'UnitPriceSpecification', price: s.prezzo, priceCurrency: 'EUR', billingDuration: 1, billingIncrement: 1, unitCode: s.periodo === 'YEAR' ? 'ANN' : 'MON' } } : {}),
    availability: 'https://schema.org/InStock', url: url(l)
  }));
  const blocchi = [
    { '@context':'https://schema.org', '@type':'WebPage', name:t.titolo, description:t.descr, inLanguage:l, url:url(l),
      isPartOf:{ '@type':'WebSite', name:'POI•LOVE', url:'https://poilove.com/' },
      primaryImageOfPage:{ '@type':'ImageObject', url:OG(l), width:1200, height:630 } },
    { '@context':'https://schema.org', '@type':'BreadcrumbList', itemListElement:[
      { '@type':'ListItem', position:1, name:'POI•LOVE', item:'https://poilove.com/' },
      { '@type':'ListItem', position:2, name:t.h1, item:url(l) } ] },
    { '@context':'https://schema.org', '@type':'FAQPage', inLanguage:l, mainEntity:t.faq.map(([q, a]) => (
      { '@type':'Question', name:q, acceptedAnswer:{ '@type':'Answer', text:a } })) },
    { '@context':'https://schema.org', '@type':'Product', name:'POI•LOVE', description:t.descr,
      brand:{ '@type':'Brand', name:'POI•LOVE' }, image:OG(l), offers:offerte }
  ];
  return blocchi.map(b => `<script type="application/ld+json">${JSON.stringify(b)}<\/script>`).join('\n');
}

function pagina(l, canonicalAltrove) {
  const t = P[l];
  const alt = ['it','sq','en'].map(x => `<link rel="alternate" hreflang="${x}" href="${url(x)}">`).join('\n');
  return `<!DOCTYPE html>
<!--
  © Alessandro Castagna — 321.al / EVOLAB
  Tutti i diritti riservati. Uso non autorizzato vietato.
  info@321.it · https://321.al
  Pagina generata da scripts/build_livelli.js — non modificare a mano.
-->
<html lang="${l}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(t.titolo)}</title>
<meta name="description" content="${esc(t.descr)}">
<link rel="canonical" href="${canonicalAltrove || url(l)}">
${alt}
<link rel="alternate" hreflang="x-default" href="${url('en')}">
<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1">
<meta property="og:type" content="website">
<meta property="og:site_name" content="POI•LOVE">
<meta property="og:locale" content="${l === 'it' ? 'it_IT' : l === 'sq' ? 'sq_AL' : 'en_GB'}">
<meta property="og:title" content="${esc(t.titolo)}">
<meta property="og:description" content="${esc(t.descr)}">
<meta property="og:url" content="${url(l)}">
<meta property="og:image" content="${OG(l)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:type" content="image/jpeg">
<meta property="og:image:alt" content="POI•LOVE · ${esc(t.h1)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(t.titolo)}">
<meta name="twitter:description" content="${esc(t.descr)}">
<meta name="twitter:image" content="${OG(l)}">
<meta name="author" content="Alessandro Castagna">
<meta name="theme-color" content="#D42B2B">
<link rel="icon" href="https://poilove.com/img/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://unpkg.com" crossorigin>
<link rel="stylesheet" href="https://unpkg.com/@phosphor-icons/web@2.1.1/src/duotone/style.css">
<link rel="stylesheet" href="https://unpkg.com/@phosphor-icons/web@2.1.1/src/fill/style.css">
${datiStrutturati(l)}
<style>
  :root{--rosso:#D42B2B;--sfondo:#EAE4D8;--carta:#FBF8F2;--testo:#1C1C1C;--tenue:#77706A;--bordo:#DCD4C6}
  @media (prefers-color-scheme: dark){:root:not([data-tema="chiaro"]){--sfondo:#141210;--carta:#1E1B18;--testo:#F3EFE8;--tenue:#A79F95;--bordo:#332E28}}
  :root[data-tema="scuro"]{--sfondo:#141210;--carta:#1E1B18;--testo:#F3EFE8;--tenue:#A79F95;--bordo:#332E28}
  *{box-sizing:border-box}
  body{margin:0;background:var(--sfondo);color:var(--testo);line-height:1.55;-webkit-font-smoothing:antialiased;
       font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,Roboto,Helvetica,Arial,sans-serif}
  .barra{position:sticky;top:0;z-index:10;background:var(--sfondo);border-bottom:1px solid var(--bordo);
         display:flex;align-items:center;gap:10px;padding:12px 18px}
  .marchio{display:flex;align-items:center;gap:9px;font-weight:900;font-size:17px;text-decoration:none;color:inherit}
  .marchio i{color:var(--rosso);font-size:20px}
  .barra .spazio{flex:1}
  .lingue{display:flex;gap:6px}
  .lingue a,.tema{background:transparent;border:1.5px solid var(--bordo);color:var(--tenue);text-decoration:none;
        font-family:inherit;font-size:12.5px;font-weight:800;border-radius:20px;padding:7px 12px;cursor:pointer;line-height:1}
  .lingue a.on{background:var(--rosso);border-color:var(--rosso);color:#fff}
  main{max-width:960px;margin:0 auto;padding:30px 18px 56px}
  .occhiello{font-size:12.5px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;color:var(--rosso)}
  h1{font-size:38px;line-height:1.12;margin:8px 0 12px;font-weight:900;letter-spacing:-.6px}
  .sommario{font-size:17.5px;color:var(--tenue);max-width:680px;margin:0 0 8px}
  h2{font-size:14px;font-weight:900;letter-spacing:.6px;text-transform:uppercase;color:var(--tenue);
     margin:40px 0 14px;padding-bottom:8px;border-bottom:1px solid var(--bordo)}
  .personali{display:flex;flex-direction:column;gap:10px}
  .liv{display:flex;align-items:center;gap:14px;background:var(--carta);border:1px solid var(--bordo);border-radius:16px;padding:14px 16px}
  .liv .ico{width:46px;height:46px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:24px;flex-shrink:0}
  .liv .nome{font-size:19px;font-weight:800}
  .liv .soglia{font-size:13.5px;color:var(--tenue);font-weight:700;margin-top:2px}
  .griglia{display:grid;grid-template-columns:1fr;gap:14px}
  @media(min-width:780px){.griglia{grid-template-columns:1fr 1fr}}
  .scheda{border-radius:20px;padding:20px;border:1.5px solid}
  .cima{display:flex;align-items:flex-start;gap:12px;margin-bottom:12px}
  .distintivo{width:44px;height:44px;border-radius:14px;background:rgba(255,255,255,.16);display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0}
  .titolo{font-size:21px;font-weight:900;line-height:1.2;margin:0}
  .frase{font-size:13.5px;opacity:.9;margin:4px 0 0}
  .quota{display:inline-flex;align-items:center;gap:8px;font-size:15px;font-weight:900;background:rgba(255,255,255,.18);
         border:1px solid rgba(255,255,255,.3);border-radius:22px;padding:8px 14px;margin-bottom:14px}
  .vantaggi{list-style:none;margin:0 0 14px;padding:0;display:flex;flex-direction:column;gap:9px}
  .vantaggi li{display:flex;align-items:flex-start;gap:10px;font-size:14px;font-weight:600}
  .vantaggi i{font-size:19px;flex-shrink:0;opacity:.95;margin-top:1px}
  .tenuta{display:flex;align-items:flex-start;gap:9px;font-size:13px;font-weight:700;background:rgba(0,0,0,.22);
          border-radius:12px;padding:11px 13px;line-height:1.45;margin:0}
  .tenuta i{font-size:18px;flex-shrink:0}
  .lavori{display:flex;align-items:center;gap:9px;font-size:13px;font-weight:800;background:rgba(255,255,255,.16);
          border-radius:12px;padding:10px 13px;margin-bottom:12px}
  .nota{font-size:13.5px;color:var(--tenue);margin-top:20px;display:flex;align-items:flex-start;gap:9px}
  .nota i{color:var(--rosso);font-size:18px;flex-shrink:0;margin-top:1px}
  .azioni{display:flex;flex-wrap:wrap;gap:12px;align-items:center;margin-top:26px}
  .azione{display:inline-flex;align-items:center;gap:9px;background:var(--rosso);color:#fff;text-decoration:none;
          font-weight:900;font-size:16px;border-radius:26px;padding:14px 24px}
  .azione.chiara{background:transparent;color:var(--testo);border:1.5px solid var(--bordo)}
  .ctaSub{font-size:13.5px;color:var(--tenue);font-weight:700}
  .domande{margin-top:44px}
  .domanda{background:var(--carta);border:1px solid var(--bordo);border-radius:14px;padding:14px 16px;margin-bottom:10px}
  .domanda h3{margin:0 0 5px;font-size:16px;font-weight:800}
  .domanda p{margin:0;font-size:14.5px;color:var(--tenue)}
  footer{border-top:1px solid var(--bordo);margin-top:46px;padding:20px 18px 34px;text-align:center;font-size:12.5px;color:var(--tenue)}
  footer .riga{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:10px}
  footer a{color:var(--tenue)}
  footer .filo{width:1px;height:16px;background:var(--bordo);display:inline-block}
  @media print{.barra,.azioni{display:none}body{background:#fff;color:#000}.scheda,.liv,.domanda{break-inside:avoid;border-color:#999}}
</style>
</head>
<body>
<div class="barra">
  <a class="marchio" href="https://poilove.com/"><i class="ph-fill ph-heart"></i> POI•LOVE</a>
  <div class="spazio"></div>
  <nav class="lingue" aria-label="lingua">
    <a href="${url('it')}" hreflang="it"${l === 'it' ? ' class="on"' : ''}>IT</a>
    <a href="${url('sq')}" hreflang="sq"${l === 'sq' ? ' class="on"' : ''}>SQ</a>
    <a href="${url('en')}" hreflang="en"${l === 'en' ? ' class="on"' : ''}>EN</a>
  </nav>
  <button class="tema" onclick="tema()" aria-label="tema"><i class="ph-duotone ph-circle-half"></i></button>
</div>

<main>
  <p class="occhiello">${esc(t.occhiello)}</p>
  <h1>${esc(t.h1)}</h1>
  <p class="sommario">${t.sommario}</p>

  <h2>${esc(t.h2a)}</h2>
  <div class="personali" id="personali">
${soglie(l)}
  </div>

  <h2>${esc(t.h2b)}</h2>
  <div class="griglia">
${SCELTI.filter(s => s.gruppo === 'sostegno').map(s => scheda(s, l)).join('\n')}
  </div>

  <h2>${esc(t.h2c)}</h2>
  <div class="griglia">
${SCELTI.filter(s => s.gruppo === 'pro').map(s => scheda(s, l)).join('\n')}
  </div>

  <p class="nota"><i class="ph-duotone ph-info"></i>${esc(t.nota)}</p>

  <div class="azioni">
    <a class="azione" href="mailto:it@altrostile.app?subject=POI%E2%80%A2LOVE%20%C2%B7%20${encodeURIComponent(t.h1)}"><i class="ph-fill ph-hand-heart"></i>${esc(t.cta)}</a>
    <a class="azione chiara" href="https://poilove.com/?livelli=1"><i class="ph-duotone ph-medal"></i>${esc(t.apri)}</a>
    <span class="ctaSub">${esc(t.ctaSub)}</span>
  </div>

  <section class="domande">
    <h2>FAQ</h2>
${t.faq.map(([q, a]) => `    <div class="domanda"><h3>${esc(q)}</h3><p>${esc(a)}</p></div>`).join('\n')}
  </section>
</main>

<footer>
  <div class="riga">
    <i class="ph-fill ph-heart" style="color:var(--rosso);font-size:18px"></i>
    <strong>POI•LOVE</strong>
    <span>è un prodotto 321, ingegnerizzato da Alessandro Castagna.</span>
    <span>NIPT M52411017N · Tiranë</span>
    <span class="filo"></span>
    <a href="https://poilove.com/privacy">Privacy e cookie</a>
    <a href="https://poilove.com/terms">Condizioni d'uso</a>
  </div>
</footer>

<script>
function tema(){
  var ora=document.documentElement.getAttribute('data-tema');
  var nuovo = ora==='scuro' ? 'chiaro' : 'scuro';
  document.documentElement.setAttribute('data-tema', nuovo);
  try{ localStorage.setItem('pl_livelli_tema', nuovo); }catch(e){}
}
try{ var tm=localStorage.getItem('pl_livelli_tema'); if(tm) document.documentElement.setAttribute('data-tema', tm); }catch(e){}

/* Le soglie dei livelli personali si regolano dal pannello admin: la pagina le
   rilegge dal database, cosi' non racconta numeri vecchi. */
(function(){
  var CH='https://poilove.com/db/rest/v1/gamification_config?select=value&key=eq.level_thresholds';
  var K='${'{{ANON}}'}';
  fetch(CH,{headers:{apikey:K,Authorization:'Bearer '+K}})
    .then(function(r){ return r.ok?r.json():null; })
    .then(function(d){
      if(!d||!d[0]||!d[0].value) return;
      var v=d[0].value;
      var righe=Object.keys(v).map(function(k){ return {nome:k,min:parseInt(v[k],10)||0}; }).sort(function(a,b){ return a.min-b.min; });
      var box=document.querySelectorAll('#personali .liv');
      if(righe.length!==box.length) return;
      var f=function(n){ if(n>=1000 && n%1000===0) return (n/1000)+'k';
        return String(n).replace(/\\B(?=(\\d{3})+(?!\\d))/g, '${l === "en" ? "," : "."}'); };
      righe.forEach(function(r,i){
        var testo = (i<righe.length-1) ? (f(r.min)+' – '+f(righe[i+1].min-1)) : (f(r.min)+'+');
        var el=box[i].querySelector('.soglia'); if(el) el.textContent = testo+' ${esc(t.punti)}';
      });
    })
    .catch(function(){});
})();
<\/script>
</body>
</html>
`;
}

// La chiave pubblica dell'app (la stessa del sito, e' pensata per stare nel client)
const app = fs.readFileSync(path.join(RADICE, 'webapp/index.html'), 'utf8');
const chiave = (app.match(/SUPABASE_ANON\s*=\s*'([^']+)'/) || [])[1] || '';

function scrivi(dest, testo) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, testo.replace('{{ANON}}', chiave));
  console.log('  scritta', path.relative(RADICE, dest));
}

['it', 'sq', 'en'].forEach(l => {
  const sotto = P[l].dir ? P[l].dir + '/' : '';
  scrivi(path.join(RADICE, 'web', sotto, 'livelli.html'), pagina(l));
  // Sul SAL la stessa pagina, ma l'originale per i motori resta quella di project
  scrivi(path.join(RADICE, 'sal', sotto, 'livelli.html'), pagina(l, url(l)));
});

// L'indirizzo ufficiale dell'italiano e' /it/livelli.html. Sulla radice resta la stessa
// pagina, cosi' i link vecchi continuano a funzionare, ma per i motori l'originale e' /it/.
scrivi(path.join(RADICE, 'web', 'livelli.html'), pagina('it', url('it')));
scrivi(path.join(RADICE, 'sal', 'livelli.html'), pagina('it', url('it')));
console.log('Fatto: 6 pagine (3 lingue x 2 siti).');
