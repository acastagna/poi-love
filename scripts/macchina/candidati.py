#!/usr/bin/env python3
# © Alessandro Castagna — 321.al / EVOLAB
# Tutti i diritti riservati. Uso non autorizzato vietato.
# info@321.it · https://321.al
#
# La catena automatica: pesca candidati dai dati aperti per un viaggio.
#
# Uso:  candidati.py <numero del viaggio> [quanti]
#
# Come funziona, in chiaro:
#   1. dal piano dei viaggi prende le prefetture di quel viaggio e il tema;
#   2. chiede a OpenStreetMap (Overpass) i luoghi di quel tipo dentro quelle zone;
#   3. tiene solo quelli con un NOME (un posto senza nome non e' un luogo del cuore);
#   4. per la foto va su Wikidata/Commons e accetta l'immagine SOLO se e' legata a
#      quell'oggetto per identita', mai per vicinanza: nelle citta' la vicinanza
#      sbaglia quasi sempre;
#   5. da' un punteggio di fiducia e scrive il candidato. Decide poi una persona.

import json, sys, time, urllib.parse, urllib.request, unicodedata

REST = 'https://poilove.com/db/rest/v1'
CHIAVE = open('/opt/poilove/service.jwt').read().strip()
# Overpass e' un servizio gratuito di altri: quando e' carico chiude la porta.
# Si prova su piu' specchi, con pause crescenti, invece di perdere il viaggio.
SPECCHI = ['https://overpass-api.de/api/interpreter',
           'https://overpass.kumi.systems/api/interpreter',
           'https://overpass.private.coffee/api/interpreter']

# Alcune cose nei dati aperti hanno un nome ma non sono luoghi: un aereo in
# mostra, un carro armato, una locomotiva. Peggio ancora, chi le segna ci mette
# la scheda del MODELLO, cosi' il testo che torna parla del MiG-21 in generale
# e non di quel pezzo li'. Non entrano.
NON_LUOGHI = {'aircraft', 'aeroplane', 'tank', 'locomotive', 'train', 'ship',
              'vehicle', 'cannon', 'artillery'}

TEMI = {
    'montagna e paesi': '["tourism"~"viewpoint|attraction"],["natural"~"peak"],["place"~"village"]',
    'mare e borghi':    '["natural"~"beach"],["tourism"~"attraction|viewpoint"],["place"~"village"]',
    'storia':           '["historic"~"castle|fort|city_gate|tower|archaeological_site|ruins|memorial"],["tourism"~"museum|attraction"]',
    'acqua':            '["natural"~"water|spring"],["tourism"~"viewpoint"]',
    'cibo':             '["amenity"~"restaurant|cafe"],["shop"~"bakery|deli"]',
    'architettura':     '["historic"~"castle|city_gate|tower|manor|fort|ruins|building"],["building"~"church|mosque|castle|cathedral"],["tourism"~"museum|attraction"]',
    'archeologia':      '["historic"~"archaeological_site|ruins"],["tourism"~"museum"]',
    'arte sacra':       '["historic"~"church|monastery"],["building"~"church|monastery|mosque"],["amenity"~"place_of_worship"]',
    'natura':           '["natural"~"waterfall|spring|cave_entrance"],["tourism"~"viewpoint"]',
    'memoria':          '["historic"~"memorial|monument|bunker"],["military"~"bunker"],["tourism"~"museum"]',
    'vita quotidiana':  '["amenity"~"marketplace"],["shop"~"craft|art"],["craft"]',
}

def chiedi(url, dati=None, testa=None, secondi=60):
    # Wikimedia respinge chi non dice chi e': senza questa riga la foto non
    # arrivava mai, e sembrava che i luoghi non avessero immagini.
    intestazioni = {'User-Agent': 'POILOVE/1.0 (https://poilove.com; info@321.al)'}
    intestazioni.update(testa or {})
    r = urllib.request.Request(url, data=dati, headers=intestazioni)
    with urllib.request.urlopen(r, timeout=secondi) as f:
        return f.read().decode('utf-8', 'ignore')

def rest(percorso, metodo='GET', corpo=None):
    testa = {'apikey': CHIAVE, 'Authorization': 'Bearer ' + CHIAVE,
             'Content-Type': 'application/json', 'Prefer': 'return=representation'}
    r = urllib.request.Request(REST + '/' + percorso, method=metodo,
                               data=(json.dumps(corpo).encode() if corpo is not None else None), headers=testa)
    with urllib.request.urlopen(r, timeout=30) as f:
        t = f.read().decode('utf-8', 'ignore')
    return json.loads(t) if t.strip() else []

def normale(s):
    s = unicodedata.normalize('NFKD', (s or '').lower())
    return ''.join(c for c in s if not unicodedata.combining(c) and (c.isalnum() or c == ' ')).strip()

def foto_da_wikidata(qid, nome):
    """La foto arriva SOLO se e' l'immagine di QUELL'oggetto su Wikidata (P18).
       Niente ricerche per vicinanza: nelle citta' pescano il palazzo accanto."""
    if not qid:
        return None
    try:
        d = json.loads(chiedi('https://www.wikidata.org/wiki/Special:EntityData/%s.json' % qid))
        ent = d['entities'][qid]
        p18 = ent.get('claims', {}).get('P18')
        if not p18:
            return None
        file_ = p18[0]['mainsnak']['datavalue']['value']
        api = ('https://commons.wikimedia.org/w/api.php?action=query&titles=File:%s'
               '&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=1200&format=json'
               % urllib.parse.quote(file_))
        j = json.loads(chiedi(api))
        for _, pg in (j.get('query', {}).get('pages') or {}).items():
            ii = (pg.get('imageinfo') or [None])[0]
            if not ii:
                continue
            em = ii.get('extmetadata', {})
            def pulisci(x):
                import re
                return re.sub('<[^>]+>', '', str(x or '')).strip()
            autore = pulisci((em.get('Artist') or {}).get('value')) or pulisci((em.get('Credit') or {}).get('value'))
            licenza = pulisci((em.get('LicenseShortName') or {}).get('value'))
            if not autore or not licenza:
                return None            # senza autore e licenza la foto non si usa
            return {'url': ii.get('thumburl') or ii.get('url'), 'autore': autore,
                    'licenza': licenza, 'fonte': ii.get('descriptionurl'), 'come': 'wikidata P18'}
    except Exception:
        return None
    return None

def overpass(query):
    """Chiede a OpenStreetMap. Se uno specchio non risponde si passa al
       prossimo, e si aspetta un po' di piu' ogni volta: e' roba di altri."""
    ultimo = None
    for giro in range(3):
        for indirizzo in SPECCHI:
            try:
                testo = chiedi(indirizzo, dati=query.encode('utf-8'), secondi=180,
                               testa={'Content-Type': 'text/plain',
                                      'User-Agent': 'POILOVE/1.0 (https://poilove.com; info@321.al)'})
                return json.loads(testo).get('elements', [])
            except Exception as ex:
                ultimo = ex
                time.sleep(3 + giro * 12)
    print('OpenStreetMap non ha risposto:', ultimo)
    return []


def testi_da_wikidata(qid):
    """Nomi e testo nelle tre lingue. Il testo e' la prima parte della voce di
       Wikipedia, non una frase scritta da noi: se la voce non c'e', si lascia
       vuoto. La licenza di Wikipedia va scritta accanto, sempre."""
    fuori = {'nome_sq': None, 'nome_it': None, 'nome_en': None,
             'descr_sq': None, 'descr_it': None, 'descr_en': None,
             'descr_fonte': None, 'descr_licenza': None}
    if not qid:
        return fuori
    try:
        d = json.loads(chiedi('https://www.wikidata.org/wiki/Special:EntityData/%s.json' % qid))
        ent = d['entities'][qid]
    except Exception:
        return fuori
    etichette = ent.get('labels', {})
    for lg, campo in (('sq', 'nome_sq'), ('it', 'nome_it'), ('en', 'nome_en')):
        v = etichette.get(lg)
        if v:
            fuori[campo] = v.get('value')
    legami = ent.get('sitelinks', {})
    fonti = []
    for lg, campo in (('sq', 'descr_sq'), ('it', 'descr_it'), ('en', 'descr_en')):
        sl = legami.get(lg + 'wiki')
        if not sl:
            continue
        titolo = sl.get('title')
        try:
            api = ('https://%s.wikipedia.org/w/api.php?action=query&prop=extracts'
                   '&exintro=1&explaintext=1&redirects=1&format=json&titles=%s'
                   % (lg, urllib.parse.quote(titolo)))
            j = json.loads(chiedi(api, secondi=30))
            for _, pg in (j.get('query', {}).get('pages') or {}).items():
                testo = (pg.get('extract') or '').strip()
                if len(testo) < 40:
                    continue
                # due o tre frasi bastano: la scheda di un luogo non e' una voce
                if len(testo) > 700:
                    taglio = testo.rfind('. ', 0, 700)
                    testo = testo[:taglio + 1] if taglio > 200 else testo[:700].rstrip() + '...'
                fuori[campo] = testo
                fonti.append('https://%s.wikipedia.org/wiki/%s' % (lg, urllib.parse.quote(titolo.replace(' ', '_'))))
        except Exception:
            pass
        time.sleep(0.1)
    if fonti:
        fuori['descr_fonte'] = ' · '.join(fonti)
        fuori['descr_licenza'] = 'CC BY-SA 4.0 · Wikipedia'
    return fuori


def cerca(viaggio, quanti):
    pref = viaggio['prefetture']
    tema = viaggio['tema']
    filtri = TEMI.get(tema, '["tourism"~"attraction|museum|viewpoint"]')
    # Le zone non si cercano per nome: nei dati aperti si chiamano "Qarku i
    # Beratit", non "Berat". Si usa l'identificativo vero, salvato in tabella.
    ids = []
    for p in pref:
        r = rest('prefetture?chiave=eq.%s&select=osm_id,nome_osm' % urllib.parse.quote(p))
        if r:
            ids.append(int(r[0]['osm_id']))
    if not ids:
        print('nessuna prefettura riconosciuta:', pref); return []
    zone = ''.join('area(%d)->.z%d;' % (3600000000 + oid, i) for i, oid in enumerate(ids))
    corpi = []
    for i in range(len(ids)):
        for f in filtri.split('],['):
            f = f.strip('[]')
            corpi.append('node[%s]["name"](area.z%d);way[%s]["name"](area.z%d);' % (f, i, f, i))
    # Si chiede largo: molti oggetti cadono dopo (doppioni, nomi vuoti, lapidar).
    # Chiedendo stretto si finiva con dieci candidati su quattordici chiesti.
    tetto = max(300, quanti * 20)
    q = '[out:json][timeout:90];%s(%s);out center %d;' % (zone, ''.join(corpi), tetto)
    trovati = overpass(q)
    if len(trovati) >= quanti * 2:
        return trovati
    # Se il tema ha pescato poco, si allarga a quello che una guida chiamerebbe
    # 'da vedere': meglio piu' candidati e una persona che sceglie.
    largo = '["tourism"~"attraction|museum|viewpoint|artwork"],["historic"]'
    corpi2 = []
    for i in range(len(ids)):
        for f in largo.split('],['):
            f = f.strip('[]')
            corpi2.append('node[%s]["name"](area.z%d);way[%s]["name"](area.z%d);' % (f, i, f, i))
    q2 = '[out:json][timeout:90];%s(%s);out center %d;' % (zone, ''.join(corpi2), tetto)
    trovati += overpass(q2)
    return trovati

def main():
    if len(sys.argv) < 2:
        print('serve il numero del viaggio'); return 2
    ordine = int(sys.argv[1])
    quanti = int(sys.argv[2]) if len(sys.argv) > 2 else 14

    vv = rest('viaggi_piano?ordine=eq.%d&select=id,ordine,nome_it,tema,prefetture' % ordine)
    if not vv:
        print('viaggio non trovato'); return 3
    v = vv[0]
    print('viaggio %d · %s · tema %s · %s' % (v['ordine'], v['nome_it'], v['tema'], ', '.join(v['prefetture'])))

    elementi = cerca(v, quanti)
    print('dai dati aperti: %d oggetti con un nome' % len(elementi))

    messi, con_foto, con_testo, saltati = 0, 0, 0, 0
    visti = set()
    # Prima quelli che hanno una scheda su Wikidata o Wikipedia: sono i luoghi
    # riconosciuti, e sono anche gli unici che possono avere una foto con licenza.
    def peso(x):
        t = x.get('tags', {})
        return (2 if t.get('wikidata') else 0) + (1 if t.get('wikipedia') else 0)
    elementi = sorted(elementi, key=peso, reverse=True)
    for e in elementi:
        if messi >= quanti:
            break
        tag = e.get('tags', {})
        nome = tag.get('name')
        if not nome or normale(nome) in visti:
            continue
        # I lapidar (le stele della memoria) sono centinaia e si somigliano tutti:
        # hanno senso nel viaggio della memoria, non in quello dell'architettura.
        if v['tema'] != 'memoria' and normale(nome).startswith('lapidar'):
            continue
        if (tag.get('historic') or tag.get('tourism') or '') in NON_LUOGHI or tag.get('aeroway'):
            continue
        visti.add(normale(nome))
        lat = e.get('lat') or (e.get('center') or {}).get('lat')
        lng = e.get('lon') or (e.get('center') or {}).get('lon')
        if lat is None or lng is None:
            continue
        qid = tag.get('wikidata')
        foto = foto_da_wikidata(qid, nome) if qid else None
        lingue = testi_da_wikidata(qid) if qid else {}
        # i nomi in albanese, italiano e inglese: prima quelli dei dati aperti,
        # poi quelli di Wikidata, in ultimo il nome come sta scritto sul posto
        lingue['nome_sq'] = tag.get('name:sq') or lingue.get('nome_sq') or nome
        lingue['nome_it'] = tag.get('name:it') or lingue.get('nome_it')
        lingue['nome_en'] = tag.get('name:en') or lingue.get('nome_en')
        fiducia = 40
        if qid: fiducia += 25
        if foto: fiducia += 20
        if tag.get('wikipedia'): fiducia += 10
        if tag.get('description') or tag.get('historic'): fiducia += 5
        riga = {
            'viaggio_id': v['id'], 'nome': nome, 'nome_alt': tag.get('alt_name') or tag.get('name:en'),
            'lat': lat, 'lng': lng, 'citta': tag.get('addr:city'),
            'prefettura': v['prefetture'][0] if v['prefetture'] else None,
            'categoria': tag.get('historic') or tag.get('tourism') or tag.get('amenity') or tag.get('natural') or tag.get('shop'),
            'tags': [k + '=' + str(x)[:40] for k, x in list(tag.items())[:8]],
            'fonte': 'openstreetmap', 'fonte_id': '%s/%s' % (e.get('type'), e.get('id')),
            'wikidata': qid, 'fiducia': min(100, fiducia),
            'foto_come': (foto or {}).get('come', 'nessuna'),
        }
        riga.update({k: v2 for k, v2 in lingue.items() if v2})
        if lingue.get('descr_sq') or lingue.get('descr_it') or lingue.get('descr_en'):
            fiducia += 10
            riga['fiducia'] = min(100, fiducia)
        if foto:
            riga.update({'foto_url': foto['url'], 'foto_autore': foto['autore'],
                         'foto_licenza': foto['licenza'], 'foto_fonte': foto['fonte']})
            con_foto += 1
        if riga.get('descr_sq') or riga.get('descr_it') or riga.get('descr_en'):
            con_testo += 1
        try:
            rest('candidati', 'POST', riga)
            messi += 1
        except Exception as ex:
            saltati += 1
        time.sleep(0.15)

    print('candidati scritti: %d · con foto vera: %d · con testo vero: %d · saltati: %d'
          % (messi, con_foto, con_testo, saltati))
    return 0

if __name__ == '__main__':
    sys.exit(main())
