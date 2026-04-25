/**
 * POI•LOVE — POI Card Renderer v4
 *
 * Card composita 4:5 (1080×1350) — unico artefatto salvato per ogni POI.
 * La foto è un'opera visiva: nessun QR embedded.
 *
 * LOGO: bottom-right, posizione assoluta, bianco retinato 28%.
 *       Non togglable. Non ha props. È strutturale.
 *
 * Fissi: logo (bottom-right) + luogo + data (footer bottom-left)
 * Toggle: titolo (showTitle) + sintesi (showSummary)
 *
 * Font: Montserrat Bold + Regular
 */
import { View, Text, Image, StyleSheet } from 'react-native';
import {
  useFonts,
  Montserrat_700Bold,
  Montserrat_400Regular,
} from '@expo-google-fonts/montserrat';
import { POI } from '@/lib/types';
import { CARD_4_5 } from '@/constants/cardLayout';
import POILoveLogo from './POILoveLogo';

const SCALE            = 3;
export const DISPLAY_W = CARD_4_5.width  / SCALE; // 360px
export const DISPLAY_H = CARD_4_5.height / SCALE; // 450px
const PAD              = Math.round(DISPLAY_W * (56 / CARD_4_5.width)); // ~18px

interface Props {
  poi:         POI;
  photoUri:    string;
  showTitle:   boolean;
  showSummary: boolean;
}

export default function POICardRenderer({ poi, photoUri, showTitle, showSummary }: Props) {
  const [fontsLoaded] = useFonts({ Montserrat_700Bold, Montserrat_400Regular });

  const summary = poi.description
    ? poi.description.slice(0, 80) + (poi.description.length > 80 ? '…' : '')
    : null;

  const date = new Date(poi.created_at).toLocaleDateString('it-IT', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  if (!fontsLoaded) return <View style={[styles.card, { backgroundColor: '#1a2a1e' }]} />;

  return (
    <View style={styles.card}>

      {/* Foto */}
      <Image source={{ uri: photoUri }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />

      {/* Gradiente scuro dal basso — 5 layer */}
      <View style={[s.g, { height: '80%', opacity: 0.06 }]} />
      <View style={[s.g, { height: '68%', opacity: 0.14 }]} />
      <View style={[s.g, { height: '54%', opacity: 0.32 }]} />
      <View style={[s.g, { height: '40%', opacity: 0.64 }]} />
      <View style={[s.g, { height: '28%', opacity: 0.88 }]} />

      {/* Testi */}
      <View style={styles.textArea}>
        {showSummary && summary && (
          <Text style={styles.summary} numberOfLines={2}>{summary}</Text>
        )}
        {showTitle && (
          <Text style={styles.title} numberOfLines={2}>{poi.name}</Text>
        )}
        <View style={styles.footer}>
          <View style={styles.footerMeta}>
            <Text style={styles.footerLocation} numberOfLines={1}>{poi.name}</Text>
            <Text style={styles.footerDate}>{date}</Text>
          </View>
        </View>
      </View>

      {/* Logo — bottom-right — sempre presente — non togglable */}
      <View style={styles.logoWrap}>
        <POILoveLogo
          height={Math.round(DISPLAY_H * (26 / CARD_4_5.height))}
          variant="watermark"
        />
      </View>

    </View>
  );
}

const s = StyleSheet.create({
  g: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#000' },
});

const styles = StyleSheet.create({
  card: {
    width:           DISPLAY_W,
    height:          DISPLAY_H,
    overflow:        'hidden',
    backgroundColor: '#1a2a1e',
  },
  textArea: {
    position:      'absolute',
    left:          0,
    right:         0,
    bottom:        0,
    paddingLeft:   PAD,
    paddingRight:  PAD,
    paddingBottom: PAD,
    gap:           Math.round(PAD * 0.3),
    justifyContent: 'flex-end',
  },
  summary: {
    fontFamily: 'Montserrat_400Regular',
    fontSize:   Math.round(DISPLAY_H * (33 / CARD_4_5.height)),
    color:      'rgba(255,255,255,0.76)',
    lineHeight: Math.round(DISPLAY_H * (47 / CARD_4_5.height)),
  },
  title: {
    fontFamily:   'Montserrat_700Bold',
    fontSize:     Math.round(DISPLAY_H * (48 / CARD_4_5.height)),
    color:        '#FFFFFF',
    lineHeight:   Math.round(DISPLAY_H * (58 / CARD_4_5.height)),
    marginBottom: Math.round(PAD * 0.3),
  },
  footer: {
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255,255,255,0.20)',
    paddingTop:     Math.round(PAD * 0.5),
    paddingRight:   Math.round(DISPLAY_W * 0.40), // spazio per il logo a destra
  },
  footerMeta: { gap: 1 },
  footerLocation: {
    fontFamily: 'Montserrat_700Bold',
    fontSize:   Math.round(DISPLAY_H * (23 / CARD_4_5.height)),
    color:      'rgba(255,255,255,0.92)',
  },
  footerDate: {
    fontFamily: 'Montserrat_400Regular',
    fontSize:   Math.round(DISPLAY_H * (18 / CARD_4_5.height)),
    color:      'rgba(255,255,255,0.52)',
  },
  logoWrap: {
    position: 'absolute',
    bottom:   PAD,
    right:    PAD,
  },
});
