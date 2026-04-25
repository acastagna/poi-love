/**
 * POI•LOVE — Card Layout Constants
 *
 * Formato master: 4:5 (1080×1350) — salvato su Plesk
 * Formato stories: 9:16 (1080×1920) — generato on-device al momento della share
 *
 * Safe zones: margini minimi per non entrare nelle UI di ogni social.
 * Tutti i valori sono in px riferiti alla risoluzione master (1080px wide).
 */

// ─── Dimensioni master ────────────────────────────
export const CARD_4_5 = {
  width:  1080,
  height: 1350,
  ratio:  '4:5',
} as const;

export const CARD_9_16 = {
  width:  1080,
  height: 1920,
  ratio:  '9:16',
} as const;

// ─── Safe zones (px) su 1080px wide ───────────────
// Zona in cui NON mettere mai testi o loghi importanti
export const SAFE_ZONES = {
  // Instagram Feed 4:5 — solo margine perimetrale
  feed: {
    top:    40,
    bottom: 40,
    left:   40,
    right:  40,
  },
  // Instagram Stories 9:16 — barra in alto + barra azioni in basso
  stories: {
    top:    156,  // 88px UI bar + 68px extra
    bottom: 400,  // ~250px barra azioni + swipe-up affordance
    left:   40,
    right:  40,
  },
  // TikTok 9:16 — pulsanti a destra + barra in basso
  tiktok: {
    top:    80,
    bottom: 340,  // barra azioni TikTok
    left:   40,
    right:  200,  // colonna like/commento/share (130px largh + 70px margin)
  },
  // WhatsApp / email — nessun vincolo
  generic: {
    top:    20,
    bottom: 20,
    left:   20,
    right:  20,
  },
} as const;

// ─── Layout testi sulla card master 4:5 ──────────
// Tutti i valori in px rispetto a CARD_4_5
export const CARD_TEXT = {
  // Gradiente scuro bottom — altezza
  gradientHeight: 480, // ~35% dell'altezza

  // Footer fisso (logo + luogo + data) — posizione bottom
  footer: {
    paddingBottom: 56,
    paddingLeft:   56,
    paddingRight:  56,
    height:        72,
  },

  // Titolo — sopra il footer
  title: {
    fontSize:      52,   // Montserrat Bold
    lineHeight:    62,
    maxLines:      2,
    paddingBottom: 16,   // distanza dal footer
    paddingLeft:   56,
    paddingRight:  56,
  },

  // Sintesi descrizione — sopra il titolo
  summary: {
    fontSize:      36,   // Montserrat Regular
    lineHeight:    50,
    maxLines:      2,
    paddingBottom: 12,
    paddingLeft:   56,
    paddingRight:  56,
    opacity:       0.80,
  },

  // Logo POI•LOVE watermark bottom-left nel footer
  logo: {
    height:      36,     // altezza logo
    opacity:     0.30,   // retinato
    color:       '#FFFFFF',
  },
} as const;

// ─── Qualità output ───────────────────────────────
export const CARD_QUALITY = {
  webpQuality:  82,    // 0-100 — ~150-200KB per card 4:5
  jpegQuality:  90,    // per download stampa
} as const;
