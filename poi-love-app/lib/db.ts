/**
 * © Alessandro Castagna — 321.al / EVOLAB
 * Tutti i diritti riservati. Uso non autorizzato vietato.
 * info@321.it · https://321.al
 *
 * POI•LOVE — Il livello dati dell'app.
 *
 * Un solo client, che parla col NOSTRO database (https://poilove.com/db/,
 * PostgREST + GoTrue sulla macchina di Norimberga). La libreria supabase-js
 * funziona uguale: sotto quell'indirizzo nginx serve le stesse strade
 * /rest/v1 e /auth/v1, e la sessione resta salvata sul telefono.
 *
 * Regole di questo file:
 *  - i nomi delle colonne sono quelli VERI: title, lat, lng, author_id, photos;
 *  - le select chiedono solo i campi che servono, mai '*' sulle liste;
 *  - ogni scrittura rilegge la riga: PostgREST risponde bene anche quando le
 *    regole per-utente hanno scartato tutto, e zero righe = rifiuto, non successo.
 */
import 'react-native-url-polyfill/auto';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Config } from '@/constants/config';
import { POI, POI_CAMPI_MAPPA, Profile, Livello, Audioguida } from './types';

export const db = createClient(Config.dbUrl, Config.dbKey, {
  auth: {
    storage:            AsyncStorage,
    autoRefreshToken:   true,
    persistSession:     true,
    detectSessionInUrl: false,
  },
});

/** Compatibilita' con il codice che importava `supabase`: stesso client. */
export const supabase = db;

// ── La sessione che dura ────────────────────────────────────────────────────
// Sul telefono il rinnovo automatico del biglietto va acceso e spento a mano:
// acceso quando l'app e' davanti, spento quando va in tasca. Senza questo, chi
// riapre l'app dopo qualche ora si ritrova col biglietto scaduto e viene
// buttato fuori senza motivo.
AppState.addEventListener('change', (stato) => {
  if (stato === 'active') db.auth.startAutoRefresh();
  else db.auth.stopAutoRefresh();
});
db.auth.startAutoRefresh();

// ─── Chi sono ───────────────────────────────────────────────────────────────
export async function getCurrentUser() {
  const { data: { user }, error } = await db.auth.getUser();
  if (error || !user) return null;
  return user;
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await db
    .from('profiles')
    .select('id,username,display_name,avatar_url,bio,language,cover_url,cover_type,points,special_tier,citta,professione,is_admin,moderation_status,created_at')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data as Profile | null;
}

// ─── Il mio livello: le regole vere (quante foto, quanti video…) ────────────
export async function getMioLivello(specialTier: string | null): Promise<Livello | null> {
  const chiave = specialTier || 'free';
  const { data, error } = await db.from('livelli').select('*').eq('chiave', chiave).maybeSingle();
  if (error) return null;                    // senza risposta valgono i limiti di Config
  return data as Livello | null;
}

// ─── I luoghi sulla mappa ───────────────────────────────────────────────────
// Solo i campi della mappa, solo l'inquadratura, solo il pubblicato.
export async function fetchPOIsInRegion(
  minLat: number, maxLat: number, minLng: number, maxLng: number,
): Promise<POI[]> {
  const { data, error } = await db
    .from('pois')
    .select(POI_CAMPI_MAPPA)
    .gte('lat', minLat).lte('lat', maxLat)
    .gte('lng', minLng).lte('lng', maxLng)
    .in('visibility', ['community', 'official'])
    .eq('is_approved', true)
    .is('removed_at', null)
    .order('love_count', { ascending: false })
    .limit(300);
  if (error) throw error;
  return (data ?? []) as unknown as POI[];
}

// ─── Un luogo per intero (scheda) ───────────────────────────────────────────
export async function fetchPOI(id: string): Promise<POI | null> {
  const { data, error } = await db
    .from('pois')
    .select('*, profiles!pois_author_id_fkey(id,username,display_name,avatar_url)')
    .eq('id', id)
    .is('removed_at', null)          // un luogo tolto dalla moderazione non si riapre da un link
    .maybeSingle();
  if (error) throw error;
  return data as unknown as POI | null;
}

// ─── I miei luoghi ──────────────────────────────────────────────────────────
export async function fetchMyPOIs(userId: string): Promise<POI[]> {
  const { data, error } = await db
    .from('pois')
    .select('*')
    .eq('author_id', userId)
    .is('removed_at', null)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as POI[];
}

// ─── Creare un luogo ────────────────────────────────────────────────────────
export async function insertPOI(poi: {
  author_id:   string;
  title:       string;
  description: string | null;
  lat:         number;
  lng:         number;
  category:    string;
  categories?: string[];
  tags?:       string[];
  visibility:  string;
  photos:      string[];
  address?:    string | null;
  city?:       string | null;
}): Promise<POI> {
  const riga = {
    ...poi,
    subcategory: poi.categories?.[0] ?? null,       // la prima e' il marcatore
    cover_photo: poi.photos[0] ?? null,
  };
  const { data, error } = await db.from('pois').insert([riga]).select('*');
  if (error) throw error;
  if (!data || !data.length) throw new Error('il database non ha accettato il luogo');
  return data[0] as unknown as POI;
}

// ─── Modificare un luogo mio ────────────────────────────────────────────────
export async function updatePOI(id: string, patch: Partial<POI>): Promise<POI> {
  const { data, error } = await db.from('pois').update(patch).eq('id', id).select('*');
  if (error) throw error;
  if (!data || !data.length) throw new Error('il database non ha accettato la modifica');
  return data[0] as unknown as POI;
}

// ─── Cancellare un luogo appena creato ──────────────────────────────────────
// Serve alla compensazione del salvataggio: se le foto non arrivano, il luogo
// senza foto non deve restare nel database come un guscio vuoto.
export async function deletePOI(id: string): Promise<void> {
  const { error } = await db.from('pois').delete().eq('id', id);
  if (error) throw error;
}

// ─── LOVE ───────────────────────────────────────────────────────────────────
export async function toggleLove(poiId: string, userId: string): Promise<boolean> {
  const { data: existing } = await db
    .from('loves')
    .select('id')
    .eq('poi_id', poiId).eq('user_id', userId)
    .maybeSingle();

  if (existing) {
    const { error } = await db.from('loves').delete().eq('id', existing.id);
    if (error) throw error;
    return false;
  }
  const { error } = await db.from('loves').insert([{ poi_id: poiId, user_id: userId }]);
  if (error) {
    // Doppio tap o secondo dispositivo: il vincolo unico ha gia' la riga.
    // Non e' un fallimento, e' la conferma che il cuore c'e'.
    if ((error as { code?: string }).code === '23505') return true;
    throw error;
  }
  return true;
}

export async function fetchMyLoves(userId: string): Promise<Set<string>> {
  const { data, error } = await db.from('loves').select('poi_id').eq('user_id', userId);
  if (error) return new Set();
  return new Set((data ?? []).map((r: { poi_id: string }) => r.poi_id));
}

// ─── Audioguide pubblicate di un luogo ──────────────────────────────────────
export async function fetchAudioguide(poiId: string): Promise<Audioguida[]> {
  const { data, error } = await db
    .from('audioguide')
    .select('id,poi_id,trip_id,lingua,titolo,testo,url,secondi,voce,pubblicata')
    .eq('poi_id', poiId)
    .eq('pubblicata', true);
  if (error) return [];
  return (data ?? []) as unknown as Audioguida[];
}

// ─── Le categorie della tassonomia (per icone e filtri) ─────────────────────
export interface Categoria {
  key: string; macro: string; label_it: string; label_sq: string | null;
  label_en: string | null; icon: string | null; color: string | null; sort: number;
}
export async function fetchCategorie(): Promise<Categoria[]> {
  const { data, error } = await db
    .from('poi_categories')
    .select('key,macro,label_it,label_sq,label_en,icon,color,sort')
    .eq('active', true)
    .order('sort');
  if (error) return [];
  return (data ?? []) as unknown as Categoria[];
}
