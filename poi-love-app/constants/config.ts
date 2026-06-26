/**
 * POI•LOVE — Configurazione globale
 */
import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra ?? {};

export const Config = {
  supabaseUrl:     process.env.EXPO_PUBLIC_SUPABASE_URL  ?? extra.supabaseUrl  ?? '',
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? extra.supabaseAnonKey ?? '',
  googleMapsKey:   process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '',
  mediaServerUrl:  process.env.EXPO_PUBLIC_MEDIA_SERVER_URL ?? 'https://media.poilove.com',

  // Limiti business
  maxPhotosPerPOI:   3,
  maxDescriptionLen: 200,
  maxTagLen:         30,

  // Deep link scheme (deve corrispondere a app.json "scheme")
  linkingScheme: 'poilove',

  // Tirana: coordinate default al primo avvio (prima che GPS sia disponibile)
  defaultRegion: {
    latitude:       41.3275,
    longitude:      19.8187,
    latitudeDelta:  0.05,
    longitudeDelta: 0.05,
  },
} as const;
