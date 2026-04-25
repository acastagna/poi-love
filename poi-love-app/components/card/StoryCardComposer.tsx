/**
 * POI•LOVE — Story Card Composer
 *
 * Wrappa la card 4:5 in un frame 9:16 con bande scure sopra/sotto.
 * Rispetta le safe zones di Instagram Stories e TikTok.
 * Viene catturato on-device solo al momento della condivisione — non salvato su Plesk.
 *
 *  ┌──────────────────┐  ←  top band (scura, safe zone sopra)
 *  │                  │
 *  │   CARD 4:5       │  ←  card principale centrata
 *  │                  │
 *  ├──────────────────┤
 *  │  titolo grande   │  ←  zona sicura sotto (sopra le UI social)
 *  │  luogo + data    │
 *  │  [logo]          │
 *  └──────────────────┘  ←  bottom band
 *
 * Safe zone rispettata: contenuto visivo tra top:156px e bottom:400px
 * su 1920px di altezza (valori da cardLayout.ts → SAFE_ZONES.stories)
 */
import { View, Text, Image, StyleSheet } from 'react-native';
import { useFonts, Montserrat_700Bold, Montserrat_400Regular } from '@expo-google-fonts/montserrat';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';
import { CARD_4_5, CARD_9_16, SAFE_ZONES } from '@/constants/cardLayout';
import { POI } from '@/lib/types';

// Scala display per 9:16
const SCALE   = 3;
const DISP_W  = CARD_9_16.width  / SCALE; // 360px
const DISP_H  = CARD_9_16.height / SCALE; // 640px
const CARD_H  = DISP_W * (CARD_4_5.height / CARD_4_5.width); // 450px

// Spazio disponibile sotto la card nella safe zone
const SAFE_B      = SAFE_ZONES.stories.bottom / SCALE;   // 133px
const SAFE_T      = SAFE_ZONES.stories.top    / SCALE;   // 52px
const BELOW_CARD  = DISP_H - SAFE_T - CARD_H;            // spazio sotto card

interface Props {
  poi:         POI;
  cardUri:     string;   // URI della card 4:5 già generata
  showTitle:   boolean;
  showSummary: boolean;
}

export default function StoryCardComposer({ poi, cardUri, showTitle, showSummary }: Props) {
  const [fontsLoaded] = useFonts({ Montserrat_700Bold, Montserrat_400Regular });

  const date = new Date(poi.created_at).toLocaleDateString('it-IT', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  const summary = poi.description
    ? poi.description.slice(0, 60) + (poi.description.length > 60 ? '…' : '')
    : null;

  if (!fontsLoaded) return null;

  const PAD = DISP_W * (56 / CARD_9_16.width);

  return (
    <View style={[styles.frame, { width: DISP_W, height: DISP_H }]}>

      {/* Sfondo nero */}
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#0a0a0a' }]} />

      {/* Card 4:5 posizionata nella safe zone */}
      <View style={[styles.cardContainer, { top: SAFE_T }]}>
        <Image
          source={{ uri: cardUri }}
          style={{ width: DISP_W, height: CARD_H, borderRadius: 0 }}
          resizeMode="cover"
        />
      </View>

      {/* Zona info sotto la card — dentro la safe zone, sopra i 400px dal basso */}
      <View style={[
        styles.infoZone,
        {
          bottom:       SAFE_B,
          height:       BELOW_CARD - SAFE_B,
          paddingHorizontal: PAD,
        }
      ]}>
        {showSummary && summary && (
          <Text style={[styles.summary, { fontSize: DISP_H * (30 / CARD_9_16.height) }]} numberOfLines={1}>
            {summary}
          </Text>
        )}
        {showTitle && (
          <Text style={[styles.title, { fontSize: DISP_H * (44 / CARD_9_16.height) }]} numberOfLines={2}>
            {poi.name}
          </Text>
        )}
        <View style={styles.metaRow}>
          <POILoveLogoSmall size={DISP_H * (28 / CARD_9_16.height)} />
          <Text style={[styles.metaText, { fontSize: DISP_H * (22 / CARD_9_16.height) }]}>
            {poi.name} · {date}
          </Text>
        </View>
      </View>

      {/* Indicatore safe zone (visibile solo in DEV) */}
      {__DEV__ && (
        <>
          <View style={{ position:'absolute', top: SAFE_T, left:0, right:0, height:1, backgroundColor:'rgba(255,0,0,0.4)' }} />
          <View style={{ position:'absolute', bottom: SAFE_B, left:0, right:0, height:1, backgroundColor:'rgba(255,0,0,0.4)' }} />
        </>
      )}
    </View>
  );
}

function POILoveLogoSmall({ size }: { size: number }) {
  const w = size * 3.8;
  return (
    <Svg width={w} height={size} viewBox="0 0 114 30" style={{ opacity: 0.55 }}>
      <Circle cx="7" cy="15" r="6" fill="none" stroke="white" strokeWidth="2" />
      <Circle cx="7" cy="15" r="2" fill="white" />
      <SvgText x="18" y="20" fontSize="14" fontWeight="bold" fontFamily="Montserrat, sans-serif" fill="white" letterSpacing="1">
        POI•LOVE
      </SvgText>
    </Svg>
  );
}

const styles = StyleSheet.create({
  frame: {
    overflow: 'hidden',
    position: 'relative',
  },
  cardContainer: {
    position: 'absolute',
    left:     0,
    right:    0,
  },
  infoZone: {
    position:      'absolute',
    left:          0,
    right:         0,
    justifyContent: 'flex-end',
    gap:           4,
  },
  summary: {
    fontFamily: 'Montserrat_400Regular',
    color:      'rgba(255,255,255,0.70)',
  },
  title: {
    fontFamily:  'Montserrat_700Bold',
    color:       '#FFFFFF',
    lineHeight:  undefined,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           8,
    marginTop:     4,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255,255,255,0.20)',
    paddingTop:    6,
  },
  metaText: {
    fontFamily: 'Montserrat_400Regular',
    color:      'rgba(255,255,255,0.55)',
  },
});
