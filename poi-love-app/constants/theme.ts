/**
 * POI•LOVE — Design Tokens
 * Brand: Red #D42B2B | Blue #285EA7 | BG #EAE4D8
 */

export const Colors = {
  // Brand primari
  red:        '#D42B2B',  // POI•LOVE
  blue:       '#285EA7',  // POI•VOICE
  background: '#EAE4D8',  // Sfondo principale

  // Toni neutri derivati
  surface:    '#F5F1EA',  // Card, sheet
  border:     '#D4CCBB',  // Bordi sottili
  textPrimary:'#1A1714',  // Testo principale
  textSecond: '#6B6154',  // Testo secondario
  textMuted:  '#9E9386',  // Placeholder

  // Feedback
  success:    '#2E7D32',
  warning:    '#E65100',
  error:      '#C62828',

  // Overlay
  overlay:    'rgba(26, 23, 20, 0.5)',
  overlayLight:'rgba(234, 228, 216, 0.9)',

  // White / Black
  white:      '#FFFFFF',
  black:      '#000000',
} as const;

export const Typography = {
  // Font sizes
  xs:   11,
  sm:   13,
  base: 15,
  md:   17,
  lg:   20,
  xl:   24,
  xxl:  32,
  hero: 42,

  // Line heights
  tight:   1.2,
  normal:  1.5,
  relaxed: 1.8,

  // Font weights (React Native usa stringhe)
  regular:   '400' as const,
  medium:    '500' as const,
  semibold:  '600' as const,
  bold:      '700' as const,
  extrabold: '800' as const,
} as const;

export const Spacing = {
  xs:   4,
  sm:   8,
  md:   16,
  lg:   24,
  xl:   32,
  xxl:  48,
} as const;

export const Radius = {
  sm:   6,
  md:   12,
  lg:   20,
  full: 999,
} as const;

export const Shadow = {
  sm: {
    shadowColor: '#1A1714',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#1A1714',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
  },
  lg: {
    shadowColor: '#1A1714',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 10,
  },
} as const;
