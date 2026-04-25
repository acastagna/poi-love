/**
 * POI•LOVE — POI Card + QR Strip
 *
 * Composizione verticale per sharing con QR:
 *
 *   ┌──────────────────┐
 *   │                  │
 *   │   card 4:5       │  ← foto pulita, logo, testi
 *   │   (360×450px)    │
 *   │                  │
 *   ├──────────────────┤
 *   │  [QR] Portami    │  ← strip bianca separata
 *   │       al luogo → │
 *   └──────────────────┘
 *
 * Questo componente è separato dalla card — la foto resta intatta.
 * L'utente sceglie nel ShareCardSheet se condividere con o senza strip.
 *
 * Per libro e mostre: NON si usa questo componente.
 * Il libro ha la propria impaginazione: foto intera + QR come elemento
 * tipografico della pagina (gestito dal sistema di generazione del libro).
 *
 * Font: Montserrat Bold + Regular
 */
import { View, Text, StyleSheet } from 'react-native';
import {
  useFonts,
  Montserrat_700Bold,
  Montserrat_400Regular,
} from '@expo-google-fonts/montserrat';
import QRCode from 'react-native-qrcode-svg';
import { POI } from '@/lib/types';
import { Colors, Radius } from '@/constants/theme';
import POICardRenderer, { DISPLAY_W, DISPLAY_H } from './POICardRenderer';

// Strip height: proporzione QR + testo
const STRIP_H    = 72;
const QR_SIZE    = 44;
const TOTAL_H    = DISPLAY_H + STRIP_H;

interface Props {
  poi:         POI;
  photoUri:    string;
  showTitle:   boolean;
  showSummary: boolean;
}

export default function POICardWithQRStrip({ poi, photoUri, showTitle, showSummary }: Props) {
  const [fontsLoaded] = useFonts({ Montserrat_700Bold, Montserrat_400Regular });

  const poiUrl = `https://poilove.com/p/${poi.id}`;

  if (!fontsLoaded) return <View style={{ width: DISPLAY_W, height: TOTAL_H, backgroundColor: Colors.background }} />;

  return (
    <View style={styles.wrapper}>

      {/* Card foto — pulita, invariata */}
      <POICardRenderer
        poi={poi}
        photoUri={photoUri}
        showTitle={showTitle}
        showSummary={showSummary}
      />

      {/* Strip QR — elemento separato, non sulla foto */}
      <View style={styles.strip}>

        {/* QR code */}
        <View style={styles.qrWrap}>
          <QRCode
            value={poiUrl}
            size={QR_SIZE}
            color={Colors.textPrimary}
            backgroundColor="transparent"
            quietZone={0}
          />
        </View>

        {/* Testo CTA */}
        <View style={styles.ctaText}>
          <Text style={styles.ctaLabel}>Portami al luogo</Text>
          <Text style={styles.ctaUrl} numberOfLines={1}>poilove.com/p/…</Text>
        </View>

        {/* Freccia */}
        <Text style={styles.arrow}>→</Text>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width:        DISPLAY_W,
    overflow:     'hidden',
    borderRadius: Radius.md,
  },
  strip: {
    width:           DISPLAY_W,
    height:          STRIP_H,
    backgroundColor: '#FFFFFF',
    flexDirection:   'row',
    alignItems:      'center',
    paddingHorizontal: 16,
    gap:             12,
    borderTopWidth:  0.5,
    borderTopColor:  'rgba(0,0,0,0.08)',
  },
  qrWrap: {
    padding:         4,
    backgroundColor: '#FFFFFF',
    borderRadius:    4,
    borderWidth:     0.5,
    borderColor:     'rgba(0,0,0,0.10)',
  },
  ctaText: {
    flex: 1,
    gap:  2,
  },
  ctaLabel: {
    fontFamily: 'Montserrat_700Bold',
    fontSize:   13,
    color:      '#1A1714',
    letterSpacing: 0.2,
  },
  ctaUrl: {
    fontFamily: 'Montserrat_400Regular',
    fontSize:   11,
    color:      '#9E9386',
  },
  arrow: {
    fontSize:   20,
    color:      '#D42B2B',
    fontWeight: '700',
  },
});
