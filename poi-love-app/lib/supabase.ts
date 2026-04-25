/**
 * POI•LOVE — Supabase Client
 *
 * Singleton con AsyncStorage per persistere la sessione su mobile.
 * Usare sempre questo import, mai creare nuovi client.
 */
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Config } from '@/constants/config';

export const supabase = createClient(Config.supabaseUrl, Config.supabaseAnonKey, {
  auth: {
    storage:          AsyncStorage,
    autoRefreshToken: true,
    persistSession:   true,
    detectSessionInUrl: false,
  },
});

// ─── Helper: user corrente (sincrono dalla cache) ──
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

// ─── Helper: profilo completo ──────────────────────
export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data;
}

// ─── Helper: POI pubblici in un bounding box ───────
export async function fetchPOIsInRegion(
  minLat: number,
  maxLat: number,
  minLng: number,
  maxLng: number,
) {
  const { data, error } = await supabase
    .from('pois')
    .select('id, name, latitude, longitude, tag, love_count, photo_urls, visibility, profiles(username, avatar_url)')
    .gte('latitude', minLat)
    .lte('latitude', maxLat)
    .gte('longitude', minLng)
    .lte('longitude', maxLng)
    .in('visibility', ['community', 'suggested_google'])
    .order('love_count', { ascending: false })
    .limit(200);

  if (error) throw error;
  return data ?? [];
}

// ─── Helper: POI personali dell'utente ────────────
export async function fetchMyPOIs(userId: string) {
  const { data, error } = await supabase
    .from('pois')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

// ─── Helper: inserimento nuovo POI ─────────────────
export async function insertPOI(poi: {
  user_id:     string;
  name:        string;
  description: string;
  latitude:    number;
  longitude:   number;
  tag:         string;
  visibility:  string;
  photo_urls:  string[];
}) {
  const { data, error } = await supabase
    .from('pois')
    .insert([poi])
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ─── Helper: toggle LOVE ───────────────────────────
export async function toggleLove(poiId: string, userId: string): Promise<boolean> {
  // Controlla se esiste già
  const { data: existing } = await supabase
    .from('loves')
    .select('id')
    .eq('poi_id', poiId)
    .eq('user_id', userId)
    .maybeSingle();

  if (existing) {
    await supabase.from('loves').delete().eq('id', existing.id);
    return false; // rimosso
  } else {
    await supabase.from('loves').insert([{ poi_id: poiId, user_id: userId }]);
    return true; // aggiunto
  }
}
