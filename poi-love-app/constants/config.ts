/**
 * © Alessandro Castagna — 321.al / EVOLAB
 * Tutti i diritti riservati. Uso non autorizzato vietato.
 * info@321.it · https://321.al
 *
 * POI•LOVE — Configurazione globale dell'app.
 *
 * Dal 18/08/2026 i dati e gli accessi vivono sulla NOSTRA macchina:
 * https://poilove.com/db/ davanti a PostgREST e GoTrue. Supabase resta solo
 * per le funzioni edge e lo storage vecchio. La chiave qui sotto e' quella
 * pubblica, la stessa del sito: apre la porta, le regole per-utente (RLS)
 * decidono cosa si vede.
 */
import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra ?? {};

export const Config = {
  // Il database di casa nostra (PostgREST + GoTrue dietro nginx)
  dbUrl:  process.env.EXPO_PUBLIC_DB_URL ?? extra.dbUrl ?? 'https://poilove.com/db',
  dbKey:  process.env.EXPO_PUBLIC_DB_KEY ?? extra.dbKey ?? 'sb_publishable_PC1xQ8XiQK9jpzwsAlFLxw_E-PKN40V',

  // Le funzioni AI (ILLI, moderazione): l'indirizzo e' nostro, nginx le inoltra
  // a Supabase dove girano. Chiavi e dati restano dal lato nostro.
  functionsUrl: process.env.EXPO_PUBLIC_FUNCTIONS_URL ?? 'https://poilove.com/db/functions/v1',

  googleMapsKey:  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '',
  mediaServerUrl: process.env.EXPO_PUBLIC_MEDIA_SERVER_URL ?? 'https://media.poilove.com',

  // Limiti di base. Quelli veri per livello arrivano dalla tabella `livelli`:
  // questi valgono solo finche' non e' ancora arrivata la risposta.
  maxPhotosPerPOI:   3,
  maxDescriptionLen: 600,
  maxTagsPerPOI:     10,   // nel foglio di creazione si scrivono separati da virgola
  maxCategories:     3,

  // Deep link scheme (deve corrispondere ad app.json "scheme")
  linkingScheme: 'poilove',

  // Tirana: coordinate di partenza al primo avvio, prima che il GPS risponda
  defaultRegion: {
    latitude:       41.3275,
    longitude:      19.8187,
    latitudeDelta:  0.05,
    longitudeDelta: 0.05,
  },
} as const;
