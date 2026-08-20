# -*- coding: utf-8 -*-
# Mockup di cosmesi: la scheda pubblica del luogo, sei tipologie. Solo grafica.

G=['f/27da8daddb.jpg','f/3280b13079.jpg','f/53e83d26c4.jpg','f/2bfcc9130b.jpg','f/3ca65a977c.jpg',
   'f/vino.jpg','f/a91173340b.jpg','f/accf28c420.jpg','f/b204bbd27f.jpg']
F={'mare':'f/14aa276da0.jpg','spiaggia':'f/5f6b75656d.jpg','castello':'f/25736c1fea.jpg',
   'ristorante':'f/fe726c037c.jpg','montagna':'f/1f43ef2975.jpg','citta':'f/525029b70f.jpg'}

# ── mattoni riusabili ────────────────────────────────────────────────────────
def testata(foto, pills):
    return ('<div class="foto" style="background-image:url(\'%s\')">'
            '<div class="fbtn sx"><i class="ph-duotone ph-arrow-left"></i></div>'
            '<div class="fbtn dx"><i class="ph-duotone ph-share-network"></i></div>'
            '<div class="fcont">%s</div>'
            '<div class="puntini"><span class="on"></span><span></span><span></span></div></div>')%(foto,pills)

def galleria(quante, video=False):
    # la Copertina sta in cima e NON si ripete qui sotto.
    # Le celle sono sempre un multiplo di 3: l'ultima riga non resta mai monca.
    quante=max(3,(quante//3)*3)
    celle=[]
    for i in range(min(quante,9)):
        segno='<i class="ph-fill ph-play-circle"></i>' if (video and i==0) else ''
        cl='video' if (video and i==0) else ''
        celle.append('<div class="%s" style="background-image:url(\'%s\')">%s</div>'%(cl,G[i%len(G)],segno))
    return '<div class="galleria">'+''.join(celle)+'</div>'

def sez(icona, testo, coda=''):
    return '<div class="sez"><i class="ph-duotone ph-%s"></i>%s%s</div>'%(icona,testo,coda)

def cuori(v):
    pieni=int(round(v))
    return ''.join('<i class="ph-fill ph-heart"></i>' if i<pieni else '<i class="ph-duotone ph-heart"></i>' for i in range(5))

def voicelove(tit, sotto, bonus=False):
    eti='<span class="bonus">BONUS PLUS</span>' if bonus else ''
    return (sez('headphones','Audioguida',eti+'<img class="marchio-voice" src="logo-poivoice.svg">')+
            '<div class="riga rvoice"><i class="ph-duotone ph-headphones"></i><div><b>%s</b><br>'
            '<span style="color:var(--tenue);font-weight:600">%s</span></div>'
            '<span class="dx">Ascolta</span></div>')%(tit,sotto)


def qr_grande(img, titolo, sotto):
    return ('<div class="qrbox"><img src="%s"><b>%s</b><span>%s</span>'
            '<div class="salva"><i class="ph-fill ph-download-simple"></i>Salva il QR</div>'
            '</div>')%(img,titolo,sotto)

def qr_riga(img, titolo, sotto):
    return ('<div class="qrriga"><img src="%s"><div><b>%s</b><span>%s</span>'
            '</div></div>')%(img,titolo,sotto)

def scheda_rec(nome, av, ruolo, val, testo, quando):
    sfondo=('background-image:url(\'%s\')'%av) if av.startswith('f/') else ('background:%s'%av)
    dentro='' if av.startswith('f/') else nome[:2].upper()
    return ('<div class="rec"><div class="cima">'
            '<div class="av" style="width:34px;height:34px;font-size:12px;%s">%s</div>'
            '<div><b style="font-size:14px">%s</b><div style="font-size:11.5px;color:var(--tenue);font-weight:700">%s</div></div>'
            '<div class="cuori">%s</div></div>'
            '<div class="testo">%s</div><div class="quando">%s</div></div>')%(sfondo,dentro,nome,ruolo,cuori(val),testo,quando)

def recensioni_ricevute(chi, media, quante, voci):
    # recensioni della PERSONA (influencer, professionista): scorrono di lato
    h=sez('chat-circle-text','Recensioni ricevute da '+chi,'<div class="frecce"><i class="ph-bold ph-caret-left"></i><i class="ph-bold ph-caret-right"></i></div>')
    h+=('<div class="media"><div class="num">%s</div><div>'
        '<div style="color:var(--rosso);font-size:16px;letter-spacing:2px">%s</div>'
        '<div style="font-size:12.5px;color:var(--tenue);font-weight:700;margin-top:3px">su %s recensioni ricevute</div>'
        '</div></div>')%(media,cuori(float(media.replace(',','.'))),quante)
    h+='<div class="scorr">'+''.join(scheda_rec(*v) for v in voci)+'</div>'
    return h

def rapporto(chi, numeri):
    return ('<div class="solo-tuo" style="background:#F3F0FF;border-color:#C4B5FD;color:#4C1D95">'
            '<i class="ph-duotone ph-seal-check"></i><span><b>Solo %s vede:</b> dal suo profilo scarica il '
            '<b>rapporto notarizzato</b> (PDF con impronta SHA-256 e data certa): %s. '
            'Vale come referenza verso terzi, anche per la cessione del marchio.</span></div>')%(chi,numeri)

def coda(dist, tempo, love, piede, mappa_naviga=False, amanti=True, chiudi=True):
    h=sez('map-trifold','Dove si trova')
    h+='<div class="mappina" style="background-image:url(\'https://tile.openstreetmap.org/12/2216/1531.png\')"><i class="ph-fill ph-map-pin"></i></div>'
    h+=('<div class="riga" style="margin-top:9px"><i class="ph-duotone ph-path"></i><div><b>%s</b> da dove sei ora<br>'
        '<span style="color:var(--tenue);font-weight:600">%s</span></div><span class="dx">Vai</span></div>')%(dist,tempo)
    if mappa_naviga:
        h+='<div class="cta pieno" style="margin-top:4px"><i class="ph-fill ph-navigation-arrow"></i>Naviga</div>'
    if amanti:
        h+=sez('users-three','Chi lo ama')
        h+='<div class="amanti"><div>AC</div><div>MB</div><div>EL</div><div>GR</div><div>+%s</div></div>'%love
    if chiudi:
        h+='<div class="piede">%s<br>POI-LOVE · la mappa fatta dalle persone</div>'%piede
    return h

AZIONI3=('<div class="tre"><div><i class="ph-duotone ph-navigation-arrow"></i>Naviga</div>'
         '<div><i class="ph-duotone ph-share-network"></i>Condividi</div>'
         '<div><i class="ph-duotone ph-bookmark-simple"></i>Salva</div></div>')
AZIONI2=('<div class="tre duee"><div><i class="ph-duotone ph-share-network"></i>Condividi</div>'
         '<div><i class="ph-duotone ph-bookmark-simple"></i>Salva</div></div>')

schede=[]

# ═══ 1 · PERSONA ════════════════════════════════════════════════════════════
schede.append(dict(n=1, tit='Persona · livello a punti',
 spiega='La base. Copertina in cima, le altre foto sotto senza ripeterla. Niente conteggi, niente tempi: sono cose del pannello. <b>Nessuna recensione</b>: sulle persone non esistono.',
 html=testata(F['mare'],'<span class="pill"><i class="ph-duotone ph-navigation-arrow"></i>2,3 km da te</span>')+'''
      <div class="corpo">
        <h1>Uji i Ftohte<span class="cat"><i class="ph-fill ph-mountains"></i>panorama</span></h1>
        <div class="zona"><i class="ph-duotone ph-map-pin"></i><span>Rruga Uji i Ftohte · Valona · Qarku i Vlores · Albania</span></div>
        <div class="autore">
          <div class="av" style="background-image:url('f/260adfd45c.jpg')"></div>
          <div><div class="anome">Marco B. <span class="badge b-liv"><i class="ph-fill ph-airplane-tilt"></i>Viaggiatore</span></div>
            <div class="ameta">128 luoghi · 4.512 punti · <i class="ph-fill ph-map-pin" style="color:#16A34A"></i> posizione visibile</div></div>
          <div class="segui">Segui</div></div>
        <div class="racconto">La terrazza sul mare piu amata della Riviera. Ci si arriva a piedi dal centro, e al tramonto l'acqua diventa arancione.</div>
        <div class="love"><i class="ph-fill ph-heart"></i>Love · 2.331</div>
        '''+AZIONI3+sez('images','Le foto del posto')+galleria(3)+sez('tag','Tag')+'''
        <div class="tag"><span>tramonto</span><span>mare</span><span>terrazza</span><span>a piedi dal centro</span></div>
        '''+sez('path','Fa parte di')+'''
        <div class="riga"><i class="ph-duotone ph-path"></i><div><b>Riviera del sud in 5 giorni</b><br><span style="color:var(--tenue);font-weight:600">itinerario pubblico · 12 tappe</span></div></div>
        <div class="riga"><i class="ph-duotone ph-users-three"></i><div><b>Estate 2026 in Riviera</b><br><span style="color:var(--tenue);font-weight:600">compagnia pubblica · 8 persone</span></div></div>'''
      +coda('2,3 km','7 minuti in auto','2.3k','Creato il 12/06/2026 · aggiornato il 03/08/2026')+'</div>'))

# ═══ 2 · SOSTENITORE ════════════════════════════════════════════════════════
schede.append(dict(n=2, tit='Sostenitore',
 spiega='Come la persona: spunta di verifica, badge, e il Muro dei Sostenitori dentro la scheda. Anche qui nessuna recensione.',
 html=testata(F['montagna'],'<span class="pill" style="background:#1e3a8a"><i class="ph-fill ph-hand-heart"></i>Sostenitore</span>')+'''
      <div class="corpo">
        <h1>Lago di Koman<span class="cat"><i class="ph-fill ph-tree"></i>natura</span></h1>
        <div class="zona"><i class="ph-duotone ph-map-pin"></i><span>Koman · Fierze · Qarku i Shkodres · Albania</span></div>
        <div class="autore" style="border-color:#B9CBF0;background:#F7F9FF">
          <div class="av" style="background:linear-gradient(135deg,#1e3a8a,#1d4ed8)">SB</div>
          <div><div class="anome">Sara B. <i class="ph-fill ph-seal-check" style="color:#1e3a8a;font-size:16px"></i>
            <span class="badge b-sos"><i class="ph-fill ph-hand-heart"></i>Sostenitore</span></div>
            <div class="ameta">Sostiene POI-LOVE da 8 mesi · 74 luoghi</div></div>
          <div class="segui" style="background:#1e3a8a">Segui</div></div>
        <div class="racconto">Il traghetto parte alle 9 da Koman: due ore dentro un canyon che sembra Norvegia. Portatevi il pranzo, a bordo non c'e niente.</div>
        <div class="love"><i class="ph-fill ph-heart"></i>Love · 3.980</div>
        '''+AZIONI3+sez('images','Le foto del posto')+galleria(6)+sez('cards-three','Muro dei Sostenitori')+'''
        <div class="muro"><i class="ph-fill ph-hand-heart" style="font-size:20px"></i>Sara sostiene attivamente il progetto POI-LOVE assieme a 214 persone</div>
        '''+sez('tag','Tag')+'''
        <div class="tag"><span>traghetto</span><span>canyon</span><span>silenzio</span></div>
        '''+sez('path','Fa parte di')+'''
        <div class="riga"><i class="ph-duotone ph-path"></i><div><b>Il nord che non ti aspetti</b><br><span style="color:var(--tenue);font-weight:600">itinerario pubblico · 7 tappe</span></div></div>'''
      +coda('121 km','2 ore e 40 in auto','3.9k','Creato il 04/05/2026 · aggiornato il 21/07/2026')+'</div>'))

# ═══ 3 · MECENATE ═══════════════════════════════════════════════════════════
schede.append(dict(n=3, tit='Mecenate',
 spiega='Itinerario in evidenza subito in alto. Ascolta l\'audioguida del luogo ovunque, anche lontano dal posto: la scheda gliela offre perche\' e\' un luogo che ha visitato. Nessuna recensione.',
 html=testata(F['citta'],'<span class="pill" style="background:linear-gradient(135deg,#6d28d9,#7c3aed)"><i class="ph-fill ph-crown"></i>Mecenate</span>')+'''
      <div class="corpo">
        <h1>Piazza Skanderbeg<span class="cat"><i class="ph-fill ph-building-columns"></i>cultura</span></h1>
        <div class="zona"><i class="ph-duotone ph-map-pin"></i><span>Sheshi Skenderbej · Tirana · Qarku i Tiranes · Albania</span></div>
        <div class="autore" style="border-color:#C4B5FD;background:#F8F5FF">
          <div class="av" style="background:linear-gradient(135deg,#6d28d9,#7c3aed)">AL</div>
          <div><div class="anome">Altin L. <i class="ph-fill ph-seal-check" style="color:#7C3AED;font-size:16px"></i>
            <span class="badge b-mec"><i class="ph-fill ph-crown"></i>Mecenate</span></div>
            <div class="ameta">Mecenate dal 2026 · 189 luoghi · 3 rotte adottate</div></div>
          <div class="segui" style="background:#7C3AED">Segui</div></div>
        '''+sez('push-pin','Il suo itinerario in evidenza')+'''
        <div class="rotta"><i class="ph-fill ph-push-pin"></i><div><b>Tirana in un giorno, a piedi</b><br><span>in evidenza su POI-LOVE · 11 tappe · 2.140 salvataggi</span></div></div>
        <div class="racconto">La piazza si guarda due volte: di giorno per le facciate, alle undici di sera quando le fontane si spengono e resta solo la luce dell'Et'hem Bey.</div>
        <div class="love"><i class="ph-fill ph-heart"></i>Love · 6.402</div>
        '''+AZIONI3
      +voicelove('Ascolta la guida di Piazza Skanderbeg','6 minuti · italiano, albanese, inglese · la sente ovunque, anche lontano dal posto, perche e un luogo che ha visitato')
      +sez('images','Le foto del posto')+galleria(9)+sez('tag','Tag')+'''
        <div class="tag"><span>centro</span><span>sera</span><span>fontane</span><span>moschea</span></div>'''
      +coda('1,1 km','14 minuti a piedi','6.4k','Creato il 18/03/2026 · aggiornato ieri')+'</div>'))

# ═══ 4 · INFLUENCER ═════════════════════════════════════════════════════════
schede.append(dict(n=4, tit='Influencer',
 spiega='Fino a tre itinerari e una compagnia in evidenza. Riceve recensioni sue, che scorrono di lato. Ascolta l\'audioguida del luogo. Il riquadro privato col rapporto notarizzato sta in fondo.',
 html=testata(F['spiaggia'],'<span class="pill" style="background:linear-gradient(135deg,#be185d,#ec4899)"><i class="ph-fill ph-megaphone"></i>Consigliato</span><span class="pill"><i class="ph-fill ph-play-circle"></i>video</span>')+'''
      <div class="corpo">
        <h1>Dhermi Beach<span class="cat"><i class="ph-fill ph-umbrella"></i>spiaggia</span></h1>
        <div class="zona"><i class="ph-duotone ph-map-pin"></i><span>Dhermi · Himare · Qarku i Vlores · Albania</span></div>
        <div class="autore" style="border-color:#f9a8d4;background:#fff5fa">
          <div class="av" style="background-image:url('f/p5.jpg')"></div>
          <div><div class="anome">Elira <i class="ph-fill ph-seal-check" style="color:#ec4899;font-size:16px"></i>
            <span class="badge b-inf"><i class="ph-fill ph-megaphone"></i>Influencer</span></div>
            <div class="ameta">18.400 follower · 214 luoghi · 46 questo mese</div></div>
          <div class="segui" style="background:#ec4899">Segui<small>+30 punti</small></div></div>
        <div class="racconto">Arrivate presto: alle sette la spiaggia e ancora vuota e l'acqua e vetro. Il chiosco in fondo fa il caffe migliore.</div>
        <div class="love"><i class="ph-fill ph-heart"></i>Love · 8.902</div>
        '''+AZIONI3+sez('images','Foto e video')+galleria(6,video=True)
      +sez('push-pin','In evidenza')+'''
        <div class="riga"><i class="ph-duotone ph-path"></i><div><b>Riviera segreta, 4 giorni</b><br><span style="color:var(--tenue);font-weight:600">9 tappe · 1.204 salvataggi</span></div></div>
        <div class="riga"><i class="ph-duotone ph-path"></i><div><b>Le spiagge senza ombrelloni</b><br><span style="color:var(--tenue);font-weight:600">7 tappe · 856 salvataggi</span></div></div>
        <div class="riga"><i class="ph-duotone ph-path"></i><div><b>Sud in moto, senza fretta</b><br><span style="color:var(--tenue);font-weight:600">11 tappe · 640 salvataggi</span></div></div>
        <div class="riga"><i class="ph-duotone ph-users-three"></i><div><b>Riviera Crew</b><br><span style="color:var(--tenue);font-weight:600">compagnia in evidenza · 42 persone</span></div></div>'''
      +voicelove('Ascolta la guida di Dhermi','3 minuti · italiano e inglese')
      +recensioni_ricevute('Elira','4,7','312',[
        ('Klara B.','f/p1.jpg','ha seguito i suoi consigli',5,'Ho fatto tre suoi posti in un giorno: nessuno sbagliato. Le indicazioni sono precise.','19/08/2026'),
        ('Ergi S.','f/p2.jpg','ha seguito i suoi consigli',4,'Bravissima sui posti di mare, meno sui ristoranti. Ma consiglia sempre con onesta.','12/08/2026'),
        ('Nora T.','f/p3.jpg','ha seguito i suoi consigli',5,'Il suo itinerario della Riviera e diventato la nostra vacanza. Grazie davvero.','04/08/2026'),
      ])
      +sez('tag','Tag')+'''
        <div class="tag"><span>alba</span><span>acqua vetro</span><span>caffe</span></div>'''
      +coda('34 km','48 minuti in auto','8.9k','Creato il 02/07/2026 · aggiornato ieri', chiudi=False)
      +sez('qr-code','Il QR di Elira')
      +qr_grande('f/qr-elira.png','Inquadralo o cliccalo','Porta allo stesso indirizzo: si salva nei contatti del telefono, col rimando al suo profilo POI-LOVE.')
      +rapporto('Elira','18.400 follower, 214 luoghi, 2.060 salvataggi di itinerari, 312 recensioni ricevute, media 4,7')
      +'<div class="piede">Creato il 02/07/2026 · aggiornato ieri<br>POI-LOVE · la mappa fatta dalle persone</div></div>'))

# ═══ 5 · PROFESSIONISTA ═════════════════════════════════════════════════════
schede.append(dict(n=5, tit='Professionista',
 spiega='Il biglietto da visita completo: Chiama, Scrivi (posta protetta del sistema), Sito, Vieni a trovarmi, i social, il QR dei contatti. Naviga scende sotto e vale per chi condivide la posizione di adesso. Audioguida sua, fino a 1 minuto.',
 html=testata(F['castello'],'<span class="pill" style="background:linear-gradient(135deg,#334155,#0b1220)"><i class="ph-fill ph-seal-check"></i>Professionista</span><span class="pill"><i class="ph-fill ph-play-circle"></i>video</span>')+'''
      <div class="corpo">
        <h1>Castello di Kruja<span class="cat"><i class="ph-fill ph-castle-turret"></i>storia</span></h1>
        <div class="zona"><i class="ph-duotone ph-map-pin"></i><span>Kalaja e Krujes · Kruje · Qarku i Durresit · Albania</span></div>
        <div class="autore" style="border-color:#94a3b8;background:#f4f6f8;flex-direction:column;align-items:stretch;gap:11px">
          <div style="display:flex;align-items:center;gap:11px">
            <div class="av" style="width:52px;height:52px;background-image:url('f/p4.jpg')"></div>
            <div style="flex:1;min-width:0">
              <div class="anome">Genc Kola <i class="ph-fill ph-seal-check" style="color:#334155;font-size:15px"></i>
                <span class="badge b-pro"><i class="ph-fill ph-briefcase"></i>Professionista</span></div>
              <div class="ameta">Guida culturale · dal 2019</div></div>
            <div class="segui" style="background:#334155;align-self:center">Segui<small>+50 punti</small></div></div>
          <div class="due">
            <div class="cta pieno" style="height:44px;font-size:14px"><i class="ph-fill ph-phone"></i>Chiama</div>
            <div class="cta vuoto" style="height:44px;font-size:14px"><i class="ph-duotone ph-envelope-simple"></i>Scrivi</div></div>
          <div class="riga" style="margin:0"><i class="ph-duotone ph-globe"></i><div><b>genckola.al</b><br><span style="color:var(--tenue);font-weight:600">visite guidate · italiano, inglese</span></div></div>
          <div class="riga" style="margin:0"><i class="ph-duotone ph-storefront"></i><div><b>Vieni a trovarmi: Studio Kola</b><br><span style="color:var(--tenue);font-weight:600">Rruga Kastrioti 14 · Kruje · indirizzo confermato</span></div><span class="dx">Naviga</span></div>
          <div class="quattro">
            <div class="social" style="background:linear-gradient(135deg,#833AB4,#E1306C)"><i class="ph-fill ph-instagram-logo"></i></div>
            <div class="social" style="background:#1877F2"><i class="ph-fill ph-facebook-logo"></i></div>
            <div class="social" style="background:#0A66C2"><i class="ph-fill ph-linkedin-logo"></i></div>
            <div class="social" style="background:#000"><i class="ph-fill ph-x-logo"></i></div></div>
        '''+qr_riga('f/qr-contatti.png','Inquadra e salva i miei contatti','Inquadralo o cliccalo, e lo stesso indirizzo: nome, telefono, email, sito e profilo POI-LOVE finiscono in rubrica.')+'''
        </div>
        <div class="racconto">Il castello si legge dall'alto: salite prima al bastione ovest, poi scendete al museo. Vi racconto la storia di Scanderbeg dove e successa.</div>
        <div class="love"><i class="ph-fill ph-heart"></i>Love · 4.117</div>
        '''+AZIONI2+'''
        <div class="riga rvoice" style="margin-top:9px"><i class="ph-duotone ph-navigation-arrow"></i><div><b>Naviga verso Genc, adesso</b><br><span style="color:var(--tenue);font-weight:600">condivide la sua posizione attuale: e alla biglietteria del castello</span></div><span class="dx">Vai</span></div>
        '''+sez('images','Foto e video')+galleria(6,video=True)
      +voicelove('La presentazione di Genc, con la sua voce','52 secondi · massimo un minuto per i professionisti · diventa subito MP3 192')
      +sez('scroll','Rotta adottata')+'''
        <div class="rotta"><i class="ph-fill ph-scroll"></i><div><b>La via di Scanderbeg</b><br><span>adottata da Genc Kola · "a mio nonno, che me la raccontava"</span></div></div>'''
      +recensioni_ricevute('Genc','4,9','37',[
        ('Marta D.','f/8219fe4294.jpg','ha fatto una visita con lui',5,'Il consiglio del bastione ovest prima del museo cambia la visita. Fatelo.','07/08/2026'),
        ('Paolo V.','f/p6.jpg','ha fatto una visita con lui',5,'Tre ore passate come venti minuti. Sa raccontare senza recitare.','29/07/2026'),
        ('Ana K.','f/489a56cf0a.jpg','ha fatto una visita con lui',4,'Molto preparato. Portate acqua, la salita al bastione e vera.','16/07/2026'),
      ])
      +coda('31 km','42 minuti in auto','4.1k','', chiudi=False)
      +rapporto('Genc','1.204 visite alla scheda, 312 navigazioni avviate, 89 QR letti, 37 recensioni, media 4,9')
      +'<div class="piede">Creato il 21/04/2026 · aggiornato il 14/08/2026<br>POI-LOVE · la mappa fatta dalle persone</div></div>'))

# ═══ 6 · PLUS · LOCALE ══════════════════════════════════════════════════════
GIORNI=[('Lunedi','12:00-15:00 · 19:00-23:30',0),('Martedi','12:00-15:00 · 19:00-23:30',0),
        ('Mercoledi','12:00-15:00 · 19:00-23:30',1),('Giovedi','12:00-15:00 · 19:00-23:30',0),
        ('Venerdi','12:00-15:00 · 19:00-23:30',0),('Sabato','12:00-23:30',0),('Domenica','12:00-23:30',0)]
tendina=''.join('<div class="%s"><b>%s</b><span>%s</span></div>'%('oggi' if o else '',g,o2) for g,o2,o in GIORNI)

CHEF=[('f/pi1.jpg','Tave kosi','780 L · circa 7,80 euro'),
      ('f/pi2.jpg','Trota del Drin','1.200 L · circa 12,00 euro'),
      ('f/pi3.jpg','Petulla dolci','390 L · circa 3,90 euro')]
chef=''.join('<div><div class="im" style="background-image:url(\'%s\')"></div><div class="tx"><b>%s</b><span>%s</span></div></div>'%c for c in CHEF)

schede.append(dict(n=6, tit='Plus · Locale — 250 euro/anno',
 spiega='<b>Questa scheda E il profilo del locale.</b> Aperto/chiuso si apre a tendina con tutti i giorni. Menu con doppia valuta e piatti che si aprono, Consigli dello Chef, recensioni con media. In fondo: Naviga, il QR salvabile, poi le foto del locale.',
 html=testata(F['ristorante'],'<span class="pill" style="background:linear-gradient(135deg,#0f766e,#14b8a6)"><i class="ph-fill ph-storefront"></i>Plus</span><span class="pill" style="background:#0B7A38"><i class="ph-fill ph-clock"></i>Aperto</span>')+'''
      <div class="corpo">
        <h1>Mullixhiu<span class="cat"><i class="ph-fill ph-fork-knife"></i>ristorante</span></h1>
        <div class="zona"><i class="ph-duotone ph-map-pin"></i><span>Lek Dukagjini 1 · Tirana · Qarku i Tiranes · Albania</span></div>
        <div class="autore" style="border-color:#5eead4;background:#f0fdfa">
          <div class="av" style="background:linear-gradient(135deg,#0f766e,#14b8a6)">MU</div>
          <div><div class="anome">Mullixhiu <i class="ph-fill ph-seal-check" style="color:#0f766e;font-size:16px"></i>
            <span class="badge b-plus"><i class="ph-fill ph-storefront"></i>Locale</span></div>
            <div class="ameta">Cucina albanese · dal 2016 · <b>questa scheda e il suo profilo</b></div></div>
          <div class="segui" style="background:#0f766e">Segui<small>+100 punti</small></div></div>
        <div class="racconto">Il mulino in mezzo al parco: cucina albanese di campagna, tavoli sotto le canne. Meglio prenotare per la sera.</div>
        '''+sez('images','Le foto del locale')+galleria(6,video=True)+'''
        <div class="puntini-gal"><span class="on"></span><span></span><span></span><span></span></div>
        <div class="orario apri" style="margin-top:18px"><i class="ph-fill ph-clock"></i>Aperto ora · chiude alle 23:30<i class="ph-bold ph-caret-up" style="margin-left:auto"></i></div>
        <div class="giorni">'''+tendina+'''</div>
        <div class="due" style="margin-top:14px">
          <div class="cta pieno"><i class="ph-fill ph-calendar-check"></i>Prenota</div>
          <div class="cta vuoto"><i class="ph-fill ph-phone"></i>Chiama</div></div>
        <div class="love" style="margin-top:10px"><i class="ph-fill ph-heart"></i>Love · 1.204</div>
        '''+AZIONI2+sez('list-numbers','Il menu')+'''
        <div class="menu">
          <div class="voce"><i class="ph-duotone ph-bowl-food" style="color:var(--rosso)"></i>Jani me fasule<div class="prezzi"><b>450 L</b><span>circa 4,50 euro</span></div></div>
          <div class="voce"><i class="ph-duotone ph-fish" style="color:var(--rosso)"></i>Trota del Drin<div class="prezzi"><b>1.200 L</b><span>circa 12,00 euro</span></div></div>
          <div class="voce"><i class="ph-duotone ph-wine" style="color:var(--rosso)"></i>Kallmet, calice<div class="prezzi"><b>350 L</b><span>circa 3,50 euro</span></div></div>
        </div>
        <div class="cambio"><i class="ph-duotone ph-arrows-left-right"></i><span>Cambio Banca d'Albania del 20/08/2026 · 1 euro = 100,2 L. Si aggiorna una volta al giorno; se la banca non risponde resta l'ultimo cambio, con la sua data.</span></div>
        <div class="piatto">
          <div class="fotopiatto" style="background-image:url('f/f3e6d188a8.jpg')"></div>
          <div style="display:flex;align-items:center;gap:8px"><b style="font-size:15px">Trota del Drin</b>
            <div class="prezzi" style="margin-left:auto;text-align:right"><b style="font-weight:900">1.200 L</b><br><span style="font-size:11.5px;color:var(--tenue);font-weight:700">circa 12,00 euro</span></div></div>
          <div style="font-size:13.5px;color:var(--tenue);margin-top:5px;line-height:1.4">Alla griglia, con limone e erbe del parco. Cosi si apre il piatto quando ci clicchi sopra: foto e spiegazione, caricate dal locale o scattate sul momento.</div>
        </div>
        '''+sez('chef-hat','Consigli dello Chef')+'<div class="chef">'+chef+'''</div>
        <div class="chef-nota"><b>Raccontato dal proprietario:</b> "Il tave kosi lo fa mia madre da quarant'anni, la trota arriva dal Drin il mattino stesso e le petulla si mangiano solo di domenica."</div>
        '''+voicelove('Il mulino raccontato dal proprietario','2 minuti e 40 · massimo tre minuti per i locali · diventa subito MP3 192', bonus=True)
      +sez('chat-circle-text','Recensioni','<span class="conta">solo amici · una a testa</span>')+'''
        <div class="media"><div class="num">4,6</div><div><div style="color:var(--rosso);font-size:16px;letter-spacing:2px">'''+cuori(4.6)+'''</div><div style="font-size:12.5px;color:var(--tenue);font-weight:700;margin-top:3px">su 38 recensioni di amici del locale</div></div></div>
        <div class="scorr">'''+scheda_rec('Anna R.','f/a0190d3b85.jpg','amica del locale',5,'Il jani me fasule e quello di mia nonna. Tavolo fuori, sotto le canne, e il conto onesto.','14/08/2026 · <b style="color:var(--rosso)">+200 punti</b>')+scheda_rec('Dritan K.','f/29ab4e360a.jpg','amico del locale',4,'Cucina seria. Di sabato sera senza prenotazione non si entra, avvisati.','02/08/2026')+scheda_rec('Ledia H.','f/p1.jpg','amica del locale',5,'Il posto piu bello di Tirana per una cena lunga. Chiedete il tavolo in fondo.','27/07/2026')+'''</div>
        <div class="cambio"><i class="ph-duotone ph-info"></i><span>Se togli l'amicizia al locale, la tua recensione sparisce. Il locale puo bandirti, ma quello che hai scritto resta.</span></div>
        '''+sez('credit-card','Pagamenti accettati')+'''
        <div class="paga"><span><i class="ph-fill ph-credit-card"></i>Carte</span><span><i class="ph-fill ph-device-mobile"></i>Apple Pay</span><span><i class="ph-fill ph-money"></i>Contanti</span></div>
        '''+coda('1,1 km','14 minuti a piedi','1.2k','', mappa_naviga=True, amanti=False, chiudi=False)+'''
        '''+qr_grande('f/qr-locale.png','Il QR del locale','Inquadralo o cliccalo, e lo stesso indirizzo: porta a questa scheda e salva il locale nei contatti. Si stampa per la vetrina.')+'''
        </div>
        '''+sez('users-three','Chi lo ama')+'''
        <div class="amanti"><div>AC</div><div>MB</div><div>EL</div><div>GR</div><div>+1.2k</div></div>
        <div class="solo-tuo"><i class="ph-duotone ph-chart-line-up"></i><span>Solo il proprietario vede: 2.140 visite · 312 navigazioni · 89 QR letti · 38 recensioni · media 4,6</span></div>
        <div class="piede">Scheda verificata il 09/08/2026 · aggiornata oggi · Plus 250 euro/anno<br>POI-LOVE · la mappa fatta dalle persone</div>'''+'</div>'))

base=open('base.html',encoding='utf-8').read()
col=''.join('<div class="col"><div class="etichetta"><span class="n">%d</span> %s</div><div class="spiega">%s</div><div class="tel">%s</div></div>'%(s['n'],s['tit'],s['spiega'],s['html']) for s in schede)
open('mock.html','w',encoding='utf-8').write(base.replace('<div class="fila" id="fila"></div>','<div class="fila">%s</div>'%col))
print('sei schede riscritte')
