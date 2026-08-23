/**
 * © Alessandro Castagna — 321.al / EVOLAB
 * Tutti i diritti riservati. Uso non autorizzato vietato.
 * info@321.it · https://321.al
 *
 * PinCuore — il marcatore DEFINITIVO di POI•LOVE, identico alla webapp
 * (variante A scelta dal founder il 18/08): la goccia paffuta col cuore
 * bianco inciso, il numerino dei LOVE a cavallo della spalla (nero su
 * disco bianco, sparisce a zero), il nome sempre sotto su pillola scura.
 * Tre livelli di colore: i MIEI rossi, chi SEGUO verde, la community
 * grigia e piu' piccola. I luoghi ufficiali portano il sigillo d'oro.
 */
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';

/* La goccia e il cuore inciso: gli stessi tracciati della webapp. */
const GOCCIA = 'M40 90C37 88 8 66 8 40 8 22 21 8 40 8s32 14 32 32c0 26-29 48-32 50z';
const CUORE  = 'M40 30c-5-6-15-4.5-17 3-2 7 4.5 12 17 22 12.5-10 19-15 17-22-2-7.5-12-9-17-3z';
/* Il sigillo dei luoghi ufficiali (Phosphor seal-check, pieno). */
const SIGILLO =
  'M225.86,102.82c-3.77-3.94-7.67-8-9.14-11.57-1.36-3.27-1.44-8.69-1.52-13.94-.15-9.76-.31-20.82-8-28.51s-18.75-7.85-28.51-8c-5.25-.08-10.67-.16-13.94-1.52-3.56-1.47-7.63-5.37-11.57-9.14C146.28,23.51,138.44,16,128,16s-18.27,7.51-25.18,14.14c-3.94,3.77-8,7.67-11.57,9.14C88,40.64,82.56,40.72,77.31,40.8c-9.76.15-20.82.31-28.51,8S41,67.55,40.8,77.31c-.08,5.25-.16,10.67-1.52,13.94-1.47,3.56-5.37,7.63-9.14,11.57C23.51,109.72,16,117.56,16,128s7.51,18.27,14.14,25.18c3.77,3.94,7.67,8,9.14,11.57,1.36,3.27,1.44,8.69,1.52,13.94.15,9.76.31,20.82,8,28.51s18.75,7.85,28.51,8c5.25.08,10.67.16,13.94,1.52,3.56,1.47,7.63,5.37,11.57,9.14C109.72,232.49,117.56,240,128,240s18.27-7.51,25.18-14.14c3.94-3.77,8-7.67,11.57-9.14,3.27-1.36,8.69-1.44,13.94-1.52,9.76-.15,20.82-.31,28.51-8s7.85-18.75,8-28.51c.08-5.25.16-10.67,1.52-13.94,1.47-3.56,5.37-7.63,9.14-11.57C232.49,146.28,240,138.44,240,128S232.49,109.73,225.86,102.82Zm-52.2,6.84-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35a8,8,0,0,1,11.32,11.32Z';

/* I love in forma compatta, come nella webapp: 2000 → 2k, 2500 → 2,5k. */
function loveCompatti(n: number): string {
  if (n >= 10000) return Math.round(n / 1000) + 'k';
  if (n >= 1000) return String(Math.round(n / 100) / 10).replace('.', ',') + 'k';
  return String(n);
}

export type TierMarcatore = 'mio' | 'amico' | 'community';

interface Props {
  titolo:     string;
  love:       number;
  selected:   boolean;
  tier:       TierMarcatore;
  ufficiale?: boolean;
  inEvidenza?: boolean;
}

const COLORI: Record<TierMarcatore, string> = {
  mio:       '#D42B2B',
  amico:     '#1a7f45',
  community: '#8a8a8a',
};

export default function PinCuore({ titolo, love, selected, tier, ufficiale, inEvidenza }: Props) {
  const speciale = !!ufficiale || !!inEvidenza;
  const colore   = speciale ? '#D42B2B' : COLORI[tier];
  const piccolo  = !speciale && tier === 'community';
  const w = piccolo ? 30 : 42;
  const h = piccolo ? 36 : 50;
  const maxNome = piccolo ? 8 : 11;
  const nome = titolo.length > maxNome ? titolo.substring(0, maxNome) + '…' : titolo;
  return (
    <View style={[styles.tutto, selected && styles.scelto]}>
      <View style={styles.pin}>
        <Svg width={w} height={h} viewBox="0 0 80 96">
          <Path d={GOCCIA} fill={colore} stroke="#fff" strokeWidth={4} />
          <Path d={CUORE} fill="#fff" />
        </Svg>
        {speciale && (
          <View style={styles.sigillo}>
            <Svg width={15} height={15} viewBox="0 0 256 256">
              <Path d={SIGILLO} fill="#c9a22e" />
            </Svg>
          </View>
        )}
        {love > 0 && (
          <View style={[
            styles.badge,
            { borderColor: colore },
            piccolo && styles.badgePiccolo,
            speciale ? styles.badgeSinistra : styles.badgeDestra,
          ]}>
            <Text style={[styles.badgeTesto, piccolo && styles.badgeTestoPiccolo]}>{loveCompatti(love)}</Text>
          </View>
        )}
      </View>
      <View style={styles.etichetta}>
        <Text style={styles.etichettaTesto} numberOfLines={1}>{nome}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tutto: {
    alignItems: 'center',
  },
  scelto: {
    transform: [{ scale: 1.15 }],
  },
  pin: {
    position: 'relative',
  },
  sigillo: {
    position: 'absolute',
    top: -4,
    right: 2,
    zIndex: 2,
  },
  badge: {
    position: 'absolute',
    minWidth: 18,
    height: 18,
    borderRadius: 99,
    paddingHorizontal: 4,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  badgeDestra:   { top: -2, right: -2 },
  badgeSinistra: { top: -2, left: -2 },
  badgePiccolo: {
    minWidth: 16,
    height: 16,
    borderWidth: 1,
  },
  badgeTesto: {
    fontSize: 10,
    fontWeight: '900',
    color: '#111',
    lineHeight: 12,
  },
  badgeTestoPiccolo: {
    fontSize: 9,
  },
  etichetta: {
    marginTop: 3,
    backgroundColor: 'rgba(0,0,0,.72)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    maxWidth: 104,
  },
  etichettaTesto: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.2,
  },
});
