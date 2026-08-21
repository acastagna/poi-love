#!/usr/bin/env python3
# © Alessandro Castagna — 321.al / EVOLAB
# Tutti i diritti riservati. Uso non autorizzato vietato.
# info@321.it · https://321.al
#
# Sfoca i volti di chi e' finito nella foto per caso.
# Non e' una macchia nera sopra la faccia: e' una sfocatura misurata, con i
# bordi sfumati, che si confonde con la foto. Chi guarda vede che la' c'era una
# persona, ma non riconosce chi.
#
# Uso:  volti.py entrata.jpg uscita.jpg [intensita 1-10] [margine 0-40] [--elenco] [--bambini]
#   --bambini sfoca SOLO i volti che sembrano di bambini (fino a dodici anni)
#   --elenco  scrive su stdout i riquadri trovati, senza toccare l'immagine
#
# Il rilevatore e' YuNet (OpenCV Zoo): piccolo, veloce, e vede anche i volti
# di lato, non solo quelli in posa.

import sys, json
import cv2
import numpy as np

MODELLO = '/opt/poilove/modelli/yunet.onnx'
MODELLO_ETA = '/opt/poilove/modelli/eta.onnx'

# Le fasce del riconoscitore dell'eta'. Non da' un numero, da' una fascia: va
# bene per la domanda che ci facciamo, che e' "e' un bambino?", non "quanti anni ha".
FASCE = ['0-2', '4-6', '8-12', '15-20', '25-32', '38-43', '48-53', '60-100']
BAMBINO = {0, 1, 2}          # le prime tre fasce: fino a dodici anni


def e_bambino(img, r, soglia=0.25):
    """Vero se quel volto sembra di un bambino. Nel dubbio risponde SI: meglio
       sfocare la faccia di un adulto che lasciare scoperta quella di un bambino."""
    try:
        h, w = img.shape[:2]
        m = int(max(r['w'], r['h']) * 0.25)
        x0 = max(0, r['x'] - m); y0 = max(0, r['y'] - m)
        x1 = min(w, r['x'] + r['w'] + m); y1 = min(h, r['y'] + r['h'] + m)
        volto = img[y0:y1, x0:x1]
        if volto.size == 0:
            return True
        rete = cv2.dnn.readNetFromONNX(MODELLO_ETA)
        blob = cv2.dnn.blobFromImage(volto, 1.0, (224, 224), (104, 117, 123), swapRB=False)
        rete.setInput(blob)
        p = rete.forward().flatten()
        p = p / p.sum() if p.sum() else p
        return float(sum(p[i] for i in BAMBINO)) >= soglia
    except Exception:
        return True

def trova_volti(img, soglia=0.6):
    h, w = img.shape[:2]
    lato = 640
    scala = lato / max(h, w) if max(h, w) > lato else 1.0
    piccola = cv2.resize(img, (int(w*scala), int(h*scala))) if scala != 1.0 else img
    ph, pw = piccola.shape[:2]
    det = cv2.FaceDetectorYN.create(MODELLO, '', (pw, ph), score_threshold=soglia)
    det.setInputSize((pw, ph))
    _, facce = det.detect(piccola)
    fuori = []
    if facce is not None:
        for f in facce:
            x, y, bw, bh = [float(v) / scala for v in f[:4]]
            fuori.append({'x': int(max(0, x)), 'y': int(max(0, y)),
                          'w': int(min(bw, w)), 'h': int(min(bh, h)),
                          'sicurezza': round(float(f[-1]), 3)})
    return fuori

def sfoca(img, riquadri, intensita=5, margine=18):
    """Sfocatura con bordi sfumati: si sfoca tutta la zona e poi la si rimette
       dentro attraverso una maschera ovale morbida, cosi' non si vede il taglio."""
    h, w = img.shape[:2]
    fuori = img.copy()
    for r in riquadri:
        mx = int(r['w'] * margine / 100.0)
        my = int(r['h'] * margine / 100.0)
        x0 = max(0, r['x'] - mx); y0 = max(0, r['y'] - my)
        x1 = min(w, r['x'] + r['w'] + mx); y1 = min(h, r['y'] + r['h'] + my)
        if x1 - x0 < 8 or y1 - y0 < 8:
            continue
        zona = fuori[y0:y1, x0:x1]
        zh, zw = zona.shape[:2]
        # Una sola passata di sfocatura non basta: la forma del viso resta e la
        # persona si riconosce lo stesso. Prima si butta via il dettaglio
        # rimpicciolendo la zona a pochi pixel, poi la si riporta grande e la si
        # ammorbidisce. Cosi' il volto non torna piu' indietro, e il risultato
        # resta morbido invece che a quadretti.
        blocchi = max(2, 12 - intensita)          # a intensita 6 restano sei blocchi
        pw = max(2, zw // blocchi)
        ph = max(2, zh // blocchi)
        minuscola = cv2.resize(zona, (pw, ph), interpolation=cv2.INTER_AREA)
        sfocata = cv2.resize(minuscola, (zw, zh), interpolation=cv2.INTER_LINEAR)
        k = max(3, int(min(zw, zh) * (0.05 + 0.020 * intensita)))
        if k % 2 == 0: k += 1
        sfocata = cv2.GaussianBlur(sfocata, (k, k), 0)
        # maschera ovale con il bordo sfumato
        maschera = np.zeros((zh, zw), dtype=np.uint8)
        cv2.ellipse(maschera, (zw//2, zh//2), (int(zw*0.46), int(zh*0.50)), 0, 0, 360, 255, -1)
        sfum = max(3, int(min(zw, zh) * 0.22))
        if sfum % 2 == 0: sfum += 1
        maschera = cv2.GaussianBlur(maschera, (sfum, sfum), 0)
        m3 = cv2.cvtColor(maschera, cv2.COLOR_GRAY2BGR).astype(np.float32) / 255.0
        fuori[y0:y1, x0:x1] = (sfocata.astype(np.float32) * m3 +
                               zona.astype(np.float32) * (1.0 - m3)).astype(np.uint8)
    return fuori

def main():
    if len(sys.argv) < 3:
        print(json.dumps({'ok': False, 'errore': 'servono entrata e uscita'})); return 2
    entrata, uscita = sys.argv[1], sys.argv[2]
    intensita = int(sys.argv[3]) if len(sys.argv) > 3 and sys.argv[3].isdigit() else 5
    margine   = int(sys.argv[4]) if len(sys.argv) > 4 and sys.argv[4].isdigit() else 18
    solo_elenco = '--elenco' in sys.argv
    solo_bambini = '--bambini' in sys.argv
    intensita = max(1, min(10, intensita))
    margine   = max(0, min(40, margine))

    img = cv2.imread(entrata)
    if img is None:
        print(json.dumps({'ok': False, 'errore': 'immagine non leggibile'})); return 3
    try:
        riquadri = trova_volti(img)
    except Exception as e:
        print(json.dumps({'ok': False, 'errore': 'rilevatore non disponibile: %s' % e})); return 4

    if solo_bambini and riquadri:
        riquadri = [r for r in riquadri if e_bambino(img, r)]

    if solo_elenco:
        print(json.dumps({'ok': True, 'volti': riquadri})); return 0

    if riquadri:
        img = sfoca(img, riquadri, intensita, margine)
    cv2.imwrite(uscita, img, [int(cv2.IMWRITE_JPEG_QUALITY), 90])
    print(json.dumps({'ok': True, 'volti': len(riquadri), 'riquadri': riquadri}))
    return 0

if __name__ == '__main__':
    sys.exit(main())
