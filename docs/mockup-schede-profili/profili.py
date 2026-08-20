# -*- coding: utf-8 -*-
# Mockup di cosmesi: il PROFILO PUBBLICO dell'utente. Cinque tipologie, il locale no
# (per il locale la scheda del luogo E' il suo profilo).

CSS = """
  .cop{height:158px;background:#cfc6b8 center/cover no-repeat;position:relative}
  .cop::after{content:'';position:absolute;inset:0;background:linear-gradient(transparent 45%,rgba(0,0,0,.45))}
  .avatarone{width:108px;height:108px;border-radius:50%;border:5px solid var(--sfondo);position:absolute;
             left:50%;bottom:-54px;transform:translateX(-50%);background:#D42B2B center/cover no-repeat;z-index:4;
             box-shadow:0 10px 26px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center;
             color:#fff;font-size:34px;font-weight:900}
  .nastro{position:absolute;left:50%;top:19px;transform:translateX(-50%);padding:7px 14px;color:#fff;font-size:10.5px;max-width:252px;
          font-weight:900;letter-spacing:1.2px;text-transform:uppercase;z-index:2;display:inline-flex;align-items:center;
          gap:7px;border-radius:24px;white-space:nowrap;box-shadow:0 6px 18px rgba(0,0,0,.35)}
  .testa{text-align:center;padding-top:62px}
  .nome-p{font-size:25px;font-weight:900;line-height:1.25;display:flex;align-items:center;justify-content:center;gap:7px;flex-wrap:wrap}
  .manetta{font-size:14px;font-weight:800;color:var(--tenue);margin-top:3px}
  .mestiere{font-size:13.5px;font-weight:800;color:var(--tenue);margin-top:6px}
  .bio{font-size:15.5px;line-height:1.5;margin-top:14px}
  .posiz{display:inline-flex;align-items:center;gap:7px;background:#E9F7EE;border:1px solid #A7E0BC;color:#0B7A38;
         border-radius:20px;padding:7px 13px;font-size:12.5px;font-weight:800;margin-top:12px}
  .numeri{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin-top:14px}
  .numeri>div{background:var(--carta);border:1px solid var(--bordo);border-radius:14px;padding:10px 3px}
  .numeri b{display:block;font-size:16.5px;font-weight:900;line-height:1.1}
  .numeri span{font-size:10px;font-weight:800;color:var(--tenue);letter-spacing:.2px}
  .poi2{display:grid;grid-template-columns:1fr 1fr;gap:8px}
  .poi2>div{border-radius:14px;overflow:hidden;background:var(--carta);border:1px solid var(--bordo)}
  .poi2 .im{height:86px;background:#cfc6b8 center/cover no-repeat}
  .poi2 .tx{padding:8px 9px}
  .poi2 b{font-size:13px;font-weight:900;display:block;line-height:1.25}
  .poi2 span{font-size:11.5px;color:var(--rosso);font-weight:900;display:inline-flex;align-items:center;gap:4px;margin-top:3px}
  .mercato{display:flex;align-items:center;gap:11px;background:linear-gradient(135deg,#FFF4E5,#FFE8CC);
           border:1.5px solid #F0B36B;border-radius:16px;padding:13px}
  .mercato i{font-size:24px;color:#B45309;flex-shrink:0}
  .mercato b{font-size:14.5px;font-weight:900;color:#7C3A00;display:block}
  .mercato span{font-size:12.5px;font-weight:700;color:#8A5200;display:block;margin-top:2px;line-height:1.35}
  .mercato .dx{margin-left:auto;background:#B45309;color:#fff;border-radius:20px;padding:8px 13px;font-size:12.5px;font-weight:900;white-space:nowrap}
  .abb{display:flex;align-items:flex-start;gap:9px;background:#EEF3FF;border:1px dashed #7EA0D8;border-radius:14px;
       padding:12px 13px;font-size:12.5px;font-weight:700;color:#1E3A8A;line-height:1.4;margin-top:10px}
  .abb .dx{margin-left:auto;font-weight:900;white-space:nowrap;color:#1E3A8A}
  .cta{height:58px !important;border:2px solid transparent !important;line-height:1.15}
  .cta.vuoto{border-color:var(--bordo) !important}
  .cta small{display:block;font-size:10.5px;font-weight:800;opacity:.92;margin-top:2px;letter-spacing:.2px}
  .b-inf-m{background:linear-gradient(135deg,#0369a1,#0ea5e9);color:#fff;border-color:#7dd3fc}
  .omaggio{display:flex;align-items:center;gap:10px;background:var(--carta);border:1px solid var(--bordo);
           border-radius:14px;padding:9px 11px;margin-bottom:8px}
  .omaggio .im{width:56px;height:44px;border-radius:10px;background:#cfc6b8 center/cover no-repeat;flex-shrink:0}
  .omaggio b{font-size:13.5px;font-weight:900;display:block;line-height:1.25}
  .uff{display:inline-flex;align-items:center;gap:4px;background:#FFF7E6;border:1.5px solid #E8C169;color:#8A6100;
       border-radius:20px;padding:2px 8px;font-size:10px;font-weight:900;margin-top:4px}
  .colori{display:flex;align-items:center;gap:8px;background:var(--carta);border:1px solid var(--bordo);
          border-radius:14px;padding:10px 12px;font-size:12.5px;font-weight:700;color:var(--tenue);line-height:1.35}
  .pallino{width:19px;height:19px;border-radius:50%;flex-shrink:0;border:2px solid #fff;box-shadow:0 0 0 1px var(--bordo)}
"""

FOTO_COP={'persona':'f/1f43ef2975.jpg','sos':'f/14aa276da0.jpg','mec':'f/525029b70f.jpg',
          'infl':'f/5f6b75656d.jpg','pro':'f/25736c1fea.jpg'}

def numeri(voci):
    return '<div class="numeri">'+''.join('<div><b>%s</b><span>%s</span></div>'%(a,b) for a,b in voci)+'</div>'

def sez(icona, testo, coda=''):
    return '<div class="sez"><i class="ph-duotone ph-%s"></i>%s%s</div>'%(icona,testo,coda)

def cuori(v):
    p=int(round(v)); return ''.join('<i class="ph-fill ph-heart"></i>' if i<p else '<i class="ph-duotone ph-heart"></i>' for i in range(5))

def poi_votati(lista):
    return '<div class="poi2">'+''.join(
        '<div><div class="im" style="background-image:url(\'%s\')"></div><div class="tx"><b>%s</b>'
        '<span><i class="ph-fill ph-heart"></i>%s</span></div></div>'%(f,n,l) for f,n,l in lista)+'</div>'

def riga(ico,tit,sotto,dx=''):
    d='<span class="dx">%s</span>'%dx if dx else ''
    return ('<div class="riga"><i class="ph-duotone ph-%s"></i><div><b>%s</b><br>'
            '<span style="color:var(--tenue);font-weight:600">%s</span></div>%s</div>')%(ico,tit,sotto,d)

def scheda_rec(nome, av, ruolo, val, testo, quando):
    return ('<div class="rec"><div class="cima">'
            '<div class="av" style="width:34px;height:34px;font-size:12px;background-image:url(\'%s\')"></div>'
            '<div><b style="font-size:14px">%s</b><div style="font-size:11.5px;color:var(--tenue);font-weight:700">%s</div></div>'
            '<div class="cuori">%s</div></div>'
            '<div class="testo">%s</div><div class="quando">%s</div></div>')%(av,nome,ruolo,cuori(val),testo,quando)

def recensioni(chi, media, quante, voci):
    h=sez('chat-circle-text','Recensioni ricevute da '+chi,'<div class="frecce"><i class="ph-bold ph-caret-left"></i><i class="ph-bold ph-caret-right"></i></div>')
    h+=('<div class="media"><div class="num">%s</div><div>'
        '<div style="color:var(--rosso);font-size:16px;letter-spacing:2px">%s</div>'
        '<div style="font-size:12.5px;color:var(--tenue);font-weight:700;margin-top:3px">su %s recensioni ricevute</div>'
        '</div></div>')%(media,cuori(float(media.replace(',','.'))),quante)
    return h+'<div class="scorr">'+''.join(scheda_rec(*v) for v in voci)+'</div>'

def testata(kind, nastro='', avatar='', iniziali=''):
    sfondo=('background-image:url(\'%s\')'%avatar) if avatar else ''
    return ('<div class="cop" style="background-image:url(\'%s\')">'
            '<div class="fbtn sx"><i class="ph-duotone ph-arrow-left"></i></div>'
            '<div class="fbtn dx"><i class="ph-duotone ph-share-network"></i></div>'
            '%s<div class="avatarone" style="%s">%s</div></div>')%(FOTO_COP[kind],nastro,sfondo,iniziali)

P=[]

# ═══ 1 · PERSONA ════════════════════════════════════════════════════════════
P.append(dict(n=1, tit='Persona · livello a punti',
 spiega='La base del profilo: copertina scelta da lui, il viso al centro a meta\' della copertina, i dati, i luoghi piu\' votati, itinerari e compagnie pubbliche, la posizione solo se l\'ha resa pubblica.',
 html=testata('persona',avatar='f/260adfd45c.jpg')+'''
      <div class="corpo">
        <div class="testa">
          <div class="nome-p">Marco B. <span class="badge b-liv"><i class="ph-fill ph-airplane-tilt"></i>Viaggiatore</span></div>
          <div class="manetta">@marcob · Valona, Albania</div>
          <div class="posiz"><i class="ph-fill ph-map-pin"></i>Adesso e a Valona · posizione pubblica</div>
          '''+numeri([('128','LUOGHI'),('8.4k','LOVE'),('312','SEGUACI'),('4.512','PUNTI')])+'''
        </div>
        <div class="bio">Cerco terrazze sul mare e trattorie senza insegna. Vivo tra Valona e Vicenza, e ogni volta che scendo aggiungo tre posti nuovi.</div>
        <div class="due" style="margin-top:14px">
          <div class="cta pieno"><i class="ph-fill ph-user-plus"></i>Segui</div>
          <div class="cta vuoto"><i class="ph-duotone ph-share-network"></i>Condividi</div></div>
        '''+sez('heart','I suoi luoghi piu votati')+poi_votati([
          ('f/14aa276da0.jpg','Uji i Ftohte','2.331'),('f/1f43ef2975.jpg','Lago di Koman','1.980'),
          ('f/5f6b75656d.jpg','Dhermi Beach','1.402'),('f/525029b70f.jpg','Piazza Skanderbeg','1.107')])
      +sez('path','Itinerari pubblici')
      +riga('path','Riviera del sud in 5 giorni','12 tappe · 1.204 salvataggi')
      +riga('path','Trattorie senza insegna','8 tappe · 640 salvataggi')
      +sez('users-three','Compagnie pubbliche')
      +riga('users-three','Estate 2026 in Riviera','8 persone · aperta')
      +'''<div class="piede">Su POI-LOVE dal 12/03/2026<br>POI-LOVE · la mappa fatta dalle persone</div></div>'''))

# ═══ 2 · SOSTENITORE ════════════════════════════════════════════════════════
P.append(dict(n=2, tit='Sostenitore',
 spiega='Stesso profilo, piu\' il nastro sulla copertina, la spunta e il badge Sostenitore. Il sostegno si vede subito, senza dover leggere.',
 html=testata('sos',nastro='<div class="nastro" style="background:linear-gradient(135deg,#1e3a8a,#2b56b8)"><i class="ph-fill ph-hand-heart"></i>Sostenitore di POI-LOVE</div>',avatar='f/489a56cf0a.jpg')+'''
      <div class="corpo">
        <div class="testa">
          <div class="nome-p">Sara B. <i class="ph-fill ph-seal-check" style="color:#1e3a8a;font-size:19px"></i>
            <span class="badge b-sos"><i class="ph-fill ph-hand-heart"></i>Sostenitore</span></div>
          <div class="manetta">@sarab · Scutari, Albania</div>
          <div class="posiz" style="background:#EEF3FF;border-color:#B9CBF0;color:#1e3a8a"><i class="ph-fill ph-hand-heart"></i>Sostiene il progetto da 8 mesi</div>
          '''+numeri([('74','LUOGHI'),('5.1k','LOVE'),('208','SEGUACI'),('3.140','PUNTI')])+'''
        </div>
        <div class="bio">Il nord dell'Albania e casa mia. Traghetti, canyon e posti dove non prende il telefono: quelli mi interessano.</div>
        <div class="due" style="margin-top:14px">
          <div class="cta pieno" style="background:#1e3a8a"><i class="ph-fill ph-user-plus"></i>Segui</div>
          <div class="cta vuoto"><i class="ph-duotone ph-share-network"></i>Condividi</div></div>
        '''+sez('cards-three','Muro dei Sostenitori')+'''
        <div class="muro"><i class="ph-fill ph-hand-heart" style="font-size:20px"></i>Sara sostiene attivamente il progetto POI-LOVE assieme a 214 persone</div>

        '''+sez('gift','Luoghi in omaggio a Sara','<span class="conta">15</span>')+'''
        <div class="omaggio"><div class="im" style="background-image:url('f/25736c1fea.jpg')"></div>
          <div><b>Castello di Rozafa</b><div class="uff"><i class="ph-fill ph-seal-check"></i>Ufficiale, per Sara</div></div></div>
        <div class="omaggio"><div class="im" style="background-image:url('f/1f43ef2975.jpg')"></div>
          <div><b>Valbona, la valle</b><div class="uff"><i class="ph-fill ph-seal-check"></i>Ufficiale, per Sara</div></div></div>
        <div class="omaggio"><div class="im" style="background-image:url('f/14aa276da0.jpg')"></div>
          <div><b>Theth, il ponte vecchio</b><div class="uff"><i class="ph-fill ph-seal-check"></i>Ufficiale, per Sara</div></div></div>
        <div class="cambio"><i class="ph-duotone ph-info"></i><span>Quindici luoghi preparati dal sistema e regalati a chi sostiene: gia' suoi, gia' pubblicati, con il bollino Ufficiale.</span></div>
        '''+sez('heart','I suoi luoghi piu votati')+poi_votati([
          ('f/1f43ef2975.jpg','Lago di Koman','3.980'),('f/25736c1fea.jpg','Rozafa','1.610'),
          ('f/14aa276da0.jpg','Theth','1.204'),('f/5f6b75656d.jpg','Valbona','980')])
      +sez('path','Itinerari pubblici')
      +riga('path','Il nord che non ti aspetti','7 tappe · 860 salvataggi')
      +sez('users-three','Compagnie pubbliche')
      +riga('users-three','Traghetto di Koman, giugno','12 persone · aperta')
      +'''<div class="piede">Su POI-LOVE dal 04/12/2025 · Sostenitore da 8 mesi<br>POI-LOVE · la mappa fatta dalle persone</div></div>'''))

# ═══ 3 · MECENATE ═══════════════════════════════════════════════════════════
P.append(dict(n=3, tit='Mecenate',
 spiega='Come il Sostenitore, con il nastro oro-viola, l\'itinerario in evidenza e lo scaffale delle audioguide che ascolta ovunque.',
 html=testata('mec',nastro='<div class="nastro" style="background:linear-gradient(135deg,#6d28d9,#8b5cf6)"><i class="ph-fill ph-crown"></i>Mecenate di POI-LOVE</div>',avatar='f/29ab4e360a.jpg')+'''
      <div class="corpo">
        <div class="testa">
          <div class="nome-p">Altin L. <i class="ph-fill ph-seal-check" style="color:#7C3AED;font-size:19px"></i>
            <span class="badge b-mec"><i class="ph-fill ph-crown"></i>Mecenate</span></div>
          <div class="manetta">@altinl · Tirana, Albania</div>
          <div class="posiz" style="background:#F8F5FF;border-color:#C4B5FD;color:#6D28D9"><i class="ph-fill ph-crown"></i>Mecenate dal 2026 · 3 rotte adottate</div>
          '''+numeri([('189','LUOGHI'),('12k','LOVE'),('1.104','SEGUACI'),('9.860','PUNTI')])+'''
        </div>
        <div class="bio">Tirana la conosco strada per strada. Adotto le rotte storiche perche' qualcuno le deve tenere in piedi.</div>
        <div class="due" style="margin-top:14px">
          <div class="cta pieno" style="background:#7C3AED"><i class="ph-fill ph-user-plus"></i>Segui</div>
          <div class="cta vuoto"><i class="ph-duotone ph-share-network"></i>Condividi</div></div>
        '''+sez('push-pin','Il suo itinerario in evidenza')+'''
        <div class="rotta"><i class="ph-fill ph-push-pin"></i><div><b>Tirana in un giorno, a piedi</b><br><span>in evidenza su POI-LOVE · 11 tappe · 2.140 salvataggi</span></div></div>
        '''+sez('headphones','Le audioguide che ascolta','<img class="marchio-voice" src="logo-poivoice.svg">')
      +'<div class="riga rvoice"><i class="ph-duotone ph-headphones"></i><div><b>14 audioguide nello scaffale</b><br><span style="color:var(--tenue);font-weight:600">le sente ovunque, anche lontano dai luoghi</span></div><span class="dx">Apri</span></div>'
      +sez('scroll','Rotte adottate')
      +riga('scroll','La via Egnatia, tratto albanese','adottata nel 2026')
      +sez('heart','I suoi luoghi piu votati')+poi_votati([
          ('f/525029b70f.jpg','Piazza Skanderbeg','6.402'),('f/25736c1fea.jpg','Castello di Petrela','2.140'),
          ('f/1f43ef2975.jpg','Dajti','1.870'),('f/14aa276da0.jpg','Kepi i Rodonit','1.320')])
      +sez('users-three','Compagnie pubbliche')
      +riga('users-three','Tirana Walkers','64 persone · in evidenza')
      +'''<div class="piede">Su POI-LOVE dal 09/01/2026 · Mecenate<br>POI-LOVE · la mappa fatta dalle persone</div></div>'''))

# ═══ 4 · INFLUENCER ═════════════════════════════════════════════════════════
P.append(dict(n=4, tit='Influencer',
 spiega='Non paga, porta valore. Profilo pieno: itinerari in evidenza, recensioni ricevute, il QR, e il mercato delle collaborazioni con i professionisti. In fondo il suo rapporto notarizzato.',
 html=testata('infl',nastro='<div class="nastro" style="background:linear-gradient(135deg,#be185d,#ec4899)"><i class="ph-fill ph-megaphone"></i>Consigliata da POI-LOVE</div>',avatar='f/p5.jpg')+'''
      <div class="corpo">
        <div class="testa">
          <div class="nome-p">Elira <i class="ph-fill ph-seal-check" style="color:#ec4899;font-size:19px"></i>
            <span class="badge b-inf"><i class="ph-fill ph-megaphone"></i>Influencer</span></div>
          <div class="manetta">@elira · Riviera albanese</div>
          <div class="posiz" style="background:#fff5fa;border-color:#f9a8d4;color:#be185d"><i class="ph-fill ph-map-pin"></i>Adesso e a Dhermi · posizione pubblica</div>
          '''+numeri([('214','LUOGHI'),('46','QUESTO MESE'),('18,4k','SEGUACI'),('4,7','RECENSIONI')])+'''
        </div>
        <div class="bio">Racconto la Riviera albanese senza filtri: dove si dorme bene, dove si mangia vero e dove non andare a agosto.</div>
        <div class="due" style="margin-top:14px">
          <div class="cta pieno" style="background:#ec4899"><i class="ph-fill ph-user-plus"></i><span>Segui<small>+30 punti</small></span></div>
          <div class="cta vuoto"><i class="ph-duotone ph-share-network"></i>Condividi</div></div>
        '''+''
      +'''
        '''+sez('handshake','Collaborazioni')+'''
        <div class="mercato"><i class="ph-fill ph-handshake"></i><div><b>Disponibile per collaborazioni</b>
          <span><b>Il listino lo vedono solo i professionisti e i locali.</b> Nessun altro influencer puo vederlo. Risponde in 24 ore.</span></div>
          <span class="dx">Proponi</span></div>
        '''+sez('push-pin','I suoi itinerari in evidenza')
      +riga('path','Riviera segreta, 4 giorni','9 tappe · 1.204 salvataggi')
      +riga('path','Le spiagge senza ombrelloni','7 tappe · 856 salvataggi')
      +riga('path','Sud in moto, senza fretta','11 tappe · 640 salvataggi')
      +sez('users-three','Compagnia in evidenza')
      +riga('users-three','Riviera Crew','42 persone · aperta')
      +sez('heart','I suoi luoghi piu votati')+poi_votati([
          ('f/5f6b75656d.jpg','Dhermi Beach','8.902'),('f/14aa276da0.jpg','Gjipe','4.410'),
          ('f/1f43ef2975.jpg','Llogara','3.120'),('f/25736c1fea.jpg','Porto Palermo','2.640')])
      +recensioni('Elira','4,7','312',[
        ('Klara B.','f/p1.jpg','ha seguito i suoi consigli',5,'Ho fatto tre suoi posti in un giorno: nessuno sbagliato.','19/08/2026'),
        ('Ergi S.','f/p2.jpg','ha seguito i suoi consigli',4,'Bravissima sui posti di mare, meno sui ristoranti. Ma consiglia con onesta.','12/08/2026'),
        ('Nora T.','f/p3.jpg','ha seguito i suoi consigli',5,'Il suo itinerario e diventato la nostra vacanza.','04/08/2026')])
      +sez('qr-code','Il suo QR')
      +'<div class="qrbox"><img src="f/qr-elira.png"><b>Inquadralo o cliccalo</b><span>Porta allo stesso indirizzo: si salva nei contatti del telefono, col rimando al suo profilo POI-LOVE.</span><div class="salva"><i class="ph-fill ph-download-simple"></i>Salva il QR</div></div>'
      +'<div class="solo-tuo" style="background:#F3F0FF;border-color:#C4B5FD;color:#4C1D95"><i class="ph-duotone ph-seal-check"></i>'
      +'<span><b>Solo Elira vede:</b> scarica il <b>rapporto notarizzato</b> (PDF con impronta SHA-256 e data certa) con tutti i suoi numeri. Vale come referenza verso terzi, anche per la cessione del marchio.</span></div>'
      +'''<div class="piede">Su POI-LOVE dal 02/02/2026 · Influencer, profilo gratuito<br>POI-LOVE · la mappa fatta dalle persone</div></div>'''))

# ═══ 5 · PROFESSIONISTA ═════════════════════════════════════════════════════
P.append(dict(n=5, tit='Professionista',
 spiega='Il profilo che paga: biglietto da visita completo, audiopresentazione, recensioni, il mercato per trovare influencer. In fondo, solo per lui, abbonamento e rapporto notarizzato.',
 html=testata('pro',nastro='<div class="nastro" style="background:linear-gradient(135deg,#0b1220,#3b4a63)"><i class="ph-fill ph-seal-check"></i>Professionista verificato</div>',avatar='f/p4.jpg')+'''
      <div class="corpo">
        <div class="testa">
          <div class="nome-p">Genc Kola <i class="ph-fill ph-seal-check" style="color:#334155;font-size:19px"></i>
            <span class="badge b-pro"><i class="ph-fill ph-briefcase"></i>Professionista</span></div>
          <div class="manetta">@genckola · Kruje, Albania</div>
          <div class="mestiere">Guida culturale · dal 2019 · italiano, inglese, albanese</div>
          '''+numeri([('6','LUOGHI'),('4,9','RECENSIONI'),('1.204','VISITE'),('89','QR LETTI')])+'''
        </div>
        <div class="bio">Racconto Scanderbeg dove e' successo. Visite private al castello, al bazar e alla via vecchia, anche fuori stagione.</div>
        <div class="due" style="margin-top:14px">
          <div class="cta pieno" style="background:#334155"><i class="ph-fill ph-user-plus"></i><span>Segui<small>+50 punti</small></span></div>
          <div class="cta vuoto"><i class="ph-duotone ph-share-network"></i>Condividi</div></div>
        <div class="due" style="margin-top:9px;margin-bottom:9px">
          <div class="cta vuoto"><i class="ph-fill ph-phone"></i>Chiama</div>
          <div class="cta vuoto"><i class="ph-duotone ph-envelope-simple"></i>Scrivi</div></div>
        '''+riga('globe','genckola.al','visite guidate · italiano, inglese')
      +riga('storefront','Vieni a trovarmi: Studio Kola','Rruga Kastrioti 14 · Kruje · indirizzo confermato','Naviga')
      +'''<div class="quattro" style="margin-bottom:8px">
          <div class="social" style="background:linear-gradient(135deg,#833AB4,#E1306C)"><i class="ph-fill ph-instagram-logo"></i></div>
          <div class="social" style="background:#1877F2"><i class="ph-fill ph-facebook-logo"></i></div>
          <div class="social" style="background:#0A66C2"><i class="ph-fill ph-linkedin-logo"></i></div>
          <div class="social" style="background:#000"><i class="ph-fill ph-x-logo"></i></div></div>
        <div class="qrriga"><img src="f/qr-contatti.png"><div><b>Inquadra e salva i miei contatti</b>
          <span>Inquadralo o cliccalo, e lo stesso indirizzo: nome, telefono, email, sito e profilo POI-LOVE finiscono in rubrica.</span></div></div>
        '''+sez('headphones','La sua presentazione','<img class="marchio-voice" src="logo-poivoice.svg">')
      +'<div class="riga rvoice"><i class="ph-duotone ph-headphones"></i><div><b>Chi sono, in 52 secondi</b><br><span style="color:var(--tenue);font-weight:600">massimo un minuto per i professionisti · MP3 192</span></div><span class="dx">Ascolta</span></div>'
      +sez('handshake','Collaborazioni')
      +'<div class="mercato"><i class="ph-fill ph-storefront"></i><div><b>Cerca un influencer per il tuo lavoro</b>'
      +'<span>listini veri, numeri e recensioni · la proposta passa da POI-LOVE</span></div><span class="dx">Apri</span></div>'
      +sez('scroll','Rotta adottata')
      +'<div class="rotta"><i class="ph-fill ph-scroll"></i><div><b>La via di Scanderbeg</b><br><span>adottata da Genc Kola · "a mio nonno, che me la raccontava"</span></div></div>'
      +sez('heart','I suoi luoghi piu votati')+poi_votati([
          ('f/25736c1fea.jpg','Castello di Kruja','4.117'),('f/525029b70f.jpg','Bazar vecchio','1.980'),
          ('f/1f43ef2975.jpg','Sari Salltik','1.240'),('f/14aa276da0.jpg','Via vecchia','870')])
      +recensioni('Genc','4,9','37',[
        ('Marta D.','f/8219fe4294.jpg','ha fatto una visita con lui',5,'Il consiglio del bastione ovest prima del museo cambia la visita.','07/08/2026'),
        ('Paolo V.','f/p6.jpg','ha fatto una visita con lui',5,'Tre ore passate come venti minuti. Sa raccontare senza recitare.','29/07/2026'),
        ('Ana K.','f/489a56cf0a.jpg','ha fatto una visita con lui',4,'Molto preparato. Portate acqua, la salita e vera.','16/07/2026')])
      +'<div class="abb"><i class="ph-duotone ph-credit-card" style="font-size:19px"></i><div><b>Solo Genc vede:</b> abbonamento Professionista, 100 euro all&#39;anno, rinnovo il 21/04/2027. Fattura e ricevute nel suo pannello.</div><span class="dx">Gestisci</span></div>'
      +'<div class="solo-tuo" style="background:#F3F0FF;border-color:#C4B5FD;color:#4C1D95"><i class="ph-duotone ph-seal-check"></i>'
      +'<span><b>Solo Genc vede:</b> scarica il <b>rapporto notarizzato</b> (PDF con impronta SHA-256 e data certa): 1.204 visite, 312 navigazioni, 89 QR letti, 37 recensioni, media 4,9.</span></div>'
      +'''<div class="piede">Su POI-LOVE dal 21/04/2026 · Professionista<br>POI-LOVE · la mappa fatta dalle persone</div></div>'''))


# ═══ 6 · INFLUENCER UOMO (stesso profilo, colore di base azzurro) ═══════════
import copy
m=copy.deepcopy(P[3])
h=m['html']
for a,b in [('f/5f6b75656d.jpg','f/2bfcc9130b.jpg'),('f/p5.jpg','f/p2.jpg'),
            ('f/qr-elira.png','f/qr-ergi.png'),
            ('Elira','Ergi K.'),('@elira','@ergik'),
            ('Consigliata da POI-LOVE','Consigliato da POI-LOVE'),
            ('#ec4899','#0ea5e9'),('#be185d','#0369a1'),('#f9a8d4','#7dd3fc'),('#fff5fa','#f0f9ff'),
            ('badge b-inf','badge b-inf-m'),
            ('Adesso e a Dhermi','Adesso e a Saranda'),
            ('Bravissima','Bravissimo'),
            ('Racconto la Riviera albanese senza filtri','Racconto il sud senza filtri')]:
    h=h.replace(a,b)
m['html']=h; m['n']=6
m['tit']='Influencer uomo'
m['spiega']='Stesso profilo, colore di base azzurro invece del rosa. Il colore resta sempre suo: lo cambia quando vuole, come la copertina.'
P.append(m)

# ── impagina, riusando lo stesso foglio di stile delle schede ────────────────
base=open('base.html',encoding='utf-8').read()
base=base.replace('</style>', CSS+'</style>')
base=base.replace('<div class="titolone">La scheda del luogo · sei tipologie</div>',
                  '<div class="titolone">Il profilo pubblico dell\'utente</div>')
i=base.index('<div class="sottotitolone">'); j=base.index('</div>',i)+6
base=base[:i]+('<div class="sottotitolone">Il locale non e\' qui: per lui la scheda del luogo E\' il profilo. '
  'Per tutti gli altri: copertina scelta dall\'utente, il viso al centro a meta\' della copertina, i dati, i luoghi piu\' votati, '
  'gli itinerari e le compagnie <b style="color:#fff">pubbliche</b>, la posizione solo se l\'ha resa pubblica. '
  'Sostenitore e Mecenate aggiungono nastro e badge. Influencer e Professionista hanno recensioni ricevute, QR e il '
  '<b style="color:#fff">mercato delle collaborazioni</b>: il professionista cerca, l\'influencer si propone. L\'ultimo riquadro e\' lo stesso profilo influencer al maschile: cambia solo il colore di base, che resta comunque personalizzabile.</div>')+base[j:]
col=''.join('<div class="col"><div class="etichetta"><span class="n">%d</span> %s</div><div class="spiega">%s</div><div class="tel">%s</div></div>'%(p['n'],p['tit'],p['spiega'],p['html']) for p in P)
open('profili.html','w',encoding='utf-8').write(base.replace('<div class="fila" id="fila"></div>','<div class="fila">%s</div>'%col))
print('cinque profili scritti')
