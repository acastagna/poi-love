/**
 * POI•LOVE — Logo Component
 *
 * Logo SVG vettoriale bianco. SEMPRE presente sulla card.
 * Non ha props di visibilità — non è togglable, non è opzionale.
 *
 * Varianti:
 *   watermark — retinato 28% opacity, per sovrapporre sulla foto
 *   footer    — 55% opacity, per il footer della card
 *   full      — 100% opacity, per schermate UI
 */
import Svg, { Circle, Path, Text as SvgText, G } from 'react-native-svg';

type Variant = 'watermark' | 'footer' | 'full';

interface Props {
  height:   number;
  variant?: Variant;
}

const OPACITY: Record<Variant, number> = {
  watermark: 0.28,
  footer:    0.55,
  full:      1.00,
};

/**
 * Viewbox 0 0 120 32 — ratio ~3.75:1
 * Il logo è composto da:
 *   - Marker pin (cerchio esterno + dot interno) — brand icon
 *   - Testo "POI•LOVE" in Montserrat Bold
 *
 * Quando il file SVG ufficiale da poilove.com/img/logo-completo.svg
 * sarà disponibile offline, sostituire il path qui sotto con quello esatto.
 */
export default function POILoveLogo({ height, variant = 'footer' }: Props) {
  const width   = height * 3.75;
  const opacity = OPACITY[variant];

  return (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 120 32"
      style={{ opacity }}
    >
      {/* Pin marker */}
      <G>
        {/* Cerchio esterno */}
        <Circle cx="12" cy="13" r="7" fill="none" stroke="white" strokeWidth="2.2" />
        {/* Dot centrale */}
        <Circle cx="12" cy="13" r="2.5" fill="white" />
        {/* Punta del pin */}
        <Path
          d="M12 20 L9.5 24 Q12 26.5 14.5 24 Z"
          fill="white"
        />
      </G>

      {/* Testo POI•LOVE */}
      <SvgText
        x="24"
        y="21"
        fontSize="13.5"
        fontWeight="bold"
        fontFamily="Montserrat-Bold, Montserrat, sans-serif"
        fill="white"
        letterSpacing="0.8"
      >
        POI•LOVE
      </SvgText>
    </Svg>
  );
}
